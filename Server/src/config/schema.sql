CREATE DATABASE IF NOT EXISTS educhain360_db;
USE educhain360_db;

-- 1. Roles Definition
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE, -- Admin, Teacher, Student, Parent, Accountant, Librarian, HR, Lab Assistant
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    school_id_number VARCHAR(50) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    phone_number VARCHAR(20),
    id_card_photo_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
);

-- 3. Academic Credentials / Marksheets
CREATE TABLE IF NOT EXISTS academic_credentials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    credential_uuid VARCHAR(36) NOT NULL UNIQUE,
    student_id INT NOT NULL,
    title VARCHAR(150) NOT NULL, -- e.g., "Grade 10 Transcript", "High School Diploma"
    issue_date DATE NOT NULL,
    document_hash VARCHAR(64) NOT NULL, -- SHA-256 hash of canonical record
    is_anchored BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Fee Receipts / Transactions
CREATE TABLE IF NOT EXISTS fee_receipts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    receipt_number VARCHAR(50) NOT NULL UNIQUE,
    student_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_status ENUM('PENDING', 'PAID', 'FAILED') DEFAULT 'PENDING',
    payment_method VARCHAR(50),
    receipt_hash VARCHAR(64) NOT NULL, -- SHA-256 hash of canonical receipt
    is_anchored BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. Permissioned Blockchain Ledger Table (Hash-Chain References)
CREATE TABLE IF NOT EXISTS blockchain_ledger (
    block_index INT AUTO_INCREMENT PRIMARY KEY,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    record_type ENUM('CREDENTIAL', 'FEE_RECEIPT', 'EXAM_RESULT') NOT NULL,
    record_ref_id INT NOT NULL,
    data_hash VARCHAR(64) NOT NULL,
    previous_hash VARCHAR(64) NOT NULL,
    digital_signature TEXT NOT NULL,
    qr_code_url TEXT
);

-- Seed Initial Roles
INSERT IGNORE INTO roles (id, name) VALUES 
(1, 'Admin'), 
(2, 'Teacher'), 
(3, 'Student'), 
(4, 'Parent'), 
(5, 'Accountant'), 
(6, 'Librarian'), 
(7, 'HR'), 
(8, 'Lab Assistant');

-- Teachers Table
CREATE TABLE IF NOT EXISTS teachers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    employee_code VARCHAR(50) UNIQUE NOT NULL,
    department VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Teacher Class Assignments
CREATE TABLE IF NOT EXISTS teacher_classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id INT NOT NULL,
    class_name VARCHAR(50) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
);

ALTER TABLE users
  ADD COLUMN avatar_data MEDIUMTEXT NULL AFTER id_card_photo_url;

CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    contact_no VARCHAR(30),
    role VARCHAR(30) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(30) DEFAULT 'Active',
    last_login DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    application_no VARCHAR(50) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    contact_no VARCHAR(30),
    program VARCHAR(150) NOT NULL,
    applied_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(30) DEFAULT 'Pending'
);

CREATE TABLE IF NOT EXISTS departments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(150) NOT NULL
);

CREATE TABLE IF NOT EXISTS programs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    department_id INT,
    students INT DEFAULT 0,
    FOREIGN KEY (department_id)
        REFERENCES departments(id)
        ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS courses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(30),
    name VARCHAR(200),
    program_id INT
);

CREATE TABLE IF NOT EXISTS payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT,
    amount DECIMAL(12,2) NOT NULL,
    method VARCHAR(50),
    status VARCHAR(30) DEFAULT 'Completed',
    payment_date DATE DEFAULT (CURRENT_DATE),
    FOREIGN KEY (student_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS books (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(200),
    category VARCHAR(100),
    total_copies INT DEFAULT 1,
    available_copies INT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS book_transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    book_id INT,
    student_id INT,
    issue_date DATE,
    due_date DATE,
    status VARCHAR(30) DEFAULT 'Issued',
    FOREIGN KEY (book_id)
        REFERENCES books(id)
        ON DELETE SET NULL,
    FOREIGN KEY (student_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS employees (
    id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    department VARCHAR(100),
    position VARCHAR(100),
    email VARCHAR(150),
    status VARCHAR(30) DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS employee_attendance (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT,
    attendance_date DATE,
    status VARCHAR(30),
    FOREIGN KEY (employee_id)
        REFERENCES employees(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS attendance_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT,
    attendance_date DATE,
    status VARCHAR(30),
    FOREIGN KEY (student_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notices (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255),
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS blockchain_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    record_id VARCHAR(100),
    record_type VARCHAR(100),
    hash VARCHAR(255),
    block_number BIGINT,
    status VARCHAR(30) DEFAULT 'Verified',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS system_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    university_name VARCHAR(255),
    university_email VARCHAR(255),
    academic_session VARCHAR(50),
    two_factor BOOLEAN DEFAULT TRUE,
    login_notifications BOOLEAN DEFAULT TRUE,
    admission_notifications BOOLEAN DEFAULT TRUE,
    finance_notifications BOOLEAN DEFAULT TRUE
);