const express = require('express');
const cors    = require('cors');
const path    = require('path');
const multer  = require('multer');
const pool    = require('./db');
require('dotenv').config();

const app  = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ── Multer: save uploaded images to /uploads ──────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname);
    const name = Date.now() + '-' + Math.round(Math.random() * 1e6) + ext;
    cb(null, name);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

// ── Serve static files ────────────────────────────────────
app.use(express.static(path.join(__dirname, '..')));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Default route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'product-management.html'));
});

/* ──────────────────────────────────────────────────────────
   POST /api/upload  →  upload image file, return its URL
────────────────────────────────────────────────────────── */
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const url = `/uploads/${req.file.filename}`;
  res.json({ url });
});

/* ──────────────────────────────────────────────────────────
   GET /api/products  →  list all products
────────────────────────────────────────────────────────── */
app.get('/api/products', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

/* ──────────────────────────────────────────────────────────
   POST /api/products  →  add new product
────────────────────────────────────────────────────────── */
app.post('/api/products', async (req, res) => {
  const { name, product_id, category, price, color, size, stock, description, img } = req.body;
  try {
    const [result] = await pool.query(
      `INSERT INTO products (name, product_id, category, price, color, size, stock, description, img)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, product_id, category, price, color, size, stock, description || '', img || '']
    );
    res.status(201).json({ id: result.insertId, message: 'Product created' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

/* ──────────────────────────────────────────────────────────
   PUT /api/products/:id  →  edit product
────────────────────────────────────────────────────────── */
app.put('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  const { name, product_id, category, price, color, size, stock, description, img } = req.body;
  try {
    await pool.query(
      `UPDATE products
       SET name=?, product_id=?, category=?, price=?, color=?, size=?, stock=?, description=?, img=?
       WHERE id=?`,
      [name, product_id, category, price, color, size, stock, description || '', img || '', id]
    );
    res.json({ message: 'Product updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

/* ──────────────────────────────────────────────────────────
   DELETE /api/products/:id  →  remove product
────────────────────────────────────────────────────────── */
app.delete('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM products WHERE id=?', [id]);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

/* Health check */
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`✅ Fleur API running at http://localhost:${PORT}`);
});
