CREATE DEFINER = `root` @`%` PROCEDURE `usp_user_save`(
    p_id INT,
    p_username VARCHAR(50),
    p_password VARCHAR(50),
    p_role_id INT,
    p_status INT
) BEGIN
DECLARE EXIT HANDLER FOR SQLEXCEPTION BEGIN ROLLBACK;
END;
START TRANSACTION;
-- call usp_user_save(0,'testerb','Test1234',1,1)
IF p_id = 0 THEN
INSERT INTO `dev`.`users`(
        `username`,
        `password`,
        `role_id`,
        `status`,
        `createDt`
    )
VALUES(
        p_username,
        p_password,
        p_role_id,
        p_status,
        SYSDATE()
    );
SELECT 1 AS `status`,
    last_insert_id() AS id,
    'user created' AS message;
ELSE
UPDATE `dev`.`users`
SET `username` = p_username,
    `password` = p_password,
    `role_id` = p_role_id,
    `status` = p_status,
    `updateDt` = SYSDATE()
WHERE `id` = p_id;
SELECT 1 AS `status`,
    p_id AS id,
    'user updated' AS message;
END IF;
COMMIT;
END