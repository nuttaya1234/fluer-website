-- Run this once to set up the database
-- Usage: /usr/local/mysql/bin/mysql -u root -p < setup.sql

CREATE DATABASE IF NOT EXISTS Fleur;
USE Fleur;

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
-- Images served from Google Drive (shared as "Anyone with the link")
INSERT INTO products (name, product_id, category, price, color, size, stock, img) VALUES
-- Swimsuits
('Betty two-piece swimsuit',        'FL-SW-001', 'Swimsuits', '2,590.00', 'Purple', 'S', 12, 'https://drive.google.com/uc?export=view&id=1-kCyYXxTLixIs_ol4h1E4aNhl3NIG4DO'),
('Betty two-piece swimsuit',        'FL-SW-002', 'Swimsuits', '2,590.00', 'Purple', 'M', 4,  'https://drive.google.com/uc?export=view&id=1-kCyYXxTLixIs_ol4h1E4aNhl3NIG4DO'),
('Betty two-piece swimsuit',        'FL-SW-003', 'Swimsuits', '2,590.00', 'Navy',   'S', 14, 'https://drive.google.com/uc?export=view&id=1-kCyYXxTLixIs_ol4h1E4aNhl3NIG4DO'),
('Betty two-piece swimsuit',        'FL-SW-004', 'Swimsuits', '2,590.00', 'Navy',   'M', 5,  'https://drive.google.com/uc?export=view&id=1-kCyYXxTLixIs_ol4h1E4aNhl3NIG4DO'),
('Kitteny one piece swimsuit',      'FL-SW-005', 'Swimsuits', '1,990.00', 'Pink',   'S', 8,  'https://drive.google.com/uc?export=view&id=1qGn58in5gxKLe0HUuwnlDk3lj4rXyKEe'),
('Kitteny one piece swimsuit',      'FL-SW-006', 'Swimsuits', '1,990.00', 'Pink',   'M', 6,  'https://drive.google.com/uc?export=view&id=1qGn58in5gxKLe0HUuwnlDk3lj4rXyKEe'),
('Bralette Floral Dress',           'FL-DR-002', 'Dresses',   '2,190.00', 'White',  'S', 9,  'https://drive.google.com/uc?export=view&id=1iub5YJG-O5GJ1kD98VL7peLKVINfZIDJ'),
-- Dresses
('Amara Dress',                     'FL-DR-003', 'Dresses',   '2,390.00', 'Beige',  'M', 7,  'https://drive.google.com/uc?export=view&id=1NqXx40mhZAKUSRrmVnhCiixJxx74L_tK'),
('Colleen Long Dress',              'FL-DR-004', 'Dresses',   '2,790.00', 'White',  'M', 5,  'https://drive.google.com/uc?export=view&id=1ZDG4mntmehjTvyas2l9pB2UQH_Yvaumu'),
-- Tops
('Bonnie Nashville Church St. Park Top', 'FL-TP-002', 'Tops', '1,490.00', 'White',  'S', 10, 'https://drive.google.com/uc?export=view&id=1F97k8YwfyM44Q8gOXpXhSCf5giT-nIGj'),
('Bonnie Striped Top',              'FL-TP-003', 'Tops',      '1,390.00', 'Navy',   'S', 12, 'https://drive.google.com/uc?export=view&id=1hUP5wOnwQQD95KSCZpVjRPwaxJf1jvue'),
-- Bottoms
('Anastasia Sweatpants',            'FL-BT-001', 'Bottoms',   '1,990.00', 'Beige',  'M', 8,  'https://drive.google.com/uc?export=view&id=1D1_uKQmmWpyJhF-RKbm8j52OJOKmaGW3'),
('Crispina Low Rise Jeans',         'FL-BT-002', 'Bottoms',   '2,290.00', 'Navy',   'M', 6,  'https://drive.google.com/uc?export=view&id=1_07DOidAbWx6RatMmJtYE16bGQx52LTG'),
('Izzy Skirt',                      'FL-BT-003', 'Bottoms',   '1,690.00', 'White',  'S', 10, 'https://drive.google.com/uc?export=view&id=1cMFKobs8MICMbsYqqEI8elKCK1JINnQV'),
-- Accessories (mapped to closest category)
('Copper Faux Jade Ring',           'FL-AC-001', 'Tops',      '590.00',   'Beige',  'M', 20, 'https://drive.google.com/uc?export=view&id=1e4Rr_eYWt7XEQ_zsVeaoAxl3FYDBErHQ'),
('Hoops Earrings Set',              'FL-AC-002', 'Tops',      '790.00',   'Beige',  'M', 15, 'https://drive.google.com/uc?export=view&id=1Q482Z8-NILZs7K1hBwl7Mx881OjRRkWC');

SELECT CONCAT('✅ Setup complete. ', COUNT(*), ' products inserted.') AS status FROM products;
