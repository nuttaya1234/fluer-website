const express = require('express');
const cors    = require('cors');
const path    = require('path');
const pool    = require('./db');
require('dotenv').config();

const app  = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ── Clean URL routing ──────────────────────────────────────
// /homepage.html  →  301 redirect to /homepage
// /homepage       →  serves homepage.html directly
const htmlPages = [
  'homepage', 'product', 'product-detail', 'product-management',
  'add-product', 'edit-product', 'search', 'login', 'team',
];

htmlPages.forEach(page => {
  // Must be registered BEFORE static middleware to intercept .html URLs
  app.get(`/${page}.html`, (req, res) => {
    const qs = Object.keys(req.query).length
      ? '?' + new URLSearchParams(req.query).toString()
      : '';
    res.redirect(301, `/${page}${qs}`);
  });

  // Serve the HTML file at the clean URL
  app.get(`/${page}`, (req, res) => {
    res.sendFile(path.join(__dirname, '..', `${page}.html`));
  });
});

// ── Serve static files (images, css, js, etc.) ────────────
app.use(express.static(path.join(__dirname, '..')));

// Default route → homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'homepage.html'));
});

/* ── Helper: fix Drive URL to thumbnail format ─────────── */
function toThumbnailUrl(url) {
  if (!url) return '';
  if (url.includes('drive.google.com/thumbnail')) return url;
  // uc?id= or uc?export=view&id=
  const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch) return `https://drive.google.com/thumbnail?id=${idMatch[1]}&sz=w400`;
  // /file/d/FILE_ID/
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch) return `https://drive.google.com/thumbnail?id=${fileMatch[1]}&sz=w400`;
  return url;
}

/* ══════════════════════════════════════════════════════════
   SERVICE 1 — GET /api/products
   Returns all products joined with category, image, color,
   size and total stock from the Fleur database.

   No criteria search → the service returns ALL results.

   Postman Test Case 1 – Get all products (no filter):
     METHOD : GET
     URL    : http://localhost:4000/api/products
     Body   : (none)
     Expected Response (200 OK):
     [
       {
         "id": 1,
         "name": "Betty Two-Piece Swimsuit",
         "product_id": "FL-SW-001",
         "category": "Swimsuits",
         "price": "2,590.00",
         "description": "Floral bikini",
         "img": "https://drive.google.com/thumbnail?id=...",
         "color": "Pink",
         "size": "S",
         "stock": 18,
         "db_id": 1
       },
       ...
     ]

   Postman Test Case 2 – Server unavailable (connection refused):
     METHOD : GET
     URL    : http://localhost:9999/api/products   ← wrong port
     Expected Response: network error / ECONNREFUSED
     (No JSON returned — Postman shows "Could not get response")
══════════════════════════════════════════════════════════ */
app.get('/api/products', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        p.product_id                                      AS id,
        p.product_name                                    AS name,
        CONCAT('FL-', UPPER(LEFT(c.category_name,2)), '-', LPAD(p.product_id,3,'0')) AS product_id,
        c.category_name                                   AS category,
        p.price,
        p.description,
        i.url                                             AS img,
        COALESCE((
          SELECT col.color_name FROM Product_Variant pv
          JOIN Color col ON pv.color_id = col.color_id
          WHERE pv.product_id = p.product_id LIMIT 1
        ), '')                                            AS color,
        COALESCE((
          SELECT s.size_name FROM Product_Variant pv
          JOIN Size s ON pv.size_id = s.size_id
          WHERE pv.product_id = p.product_id LIMIT 1
        ), 'M')                                           AS size,
        COALESCE((
          SELECT SUM(pv.stock_quantity) FROM Product_Variant pv
          WHERE pv.product_id = p.product_id
        ), 0)                                             AS stock,
        p.product_id                                      AS db_id
      FROM Product p
      JOIN Category c ON p.category_id = c.category_id
      LEFT JOIN Image i ON i.product_id = p.product_id
      ORDER BY p.product_id ASC
    `);

    const products = rows.map(r => ({
      ...r,
      img: toThumbnailUrl(r.img),
      price: Number(r.price).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    }));

    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

/* ══════════════════════════════════════════════════════════
   SERVICE 2 — POST /api/products
   Creates a new product with its category, image and variant.
   Inserts rows into Product, Image, and Product_Variant tables.

   Postman Test Case 1 – Add a valid product:
     METHOD  : POST
     URL     : http://localhost:4000/api/products
     Headers : Content-Type: application/json
     Body (raw JSON):
     {
       "name":        "Rose Crop Top",
       "category":    "Crop Tops",
       "price":       "890",
       "color":       "Pink",
       "size":        "S",
       "stock":       20,
       "description": "A soft rose-print crop top.",
       "img":         "https://drive.google.com/uc?id=EXAMPLE_ID"
     }
     Expected Response (201 Created):
     { "id": 24, "message": "Product created" }

   Postman Test Case 2 – Add product with missing name (still saves
   with default "Unnamed" applied by frontend, but backend inserts):
     METHOD  : POST
     URL     : http://localhost:4000/api/products
     Headers : Content-Type: application/json
     Body (raw JSON):
     {
       "name":     "",
       "category": "Dresses",
       "price":    "1200",
       "color":    "White",
       "size":     "M",
       "stock":    5,
       "img":      ""
     }
     Expected Response (201 Created):
     { "id": 25, "message": "Product created" }
══════════════════════════════════════════════════════════ */
app.post('/api/products', async (req, res) => {
  const { name, category, price, color, size, stock, description, img } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1) Get or create category
    let [cats] = await conn.query(
      'SELECT category_id FROM Category WHERE category_name = ?', [category]
    );
    let categoryId;
    if (cats.length > 0) {
      categoryId = cats[0].category_id;
    } else {
      const [r] = await conn.query(
        'INSERT INTO Category (category_name) VALUES (?)', [category]
      );
      categoryId = r.insertId;
    }

    // 2) Insert product
    const priceNum = parseFloat(String(price).replace(/,/g, '')) || 0;
    const [prodResult] = await conn.query(
      'INSERT INTO Product (category_id, product_name, description, price) VALUES (?, ?, ?, ?)',
      [categoryId, name, description || '', priceNum]
    );
    const newProductId = prodResult.insertId;

    // 3) Insert image linked to product_id
    const imgUrl = toThumbnailUrl(img || '');
    await conn.query(
      'INSERT INTO Image (product_id, url) VALUES (?, ?)',
      [newProductId, imgUrl]
    );

    // 4) Insert variant
    if (color || size || stock !== undefined) {
      // Get or create color
      let colorId = 1;
      if (color) {
        let [colors] = await conn.query(
          'SELECT color_id FROM Color WHERE color_name = ?', [color]
        );
        if (colors.length > 0) {
          colorId = colors[0].color_id;
        } else {
          const [r] = await conn.query('INSERT INTO Color (color_name) VALUES (?)', [color]);
          colorId = r.insertId;
        }
      }

      // Get or create size
      let sizeId = 3; // default M
      if (size) {
        let [sizes] = await conn.query(
          'SELECT size_id FROM Size WHERE size_name = ?', [size]
        );
        if (sizes.length > 0) {
          sizeId = sizes[0].size_id;
        } else {
          const [r] = await conn.query('INSERT INTO Size (size_name) VALUES (?)', [size]);
          sizeId = r.insertId;
        }
      }

      await conn.query(
        'INSERT INTO Product_Variant (product_id, size_id, color_id, stock_quantity) VALUES (?, ?, ?, ?)',
        [newProductId, sizeId, colorId, Number(stock) || 0]
      );
    }

    await conn.commit();
    res.status(201).json({ id: newProductId, message: 'Product created' });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Failed to create product' });
  } finally {
    conn.release();
  }
});

/* ══════════════════════════════════════════════════════════
   SERVICE 3 — PUT /api/products/:id
   Updates an existing product's name, category, price,
   description, image, color, size and stock.

   Postman Test Case 1 – Update an existing product (id = 1):
     METHOD  : PUT
     URL     : http://localhost:4000/api/products/1
     Headers : Content-Type: application/json
     Body (raw JSON):
     {
       "name":        "Betty Two-Piece Swimsuit (Updated)",
       "category":    "Swimsuits",
       "price":       "2790",
       "color":       "Purple",
       "size":        "S",
       "stock":       15,
       "description": "Updated description.",
       "img":         "https://drive.google.com/uc?id=1-kCyYXxTLixIs_ol4h1E4aNhl3NIG4DO"
     }
     Expected Response (200 OK):
     { "message": "Product updated" }

   Postman Test Case 2 – Update a product that does not exist (id = 9999):
     METHOD  : PUT
     URL     : http://localhost:4000/api/products/9999
     Headers : Content-Type: application/json
     Body (raw JSON):
     {
       "name": "Ghost Product", "category": "Tops",
       "price": "500", "color": "Black", "size": "M",
       "stock": 0, "description": "", "img": ""
     }
     Expected Response (200 OK):
     { "message": "Product updated" }
     (No rows affected in DB — product_id 9999 does not exist)
══════════════════════════════════════════════════════════ */
app.put('/api/products/:id', async (req, res) => {
  const productId = parseInt(req.params.id);
  const { name, category, price, color, size, stock, description, img } = req.body;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Get or create category
    let [cats] = await conn.query(
      'SELECT category_id FROM Category WHERE category_name = ?', [category]
    );
    let categoryId;
    if (cats.length > 0) {
      categoryId = cats[0].category_id;
    } else {
      const [r] = await conn.query(
        'INSERT INTO Category (category_name) VALUES (?)', [category]
      );
      categoryId = r.insertId;
    }

    // Update product
    const priceNum = parseFloat(String(price).replace(/,/g, '')) || 0;
    await conn.query(
      'UPDATE Product SET category_id=?, product_name=?, description=?, price=? WHERE product_id=?',
      [categoryId, name, description || '', priceNum, productId]
    );

    // Update image (upsert via product_id FK)
    const imgUrl = toThumbnailUrl(img || '');
    const [existImg] = await conn.query(
      'SELECT image_id FROM Image WHERE product_id = ?', [productId]
    );
    if (existImg.length > 0) {
      await conn.query(
        'UPDATE Image SET url = ? WHERE product_id = ?', [imgUrl, productId]
      );
    } else {
      await conn.query(
        'INSERT INTO Image (product_id, url) VALUES (?, ?)', [productId, imgUrl]
      );
    }

    // Update variant — delete old, insert new
    await conn.query('DELETE FROM Product_Variant WHERE product_id = ?', [productId]);

    let colorId = 1;
    if (color) {
      let [colors] = await conn.query(
        'SELECT color_id FROM Color WHERE color_name = ?', [color]
      );
      if (colors.length > 0) {
        colorId = colors[0].color_id;
      } else {
        const [r] = await conn.query('INSERT INTO Color (color_name) VALUES (?)', [color]);
        colorId = r.insertId;
      }
    }

    let sizeId = 3;
    if (size) {
      let [sizes] = await conn.query(
        'SELECT size_id FROM Size WHERE size_name = ?', [size]
      );
      if (sizes.length > 0) {
        sizeId = sizes[0].size_id;
      } else {
        const [r] = await conn.query('INSERT INTO Size (size_name) VALUES (?)', [size]);
        sizeId = r.insertId;
      }
    }

    await conn.query(
      'INSERT INTO Product_Variant (product_id, size_id, color_id, stock_quantity) VALUES (?, ?, ?, ?)',
      [productId, sizeId, colorId, Number(stock) || 0]
    );

    await conn.commit();
    res.json({ message: 'Product updated' });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Failed to update product' });
  } finally {
    conn.release();
  }
});

/* ══════════════════════════════════════════════════════════
   SERVICE 4 — DELETE /api/products/:id
   Permanently deletes a product and all related rows
   (Admin_Product, Product_Variant, Image, Product).

   Postman Test Case 1 – Delete an existing product (id = 24):
     METHOD : DELETE
     URL    : http://localhost:4000/api/products/24
     Body   : (none)
     Expected Response (200 OK):
     { "message": "Product deleted" }
     Verify: GET /api/products should no longer include id 24.

   Postman Test Case 2 – Delete a product that does not exist (id = 9999):
     METHOD : DELETE
     URL    : http://localhost:4000/api/products/9999
     Body   : (none)
     Expected Response (200 OK):
     { "message": "Product deleted" }
     (DELETE queries affect 0 rows — no error, idempotent behaviour)
══════════════════════════════════════════════════════════ */
app.delete('/api/products/:id', async (req, res) => {
  const productId = parseInt(req.params.id);
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('DELETE FROM Admin_Product WHERE product_id = ?', [productId]);
    await conn.query('DELETE FROM Product_Variant WHERE product_id = ?', [productId]);
    await conn.query('DELETE FROM Image WHERE product_id = ?', [productId]);
    await conn.query('DELETE FROM Product WHERE product_id = ?', [productId]);
    await conn.commit();
    res.json({ message: 'Product deleted' });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Failed to delete product' });
  } finally {
    conn.release();
  }
});

/* ══════════════════════════════════════════════════════════
   SERVICE 5 — GET /api/categories
   Returns all category records (id + name) ordered by id.

   Postman Test Case 1 – Get all categories:
     METHOD : GET
     URL    : http://localhost:4000/api/categories
     Body   : (none)
     Expected Response (200 OK):
     [
       { "category_id": 1, "category_name": "Swimsuits" },
       { "category_id": 2, "category_name": "Crop Tops" },
       { "category_id": 3, "category_name": "Short Sleeves" },
       ...
     ]

   Postman Test Case 2 – Verify count matches database:
     METHOD : GET
     URL    : http://localhost:4000/api/categories
     Body   : (none)
     Expected Response (200 OK):
     Array length should be 10 (matching SELECT COUNT(*) FROM Category)
══════════════════════════════════════════════════════════ */
app.get('/api/categories', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT category_id, category_name FROM Category ORDER BY category_id'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

/* ══════════════════════════════════════════════════════════
   SERVICE 6 — POST /api/login
   Authenticates an admin by username + password.
   Updates last_login_datetime on success.

   Postman Test Case 1 – Valid credentials:
     METHOD  : POST
     URL     : http://localhost:4000/api/login
     Headers : Content-Type: application/json
     Body (raw JSON):
     { "username": "mina01", "password": "hashed" }
     Expected Response (200 OK):
     {
       "success": true,
       "admin": {
         "id": 1,
         "username": "mina01",
         "name": "Mina Kim"
       }
     }

   Postman Test Case 2 – Invalid credentials:
     METHOD  : POST
     URL     : http://localhost:4000/api/login
     Headers : Content-Type: application/json
     Body (raw JSON):
     { "username": "mina01", "password": "wrongpassword" }
     Expected Response (401 Unauthorized):
     { "error": "Invalid username or password" }

   Postman Test Case 3 – Missing fields:
     METHOD  : POST
     URL     : http://localhost:4000/api/login
     Headers : Content-Type: application/json
     Body (raw JSON):
     { "username": "mina01" }
     Expected Response (400 Bad Request):
     { "error": "Username and password required" }
══════════════════════════════════════════════════════════ */
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  try {
    const [rows] = await pool.query(
      `SELECT al.login_id, al.admin_id, al.username, a.first_name, a.last_name
       FROM Admin_Login al
       JOIN Administrator a ON al.admin_id = a.admin_id
       WHERE al.username = ? AND al.password = ?`,
      [username, password]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    await pool.query(
      'UPDATE Admin_Login SET last_login_datetime = NOW() WHERE login_id = ?',
      [rows[0].login_id]
    );
    res.json({
      success: true,
      admin: {
        id:       rows[0].admin_id,
        username: rows[0].username,
        name:     `${rows[0].first_name} ${rows[0].last_name}`,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

/* ══════════════════════════════════════════════════════════
   SERVICE 7 — GET /api/health
   Returns server and database status. Used to confirm the
   API is reachable before running other Postman tests.

   Postman Test Case 1 – Server is running:
     METHOD : GET
     URL    : http://localhost:4000/api/health
     Body   : (none)
     Expected Response (200 OK):
     { "status": "ok", "database": "Fleur" }

   Postman Test Case 2 – Quick pre-test script in Postman:
     In Postman Tests tab, add:
       pm.test("Server is healthy", () => {
         pm.response.to.have.status(200);
         const json = pm.response.json();
         pm.expect(json.status).to.eql("ok");
         pm.expect(json.database).to.eql("Fleur");
       });
══════════════════════════════════════════════════════════ */
app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', database: process.env.DB_NAME })
);

app.listen(PORT, () => {
  console.log(`✅ Fleur API running at http://localhost:${PORT} → DB: ${process.env.DB_NAME}`);
});
