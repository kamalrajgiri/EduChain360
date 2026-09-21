USE educhain360_db;

-- ============================================================
-- 1. CLASSES
-- ============================================================

CREATE TABLE IF NOT EXISTS academic_classes (
    id INT PRIMARY KEY AUTO_INCREMENT,

    class_name VARCHAR(150) NOT NULL,
    grade VARCHAR(50) NOT NULL,
    section VARCHAR(50) NOT NULL,

    academic_year VARCHAR(50) NOT NULL,

    capacity INT DEFAULT 40,

    status ENUM('Active', 'Inactive')
        DEFAULT 'Active',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uq_class_section_year
        (grade, section, academic_year)
) ENGINE=InnoDB;


-- ============================================================
-- 2. SUBJECTS
-- ============================================================

CREATE TABLE IF NOT EXISTS subjects (
    id INT PRIMARY KEY AUTO_INCREMENT,

    subject_code VARCHAR(30) NOT NULL UNIQUE,

    subject_name VARCHAR(150) NOT NULL,

    description TEXT,

    status ENUM('Active', 'Inactive')
        DEFAULT 'Active',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;


-- ============================================================
-- 3. SUBJECTS OFFERED BY A CLASS
-- ============================================================

CREATE TABLE IF NOT EXISTS class_subjects (
    id INT PRIMARY KEY AUTO_INCREMENT,

    class_id INT NOT NULL,

    subject_id INT NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uq_class_subject
        (class_id, subject_id),

    CONSTRAINT fk_class_subject_class
        FOREIGN KEY (class_id)
        REFERENCES academic_classes(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_class_subject_subject
        FOREIGN KEY (subject_id)
        REFERENCES subjects(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;


-- ============================================================
-- 4. STUDENT ENROLLMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS class_enrollments (
    id INT PRIMARY KEY AUTO_INCREMENT,

    class_id INT NOT NULL,

    student_id INT NOT NULL,

    roll_number INT NOT NULL,

    enrollment_date DATE DEFAULT (CURRENT_DATE),

    status ENUM('Active', 'Inactive')
        DEFAULT 'Active',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uq_student_class
        (student_id, class_id),

    UNIQUE KEY uq_class_roll
        (class_id, roll_number),

    CONSTRAINT fk_enrollment_class
        FOREIGN KEY (class_id)
        REFERENCES academic_classes(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_enrollment_student
        FOREIGN KEY (student_id)
        REFERENCES users(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;


-- ============================================================
-- 5. TEACHER ASSIGNMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS teacher_assignments (
    id INT PRIMARY KEY AUTO_INCREMENT,

    teacher_id INT NOT NULL,

    class_id INT NOT NULL,

    subject_id INT NOT NULL,

    academic_year VARCHAR(50) NOT NULL,

    status ENUM('Active', 'Inactive')
        DEFAULT 'Active',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uq_teacher_class_subject_year
        (teacher_id, class_id, subject_id, academic_year),

    CONSTRAINT fk_assignment_teacher
        FOREIGN KEY (teacher_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_assignment_class
        FOREIGN KEY (class_id)
        REFERENCES academic_classes(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_assignment_subject
        FOREIGN KEY (subject_id)
        REFERENCES subjects(id)
        ON DELETE CASCADE
) ENGINE=InnoDB;


-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_enrollment_class
    ON class_enrollments(class_id);

CREATE INDEX idx_enrollment_student
    ON class_enrollments(student_id);

CREATE INDEX idx_assignment_teacher
    ON teacher_assignments(teacher_id);

CREATE INDEX idx_assignment_class
    ON teacher_assignments(class_id);

CREATE INDEX idx_assignment_subject
    ON teacher_assignments(subject_id);