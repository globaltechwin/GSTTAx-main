-- Keep product display numbers separate from the internal auto-increment primary key.
-- Existing products retain their current visible PRD number (previously based on id).
ALTER TABLE `products` ADD COLUMN `product_number` INT NULL;

UPDATE `products` SET `product_number` = `id` WHERE `product_number` IS NULL;

ALTER TABLE `products` MODIFY `product_number` INT NOT NULL;
CREATE UNIQUE INDEX `products_admin_id_product_number_key` ON `products`(`admin_id`, `product_number`);
