/* ──────────────────────────────────────────────────
   api.js  –  Fleur frontend ↔ MySQL API helper
   All pages import this via <script src="api.js">
────────────────────────────────────────────────── */

const API_BASE = 'http://localhost:4000/api';

const FleurAPI = {

  /* Upload an image file → returns the URL path to store in DB */
  async uploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body:   formData,      // do NOT set Content-Type header — browser sets it with boundary
    });
    if (!res.ok) throw new Error('Image upload failed');
    const data = await res.json();
    return data.url;         // e.g. "/uploads/1713012345678-123456.jpg"
  },

  /* Load all products */
  async getProducts() {
    const res = await fetch(`${API_BASE}/products`);
    if (!res.ok) throw new Error('Failed to load products');
    return res.json();
  },

  /* Add a new product */
  async addProduct(data) {
    const res = await fetch(`${API_BASE}/products`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to add product');
    return res.json();
  },

  /* Edit an existing product by its MySQL row id */
  async updateProduct(id, data) {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update product');
    return res.json();
  },

  /* Delete a product by MySQL row id */
  async deleteProduct(id) {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete product');
    return res.json();
  },
};
