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