USE educhain360_db;

-- ═══════════════════════════════════════════════════════════════
-- 1. Private notice column (idempotent)
-- ═══════════════════════════════════════════════════════════════
SET @col_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = 'educhain360_db'
    AND TABLE_NAME = 'notices'
    AND COLUMN_NAME = 'recipient_id'
);

SET @sql = IF(@col_exists = 0,
  'ALTER TABLE notices ADD COLUMN recipient_id INT NULL AFTER audience',
  'SELECT "recipient_id already exists" AS info'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add FK only if the column now exists and no FK yet
SET @fk_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = 'educhain360_db'
    AND TABLE_NAME = 'notices'
    AND CONSTRAINT_NAME = 'fk_notices_recipient'
);
SET @sql = IF(@fk_exists = 0,
  'ALTER TABLE notices ADD CONSTRAINT fk_notices_recipient FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE',
  'SELECT "fk already exists" AS info'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ═══════════════════════════════════════════════════════════════
-- 2. Certificate verify code (idempotent)
-- ═══════════════════════════════════════════════════════════════
SET @col_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = 'educhain360_db'
    AND TABLE_NAME = 'academic_credentials'
    AND COLUMN_NAME = 'verify_code'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE academic_credentials ADD COLUMN verify_code VARCHAR(20) NULL UNIQUE AFTER credential_uuid',
  'SELECT "verify_code already exists" AS info'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Backfill any null verify_codes
UPDATE academic_credentials
   SET verify_code = CONCAT('EC-', UPPER(SUBSTRING(MD5(credential_uuid), 1, 8)))
 WHERE verify_code IS NULL;

-- ═══════════════════════════════════════════════════════════════
-- 3. Attendance LEAVE status (idempotent)
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE attendance
  MODIFY COLUMN status ENUM('PRESENT','ABSENT','LATE','LEAVE') NOT NULL;

-- ═══════════════════════════════════════════════════════════════
-- 4. Fee adjustments (idempotent)
-- ═══════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS fee_adjustments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    type ENUM('FINE','DISCOUNT','ADDITIONAL') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    reason VARCHAR(255) NULL,
    applies_to_invoice_id INT NULL,
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (applies_to_invoice_id) REFERENCES fee_invoices(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_adj_student (student_id)
);