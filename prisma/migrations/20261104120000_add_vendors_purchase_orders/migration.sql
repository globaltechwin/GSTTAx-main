CREATE TABLE `vendors` (
 `id` INTEGER NOT NULL AUTO_INCREMENT, `name` VARCHAR(150) NOT NULL, `industry` VARCHAR(100) NULL, `email` VARCHAR(150) NULL, `website` VARCHAR(200) NULL,
 `landline` VARCHAR(30) NULL, `mobile` VARCHAR(30) NULL, `address_line1` VARCHAR(255) NULL, `address_line2` VARCHAR(255) NULL,
 `gstn_type` VARCHAR(40) NOT NULL DEFAULT 'REGISTERED_REGULAR', `gstin` VARCHAR(20) NULL, `pan` VARCHAR(20) NULL, `currency` VARCHAR(10) NOT NULL DEFAULT 'INR',
 `country` VARCHAR(80) NOT NULL DEFAULT 'India', `state` VARCHAR(80) NULL, `pin_code` VARCHAR(12) NULL, `tcs_enabled` BOOLEAN NOT NULL DEFAULT false,
 `tcs_rate` DECIMAL(5,2) NOT NULL DEFAULT 0, `opening_date` DATE NULL, `opening_type` VARCHAR(10) NOT NULL DEFAULT 'CREDIT', `opening_amount` DECIMAL(14,2) NOT NULL DEFAULT 0,
 `portal_enabled` BOOLEAN NOT NULL DEFAULT false, `status` VARCHAR(20) NOT NULL DEFAULT 'active', `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 `updated_at` DATETIME(3) NOT NULL, `admin_id` INTEGER NOT NULL, PRIMARY KEY (`id`), INDEX `vendors_admin_id_name_idx` (`admin_id`,`name`),
 UNIQUE INDEX `vendors_admin_id_gstin_key` (`admin_id`,`gstin`), CONSTRAINT `vendors_admin_id_fkey` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `purchase_orders` (
 `id` INTEGER NOT NULL AUTO_INCREMENT, `po_number` VARCHAR(40) NOT NULL, `vendor_id` INTEGER NOT NULL, `vendor_name` VARCHAR(150) NOT NULL, `gstin` VARCHAR(20) NULL,
 `contact_name` VARCHAR(120) NULL, `order_date` DATE NOT NULL, `quote_no` VARCHAR(60) NULL, `quote_date` DATE NULL, `currency` VARCHAR(10) NOT NULL DEFAULT 'INR',
 `shipping_address` TEXT NULL, `sender_details` TEXT NULL, `subtotal` DECIMAL(14,2) NOT NULL DEFAULT 0, `discount_amount` DECIMAL(14,2) NOT NULL DEFAULT 0,
 `igst_amount` DECIMAL(14,2) NOT NULL DEFAULT 0, `cgst_amount` DECIMAL(14,2) NOT NULL DEFAULT 0, `sgst_amount` DECIMAL(14,2) NOT NULL DEFAULT 0,
 `cess_amount` DECIMAL(14,2) NOT NULL DEFAULT 0, `grand_total` DECIMAL(14,2) NOT NULL DEFAULT 0, `status` VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
 `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), `updated_at` DATETIME(3) NOT NULL, `admin_id` INTEGER NOT NULL, PRIMARY KEY (`id`),
 UNIQUE INDEX `purchase_orders_admin_id_po_number_key` (`admin_id`,`po_number`), INDEX `purchase_orders_admin_id_order_date_idx` (`admin_id`,`order_date`),
 CONSTRAINT `purchase_orders_admin_id_fkey` FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
 CONSTRAINT `purchase_orders_vendor_id_fkey` FOREIGN KEY (`vendor_id`) REFERENCES `vendors` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `purchase_order_items` (
 `id` INTEGER NOT NULL AUTO_INCREMENT, `purchase_order_id` INTEGER NOT NULL, `product_name` VARCHAR(180) NOT NULL, `description` VARCHAR(255) NULL,
 `item_type` VARCHAR(20) NOT NULL DEFAULT 'GOODS', `hsn_sac` VARCHAR(30) NULL, `quantity` DECIMAL(12,3) NOT NULL DEFAULT 1, `uom` VARCHAR(20) NOT NULL DEFAULT 'Nos',
 `unit_rate` DECIMAL(14,2) NOT NULL DEFAULT 0, `discount_rate` DECIMAL(5,2) NOT NULL DEFAULT 0, `tax_rate` DECIMAL(5,2) NOT NULL DEFAULT 0,
 `taxable_amount` DECIMAL(14,2) NOT NULL DEFAULT 0, `tax_amount` DECIMAL(14,2) NOT NULL DEFAULT 0, `total_amount` DECIMAL(14,2) NOT NULL DEFAULT 0,
 PRIMARY KEY (`id`), INDEX `purchase_order_items_purchase_order_id_idx` (`purchase_order_id`),
 CONSTRAINT `purchase_order_items_purchase_order_id_fkey` FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
