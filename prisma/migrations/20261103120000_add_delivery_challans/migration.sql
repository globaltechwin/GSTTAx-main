CREATE TABLE `delivery_challans` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `admin_id` INTEGER NOT NULL,
  `challan_number` VARCHAR(50) NOT NULL,
  `challan_date` DATE NOT NULL,
  `delivery_date` DATE NULL,
  `company_id` INTEGER NULL,
  `company_name` VARCHAR(200) NOT NULL,
  `company_address` TEXT NULL,
  `company_gstin` VARCHAR(50) NULL,
  `company_phone` VARCHAR(30) NULL,
  `recipient_id` INTEGER NULL,
  `recipient_name` VARCHAR(200) NOT NULL,
  `recipient_address` TEXT NULL,
  `recipient_gstin` VARCHAR(50) NULL,
  `recipient_state` VARCHAR(100) NULL,
  `po_number` VARCHAR(100) NULL,
  `po_date` DATE NULL,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'INR',
  `state_of_supply` VARCHAR(100) NULL,
  `vehicle_number` VARCHAR(50) NULL,
  `transporter_name` VARCHAR(200) NULL,
  `reason` TEXT NULL,
  `remarks` TEXT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  `cancel_reason` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  INDEX `delivery_challans_admin_id_challan_date_idx` (`admin_id`, `challan_date`),
  INDEX `delivery_challans_company_id_idx` (`company_id`),
  INDEX `delivery_challans_recipient_id_idx` (`recipient_id`),
  UNIQUE INDEX `delivery_challans_admin_id_challan_number_key` (`admin_id`, `challan_number`),
  PRIMARY KEY (`id`),
  CONSTRAINT `delivery_challans_admin_id_fkey`
    FOREIGN KEY (`admin_id`) REFERENCES `users` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `delivery_challan_items` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `delivery_challan_id` INTEGER NOT NULL,
  `description` VARCHAR(255) NOT NULL,
  `hsn` VARCHAR(20) NULL,
  `quantity` VARCHAR(30) NOT NULL,
  `uom` VARCHAR(20) NOT NULL DEFAULT 'Pcs',
  INDEX `delivery_challan_items_delivery_challan_id_idx` (`delivery_challan_id`),
  PRIMARY KEY (`id`),
  CONSTRAINT `delivery_challan_items_delivery_challan_id_fkey`
    FOREIGN KEY (`delivery_challan_id`) REFERENCES `delivery_challans` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
