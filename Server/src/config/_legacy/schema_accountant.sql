-- ============================================================
-- PHASE ACCOUNTANT — fee structure template
-- ============================================================
USE educhain360_db;

-- Templates that define what a class/term owes
CREATE TABLE IF NOT EXISTS fee_structure (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NULL,                         -- NULL = applies to all classes
    academic_year VARCHAR(20) NOT NULL,        -- "2083/2084"
    term VARCHAR(50) NOT NULL,                 -- "Term 2"
    fee_head VARCHAR(100) NOT NULL,            -- "Tuition fee"
    amount DECIMAL(10,2) NOT NULL,
    is_mandatory BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    INDEX idx_fee_structure_lookup (academic_year, term, class_id)
);

-- Track which user marked an invoice as paid offline (cash/cheque)
ALTER TABLE fee_receipts
  ADD COLUMN recorded_by INT NULL AFTER payment_method,
  ADD COLUMN notes VARCHAR(255) NULL AFTER recorded_by;

  -- Add a column to track the amount paid for each invoice
  ALTER TABLE fee_invoices
  ADD COLUMN amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER amount;

-- Sync existing paid invoices so they reflect reality
UPDATE fee_invoices
   SET amount_paid = amount
 WHERE status = 'PAID';