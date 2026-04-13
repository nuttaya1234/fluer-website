# 🌸 Fluer — Women's Fashion E-Commerce Website

Fluer is a women's fashion e-commerce website featuring curated swimwear, dresses, tops, and more. It includes a customer-facing storefront and a full admin panel for product management, backed by a Node.js/Express REST API connected to a MySQL database.

---

## 📄 Pages & Features

| Page | Description |
|------|-------------|
| **Homepage** | Hero banner, featured products, and category navigation |
| **Product Listing** | Browse all products with category filtering and search |
| **Product Detail** | View product images, colors, sizes, stock, and description |
| **Search** | Search results page with keyword filtering |
| **Login** | Admin login page |
| **Team** | Meet the Fluer team |
| **Admin — Product Management** | View and manage all products in a table |
| **Admin — Add Product** | Upload a new product with image, category, price, stock, etc. |
| **Admin — Edit Product** | Edit existing product details and images |

---

## 🛠️ Tech Stack

**Frontend**
- HTML5, CSS3, JavaScript (Vanilla)

**Backend**
- Node.js
- Express.js
- Multer (image upload handling)
- MySQL2
- dotenv
- CORS

**Database**
- MySQL (`fleur_db`)

---

## 🚀 How to Run

### Prerequisites
- [Node.js](https://nodejs.org/) installed
- [MySQL](https://www.mysql.com/) installed and running

---

### 1. Set Up the Database

Run the SQL setup script to create the database and seed default products:

```bash
/usr/local/mysql/bin/mysql -u root -p < backend/setup.sql
```

This will:
- Create the `fleur_db` database
- Create the `products` table
- Insert 10 seed products

---

### 2. Configure Environment Variables

Inside the `backend/` folder, create a `.env` file:

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=fleur_db
PORT=3000
```

---

### 3. Install Backend Dependencies

```bash
cd backend
npm install
```

---

### 4. Start the Backend Server

```bash
npm start
```

The API will run at: `http://localhost:3000`

---

### 5. Open the Frontend

Open `homepage.html` directly in your browser, or serve the root folder with a local server (e.g. VS Code Live Server).

---

## 📁 Project Structure

```
fluer/
├── homepage.html
├── product.html
├── product-detail.html
├── search.html
├── login.html
├── team.html
├── product-management.html
├── add-product.html
├── edit-product.html
├── style.css
├── api.js
├── image/
└── backend/
    ├── server.js
    ├── db.js
    ├── setup.sql
    ├── package.json
    └── .env           ← (not committed — create manually)
```