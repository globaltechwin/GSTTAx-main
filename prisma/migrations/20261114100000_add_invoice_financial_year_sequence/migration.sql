-- Keep the existing sequence value for the current Indian financial year.
ALTER TABLE `invoice_sequences`
  DROP PRIMARY KEY,
  ADD COLUMN `financial_year` VARCHAR(5) NOT NULL DEFAULT '00-00',
  ADD PRIMARY KEY (`admin_id`, `financial_year`);

UPDATE `invoice_sequences`
SET `financial_year` = CONCAT(
  LPAD(MOD(YEAR(CURRENT_DATE) - IF(MONTH(CURRENT_DATE) < 4, 1, 0), 100), 2, '0'),
  '-',
  LPAD(MOD(YEAR(CURRENT_DATE) + IF(MONTH(CURRENT_DATE) >= 4, 1, 0), 100), 2, '0')
)
WHERE `financial_year` = '00-00';

ALTER TABLE `invoices`
  MODIFY COLUMN `invoice_no` VARCHAR(50) NULL;
