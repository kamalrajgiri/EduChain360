import bcrypt from "bcryptjs";
import { pool } from "../config/db.js";

export async function getDashboard(req, res) {
  try {
    const [[students]] = await pool.query(`
      SELECT COUNT(*) AS total
      FROM users u
      JOIN roles r ON r.id = u.role_id
      WHERE r.name = 'Student'
      AND u.is_active = TRUE
    `);

    const [[staff]] = await pool.query(`
      SELECT COUNT(*) AS total
      FROM users u
      JOIN roles r ON r.id = u.role_id
      WHERE r.name IN ('Teacher', 'HR', 'Accountant', 'Librarian')
      AND u.is_active = TRUE
    `);

    const [[pendingAdmissions]] =
      await pool.query(`
        SELECT COUNT(*) AS total
        FROM admissions
        WHERE status IN ('Pending', 'Under Review')
      `);

    const [[monthlyCollection]] =
      await pool.query(`
        SELECT COALESCE(SUM(amount), 0) AS total
        FROM payments
        WHERE status = 'Completed'
        AND MONTH(payment_date) = MONTH(CURDATE())
        AND YEAR(payment_date) = YEAR(CURDATE())
      `);

    const [[books]] = await pool.query(`
      SELECT COUNT(*) AS total
      FROM books
    `);

    const [[blockchainRecords]] =
      await pool.query(`
        SELECT COUNT(*) AS total
        FROM blockchain_records
      `);

    const [feeTrend] = await pool.query(`
      SELECT
        DATE_FORMAT(payment_date, '%b') AS label,
        SUM(amount) AS amount
      FROM payments
      WHERE status = 'Completed'
      AND payment_date >= DATE_SUB(CURDATE(), INTERVAL 5 MONTH)
      GROUP BY YEAR(payment_date), MONTH(payment_date), label
      ORDER BY YEAR(payment_date), MONTH(payment_date)
    `);

    const [[attendance]] =
      await pool.query(`
        SELECT
          COUNT(*) AS total,
          SUM(status = 'Present') AS present,
          SUM(status = 'Late') AS late,
          SUM(status = 'Absent') AS absent
        FROM attendance_records
        WHERE attendance_date = CURDATE()
      `);

    const [admissions] = await pool.query(`
      SELECT
        id,
        application_no,
        first_name,
        last_name,
        program,
        email,
        contact_no,
        applied_date,
        status
      FROM admissions
      ORDER BY applied_date DESC
      LIMIT 5
    `);

    const [notices] = await pool.query(`
      SELECT *
      FROM notices
      ORDER BY created_at DESC
      LIMIT 5
    `);

    const rate =
      attendance.total > 0
        ? Number(
            (
              (attendance.present /
                attendance.total) *
              100
            ).toFixed(1)
          )
        : 0;

    res.json({
      success: true,
      data: {
        stats: {
          students: students.total,
          staff: staff.total,
          pendingAdmissions:
            pendingAdmissions.total,
          monthlyCollection:
            monthlyCollection.total,
          books: books.total,
          blockchainRecords:
            blockchainRecords.total,
        },

        feeTrend,

        attendance: {
          rate,
          present: attendance.present || 0,
          late: attendance.late || 0,
          absent: attendance.absent || 0,
        },

        admissions,

        notices,

        health: [
          {
            name: "API Server",
            status: "Connected",
          },
          {
            name: "MySQL Database",
            status: "Connected",
          },
          {
            name: "Blockchain Service",
            status: "Connected",
          },
        ],
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Unable to load dashboard",
    });
  }
}

/* =========================
   ADMISSIONS
========================= */

export async function getAdmissions(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT *
      FROM admissions
      ORDER BY applied_date DESC
    `);

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    res.status(500).json({
      message: "Unable to load admissions",
    });
  }
}

export async function createAdmission(req, res) {
  try {
    const {
      application_no,
      first_name,
      last_name,
      applicant_name,
      name,
      email,
      contact_no,
      program,
      applied_date,
      status,
    } = req.body;
    const applicantName = applicant_name || name || [first_name, last_name]
      .filter(Boolean)
      .join(" ")
      .trim();
    const [firstName = "", ...lastNameParts] = applicantName.split(/\s+/);
    const lastName = last_name || lastNameParts.join(" ");

    const admissionStatus = [
      'Pending',
      'Under Review',
      'Approved',
      'Rejected',
    ].includes(status)
      ? status
      : 'Pending';
    const applicationNumber =
      application_no || `ADM-${Date.now()}`;

    if (!firstName || !email || !program) {
      return res.status(400).json({
        message: "Applicant name, email and program are required",
      });
    }

    const [result] = await pool.query(
      `
      INSERT INTO admissions
      (
        application_no,
        first_name,
        last_name,
        email,
        contact_no,
        program,
        applied_date,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), ?)
      `,
      [
        applicationNumber,
        firstName,
        lastName,
        email,
        contact_no,
        program,
        applied_date || null,
        admissionStatus,
      ]
    );

    res.status(201).json({
      success: true,
      id: result.insertId,
      message: "Admission created",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Unable to create admission",
    });
  }
}

export async function updateAdmission(req, res) {
  try {
    const { id } = req.params;
    const {
      application_no,
      applicant_name,
      first_name,
      last_name,
      email,
      contact_no,
      program,
      applied_date,
      status,
    } = req.body;

    if (
      status &&
      !application_no &&
      !applicant_name &&
      !first_name &&
      !last_name &&
      !email &&
      !contact_no &&
      !program &&
      !applied_date
    ) {
      if (!['Pending', 'Under Review', 'Approved', 'Rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid admission status' });
      }

      await pool.query(
        `UPDATE admissions SET status = ? WHERE id = ?`,
        [status, id]
      );

      return res.json({
        success: true,
        message: 'Admission updated',
      });
    }

    const applicantName = applicant_name || [first_name, last_name]
      .filter(Boolean)
      .join(' ')
      .trim();
    const [firstName = '', ...lastNameParts] = applicantName.split(/\s+/);
    const lastName = last_name || lastNameParts.join(' ');
    const admissionStatus = [
      'Pending',
      'Under Review',
      'Approved',
      'Rejected',
    ].includes(status)
      ? status
      : 'Pending';

    await pool.query(
      `
      UPDATE admissions
      SET application_no = ?,
          first_name = ?,
          last_name = ?,
          email = ?,
          contact_no = ?,
          program = ?,
          applied_date = COALESCE(?, applied_date),
          status = ?
      WHERE id = ?
      `,
      [
        application_no,
        firstName,
        lastName,
        email,
        contact_no,
        program,
        applied_date || null,
        admissionStatus,
        id,
      ]
    );

    res.json({
      success: true,
      message: "Admission updated",
    });
  } catch (error) {
    res.status(500).json({
      message: "Unable to update admission",
    });
  }
}

export async function deleteAdmission(req, res) {
  try {
    const { id } = req.params;

    await pool.query(
      `DELETE FROM admissions WHERE id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: "Admission deleted",
    });
  } catch (error) {
    res.status(500).json({
      message: "Unable to delete admission",
    });
  }
}

/* =========================
   USERS
========================= */

export async function getUsers(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT
        u.id,
        full_name,
        email,
        phone_number,
        r.name AS role,
        CASE WHEN is_active = 1 THEN 'Active' ELSE 'Inactive' END AS status,
        u.created_at
      FROM users u
      JOIN roles r ON r.id = u.role_id
      ORDER BY u.created_at DESC
    `);

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error('Unable to load users:', error);

    res.status(500).json({
      message: "Unable to load users",
    });
  }
}

export async function createUser(req, res) {
  try {
    const {
      full_name,
      name,
      first_name,
      last_name,
      email,
      role,
      status,
    } = req.body;
    const fullName = full_name || name || [first_name, last_name].filter(Boolean).join(" ").trim();
    const isActive = status !== 'Inactive';

    if (!fullName || !email || !role) {
      return res.status(400).json({
        message: "Name, email and role are required",
      });
    }

    const [existingUsers] = await pool.query(
      `SELECT id FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1`,
      [email.trim()]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        message: "This email is already registered. Use a different email.",
      });
    }

    const [roleRows] = await pool.query('SELECT id FROM roles WHERE name = ? LIMIT 1', [role]);
    if (roleRows.length === 0) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const passwordHash = await bcrypt.hash(
      "ChangeMe@123",
      10
    );

    const [result] = await pool.query(
      `
      INSERT INTO users
      (
        school_id_number,
        full_name,
        email,
        password_hash,
        role_id,
        is_active
      )
      VALUES (?, ?, ?, ?, ?, 1)
      `,
      [
        `USR-${Date.now()}`,
        fullName,
        email,
        passwordHash,
        roleRows[0].id,
      ]
    );

    if (!isActive) {
      await pool.query(
        `UPDATE users SET is_active = 0 WHERE id = ?`,
        [result.insertId]
      );
    }

    res.status(201).json({
      success: true,
      id: result.insertId,
      message:
        "User created. Default password is ChangeMe@123",
    });
  } catch (error) {
    console.error(error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        message: "This email is already registered. Use a different email.",
      });
    }

    res.status(500).json({
      message: "Unable to create user",
    });
  }
}

export async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const {
      full_name,
      name,
      email,
      role,
      status,
    } = req.body;
    const updates = [];
    const values = [];

    if (full_name || name) {
      updates.push('full_name = ?');
      values.push(full_name || name);
    }

    if (email) {
      updates.push('email = ?');
      values.push(email);
    }

    if (role) {
      const [roleRows] = await pool.query(
        'SELECT id FROM roles WHERE name = ? LIMIT 1',
        [role]
      );

      if (roleRows.length === 0) {
        return res.status(400).json({ message: 'Invalid role' });
      }

      updates.push('role_id = ?');
      values.push(roleRows[0].id);
    }

    if (status) {
      updates.push('is_active = ?');
      values.push(status === 'Active' ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No changes supplied' });
    }

    values.push(id);
    await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    res.json({
      success: true,
      message: "User updated",
    });
  } catch (error) {
    res.status(500).json({
      message: "Unable to update user",
    });
  }
}

export async function deleteUser(req, res) {
  try {
    const { id } = req.params;

    await pool.query(`DELETE FROM users WHERE id = ?`, [id]);

    res.json({
      success: true,
      message: "User deleted",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Unable to delete user",
    });
  }
}

/* =========================
   ACADEMICS
========================= */

export async function getAcademics(req, res) {
  try {
    const [[departments]] =
      await pool.query(`
        SELECT COUNT(*) AS total
        FROM departments
      `);

    const [[programs]] =
      await pool.query(`
        SELECT COUNT(*) AS total
        FROM programs
      `);

    const [[courses]] =
      await pool.query(`
        SELECT COUNT(*) AS total
        FROM courses
      `);

    const [programList] =
      await pool.query(`
        SELECT
          p.id,
          p.name,
          d.name AS department,
          p.students
        FROM programs p
        LEFT JOIN departments d
          ON p.department_id = d.id
        ORDER BY p.name
      `);

    res.json({
      success: true,
      data: {
        departments: departments.total,
        programs: programs.total,
        courses: courses.total,
        programList,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Unable to load academics",
    });
  }
}

/* =========================
   FINANCE
========================= */

export async function getFinance(req, res) {
  try {
    const [[monthly]] =
      await pool.query(`
        SELECT COALESCE(SUM(amount), 0) AS total
        FROM payments
        WHERE status = 'Completed'
        AND MONTH(payment_date) = MONTH(CURDATE())
        AND YEAR(payment_date) = YEAR(CURDATE())
      `);

    const [[count]] =
      await pool.query(`
        SELECT COUNT(*) AS total
        FROM payments
      `);

    const [[pending]] =
      await pool.query(`
        SELECT COUNT(*) AS total
        FROM payments
        WHERE status = 'Pending'
      `);

    const [payments] =
      await pool.query(`
        SELECT
          p.*,
          u.full_name AS student_name
        FROM payments p
        LEFT JOIN users u
          ON p.student_id = u.id
        ORDER BY p.payment_date DESC
        LIMIT 10
      `);

    res.json({
      success: true,
      data: {
        monthlyCollection: monthly.total,
        paymentCount: count.total,
        pendingPayments: pending.total,
        payments,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Unable to load finance",
    });
  }
}

/* =========================
   LIBRARY
========================= */

export async function getLibrary(req, res) {
  try {
    const [[total]] =
      await pool.query(`
        SELECT COALESCE(SUM(total_copies), 0) AS total
        FROM books
      `);

    const [[available]] =
      await pool.query(`
        SELECT COALESCE(SUM(available_copies), 0) AS total
        FROM books
      `);

    const [[issued]] =
      await pool.query(`
        SELECT COUNT(*) AS total
        FROM book_transactions
        WHERE status = 'Issued'
      `);

    const [[overdue]] =
      await pool.query(`
        SELECT COUNT(*) AS total
        FROM book_transactions
        WHERE status = 'Issued'
        AND due_date < CURDATE()
      `);

    const [books] =
      await pool.query(`
        SELECT *
        FROM books
        ORDER BY title
        LIMIT 20
      `);

    res.json({
      success: true,
      data: {
        totalBooks: total.total,
        availableBooks: available.total,
        issuedBooks: issued.total,
        overdueBooks: overdue.total,
        books,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Unable to load library",
    });
  }
}

/* =========================
   HR
========================= */

export async function getHr(req, res) {
  try {
    const [[employees]] =
      await pool.query(`
        SELECT COUNT(*) AS total
        FROM employees
      `);

    const [[present]] =
      await pool.query(`
        SELECT COUNT(*) AS total
        FROM employee_attendance
        WHERE attendance_date = CURDATE()
        AND status = 'Present'
      `);

    const [[leave]] =
      await pool.query(`
        SELECT COUNT(*) AS total
        FROM employee_attendance
        WHERE attendance_date = CURDATE()
        AND status = 'Leave'
      `);

    const [employeeList] =
      await pool.query(`
        SELECT *
        FROM employees
        ORDER BY first_name
      `);

    res.json({
      success: true,
      data: {
        employees: employees.total,
        present: present.total,
        onLeave: leave.total,
        employeeList,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Unable to load HR",
    });
  }
}

/* =========================
   ANALYTICS
========================= */

export async function getAnalytics(req, res) {
  try {
    res.json({
      success: true,
      data: {
        studentGrowth: 82,
        admissionConversion: 68,
        feeGrowth: 74,
        attendanceRate: 94,

        metrics: [
          {
            label: "Student engagement",
            value: 87,
          },
          {
            label: "Admission processing",
            value: 78,
          },
          {
            label: "Fee collection",
            value: 74,
          },
          {
            label: "Attendance",
            value: 94,
          },
          {
            label: "Library utilization",
            value: 69,
          },
        ],
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Unable to load analytics",
    });
  }
}

/* =========================
   BLOCKCHAIN
========================= */

export async function getBlockchain(req, res) {
  try {
    const [records] =
      await pool.query(`
        SELECT *
        FROM blockchain_records
        ORDER BY created_at DESC
        LIMIT 20
      `);

    const [[count]] =
      await pool.query(`
        SELECT COUNT(*) AS total
        FROM blockchain_records
      `);

    const [[verified]] =
      await pool.query(`
        SELECT COUNT(*) AS total
        FROM blockchain_records
        WHERE status = 'Verified'
      `);

    res.json({
      success: true,
      data: {
        status: "Connected",
        latestBlock: 124890,
        transactions: count.total,
        verifiedRecords: verified.total,
        records,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Unable to load blockchain",
    });
  }
}

/* =========================
   PROFILE
========================= */

export async function getProfile(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT
        u.id,
        u.full_name,
        u.email,
        u.phone_number,
        r.name AS role,
        u.created_at
      FROM users u
      JOIN roles r ON r.id = u.role_id
      WHERE u.id = ?
      LIMIT 1
    `, [req.user.id]);

    res.json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    res.status(500).json({
      message: "Unable to load profile",
    });
  }
}

export async function updateProfile(req, res) {
  try {
    const {
      full_name,
      firstName,
      middleName,
      lastName,
      email,
      phone,
    } = req.body;
    const name =
      full_name ||
      [firstName, middleName, lastName]
        .filter(Boolean)
        .join(" ");

    await pool.query(
      `
      UPDATE users
      SET
        full_name = ?,
        email = ?,
        phone_number = ?
      WHERE id = ?
      `,
      [
        name,
        email,
        phone,
        req.user.id,
      ]
    );

    const [rows] = await pool.query(`
      SELECT
        u.id,
        u.full_name,
        u.email,
        u.phone_number,
        r.name AS role,
        u.created_at
      FROM users u
      JOIN roles r ON r.id = u.role_id
      WHERE u.id = ?
      LIMIT 1
    `, [req.user.id]);

    res.json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    res.status(500).json({
      message: "Unable to update profile",
    });
  }
}

export async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: "Valid current and new passwords are required" });
    }

    const [rows] = await pool.query(
      'SELECT password_hash FROM users WHERE id = ? LIMIT 1',
      [req.user.id]
    );
    if (rows.length === 0 || rows[0].password_hash !== currentPassword) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    await pool.query(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [newPassword, req.user.id]
    );
    res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Unable to change password" });
  }
}

/* =========================
   NOTIFICATIONS
========================= */

export async function getNotifications(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT *
      FROM notifications
      ORDER BY created_at DESC
      LIMIT 50
    `);

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    res.status(500).json({
      message: "Unable to load notifications",
    });
  }
}

export async function markNotificationRead(
  req,
  res
) {
  try {
    await pool.query(
      `
      UPDATE notifications
      SET is_read = 1
      WHERE id = ?
      `,
      [req.params.id]
    );

    res.json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    res.status(500).json({
      message: "Unable to update notification",
    });
  }
}

/* =========================
   SETTINGS
========================= */

export async function getSettings(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT *
      FROM system_settings
      LIMIT 1
    `);

    res.json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    res.status(500).json({
      message: "Unable to load settings",
    });
  }
}

export async function updateSettings(req, res) {
  try {
    const {
      university_name,
      university_email,
      academic_session,
      two_factor,
      login_notifications,
      admission_notifications,
      finance_notifications,
    } = req.body;

    await pool.query(
      `
      UPDATE system_settings
      SET
        university_name = ?,
        university_email = ?,
        academic_session = ?,
        two_factor = ?,
        login_notifications = ?,
        admission_notifications = ?,
        finance_notifications = ?
      WHERE id = 1
      `,
      [
        university_name,
        university_email,
        academic_session,
        two_factor ? 1 : 0,
        login_notifications ? 1 : 0,
        admission_notifications ? 1 : 0,
        finance_notifications ? 1 : 0,
      ]
    );

    res.json({
      success: true,
      message: "Settings updated",
    });
  } catch (error) {
    res.status(500).json({
      message: "Unable to update settings",
    });
  }
}