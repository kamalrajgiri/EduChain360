-- ═══════════════════════════════════════════════════════════════
-- EduChain360 — Canonical Schema
-- Drop DB and run this to build a fresh database.
-- Safe to re-run: every CREATE uses IF NOT EXISTS.
-- ═══════════════════════════════════════════════════════════════

CREATE DATABASE IF NOT EXISTS educhain360_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE educhain360_db;

-- ─── 1. Roles ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT IGNORE INTO roles (id, name) VALUES
  (1, 'Admin'),
  (2, 'Teacher'),
  (3, 'Student'),
  (4, 'Parent'),
  (5, 'Accountant'),
  (6, 'Librarian'),
  (7, 'HR'),
  (8, 'Lab Assistant');

-- ─── 2. Users ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  school_id_number VARCHAR(50) NOT NULL UNIQUE,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role_id INT NOT NULL,
  phone_number VARCHAR(20),
  id_card_photo_url VARCHAR(255),
  avatar_data MEDIUMTEXT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT,
  INDEX idx_users_role (role_id)
);

-- ─── 3. Teachers profile ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS teachers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  employee_code VARCHAR(50) UNIQUE,
  department VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─── 4. Classes ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS classes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  academic_year VARCHAR(20) NOT NULL,
  class_teacher_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_teacher_id) REFERENCES teachers(id) ON DELETE SET NULL,
  INDEX idx_classes_year (academic_year)
);

-- ─── 5. Subjects ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subjects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) UNIQUE,
  full_marks INT DEFAULT 100
);

-- ─── 6. Enrollments (student → class) ─────────────────────────
CREATE TABLE IF NOT EXISTS enrollments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  class_id INT NOT NULL,
  roll_number INT NOT NULL,
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_student_class (student_id, class_id),
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id)   REFERENCES classes(id) ON DELETE CASCADE,
  INDEX idx_enroll_class (class_id)
);

-- ─── 7. Class ↔ Subject ↔ Teacher assignments ─────────────────
CREATE TABLE IF NOT EXISTS class_subjects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  class_id INT NOT NULL,
  subject_id INT NOT NULL,
  teacher_id INT NOT NULL,
  UNIQUE KEY uniq_class_subject (class_id, subject_id),
  FOREIGN KEY (class_id)   REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
  INDEX idx_cs_teacher (teacher_id)
);

-- ─── 8. Attendance ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  class_id INT NOT NULL,
  subject_id INT NULL,
  attendance_date DATE NOT NULL,
  status ENUM('PRESENT','ABSENT','LATE','LEAVE') NOT NULL,
  marked_by_teacher_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_attendance (student_id, class_id, subject_id, attendance_date),
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id)   REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
  FOREIGN KEY (marked_by_teacher_id) REFERENCES teachers(id) ON DELETE SET NULL,
  INDEX idx_attendance_student_date (student_id, attendance_date),
  INDEX idx_attendance_class_date (class_id, attendance_date)
);

-- ─── 9. Exams ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS exams (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  class_id INT NOT NULL,
  subject_id INT NOT NULL,
  full_marks INT DEFAULT 100,
  exam_date DATE NULL,
  created_by_teacher_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id)   REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by_teacher_id) REFERENCES teachers(id) ON DELETE SET NULL,
  INDEX idx_exams_class (class_id),
  INDEX idx_exams_name (name)
);

-- ─── 10. Exam marks ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS exam_marks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  exam_id INT NOT NULL,
  student_id INT NOT NULL,
  marks_obtained DECIMAL(5,2) NULL,
  grade VARCHAR(5) NULL,
  submitted_at TIMESTAMP NULL,
  UNIQUE KEY uniq_exam_student (exam_id, student_id),
  FOREIGN KEY (exam_id)    REFERENCES exams(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_marks_student (student_id)
);

-- ─── 11. Timetable ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS timetable_entries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  class_id INT NOT NULL,
  subject_id INT NOT NULL,
  teacher_id INT NULL,
  day_of_week ENUM('MON','TUE','WED','THU','FRI','SAT') NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room VARCHAR(50) NULL,
  FOREIGN KEY (class_id)   REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL,
  INDEX idx_tt_class_day (class_id, day_of_week),
  INDEX idx_tt_teacher_day (teacher_id, day_of_week)
);

-- ─── 12. Notices (private-capable) ────────────────────────────
CREATE TABLE IF NOT EXISTS notices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  audience ENUM('ALL','STUDENTS','PARENTS','STAFF','TEACHERS','APPLICANTS') DEFAULT 'ALL',
  recipient_id INT NULL,
  published_by INT NULL,
  published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('DRAFT','SENT') DEFAULT 'SENT',
  FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (published_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_notices_published (published_at DESC),
  INDEX idx_notices_recipient (recipient_id)
);

-- ─── 13. Academic credentials ─────────────────────────────────
CREATE TABLE IF NOT EXISTS academic_credentials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  credential_uuid VARCHAR(36) NOT NULL UNIQUE,
  verify_code VARCHAR(20) UNIQUE NULL,
  student_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  issue_date DATE NOT NULL,
  document_hash VARCHAR(64) NULL,
  is_anchored BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_cred_student (student_id)
);

-- ─── 14. Fee receipts ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fee_receipts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  receipt_number VARCHAR(50) NOT NULL UNIQUE,
  student_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_status ENUM('PENDING','PAID','FAILED') DEFAULT 'PENDING',
  payment_method VARCHAR(50),
  recorded_by INT NULL,
  notes VARCHAR(255) NULL,
  receipt_hash VARCHAR(64) NULL,
  is_anchored BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_receipts_student (student_id),
  INDEX idx_receipts_status (payment_status)
);

-- ─── 15. Fee invoices ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fee_invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  term VARCHAR(50) NOT NULL,
  fee_head VARCHAR(100) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0,
  due_date DATE NULL,
  status ENUM('UNPAID','PAID','PARTIAL') DEFAULT 'UNPAID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_invoice_student_status (student_id, status),
  INDEX idx_invoice_due (due_date)
);

-- ─── 16. Fee structure template ───────────────────────────────
CREATE TABLE IF NOT EXISTS fee_structure (
  id INT AUTO_INCREMENT PRIMARY KEY,
  class_id INT NULL,
  academic_year VARCHAR(20) NOT NULL,
  term VARCHAR(50) NOT NULL,
  fee_head VARCHAR(100) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  is_mandatory BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  INDEX idx_fs_lookup (academic_year, term, class_id)
);

-- ─── 17. Fee adjustments ──────────────────────────────────────
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

-- ─── 18. Library ──────────────────────────────────────────────
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

-- ─── 19. Payroll ──────────────────────────────────────────────
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
  UNIQUE KEY uniq_run_user (run_id, user_id),
  FOREIGN KEY (run_id) REFERENCES payroll_runs(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─── 20. Blockchain placeholder (Phase I) ─────────────────────
CREATE TABLE IF NOT EXISTS blockchain_ledger (
  block_index INT AUTO_INCREMENT PRIMARY KEY,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  record_type ENUM('CREDENTIAL','FEE_RECEIPT','EXAM_RESULT') NOT NULL,
  record_ref_id INT NOT NULL,
  data_hash VARCHAR(64) NOT NULL,
  previous_hash VARCHAR(64) NOT NULL,
  digital_signature TEXT,
  qr_code_url TEXT
);