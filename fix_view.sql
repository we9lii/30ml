DROP TABLE IF EXISTS `instant_expense_sheet_summary`;
DROP VIEW IF EXISTS `instant_expense_sheet_summary`;

CREATE VIEW `instant_expense_sheet_summary` AS 
SELECT 
    `s`.`id` AS `sheet_id`,
    `s`.`custody_number` AS `custody_number`,
    `s`.`custody_amount` AS `custody_amount`,
    `s`.`status` AS `status`,
    `s`.`user_id` AS `user_id`,
    `s`.`created_at` AS `created_at`,
    `s`.`last_modified` AS `last_modified`,
    COALESCE(SUM((`l`.`amount` + COALESCE(`l`.`bank_fees`, 0))), 0) AS `total_spent`,
    COUNT(`l`.`id`) AS `lines_count`
FROM 
    (`instant_expense_sheets` `s` 
    LEFT JOIN `instant_expense_lines` `l` ON ((`l`.`sheet_id` = `s`.`id`))) 
GROUP BY 
    `s`.`id`, 
    `s`.`custody_number`, 
    `s`.`custody_amount`, 
    `s`.`status`, 
    `s`.`user_id`, 
    `s`.`created_at`, 
    `s`.`last_modified`;
