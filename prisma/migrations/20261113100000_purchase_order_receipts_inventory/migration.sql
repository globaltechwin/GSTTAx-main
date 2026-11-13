ALTER TABLE `purchase_orders` ADD COLUMN `received_at` DATETIME(3) NULL;
ALTER TABLE `purchase_order_items` ADD COLUMN `product_id` INTEGER NULL;
CREATE INDEX `purchase_order_items_product_id_idx` ON `purchase_order_items`(`product_id`);
ALTER TABLE `purchase_order_items` ADD CONSTRAINT `purchase_order_items_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE `inventory_movements` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `product_id` INTEGER NOT NULL,
  `purchase_order_id` INTEGER NOT NULL,
  `purchase_order_item_id` INTEGER NOT NULL,
  `admin_id` INTEGER NOT NULL,
  `movement_type` VARCHAR(30) NOT NULL DEFAULT 'PURCHASE_RECEIPT',
  `quantity` DECIMAL(14,3) NOT NULL,
  `stock_before` DECIMAL(14,3) NOT NULL,
  `stock_after` DECIMAL(14,3) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `inventory_movements_purchase_order_item_id_key` (`purchase_order_item_id`),
  INDEX `inventory_movements_admin_id_created_at_idx` (`admin_id`, `created_at`),
  INDEX `inventory_movements_product_id_created_at_idx` (`product_id`, `created_at`),
  INDEX `inventory_movements_purchase_order_id_idx` (`purchase_order_id`),
  PRIMARY KEY (`id`),
  CONSTRAINT `inventory_movements_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `inventory_movements_purchase_order_id_fkey` FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `inventory_movements_purchase_order_item_id_fkey` FOREIGN KEY (`purchase_order_item_id`) REFERENCES `purchase_order_items`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `inventory_movements_admin_id_fkey` FOREIGN KEY (`admin_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
