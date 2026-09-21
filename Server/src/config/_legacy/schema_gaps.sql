USE educhain360_db;

-- ═══════════════════════════════════════════════════════════════
-- 1. PRIVATE NOTICES — recipient_id
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE notices
  ADD COLUMN recipient_id INT NULL AFTER audience;

ALTER TABLE notices
  ADD CONSTRAINT fk_notices_recipient
  FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE;

-- ═══════════════════════════════════════════════════════════════
-- 2. LEAVE STATUS
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE attendance
  MODIFY COLUMN status ENUM('PRESENT','ABSENT','LATE','LEAVE') NOT NULL;

-- ═══════════════════════════════════════════════════════════════
-- 3. FEE ADJUSTMENTS — fine / discount / additional
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

-- ═══════════════════════════════════════════════════════════════
-- 4. CERTIFICATE VERIFICATION CODE (short, human-readable)
-- ═══════════════════════════════════════════════════════════════
ALTER TABLE academic_credentials
  ADD COLUMN verify_code VARCHAR(20) UNIQUE NULL AFTER credential_uuid;

UPDATE academic_credentials
   SET verify_code = CONCAT('EC-', UPPER(SUBSTRING(MD5(credential_uuid), 1, 8)))
 WHERE verify_code IS NULL;