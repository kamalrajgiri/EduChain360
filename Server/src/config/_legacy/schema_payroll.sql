-- ============================================================
-- PHASE ACCOUNTANT · PAYROLL
-- ============================================================
USE educhain360_db;

CREATE TABLE IF NOT EXISTS staff_salaries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    gross_salary DECIMAL(10,2) NOT NULL,
    tax_rate DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    pf_rate DECIMAL(5,2) NOT NULL DEFAULT 5.00,
    other_deduction DECIMAL(10,2) NOT NULL DEFAULT 0,
    effective_from DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payroll_runs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    month VARCHAR(7) NOT NULL,
    total_gross DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_deductions DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_net DECIMAL(12,2) NOT NULL DEFAULT 0,
    staff_count INT NOT NULL DEFAULT 0,
    status ENUM('DRAFT','PROCESSED') DEFAULT 'PROCESSED',
    run_by INT NULL,
    notes VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_month (month),
    FOREIGN KEY (run_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS payroll_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    run_id INT NOT NULL,
    user_id INT NOT NULL,
    gross DECIMAL(10,2) NOT NULL,
    tax DECIMAL(10,2) NOT NULL DEFAULT 0,
    pf DECIMAL(10,2) NOT NULL DEFAULT 0,
    other_deduction DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_deductions DECIMAL(10,2) NOT NULL DEFAULT 0,
    net DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (run_id) REFERENCES payroll_runs(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uniq_run_user (run_id, user_id)
);