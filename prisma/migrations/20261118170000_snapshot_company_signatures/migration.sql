-- Preserve the company signature on each document so later company edits
-- affect only documents created after the edit.
ALTER TABLE `invoices`
  ADD COLUMN `signature_url` LONGTEXT NULL,
  ADD COLUMN `signature_width` INTEGER NULL,
  ADD COLUMN `signature_height` INTEGER NULL;

ALTER TABLE `delivery_challans`
  ADD COLUMN `signature_url` LONGTEXT NULL,
  ADD COLUMN `signature_width` INTEGER NULL,
  ADD COLUMN `signature_height` INTEGER NULL;

ALTER TABLE `purchase_orders`
  ADD COLUMN `signature_url` LONGTEXT NULL,
  ADD COLUMN `signature_width` INTEGER NULL,
  ADD COLUMN `signature_height` INTEGER NULL;

-- Backfill existing documents with the currently saved company signature.
-- This keeps their current printed appearance while freezing it going forward.
UPDATE `invoices` i
LEFT JOIN `companies` c ON c.`id` = i.`company_id`
SET i.`signature_url` = c.`signature_url`,
    i.`signature_width` = c.`signature_width`,
    i.`signature_height` = c.`signature_height`;

UPDATE `delivery_challans` d
LEFT JOIN `companies` c ON c.`id` = d.`company_id`
SET d.`signature_url` = c.`signature_url`,
    d.`signature_width` = c.`signature_width`,
    d.`signature_height` = c.`signature_height`;

UPDATE `purchase_orders` p
LEFT JOIN `companies` c ON c.`id` = p.`company_id`
SET p.`signature_url` = c.`signature_url`,
    p.`signature_width` = c.`signature_width`,
    p.`signature_height` = c.`signature_height`;
