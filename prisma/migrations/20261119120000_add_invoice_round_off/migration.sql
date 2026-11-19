ALTER TABLE `invoices` ADD COLUMN `round_off` DECIMAL(12,2) NOT NULL DEFAULT 0.00;

-- Repair the MySQL product ID sequence so new products continue above every
-- existing ID, including IDs belonging to products that were deleted earlier.
SET @next_product_id = (SELECT COALESCE(MAX(`id`), 0) + 1 FROM `products`);
SET @product_auto_increment_sql = CONCAT('ALTER TABLE `products` AUTO_INCREMENT = ', @next_product_id);
PREPARE product_auto_increment_stmt FROM @product_auto_increment_sql;
EXECUTE product_auto_increment_stmt;
DEALLOCATE PREPARE product_auto_increment_stmt;
