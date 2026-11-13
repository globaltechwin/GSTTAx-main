ALTER TABLE `purchases`
  ADD COLUMN `company_id` INTEGER NULL;

CREATE INDEX `purchases_company_id_idx` ON `purchases`(`company_id`);

ALTER TABLE `purchases`
  ADD CONSTRAINT `purchases_company_id_fkey`
  FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
