-- ========================================================
-- A-One Trade & Supply Network - Billing Database Schema
-- Compatible with MySQL 5.7+, MySQL 8.0+, MariaDB 10.3+
-- For Hostinger phpMyAdmin or Local MySQL / XAMPP
-- ========================================================

CREATE DATABASE IF NOT EXISTS `aone_billing` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `aone_billing`;

-- --------------------------------------------------------
-- 1. Table structure for `customers`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `customers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `phone` VARCHAR(50) NOT NULL,
  `address` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_phone` (`phone`),
  INDEX `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 2. Table structure for `products`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `products` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL UNIQUE,
  `price` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_pname` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 3. Table structure for `bills`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `bills` (
  `id` VARCHAR(64) PRIMARY KEY,
  `invoice_no` VARCHAR(50) NOT NULL UNIQUE,
  `bill_date` DATE NOT NULL,
  `customer_name` VARCHAR(150) NOT NULL,
  `customer_phone` VARCHAR(50) NOT NULL,
  `customer_address` TEXT,
  `disc_type` ENUM('rs', 'pct') DEFAULT 'rs',
  `disc_value` DECIMAL(10, 2) DEFAULT 0.00,
  `charges` DECIMAL(10, 2) DEFAULT 0.00,
  `received` DECIMAL(12, 2) DEFAULT 0.00,
  `subtotal` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `discount_amt` DECIMAL(12, 2) DEFAULT 0.00,
  `grand_total` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `balance` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `created_at` BIGINT NOT NULL,
  `updated_at` BIGINT NOT NULL,
  INDEX `idx_bdate` (`bill_date`),
  INDEX `idx_cphone` (`customer_phone`),
  INDEX `idx_cname` (`customer_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 4. Table structure for `bill_items`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `bill_items` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `bill_id` VARCHAR(64) NOT NULL,
  `item_order` INT NOT NULL DEFAULT 0,
  `name` VARCHAR(255) NOT NULL,
  `qty` DECIMAL(10, 3) NOT NULL DEFAULT 1.000,
  `price` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `disc` DECIMAL(10, 2) DEFAULT 0.00,
  `disc_type` ENUM('rs', 'pct') DEFAULT 'rs',
  `gross` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `line_disc` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `net` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  FOREIGN KEY (`bill_id`) REFERENCES `bills`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 5. Table structure for `app_settings`
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `app_settings` (
  `setting_key` VARCHAR(64) PRIMARY KEY,
  `setting_value` TEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Initialize default counter
INSERT INTO `app_settings` (`setting_key`, `setting_value`)
VALUES ('invoice_counter', '1000')
ON DUPLICATE KEY UPDATE `setting_key`=`setting_key`;
