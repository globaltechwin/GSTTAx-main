ALTER TABLE `purchase_orders`
  ADD COLUMN `company_id` INTEGER NULL;

-- Safely associate historical orders only when their workspace has exactly one company.
UPDATE `purchase_orders` AS po
INNER JOIN (
  SELECT `admin_id`, MIN(`id`) AS `company_id`
  FROM `companies`
  WHERE `admin_id` IS NOT NULL
  GROUP BY `admin_id`
  HAVING COUNT(*) = 1
) AS c ON c.`admin_id` = po.`admin_id`
SET po.`company_id` = c.`company_id`;

CREATE INDEX `purchase_orders_company_id_idx`
  ON `purchase_orders`(`company_id`);

ALTER TABLE `purchase_orders`
  ADD CONSTRAINT `purchase_orders_company_id_fkey`
  FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
