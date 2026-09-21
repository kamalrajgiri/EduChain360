-- ============================================================
-- PHASE STUDENT — additional tables & adjustments
-- ============================================================
USE educhain360_db;

-- Make hash columns nullable until the blockchain phase
ALTER TABLE fee_receipts         MODIFY COLUMN receipt_hash  VARCHAR(64) NULL;
ALTER TABLE academic_credentials MODIFY COLUMN document_hash VARCHAR(64) NULL;

CREATE TABLE IF NOT EXISTS classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    UNIQUE KEY uq_class_year (name, academic_year)
);

CREATE TABLE IF NOT EXISTS subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(30) NOT NULL UNIQUE,
    full_marks INT NOT NULL DEFAULT 100
);

CREATE TABLE IF NOT EXISTS enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    class_id INT NOT NULL,
    roll_number INT NOT NULL,
    UNIQUE KEY uq_enrollment (student_id, class_id),
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS class_subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    subject_id INT NOT NULL,
    teacher_id INT NULL,
    UNIQUE KEY uq_class_subject (class_id, subject_id),
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS timetable_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    subject_id INT NOT NULL,
    teacher_id INT NULL,
    day_of_week ENUM('MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room VARCHAR(50),
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    class_id INT NOT NULL,
    subject_id INT NOT NULL,
    attendance_date DATE NOT NULL,
    status ENUM('PRESENT', 'LATE', 'ABSENT') NOT NULL,
    marked_by_teacher_id INT NULL,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (marked_by_teacher_id) REFERENCES teachers(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS exams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    class_id INT NOT NULL,
    subject_id INT NOT NULL,
    full_marks INT NOT NULL DEFAULT 100,
    exam_date DATE NOT NULL,
    created_by_teacher_id INT NULL,
    UNIQUE KEY uq_exam (name, class_id, subject_id),
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by_teacher_id) REFERENCES teachers(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS exam_marks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_id INT NOT NULL,
    student_id INT NOT NULL,
    marks_obtained DECIMAL(5,2) NOT NULL,
    grade VARCHAR(5) NOT NULL,
    submitted_at DATETIME NOT NULL,
    UNIQUE KEY uq_exam_student (exam_id, student_id),
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

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