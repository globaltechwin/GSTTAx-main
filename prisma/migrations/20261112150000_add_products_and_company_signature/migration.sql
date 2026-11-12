ALTER TABLE `companies`
  ADD COLUMN `signature_url` LONGTEXT NULL,
  ADD COLUMN `signature_width` INTEGER NOT NULL DEFAULT 160,
  ADD COLUMN `signature_height` INTEGER NOT NULL DEFAULT 60;

CREATE TABLE `products` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(150) NOT NULL,
  `sku` VARCHAR(80) NOT NULL,
  `hsn_code` VARCHAR(20) NULL,
  `description` TEXT NULL,
  `unit` VARCHAR(20) NOT NULL DEFAULT 'Nos',
  `gst_rate` DECIMAL(5,2) NOT NULL DEFAULT 0,
  `purchase_rate` DECIMAL(14,2) NOT NULL DEFAULT 0,
  `selling_rate` DECIMAL(14,2) NOT NULL DEFAULT 0,
  `stock` DECIMAL(14,3) NOT NULL DEFAULT 0,
  `min_stock` DECIMAL(14,3) NOT NULL DEFAULT 0,
  `status` VARCHAR(20) NOT NULL DEFAULT 'active',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  `admin_id` INTEGER NOT NULL,
  INDEX `products_admin_id_name_idx` (`admin_id`, `name`),
  UNIQUE INDEX `products_admin_id_sku_key` (`admin_id`, `sku`),
  PRIMARY KEY (`id`),
  CONSTRAINT `products_admin_id_fkey` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
