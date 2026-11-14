CREATE TABLE `document_number_sequences` (
  `admin_id` INTEGER NOT NULL,
  `document_type` VARCHAR(30) NOT NULL,
  `financial_year` VARCHAR(5) NOT NULL,
  `current_value` INTEGER NOT NULL DEFAULT 0,
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`admin_id`, `document_type`, `financial_year`),
  CONSTRAINT `document_number_sequences_admin_id_fkey`
    FOREIGN KEY (`admin_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
