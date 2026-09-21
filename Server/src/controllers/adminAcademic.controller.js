import { pool } from "../config/db.js";

const db = pool;


// ============================================================
// HELPERS
// ============================================================

function getErrorMessage(error) {
  return error?.message || "Database operation failed.";
}


// ============================================================
// CLASSES
// ============================================================

export async function getClasses(req, res) {
  try {
    const [rows] = await db.query(`
      SELECT
        c.id,
        c.class_name,
        c.grade,
        c.section,
        c.academic_year,
        c.capacity,
        c.status,
        c.created_at,

        COUNT(DISTINCT e.id) AS enrolled_students,
        COUNT(DISTINCT cs.id) AS subject_count

      FROM academic_classes c

      LEFT JOIN class_enrollments e
        ON e.class_id = c.id
        AND e.status = 'Active'

      LEFT JOIN class_subjects cs
        ON cs.class_id = c.id

      GROUP BY
        c.id,
        c.class_name,
        c.grade,
        c.section,
        c.academic_year,
        c.capacity,
        c.status,
        c.created_at

      ORDER BY c.grade, c.section
    `);

    res.json(rows);
  } catch (error) {
    console.error("getClasses:", error);

    res.status(500).json({
      message: getErrorMessage(error),
    });
  }
}


export async function createClass(req, res) {
  try {
    const {
      class_name,
      grade,
      section,
      academic_year,
      capacity = 40,
    } = req.body;

    if (!class_name || !grade || !section || !academic_year) {
      return res.status(400).json({
        message:
          "class_name, grade, section and academic_year are required.",
      });
    }

    const [result] = await db.query(
      `
      INSERT INTO academic_classes
      (
        class_name,
        grade,
        section,
        academic_year,
        capacity
      )
      VALUES (?, ?, ?, ?, ?)
      `,
      [
        class_name.trim(),
        grade.trim(),
        section.trim(),
        academic_year.trim(),
        Number(capacity),
      ]
    );

    const [rows] = await db.query(
      `
      SELECT *
      FROM academic_classes
      WHERE id = ?
      `,
      [result.insertId]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error("createClass:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message:
          "A class with the same grade, section and academic year already exists.",
      });
    }

    res.status(500).json({
      message: getErrorMessage(error),
    });
  }
}


export async function updateClass(req, res) {
  try {
    const { id } = req.params;

    const {
      class_name,
      grade,
      section,
      academic_year,
      capacity,
      status,
    } = req.body;

    const [result] = await db.query(
      `
      UPDATE academic_classes
      SET
        class_name = COALESCE(?, class_name),
        grade = COALESCE(?, grade),
        section = COALESCE(?, section),
        academic_year = COALESCE(?, academic_year),
        capacity = COALESCE(?, capacity),
        status = COALESCE(?, status)
      WHERE id = ?
      `,
      [
        class_name || null,
        grade || null,
        section || null,
        academic_year || null,
        capacity ?? null,
        status || null,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Class not found.",
      });
    }

    const [rows] = await db.query(
      `SELECT * FROM academic_classes WHERE id = ?`,
      [id]
    );

    res.json(rows[0]);
  } catch (error) {
    console.error("updateClass:", error);

    res.status(500).json({
      message: getErrorMessage(error),
    });
  }
}


export async function deleteClass(req, res) {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      `
      DELETE FROM academic_classes
      WHERE id = ?
      `,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Class not found.",
      });
    }

    res.json({
      message: "Class deleted successfully.",
    });
  } catch (error) {
    console.error("deleteClass:", error);

    res.status(500).json({
      message: getErrorMessage(error),
    });
  }
}


// ============================================================
// SUBJECTS
// ============================================================

export async function getSubjects(req, res) {
  try {
    const [rows] = await db.query(`
      SELECT
        s.id,
        s.code AS subject_code,
        s.name AS subject_name,
        NULL AS description,
        'Active' AS status,

        COUNT(DISTINCT cs.class_id) AS class_count

      FROM subjects s

      LEFT JOIN class_subjects cs
        ON cs.subject_id = s.id

      GROUP BY
        s.id,
        s.code,
        s.name

      ORDER BY s.name
    `);

    res.json(rows);
  } catch (error) {
    console.error("getSubjects:", error);

    res.status(500).json({
      message: getErrorMessage(error),
    });
  }
}


export async function createSubject(req, res) {
  try {
    const {
      subject_code,
      subject_name,
      description = "",
    } = req.body;

    if (!subject_code || !subject_name) {
      return res.status(400).json({
        message:
          "subject_code and subject_name are required.",
      });
    }

    const [result] = await db.query(
      `
      INSERT INTO subjects
      (
        code,
        name
      )
      VALUES (?, ?)
      `,
      [
        subject_code.trim().toUpperCase(),
        subject_name.trim(),
      ]
    );

    const [rows] = await db.query(
      `
      SELECT *
      FROM subjects
      WHERE id = ?
      `,
      [result.insertId]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error("createSubject:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "Subject code already exists.",
      });
    }

    res.status(500).json({
      message: getErrorMessage(error),
    });
  }
}


export async function updateSubject(req, res) {
  try {
    const { id } = req.params;

    const {
      subject_code,
      subject_name,
      description,
      status,
    } = req.body;

    const [result] = await db.query(
      `
      UPDATE subjects
      SET
        code = COALESCE(?, code),
        name = COALESCE(?, name)
      WHERE id = ?
      `,
      [
        subject_code
          ? subject_code.trim().toUpperCase()
          : null,
        subject_name
          ? subject_name.trim()
          : null,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Subject not found.",
      });
    }

    const [rows] = await db.query(
      `SELECT * FROM subjects WHERE id = ?`,
      [id]
    );

    res.json(rows[0]);
  } catch (error) {
    console.error("updateSubject:", error);

    res.status(500).json({
      message: getErrorMessage(error),
    });
  }
}


export async function deleteSubject(req, res) {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      `
      DELETE FROM subjects
      WHERE id = ?
      `,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Subject not found.",
      });
    }

    res.json({
      message: "Subject deleted successfully.",
    });
  } catch (error) {
    console.error("deleteSubject:", error);

    res.status(500).json({
      message: getErrorMessage(error),
    });
  }
}


// ============================================================
// STUDENTS AVAILABLE FOR ENROLLMENT
// ============================================================

export async function getStudentsForEnrollment(req, res) {
  try {
    const [rows] = await db.query(`
      SELECT
        u.id,
        u.full_name AS first_name,
        '' AS last_name,
        u.email,
        u.phone_number AS contact_no,
        u.school_id_number,
        CASE WHEN u.is_active = 1 THEN 'Active' ELSE 'Inactive' END AS status

      FROM users u
      INNER JOIN roles r ON r.id = u.role_id

      WHERE LOWER(r.name) = 'student'

      ORDER BY u.full_name
    `);

    res.json(rows);
  } catch (error) {
    console.error("getStudentsForEnrollment:", error);

    res.status(500).json({
      message: getErrorMessage(error),
    });
  }
}


// ============================================================
// ENROLLMENTS
// ============================================================

export async function getEnrollments(req, res) {
  try {
    const [rows] = await db.query(`
      SELECT
        e.id,
        e.roll_number,
        e.enrollment_date,
        e.status,

        c.id AS class_id,
        c.class_name,
        c.grade,
        c.section,
        c.academic_year,

        u.id AS student_id,
        u.school_id_number,
        u.full_name AS first_name,
        '' AS last_name,
        u.email

      FROM class_enrollments e

      INNER JOIN academic_classes c
        ON c.id = e.class_id

      INNER JOIN users u
        ON u.id = e.student_id

      ORDER BY
        c.grade,
        c.section,
        e.roll_number
    `);

    res.json(rows);
  } catch (error) {
    console.error("getEnrollments:", error);

    res.status(500).json({
      message: getErrorMessage(error),
    });
  }
}


export async function createEnrollment(req, res) {
  try {
    const {
      class_id,
      student_id,
      roll_number,
    } = req.body;

    if (!class_id || !student_id || !roll_number) {
      return res.status(400).json({
        message:
          "class_id, student_id and roll_number are required.",
      });
    }

    const [students] = await db.query(
      `
      SELECT id
      FROM users u
      INNER JOIN roles r ON r.id = u.role_id
      WHERE u.id = ?
      AND LOWER(r.name) = 'student'
      `,
      [student_id]
    );

    if (students.length === 0) {
      return res.status(400).json({
        message: "Selected user is not a student.",
      });
    }

    const [classes] = await db.query(
      `
      SELECT
        id,
        capacity
      FROM academic_classes
      WHERE id = ?
      AND status = 'Active'
      `,
      [class_id]
    );

    if (classes.length === 0) {
      return res.status(404).json({
        message: "Class not found or inactive.",
      });
    }

    const [existingStudent] = await db.query(
      `
      SELECT id
      FROM class_enrollments
      WHERE student_id = ?
      AND class_id = ?
      `,
      [student_id, class_id]
    );

    if (existingStudent.length > 0) {
      return res.status(409).json({
        message:
          "This student is already enrolled in this class.",
      });
    }

    const [existingRoll] = await db.query(
      `
      SELECT id
      FROM class_enrollments
      WHERE class_id = ?
      AND roll_number = ?
      `,
      [class_id, roll_number]
    );

    if (existingRoll.length > 0) {
      return res.status(409).json({
        message:
          "This roll number is already assigned in this class.",
      });
    }

    const [result] = await db.query(
      `
      INSERT INTO class_enrollments
      (
        class_id,
        student_id,
        roll_number
      )
      VALUES (?, ?, ?)
      `,
      [
        class_id,
        student_id,
        Number(roll_number),
      ]
    );

    const [rows] = await db.query(
      `
      SELECT
        e.*,
        c.class_name,
        u.full_name AS first_name,
        '' AS last_name
      FROM class_enrollments e
      INNER JOIN academic_classes c
        ON c.id = e.class_id
      INNER JOIN users u
        ON u.id = e.student_id
      WHERE e.id = ?
      `,
      [result.insertId]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error("createEnrollment:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message:
          "This student/class or roll number combination already exists.",
      });
    }

    res.status(500).json({
      message: getErrorMessage(error),
    });
  }
}


export async function updateEnrollment(req, res) {
  try {
    const { id } = req.params;

    const {
      roll_number,
      status,
    } = req.body;

    const [result] = await db.query(
      `
      UPDATE class_enrollments
      SET
        roll_number = COALESCE(?, roll_number),
        status = COALESCE(?, status)
      WHERE id = ?
      `,
      [
        roll_number ?? null,
        status || null,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Enrollment not found.",
      });
    }

    const [rows] = await db.query(
      `
      SELECT
        e.*,
        c.class_name,
        u.full_name AS first_name,
        '' AS last_name
      FROM class_enrollments e
      INNER JOIN academic_classes c
        ON c.id = e.class_id
      INNER JOIN users u
        ON u.id = e.student_id
      WHERE e.id = ?
      `,
      [id]
    );

    res.json(rows[0]);
  } catch (error) {
    console.error("updateEnrollment:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "That roll number is already used in this class.",
      });
    }

    res.status(500).json({
      message: getErrorMessage(error),
    });
  }
}


export async function deleteEnrollment(req, res) {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      `
      DELETE FROM class_enrollments
      WHERE id = ?
      `,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Enrollment not found.",
      });
    }

    res.json({
      message: "Student removed from class.",
    });
  } catch (error) {
    console.error("deleteEnrollment:", error);

    res.status(500).json({
      message: getErrorMessage(error),
    });
  }
}


// ============================================================
// TEACHERS
// ============================================================

export async function getTeachersForAssignment(req, res) {
  try {
    const [rows] = await db.query(`
      SELECT
        u.id,
        u.full_name AS first_name,
        '' AS last_name,
        email,
        u.phone_number AS contact_no,
        CASE WHEN u.is_active = 1 THEN 'Active' ELSE 'Inactive' END AS status
      FROM users u
      INNER JOIN roles r ON r.id = u.role_id
      WHERE LOWER(r.name) = 'teacher'
      AND u.is_active = 1
      ORDER BY u.full_name
    `);

    res.json(rows);
  } catch (error) {
    console.error("getTeachersForAssignment:", error);

    res.status(500).json({
      message: getErrorMessage(error),
    });
  }
}


// ============================================================
// TEACHER ASSIGNMENTS
// ============================================================

export async function getTeacherAssignments(req, res) {
  try {
    const [rows] = await db.query(`
      SELECT
        ta.id,
        ta.academic_year,
        ta.status,

        t.id AS teacher_id,
        t.full_name AS teacher_name,

        c.id AS class_id,
        c.class_name,
        c.grade,
        c.section,

        s.id AS subject_id,
        s.code AS subject_code,
        s.name AS subject_name

      FROM teacher_assignments ta

      INNER JOIN users t
        ON t.id = ta.teacher_id

      INNER JOIN academic_classes c
        ON c.id = ta.class_id

      INNER JOIN subjects s
        ON s.id = ta.subject_id

      ORDER BY
        c.grade,
        c.section,
        s.name
    `);

    res.json(rows);
  } catch (error) {
    console.error("getTeacherAssignments:", error);

    res.status(500).json({
      message: getErrorMessage(error),
    });
  }
}


export async function createTeacherAssignment(req, res) {
  try {
    const {
      teacher_id,
      class_id,
      subject_id,
      academic_year,
    } = req.body;

    if (
      !teacher_id ||
      !class_id ||
      !subject_id ||
      !academic_year
    ) {
      return res.status(400).json({
        message:
          "teacher_id, class_id, subject_id and academic_year are required.",
      });
    }

    const [teacher] = await db.query(
      `
      SELECT id
      FROM users u
      INNER JOIN roles r ON r.id = u.role_id
      WHERE u.id = ?
      AND LOWER(r.name) = 'teacher'
      AND u.is_active = 1
      `,
      [teacher_id]
    );

    if (teacher.length === 0) {
      return res.status(400).json({
        message: "Selected user is not an active teacher.",
      });
    }

    const [classRows] = await db.query(
      `
      SELECT id
      FROM academic_classes
      WHERE id = ?
      AND status = 'Active'
      `,
      [class_id]
    );

    if (classRows.length === 0) {
      return res.status(400).json({
        message: "Selected class is not active.",
      });
    }

    const [subjectRows] = await db.query(
      `
      SELECT id
      FROM subjects
      WHERE id = ?
      `,
      [subject_id]
    );

    if (subjectRows.length === 0) {
      return res.status(400).json({
        message: "Selected subject is not active.",
      });
    }

    const [result] = await db.query(
      `
      INSERT INTO teacher_assignments
      (
        teacher_id,
        class_id,
        subject_id,
        academic_year
      )
      VALUES (?, ?, ?, ?)
      `,
      [
        teacher_id,
        class_id,
        subject_id,
        academic_year.trim(),
      ]
    );

    const [rows] = await db.query(
      `
      SELECT
        ta.id,
        ta.academic_year,
        ta.status,

        t.full_name AS teacher_name,

        c.class_name,

        s.code AS subject_code,
        s.name AS subject_name

      FROM teacher_assignments ta

      INNER JOIN users t
        ON t.id = ta.teacher_id

      INNER JOIN academic_classes c
        ON c.id = ta.class_id

      INNER JOIN subjects s
        ON s.id = ta.subject_id

      WHERE ta.id = ?
      `,
      [result.insertId]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error("createTeacherAssignment:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message:
          "This teacher, class, subject and academic year assignment already exists.",
      });
    }

    res.status(500).json({
      message: getErrorMessage(error),
    });
  }
}


export async function updateTeacherAssignment(req, res) {
  try {
    const { id } = req.params;

    const {
      academic_year,
      status,
    } = req.body;

    const [result] = await db.query(
      `
      UPDATE teacher_assignments
      SET
        academic_year = COALESCE(?, academic_year),
        status = COALESCE(?, status)
      WHERE id = ?
      `,
      [
        academic_year || null,
        status || null,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Teacher assignment not found.",
      });
    }

    const [rows] = await db.query(
      `
      SELECT
        ta.id,
        ta.academic_year,
        ta.status,

        t.full_name AS teacher_name,

        c.class_name,

        s.code AS subject_code,
        s.name AS subject_name

      FROM teacher_assignments ta

      INNER JOIN users t
        ON t.id = ta.teacher_id

      INNER JOIN academic_classes c
        ON c.id = ta.class_id

      INNER JOIN subjects s
        ON s.id = ta.subject_id

      WHERE ta.id = ?
      `,
      [id]
    );

    res.json(rows[0]);
  } catch (error) {
    console.error("updateTeacherAssignment:", error);

    res.status(500).json({
      message: getErrorMessage(error),
    });
  }
}


export async function deleteTeacherAssignment(req, res) {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      `
      DELETE FROM teacher_assignments
      WHERE id = ?
      `,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Teacher assignment not found.",
      });
    }

    res.json({
      message: "Teacher assignment removed.",
    });
  } catch (error) {
    console.error("deleteTeacherAssignment:", error);

    res.status(500).json({
      message: getErrorMessage(error),
    });
  }
}


// ============================================================
// ACADEMIC MANAGEMENT SUMMARY
// ============================================================

export async function getAcademicManagementSummary(req, res) {
  try {
    const [[classStats]] = await db.query(`
      SELECT COUNT(*) AS total
      FROM academic_classes
      WHERE status = 'Active'
    `);

    const [[subjectStats]] = await db.query(`
      SELECT COUNT(*) AS total
      FROM subjects
      WHERE status = 'Active'
    `);

    const [[enrollmentStats]] = await db.query(`
      SELECT COUNT(*) AS total
      FROM class_enrollments
      WHERE status = 'Active'
    `);

    const [[assignmentStats]] = await db.query(`
      SELECT COUNT(*) AS total
      FROM teacher_assignments
      WHERE status = 'Active'
    `);

    const [[teacherStats]] = await db.query(`
      SELECT COUNT(*) AS total
      FROM users u
      INNER JOIN roles r ON r.id = u.role_id
      WHERE LOWER(r.name) = 'teacher'
      AND u.is_active = 1
    `);

    const [[studentStats]] = await db.query(`
      SELECT COUNT(*) AS total
      FROM users u
      INNER JOIN roles r ON r.id = u.role_id
      WHERE LOWER(r.name) = 'student'
      AND u.is_active = 1
    `);

    res.json({
      classes: Number(classStats.total),
      subjects: Number(subjectStats.total),
      enrollments: Number(enrollmentStats.total),
      assignments: Number(assignmentStats.total),
      teachers: Number(teacherStats.total),
      students: Number(studentStats.total),
    });
  } catch (error) {
    console.error("getAcademicManagementSummary:", error);

    res.status(500).json({
      message: getErrorMessage(error),
    });
  }
}