-- ============================================================
-- CGC University Transport Management System
-- Database Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS cgc_transport
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE cgc_transport;

-- ── Students Table ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS students (
  id         INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  name       VARCHAR(100)     NOT NULL,
  email      VARCHAR(150)     NOT NULL UNIQUE,
  password   VARCHAR(255)     NOT NULL,
  course     VARCHAR(100)     NOT NULL,
  bus_no     VARCHAR(20)      NOT NULL,
  created_at TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_bus_no (bus_no),
  INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Drivers Table ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS drivers (
  id         INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  name       VARCHAR(100)     NOT NULL,
  phone      VARCHAR(20)      NOT NULL,
  license_no VARCHAR(50)      NOT NULL UNIQUE,
  created_at TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_license (license_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Sample Data ──────────────────────────────────────────────
INSERT INTO students (name, email, password, course, bus_no) VALUES
  ('Arjun Sharma',   'arjun@cgc.edu.in',    '$2b$10$examplehash1', 'B.Tech CSE', 'CGC-07'),
  ('Priya Kaur',     'priya@cgc.edu.in',    '$2b$10$examplehash2', 'BCA',        'CGC-03'),
  ('Rohit Verma',    'rohit@cgc.edu.in',    '$2b$10$examplehash3', 'MBA',        'CGC-07'),
  ('Simran Grewal',  'simran@cgc.edu.in',   '$2b$10$examplehash4', 'B.Tech ECE', 'CGC-12'),
  ('Manpreet Singh', 'manpreet@cgc.edu.in', '$2b$10$examplehash5', 'BBA',        'CGC-03');

INSERT INTO drivers (name, phone, license_no) VALUES
  ('Rajinder Singh',   '+91 98765 43210', 'PB-0520220001'),
  ('Gurjeet Dhaliwal', '+91 87654 32109', 'PB-0520220002'),
  ('Harpreet Sandhu',  '+91 76543 21098', 'PB-0520220003');