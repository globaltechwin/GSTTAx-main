ALTER TABLE `companies` ADD COLUMN `logo_url` LONGTEXT NULL;
ALTER TABLE `invoices` ADD COLUMN `document_type` VARCHAR(20) NOT NULL DEFAULT 'TAX_INVOICE';
ALTER TABLE `invoices` ADD COLUMN `discount_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00;
ALTER TABLE `invoices` ADD COLUMN `kind_attn` VARCHAR(150) NULL;
ALTER TABLE `invoices` ADD COLUMN `mobile_no` VARCHAR(30) NULL;
CREATE INDEX `invoices_admin_id_document_type_idx` ON `invoices`(`admin_id`, `document_type`);
ALTER TABLE `invoices` ADD COLUMN `po_number` VARCHAR(50) NULL;
ALTER TABLE `invoices` ADD COLUMN `po_date` DATE NULL;

CREATE TABLE `proforma_sequences` (
  `admin_id` INTEGER NOT NULL,
  `current_value` INTEGER NOT NULL DEFAULT 0,
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`admin_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
