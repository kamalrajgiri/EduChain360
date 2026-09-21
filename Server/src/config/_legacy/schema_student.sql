-- ============================================================
-- PHASE STUDENT — additional tables & adjustments
-- ============================================================
USE educhain360_db;

-- Make hash columns nullable until the blockchain phase
ALTER TABLE fee_receipts         MODIFY COLUMN receipt_hash  VARCHAR(64) NULL;
ALTER TABLE academic_credentials MODIFY COLUMN document_hash VARCHAR(64) NULL;

-- 1. Fee invoices (per student, per term, per fee head)
CREATE TABLE IF NOT EXISTS fee_invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    term VARCHAR(50) NOT NULL,           -- "Term 2, 2083/2084"
    fee_head VARCHAR(100) NOT NULL,      -- "Tuition fee", "Exam fee", ...
    amount DECIMAL(10,2) NOT NULL,
    due_date DATE NULL,
    status ENUM('UNPAID','PAID','PARTIAL') DEFAULT 'UNPAID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_fee_inv_student_status (student_id, status)
);

-- 2. Library books
CREATE TABLE IF NOT EXISTS books (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    author VARCHAR(150),
    isbn VARCHAR(30),
    category VARCHAR(50),
    total_copies INT DEFAULT 1,
    available_copies INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Book issues (circulation)
CREATE TABLE IF NOT EXISTS book_issues (
    id INT AUTO_INCREMENT PRIMARY KEY,
    book_id INT NOT NULL,
    student_id INT NOT NULL,
    issued_on DATE NOT NULL,
    due_date DATE NOT NULL,
    returned_on DATE NULL,
    status ENUM('ISSUED','RETURNED','OVERDUE') DEFAULT 'ISSUED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (book_id)    REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_book_issue_student (student_id, status)
);