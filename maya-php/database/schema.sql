-- Maya Import Export Logistic — MySQL schema
-- Default admin: admin@maya.com / admin123

CREATE DATABASE IF NOT EXISTS maya_logistics CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE maya_logistics;

DROP TABLE IF EXISTS contact_messages;
DROP TABLE IF EXISTS password_resets;
DROP TABLE IF EXISTS shipments;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  phone VARCHAR(40) DEFAULT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin','staff','customer') NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE permissions (
  user_id INT PRIMARY KEY,
  can_manage_shipments TINYINT(1) NOT NULL DEFAULT 0,
  can_manage_customers TINYINT(1) NOT NULL DEFAULT 0,
  can_generate_invoice TINYINT(1) NOT NULL DEFAULT 0,
  CONSTRAINT fk_perm_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE shipments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tracking_id VARCHAR(20) NOT NULL UNIQUE,
  customer_id INT NOT NULL,
  created_by_id INT DEFAULT NULL,
  sender_name VARCHAR(120) NOT NULL,
  sender_phone VARCHAR(40) NOT NULL,
  sender_address VARCHAR(255) NOT NULL,
  receiver_name VARCHAR(120) NOT NULL,
  receiver_phone VARCHAR(40) NOT NULL,
  receiver_address VARCHAR(255) NOT NULL,
  origin VARCHAR(120) NOT NULL,
  destination VARCHAR(120) NOT NULL,
  mode ENUM('air','sea','road') NOT NULL,
  weight_kg DECIMAL(10,2) NOT NULL,
  description TEXT,
  status ENUM('pending','in_transit','delivered') NOT NULL DEFAULT 'pending',
  cost_npr DECIMAL(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  delivered_at TIMESTAMP NULL,
  CONSTRAINT fk_ship_customer FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_ship_creator FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_ship_status (status),
  INDEX idx_ship_customer (customer_id),
  INDEX idx_ship_created (created_at)
) ENGINE=InnoDB;

CREATE TABLE password_resets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(190) NOT NULL,
  otp_code VARCHAR(10) NOT NULL,
  expires_at DATETIME NOT NULL,
  used TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_reset_email (email)
) ENGINE=InnoDB;

CREATE TABLE contact_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  phone VARCHAR(40),
  subject VARCHAR(200),
  message TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Default admin account: admin@maya.com / admin123
-- The hash below is bcrypt of "admin123" (cost 10).
INSERT INTO users (name, email, phone, password_hash, role)
VALUES ('Maya Admin', 'admin@maya.com', '9769686908',
  '$2b$10$9lQ3HDR6A3a.SwtchAEh4.QvKE03Rg1v5z8vX5LtLnw0/HpuMOth.', 'admin');

INSERT INTO permissions (user_id, can_manage_shipments, can_manage_customers, can_generate_invoice)
VALUES (1, 1, 1, 1);
