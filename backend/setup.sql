-- Run this once to set up the database
-- Usage: /usr/local/mysql/bin/mysql -u root -p < setup.sql

CREATE DATABASE IF NOT EXISTS fleur_db;
USE fleur_db;

CREATE TABLE IF NOT EXISTS products (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(255)  NOT NULL,
  product_id  VARCHAR(50)   NOT NULL,
  category    VARCHAR(100)  NOT NULL,
  price       VARCHAR(20)   NOT NULL,
  color       VARCHAR(50)   DEFAULT '',
  size        VARCHAR(10)   DEFAULT 'M',
  stock       INT           DEFAULT 0,
  description TEXT,
  img         LONGTEXT,
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- Seed default products
INSERT INTO products (name, product_id, category, price, color, size, stock, img) VALUES
('Betty two-piece swimsuit',   'FL-SW-001', 'Swimsuits', '2,590.00', 'Purple', 'S', 12, 'image/productDetail/swim_betty_detail.png'),
('Betty two-piece swimsuit',   'FL-SW-002', 'Swimsuits', '2,590.00', 'Purple', 'M', 4,  'image/productDetail/swim_betty_detail.png'),
('Betty two-piece swimsuit',   'FL-SW-003', 'Swimsuits', '2,590.00', 'Navy',   'S', 14, 'image/productDetail/swim_betty_detail.png'),
('Betty two-piece swimsuit',   'FL-SW-004', 'Swimsuits', '2,590.00', 'Navy',   'M', 5,  'image/productDetail/swim_betty_detail.png'),
('Kitteny one piece swimsuit', 'FL-SW-005', 'Swimsuits', '1,990.00', 'Pink',   'S', 8,  'image/home/our_product/swim_kittenny_home.png'),
('Kitteny one piece swimsuit', 'FL-SW-006', 'Swimsuits', '1,990.00', 'Pink',   'M', 6,  'image/home/our_product/swim_kittenny_home.png'),
('Lolita Ruffle one piece',    'FL-SW-007', 'Swimsuits', '2,590.00', 'White',  'S', 10, 'image/home/our_product/swim_lolita_home.png'),
('Lila mini dress',            'FL-DR-001', 'Dresses',   '2,390.00', 'White',  'M', 7,  'image/allProduct&SearchPage/dress_lila.png'),
('Camellia top',               'FL-TP-001', 'Tops',      '1,590.00', 'White',  'S', 15, 'image/allProduct&SearchPage/top_camellia.png'),
('Lily floral sweater',        'FL-SW-008', 'Sweaters',  '2,990.00', 'Beige',  'M', 3,  'image/allProduct&SearchPage/sweater_lily.png');

SELECT CONCAT('✅ Setup complete. ', COUNT(*), ' products inserted.') AS status FROM products;
