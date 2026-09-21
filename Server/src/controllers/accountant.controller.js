import { pool } from '../config/db.js';

/* ═══════════════════════════════════════════════════════════════
   DASHBOARD
   ═══════════════════════════════════════════════════════════════ */

export async function getDashboard(req, res, next) {
  try {
    const term = req.query.term || 'Term 2, 2083/2084';

    const [collectedRows] = await pool.query(
      `SELECT COALESCE(SUM(r.amount), 0) AS collected,
              COUNT(*) AS receipt_count
         FROM fee_receipts r
        WHERE r.payment_status = 'PAID'
          AND DATE(r.created_at) >= DATE_SUB(CURDATE(), INTERVAL 120 DAY)`
    );

    const [outRows] = await pool.query(
      `SELECT COALESCE(SUM(GREATEST(GREATEST(amount - amount_paid, 0), 0)), 0) AS total,
              COUNT(DISTINCT student_id) AS students
         FROM fee_invoices
        WHERE status IN ('UNPAID','PARTIAL')`
    );

    const [todayRows] = await pool.query(
      `SELECT COUNT(*) AS count,
              COALESCE(SUM(amount), 0) AS amount
         FROM fee_receipts
        WHERE DATE(created_at) = CURDATE()`
    );

    const [anchorRows] = await pool.query(
      `SELECT COUNT(*) AS total, SUM(is_anchored) AS anchored FROM fee_receipts`
    );

    const totalReceipts = Number(anchorRows[0]?.total || 0);
    const anchoredReceipts = Number(anchorRows[0]?.anchored || 0);
    const anchorPct = totalReceipts > 0
      ? Math.round((anchoredReceipts / totalReceipts) * 100)
      : 0;

    const [recent] = await pool.query(
      `SELECT r.id, r.receipt_number, r.amount, r.payment_method,
              r.payment_status, r.is_anchored, r.created_at,
              u.full_name AS student_name,
              c.name AS class_name
         FROM fee_receipts r
         JOIN users u ON u.id = r.student_id
         LEFT JOIN enrollments e ON e.student_id = u.id
         LEFT JOIN classes c ON c.id = e.class_id
        ORDER BY r.created_at DESC
        LIMIT 8`
    );

    const [byMethod] = await pool.query(
      `SELECT payment_method,
              COUNT(*) AS count,
              COALESCE(SUM(amount), 0) AS amount
         FROM fee_receipts
        WHERE payment_status = 'PAID'
        GROUP BY payment_method
        ORDER BY amount DESC`
    );

    const [byClass] = await pool.query(
      `SELECT c.name AS class_name,
              COUNT(DISTINCT r.id) AS receipt_count,
              COALESCE(SUM(r.amount), 0) AS amount
         FROM fee_receipts r
         JOIN enrollments e ON e.student_id = r.student_id
         JOIN classes c ON c.id = e.class_id
        WHERE r.payment_status = 'PAID'
        GROUP BY c.id, c.name
        ORDER BY amount DESC
        LIMIT 6`
    );

    res.json({
      success: true,
      data: {
        term,
        kpis: {
          collected: Number(collectedRows[0]?.collected || 0),
          receiptCount: Number(collectedRows[0]?.receipt_count || 0),
          outstanding: Number(outRows[0]?.total || 0),
          outstandingStudents: Number(outRows[0]?.students || 0),
          transactionsToday: Number(todayRows[0]?.count || 0),
          amountToday: Number(todayRows[0]?.amount || 0),
          totalReceipts,
          anchoredReceipts,
          anchorPct
        },
        recentTransactions: recent,
        collectionByMethod: byMethod,
        collectionByClass: byClass
      }
    });
  } catch (err) {
    next(err);
  }
}

/* ═══════════════════════════════════════════════════════════════
   DASHBOARD — ALERTS / ACTIVITY / WEEKLY CHART
   ═══════════════════════════════════════════════════════════════ */

export async function getAlerts(req, res, next) {
  try {
    const [aging] = await pool.query(
      `SELECT
         SUM(CASE WHEN DATEDIFF(CURDATE(), due_date) BETWEEN 0  AND 30 THEN 1 ELSE 0 END) AS days_0_30,
         SUM(CASE WHEN DATEDIFF(CURDATE(), due_date) BETWEEN 31 AND 60 THEN 1 ELSE 0 END) AS days_31_60,
         SUM(CASE WHEN DATEDIFF(CURDATE(), due_date) BETWEEN 61 AND 90 THEN 1 ELSE 0 END) AS days_61_90,
         SUM(CASE WHEN DATEDIFF(CURDATE(), due_date) > 90 THEN 1 ELSE 0 END) AS days_90_plus,
         SUM(CASE WHEN due_date < CURDATE() THEN GREATEST(GREATEST(amount - amount_paid, 0), 0) ELSE 0 END) AS overdue_amount,
         SUM(CASE WHEN due_date < CURDATE() THEN 1 ELSE 0 END) AS overdue_count
       FROM fee_invoices
       WHERE status IN ('UNPAID','PARTIAL')`
    );

    const [topDebtors] = await pool.query(
      `SELECT u.id, u.full_name, u.school_id_number,
              c.name AS class_name,
              COALESCE(SUM(fi.amount - fi.amount_paid), 0) AS dues
         FROM fee_invoices fi
         JOIN users u ON u.id = fi.student_id
         LEFT JOIN enrollments e ON e.student_id = u.id
         LEFT JOIN classes c ON c.id = e.class_id
        WHERE fi.status IN ('UNPAID','PARTIAL')
        GROUP BY u.id, u.full_name, u.school_id_number, c.name
        ORDER BY dues DESC
        LIMIT 5`
    );

    res.json({
      success: true,
      data: {
        aging: {
          days0_30:   Number(aging[0]?.days_0_30   || 0),
          days31_60:  Number(aging[0]?.days_31_60  || 0),
          days61_90:  Number(aging[0]?.days_61_90  || 0),
          days90Plus: Number(aging[0]?.days_90_plus || 0)
        },
        overdue: {
          amount: Number(aging[0]?.overdue_amount || 0),
          count: Number(aging[0]?.overdue_count || 0)
        },
        topDebtors
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function getActivity(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT r.id, r.receipt_number, r.amount, r.payment_method,
              r.created_at, r.is_anchored,
              u.full_name AS student_name,
              rec.full_name AS recorded_by_name
         FROM fee_receipts r
         JOIN users u ON u.id = r.student_id
         LEFT JOIN users rec ON rec.id = r.recorded_by
        ORDER BY r.created_at DESC
        LIMIT 10`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

export async function getWeeklyChart(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT DATE(created_at) AS day,
              COUNT(*) AS receipts,
              COALESCE(SUM(amount), 0) AS amount
         FROM fee_receipts
        WHERE payment_status = 'PAID'
          AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
        GROUP BY DATE(created_at)
        ORDER BY day`
    );

    const byDate = Object.fromEntries(rows.map((r) => [String(r.day).slice(0, 10), r]));
    const out = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const hit = byDate[key];
      out.push({
        day: key,
        receipts: Number(hit?.receipts || 0),
        amount: Number(hit?.amount || 0)
      });
    }

    res.json({ success: true, data: out });
  } catch (err) {
    next(err);
  }
}

/* ═══════════════════════════════════════════════════════════════
   TRANSACTIONS
   ═══════════════════════════════════════════════════════════════ */

export async function getTransactions(req, res, next) {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const method = req.query.method || '';
    const q = (req.query.q || '').trim();

    const where = [];
    const values = [];

    if (method) {
      where.push('r.payment_method = ?');
      values.push(method);
    }
    if (q) {
      where.push('(u.full_name LIKE ? OR r.receipt_number LIKE ?)');
      const like = `%${q}%`;
      values.push(like, like);
    }

    const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const [rows] = await pool.query(
      `SELECT r.id, r.receipt_number, r.amount, r.payment_method,
              r.payment_status, r.is_anchored, r.created_at,
              u.full_name AS student_name, u.school_id_number,
              c.name AS class_name
         FROM fee_receipts r
         JOIN users u ON u.id = r.student_id
         LEFT JOIN enrollments e ON e.student_id = u.id
         LEFT JOIN classes c ON c.id = e.class_id
         ${whereSql}
        ORDER BY r.created_at DESC
        LIMIT ? OFFSET ?`,
      [...values, limit, offset]
    );

    const [countRow] = await pool.query(
      `SELECT COUNT(*) AS total
         FROM fee_receipts r
         JOIN users u ON u.id = r.student_id
         ${whereSql}`,
      values
    );

    res.json({
      success: true,
      data: {
        rows,
        total: Number(countRow[0]?.total || 0),
        limit,
        offset
      }
    });
  } catch (err) {
    next(err);
  }
}

/* ═══════════════════════════════════════════════════════════════
   INVOICES
   ═══════════════════════════════════════════════════════════════ */

export async function getInvoices(req, res, next) {
  try {
    const limit  = Math.min(Number(req.query.limit) || 50, 200);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const status = req.query.status || '';
    const classId = req.query.class_id ? Number(req.query.class_id) : null;
    const q = (req.query.q || '').trim();
    const aging = req.query.aging || '';

    const where = [];
    const values = [];

    if (status) {
      where.push('fi.status = ?');
      values.push(status);
    }
    if (classId) {
      where.push('e.class_id = ?');
      values.push(classId);
    }
    if (q) {
      where.push('(u.full_name LIKE ? OR u.school_id_number LIKE ? OR fi.fee_head LIKE ?)');
      const like = `%${q}%`;
      values.push(like, like, like);
    }
    if (aging && status !== 'PAID') {
      const dayMap = { '0-30': [0, 30], '31-60': [31, 60], '61-90': [61, 90], '90+': [91, 9999] };
      const [lo, hi] = dayMap[aging] || [];
      if (lo != null) {
        where.push("fi.status IN ('UNPAID','PARTIAL')");
        where.push('DATEDIFF(CURDATE(), fi.due_date) BETWEEN ? AND ?');
        values.push(lo, hi);
      }
    }

    const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const [rows] = await pool.query(
      `SELECT fi.id, fi.term, fi.fee_head, fi.amount, fi.amount_paid,
              fi.due_date, fi.status, fi.created_at,
              u.id AS student_id, u.full_name AS student_name, u.school_id_number,
              c.name AS class_name,
              DATEDIFF(CURDATE(), fi.due_date) AS days_overdue
         FROM fee_invoices fi
         JOIN users u ON u.id = fi.student_id
         LEFT JOIN enrollments e ON e.student_id = u.id
         LEFT JOIN classes c ON c.id = e.class_id
         ${whereSql}
        ORDER BY
          CASE fi.status
            WHEN 'UNPAID' THEN 1
            WHEN 'PARTIAL' THEN 2
            WHEN 'PAID' THEN 3
          END,
          fi.due_date ASC,
          fi.id DESC
        LIMIT ? OFFSET ?`,
      [...values, limit, offset]
    );

    const [countRow] = await pool.query(
      `SELECT COUNT(*) AS total
         FROM fee_invoices fi
         JOIN users u ON u.id = fi.student_id
         LEFT JOIN enrollments e ON e.student_id = u.id
         ${whereSql}`,
      values
    );

    res.json({
      success: true,
      data: { rows, total: Number(countRow[0]?.total || 0), limit, offset }
    });
  } catch (err) {
    next(err);
  }
}

export async function updateInvoice(req, res, next) {
  try {
    const { id } = req.params;
    const { amount, due_date, fee_head, cancel } = req.body || {};

    const [existing] = await pool.query(
      'SELECT id, amount, amount_paid, status FROM fee_invoices WHERE id = ? LIMIT 1',
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const inv = existing[0];

    if (cancel) {
      if (inv.status === 'PAID') {
        return res.status(400).json({ success: false, message: 'Cannot cancel a paid invoice' });
      }
      await pool.query('DELETE FROM fee_invoices WHERE id = ?', [id]);
      return res.json({ success: true, message: 'Invoice cancelled' });
    }

    const sets = [];
    const values = [];

    if (fee_head) {
      sets.push('fee_head = ?');
      values.push(fee_head);
    }
    if (amount != null) {
      const amt = Number(amount);
      if (amt <= 0) {
        return res.status(400).json({ success: false, message: 'Amount must be positive' });
      }
      if (amt < Number(inv.amount_paid)) {
        return res.status(400).json({ success: false, message: 'Amount cannot be less than amount already paid' });
      }
      sets.push('amount = ?');
      values.push(amt);

      const newStatus = Number(inv.amount_paid) >= amt ? 'PAID'
                       : Number(inv.amount_paid) > 0 ? 'PARTIAL'
                       : 'UNPAID';
      sets.push('status = ?');
      values.push(newStatus);
    }
    if (due_date) {
      sets.push('due_date = ?');
      values.push(due_date);
    }

    if (sets.length === 0) {
      return res.status(400).json({ success: false, message: 'Nothing to update' });
    }

    values.push(id);
    await pool.query(`UPDATE fee_invoices SET ${sets.join(', ')} WHERE id = ?`, values);

    res.json({ success: true, message: 'Invoice updated' });
  } catch (err) {
    next(err);
  }
}

/* ═══════════════════════════════════════════════════════════════
   SINGLE INVOICE DETAIL (for the edit modal)
   ═══════════════════════════════════════════════════════════════ */

export async function getInvoice(req, res, next) {
  try {
    const id = Number(req.params.id);
    const [rows] = await pool.query(
      `SELECT fi.id, fi.student_id, fi.term, fi.fee_head,
              fi.amount, fi.amount_paid, fi.due_date, fi.status,
              u.full_name AS student_name, u.school_id_number,
              c.name AS class_name
         FROM fee_invoices fi
         JOIN users u ON u.id = fi.student_id
         LEFT JOIN enrollments e ON e.student_id = u.id
         LEFT JOIN classes c ON c.id = e.class_id
        WHERE fi.id = ?
        LIMIT 1`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
}

/* ═══════════════════════════════════════════════════════════════
   FEE STRUCTURE
   ═══════════════════════════════════════════════════════════════ */

export async function getFeeStructure(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT fs.id, fs.academic_year, fs.term, fs.fee_head,
              fs.amount, fs.is_mandatory, fs.created_at,
              c.id AS class_id, c.name AS class_name
         FROM fee_structure fs
         LEFT JOIN classes c ON c.id = fs.class_id
        ORDER BY fs.academic_year DESC, fs.term, c.name, fs.fee_head`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

export async function createFeeStructure(req, res, next) {
  try {
    const { class_id, academic_year, term, fee_head, amount, is_mandatory } = req.body;

    if (!academic_year || !term || !fee_head || amount == null) {
      return res.status(400).json({ success: false, message: 'academic_year, term, fee_head, amount are required' });
    }
    if (Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'amount must be positive' });
    }

    const [ins] = await pool.query(
      `INSERT INTO fee_structure
         (class_id, academic_year, term, fee_head, amount, is_mandatory)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [class_id || null, academic_year, term, fee_head, amount, is_mandatory !== false]
    );

    res.json({ success: true, message: 'Fee structure added', data: { id: ins.insertId } });
  } catch (err) {
    next(err);
  }
}

export async function updateFeeStructure(req, res, next) {
  try {
    const { id } = req.params;
    const { fee_head, amount, is_mandatory } = req.body;

    const sets = [];
    const values = [];

    if (fee_head)      { sets.push('fee_head = ?');     values.push(fee_head); }
    if (amount != null){ sets.push('amount = ?');       values.push(amount); }
    if (is_mandatory != null) { sets.push('is_mandatory = ?'); values.push(is_mandatory); }

    if (sets.length === 0) {
      return res.status(400).json({ success: false, message: 'Nothing to update' });
    }

    values.push(id);
    await pool.query(`UPDATE fee_structure SET ${sets.join(', ')} WHERE id = ?`, values);
    res.json({ success: true, message: 'Fee structure updated' });
  } catch (err) {
    next(err);
  }
}

export async function deleteFeeStructure(req, res, next) {
  try {
    await pool.query('DELETE FROM fee_structure WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Fee structure removed' });
  } catch (err) {
    next(err);
  }
}

export async function generateInvoices(req, res, next) {
  const conn = await pool.getConnection();
  try {
    const { class_id, academic_year, term } = req.body;
    if (!class_id || !academic_year || !term) {
      conn.release();
      return res.status(400).json({ success: false, message: 'class_id, academic_year, term required' });
    }

    await conn.beginTransaction();

    const [structure] = await conn.query(
      `SELECT fee_head, amount
         FROM fee_structure
        WHERE academic_year = ?
          AND term = ?
          AND (class_id = ? OR class_id IS NULL)`,
      [academic_year, term, class_id]
    );

    if (structure.length === 0) {
      await conn.rollback();
      conn.release();
      return res.status(400).json({ success: false, message: 'No fee structure found for this class/term' });
    }

    const [students] = await conn.query(
      `SELECT student_id FROM enrollments WHERE class_id = ?`,
      [class_id]
    );

    let created = 0;
    // Use SQL to compute due date so it stays in the DB's local timezone
    const [dueRows] = await conn.query(
      `SELECT DATE_ADD(CURDATE(), INTERVAL 15 DAY) AS due_date`
    );
    const dueDate = dueRows[0].due_date;

    for (const st of students) {
      for (const row of structure) {
        const [exists] = await conn.query(
          `SELECT id FROM fee_invoices
            WHERE student_id = ? AND term = ? AND fee_head = ?`,
          [st.student_id, term, row.fee_head]
        );
        if (exists.length === 0) {
          await conn.query(
            `INSERT INTO fee_invoices
               (student_id, term, fee_head, amount, amount_paid, due_date, status)
             VALUES (?, ?, ?, ?, 0, ?, 'UNPAID')`,
            [st.student_id, term, row.fee_head, row.amount, dueDate]
          );
          created++;
        }
      }
    }

    await conn.commit();
    conn.release();
    res.json({ success: true, message: `${created} invoices created`, data: { created } });
  } catch (err) {
    try { await conn.rollback(); } catch { /* ignore */ }
    conn.release();
    next(err);
  }
}

/**
 * POST /api/accountant/fee-structure/preview-invoices
 * Body: { class_id, academic_year, term }
 * Returns a preview of what WILL be created without creating it.
 */
export async function previewInvoices(req, res, next) {
  try {
    const { class_id, academic_year, term } = req.body;
    if (!class_id || !academic_year || !term) {
      return res.status(400).json({ success: false, message: 'class_id, academic_year, term required' });
    }

    const [structure] = await pool.query(
      `SELECT fee_head, amount
         FROM fee_structure
        WHERE academic_year = ?
          AND term = ?
          AND (class_id = ? OR class_id IS NULL)`,
      [academic_year, term, class_id]
    );

    if (structure.length === 0) {
      return res.json({
        success: true,
        data: { students: 0, feeHeads: [], newInvoices: 0, totalAmount: 0, reason: 'no_structure' }
      });
    }

    const [students] = await pool.query(
      'SELECT student_id FROM enrollments WHERE class_id = ?',
      [class_id]
    );

    // Count truly-new invoices per student/head, and sum their amounts
    let existing = 0;
    let newInvoices = 0;
    let totalAmount = 0;

    for (const s of students) {
      for (const row of structure) {
        const [hit] = await pool.query(
          `SELECT 1 FROM fee_invoices
            WHERE student_id = ? AND term = ? AND fee_head = ? LIMIT 1`,
          [s.student_id, term, row.fee_head]
        );
        if (hit.length > 0) {
          existing++;
        } else {
          newInvoices++;
          totalAmount += Number(row.amount);
        }
      }
    }

    const perStudent = structure.reduce((s, r) => s + Number(r.amount), 0);
    const potential = students.length * structure.length;

    res.json({
      success: true,
      data: {
        students: students.length,
        feeHeads: structure,
        perStudent,
        potential,
        existing,
        newInvoices,
        totalAmount,
        reason: newInvoices === 0 ? 'all_exist' : 'ready'
      }
    });
  } catch (err) {
    next(err);
  }
}

/* ═══════════════════════════════════════════════════════════════
   PAYMENTS & RECEIPTS
   ═══════════════════════════════════════════════════════════════ */

export async function recordPaymentPartial(req, res, next) {
  const conn = await pool.getConnection();
  try {
    const { student_id, amount, method, notes } = req.body;
    const accountantId = req.user.id;

    if (!student_id || !amount || !method) {
      conn.release();
      return res.status(400).json({ success: false, message: 'student_id, amount, method required' });
    }
    const amt = Number(amount);
    if (amt <= 0) {
      conn.release();
      return res.status(400).json({ success: false, message: 'Amount must be positive' });
    }
    const allowed = ['Cash', 'Cheque', 'Bank slip', 'eSewa', 'Khalti', 'Bank transfer'];
    if (!allowed.includes(method)) {
      conn.release();
      return res.status(400).json({ success: false, message: 'Invalid payment method' });
    }

    const [studentRows] = await conn.query(
      `SELECT u.id, u.full_name
         FROM users u
         JOIN roles r ON r.id = u.role_id
        WHERE u.id = ? AND r.name = 'Student'
        LIMIT 1`,
      [student_id]
    );
    if (studentRows.length === 0) {
      conn.release();
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    await conn.beginTransaction();

    const receiptNumber = `RCPT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const [ins] = await conn.query(
      `INSERT INTO fee_receipts
         (receipt_number, student_id, amount, payment_status, payment_method, recorded_by, notes)
       VALUES (?, ?, ?, 'PAID', ?, ?, ?)`,
      [receiptNumber, student_id, amt, method, accountantId, notes || null]
    );
    const receiptId = ins.insertId;

    const [invoices] = await conn.query(
      `SELECT id, amount, amount_paid
         FROM fee_invoices
        WHERE student_id = ? AND status IN ('UNPAID','PARTIAL')
        ORDER BY due_date IS NULL, due_date, id`,
      [student_id]
    );

    let remaining = amt;
    let invoicesFullyPaid = 0;
    let invoicesPartiallyPaid = 0;

    for (const inv of invoices) {
      if (remaining <= 0) break;
      const owed = Number(inv.amount) - Number(inv.amount_paid);
      if (owed <= 0) continue;

      if (remaining >= owed) {
        await conn.query(
          `UPDATE fee_invoices SET amount_paid = amount, status = 'PAID' WHERE id = ?`,
          [inv.id]
        );
        remaining -= owed;
        invoicesFullyPaid++;
      } else {
        await conn.query(
          `UPDATE fee_invoices SET amount_paid = amount_paid + ?, status = 'PARTIAL' WHERE id = ?`,
          [remaining, inv.id]
        );
        remaining = 0;
        invoicesPartiallyPaid++;
      }
    }

    await conn.commit();
    conn.release();

    const summary = [];
    if (invoicesFullyPaid > 0) summary.push(`${invoicesFullyPaid} paid`);
    if (invoicesPartiallyPaid > 0) summary.push(`${invoicesPartiallyPaid} partial`);
    if (remaining > 0) summary.push(`NPR ${remaining.toLocaleString('en-IN')} unallocated`);

    res.json({
      success: true,
      message: `Payment recorded. ${summary.join(', ')}.`,
      data: {
        receiptId,
        receiptNumber,
        amount: amt,
        method,
        invoicesFullyPaid,
        invoicesPartiallyPaid,
        unallocated: remaining
      }
    });
  } catch (err) {
    try { await conn.rollback(); } catch { /* ignore */ }
    conn.release();
    next(err);
  }
}

export async function getReceipt(req, res, next) {
  try {
    const receiptId = Number(req.params.id);

    const [rows] = await pool.query(
      `SELECT r.id, r.receipt_number, r.amount, r.payment_method, r.payment_status,
              r.receipt_hash, r.is_anchored, r.created_at, r.notes,
              u.full_name AS student_name, u.school_id_number,
              c.name AS class_name,
              rec.full_name AS recorded_by_name
         FROM fee_receipts r
         JOIN users u ON u.id = r.student_id
         LEFT JOIN enrollments e ON e.student_id = u.id
         LEFT JOIN classes c ON c.id = e.class_id
         LEFT JOIN users rec ON rec.id = r.recorded_by
        WHERE r.id = ?
        LIMIT 1`,
      [receiptId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Receipt not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
}

/* ═══════════════════════════════════════════════════════════════
   STUDENTS
   ═══════════════════════════════════════════════════════════════ */

export async function searchStudents(req, res, next) {
  try {
    const q = (req.query.q || '').trim();
    if (q.length < 2) {
      return res.json({ success: true, data: [] });
    }
    const like = `%${q}%`;

    const [rows] = await pool.query(
      `SELECT u.id, u.full_name, u.school_id_number,
              c.name AS class_name,
              (SELECT COALESCE(SUM(GREATEST(GREATEST(amount - amount_paid, 0), 0)), 0) FROM fee_invoices
                WHERE student_id = u.id AND status IN ('UNPAID','PARTIAL')) AS dues
         FROM users u
         JOIN roles r ON r.id = u.role_id
         LEFT JOIN enrollments e ON e.student_id = u.id
         LEFT JOIN classes c ON c.id = e.class_id
        WHERE r.name = 'Student'
          AND (u.full_name LIKE ? OR u.school_id_number LIKE ?)
        ORDER BY u.full_name
        LIMIT 10`,
      [like, like]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/accountant/students/:id
 * Student detail — includes invoices, receipts, adjustments and net outstanding.
 */
export async function getStudentDetail(req, res, next) {
  try {
    const studentId = Number(req.params.id);

    const [studentRows] = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.school_id_number, u.phone_number,
              c.id AS class_id, c.name AS class_name, e.roll_number
         FROM users u
         JOIN roles r ON r.id = u.role_id
         LEFT JOIN enrollments e ON e.student_id = u.id
         LEFT JOIN classes c ON c.id = e.class_id
        WHERE u.id = ? AND r.name = 'Student'
        LIMIT 1`,
      [studentId]
    );

    if (studentRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    const student = studentRows[0];

    const [invoices] = await pool.query(
      `SELECT id, term, fee_head, amount, amount_paid, due_date, status
         FROM fee_invoices
        WHERE student_id = ?
        ORDER BY due_date IS NULL, due_date, fee_head`,
      [studentId]
    );

    const [receipts] = await pool.query(
      `SELECT r.id, r.receipt_number, r.amount, r.payment_method,
              r.payment_status, r.is_anchored, r.created_at, r.notes,
              rec.full_name AS recorded_by_name
         FROM fee_receipts r
         LEFT JOIN users rec ON rec.id = r.recorded_by
        WHERE r.student_id = ?
        ORDER BY r.created_at DESC`,
      [studentId]
    );

const [adjustments] = await pool.query(
  `SELECT fa.id, fa.type, fa.amount, fa.reason,
          fa.applies_to_invoice_id, fa.created_at,
          u.full_name AS created_by_name,
          fi.fee_head AS invoice_fee_head
     FROM fee_adjustments fa
     LEFT JOIN users u ON u.id = fa.created_by
     LEFT JOIN fee_invoices fi ON fi.id = fa.applies_to_invoice_id
    WHERE fa.student_id = ?
    ORDER BY fa.created_at DESC`,
  [studentId]
);

    const totalInvoiced = invoices.reduce((s, i) => s + Number(i.amount), 0);
    const totalPaid = invoices.reduce((s, i) => s + Number(i.amount_paid), 0);
    const rawOutstanding = invoices
      .filter((i) => i.status !== 'PAID')
      .reduce((s, i) => s + (Number(i.amount) - Number(i.amount_paid)), 0);

    const adjTotals = adjustments.reduce((acc, a) => {
      acc[a.type] = (acc[a.type] || 0) + Number(a.amount);
      return acc;
    }, { FINE: 0, DISCOUNT: 0, ADDITIONAL: 0 });

    // Net outstanding: pending + fines + additional - discounts
    const netOutstanding = Math.max(
      0,
      rawOutstanding + adjTotals.FINE + adjTotals.ADDITIONAL - adjTotals.DISCOUNT
    );

    res.json({
      success: true,
      data: {
        student,
        invoices,
        receipts,
        adjustments,
        adjustmentTotals: adjTotals,
        totals: {
          invoiced: totalInvoiced,
          paid: totalPaid,
          outstanding: netOutstanding,
          rawOutstanding
        }
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/accountant/students/:id/remind
 * Sends a PRIVATE fee reminder to a single student.
 */
export async function remindStudent(req, res, next) {
  try {
    const studentId = Number(req.params.id);
    const accountantId = req.user.id;

    const [studentRows] = await pool.query(
      `SELECT u.id, u.full_name,
              COALESCE((SELECT SUM(amount - amount_paid) FROM fee_invoices
                        WHERE student_id = u.id AND status IN ('UNPAID','PARTIAL')), 0) AS dues
         FROM users u
         JOIN roles r ON r.id = u.role_id
        WHERE u.id = ? AND r.name = 'Student'
        LIMIT 1`,
      [studentId]
    );
    if (studentRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const student = studentRows[0];
    if (Number(student.dues) <= 0) {
      return res.status(400).json({ success: false, message: 'Student has no outstanding dues' });
    }

    const title = `Fee reminder — ${student.full_name}`;
    const message = `Dear ${student.full_name}, you have NPR ${Number(student.dues).toLocaleString('en-IN')} in outstanding fees. Please clear your dues at the accounts office or online to avoid late charges.`;

    // PRIVATE — set recipient_id, keep audience = STUDENTS so it's still
    // shown in student-scoped filters on their side
    const [ins] = await pool.query(
      `INSERT INTO notices (title, message, audience, recipient_id, published_by, status)
       VALUES (?, ?, 'STUDENTS', ?, ?, 'SENT')`,
      [title, message, studentId, accountantId]
    );

    res.json({
      success: true,
      message: `Private reminder sent to ${student.full_name}`,
      data: { noticeId: ins.insertId, dues: Number(student.dues) }
    });
  } catch (err) {
    next(err);
  }
}

/* ═══════════════════════════════════════════════════════════════
   UNPAID INVOICES — for payment allocation preview
   ═══════════════════════════════════════════════════════════════ */

export async function getUnpaidInvoices(req, res, next) {
  try {
    const studentId = Number(req.params.id);

    const [student] = await pool.query(
      `SELECT u.id, u.full_name, u.school_id_number
         FROM users u
         JOIN roles r ON r.id = u.role_id
        WHERE u.id = ? AND r.name = 'Student'
        LIMIT 1`,
      [studentId]
    );
    if (student.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const [rows] = await pool.query(
      `SELECT id, term, fee_head, amount, amount_paid, due_date, status,
              (amount - amount_paid) AS owed,
              DATEDIFF(CURDATE(), due_date) AS days_overdue
         FROM fee_invoices
        WHERE student_id = ? AND status IN ('UNPAID','PARTIAL')
        ORDER BY due_date IS NULL, due_date, id`,
      [studentId]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

/* ═══════════════════════════════════════════════════════════════
   STUDENT STATEMENT — full ledger with running balance
   Includes invoices, adjustments (fine/discount/additional) and payments.
   ═══════════════════════════════════════════════════════════════ */

export async function getStudentStatement(req, res, next) {
  try {
    const studentId = Number(req.params.id);

    const [studentRows] = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.school_id_number, u.phone_number,
              c.id AS class_id, c.name AS class_name, e.roll_number, c.academic_year
         FROM users u
         JOIN roles r ON r.id = u.role_id
         LEFT JOIN enrollments e ON e.student_id = u.id
         LEFT JOIN classes c ON c.id = e.class_id
        WHERE u.id = ? AND r.name = 'Student'
        LIMIT 1`,
      [studentId]
    );
    if (studentRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    const student = studentRows[0];

    const [invoices] = await pool.query(
      `SELECT id, term, fee_head, amount, amount_paid, due_date, status, created_at
         FROM fee_invoices
        WHERE student_id = ?
        ORDER BY created_at, id`,
      [studentId]
    );

    const [receipts] = await pool.query(
      `SELECT id, receipt_number, amount, payment_method, payment_status, created_at
         FROM fee_receipts
        WHERE student_id = ?
        ORDER BY created_at, id`,
      [studentId]
    );

    const [adjustments] = await pool.query(
      `SELECT id, type, amount, reason, created_at
         FROM fee_adjustments
        WHERE student_id = ?
        ORDER BY created_at, id`,
      [studentId]
    );

    const events = [];

    for (const inv of invoices) {
      events.push({
        when: inv.created_at || inv.due_date,
        type: 'invoice',
        label: inv.fee_head,
        sublabel: inv.term,
        debit: Number(inv.amount),
        credit: 0,
        ref: `INV-${inv.id}`
      });
    }

    for (const a of adjustments) {
      if (a.type === 'DISCOUNT') {
        events.push({
          when: a.created_at,
          type: 'discount',
          label: `Discount — ${a.reason || 'Fee adjustment'}`,
          sublabel: 'Adjustment',
          debit: 0,
          credit: Number(a.amount),
          ref: `ADJ-${a.id}`
        });
      } else {
        events.push({
          when: a.created_at,
          type: a.type.toLowerCase(),
          label: `${a.type === 'FINE' ? 'Fine' : 'Additional fee'} — ${a.reason || 'Fee adjustment'}`,
          sublabel: 'Adjustment',
          debit: Number(a.amount),
          credit: 0,
          ref: `ADJ-${a.id}`
        });
      }
    }

    for (const r of receipts) {
      events.push({
        when: r.created_at,
        type: 'payment',
        label: `Payment — ${r.payment_method || 'Cash'}`,
        sublabel: r.receipt_number,
        debit: 0,
        credit: Number(r.amount),
        ref: r.receipt_number
      });
    }

    events.sort((a, b) => new Date(a.when) - new Date(b.when));

    let balance = 0;
    const ledger = events.map((e) => {
      balance += e.debit - e.credit;
      return { ...e, balance };
    });

    const totalInvoiced = invoices.reduce((s, i) => s + Number(i.amount), 0);
    const totalPaid = receipts
      .filter((r) => r.payment_status === 'PAID')
      .reduce((s, r) => s + Number(r.amount), 0);
    const adjTotals = adjustments.reduce((acc, a) => {
      acc[a.type] = (acc[a.type] || 0) + Number(a.amount);
      return acc;
    }, { FINE: 0, DISCOUNT: 0, ADDITIONAL: 0 });

    const totalDebits = ledger.reduce((s, e) => s + e.debit, 0);
    const totalCredits = ledger.reduce((s, e) => s + e.credit, 0);

    res.json({
      success: true,
      data: {
        student,
        ledger,
        totals: {
          invoiced: totalInvoiced,
          paid: totalPaid,
          fines: adjTotals.FINE,
          additional: adjTotals.ADDITIONAL,
          discounts: adjTotals.DISCOUNT,
          outstanding: Math.max(0, totalDebits - totalCredits),
          balance
        },
        generated_at: new Date().toISOString()
      }
    });
  } catch (err) {
    next(err);
  }
}

/* ═══════════════════════════════════════════════════════════════
   REPORTS
   ═══════════════════════════════════════════════════════════════ */

export async function getReports(req, res, next) {
  try {
    const [monthly] = await pool.query(
      `SELECT DATE_FORMAT(created_at, '%Y-%m') AS month,
              COUNT(*) AS receipts,
              COALESCE(SUM(amount), 0) AS amount
         FROM fee_receipts
        WHERE payment_status = 'PAID'
          AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
        GROUP BY month
        ORDER BY month`
    );

    const [byMethod] = await pool.query(
      `SELECT payment_method,
              COUNT(*) AS count,
              COALESCE(SUM(amount), 0) AS amount
         FROM fee_receipts
        WHERE payment_status = 'PAID'
        GROUP BY payment_method
        ORDER BY amount DESC`
    );

    const [byClass] = await pool.query(
      `SELECT c.id, c.name AS class_name,
              COUNT(DISTINCT r.id) AS receipt_count,
              COUNT(DISTINCT r.student_id) AS student_count,
              COALESCE(SUM(r.amount), 0) AS amount
         FROM fee_receipts r
         JOIN enrollments e ON e.student_id = r.student_id
         JOIN classes c ON c.id = e.class_id
        WHERE r.payment_status = 'PAID'
        GROUP BY c.id, c.name
        ORDER BY amount DESC`
    );

    const [outstanding] = await pool.query(
      `SELECT c.id, c.name AS class_name,
              COUNT(DISTINCT fi.student_id) AS students,
              COALESCE(SUM(fi.amount - fi.amount_paid), 0) AS amount
         FROM fee_invoices fi
         JOIN enrollments e ON e.student_id = fi.student_id
         JOIN classes c ON c.id = e.class_id
        WHERE fi.status IN ('UNPAID','PARTIAL')
        GROUP BY c.id, c.name
        ORDER BY amount DESC`
    );

    res.json({
      success: true,
      data: { monthly, byMethod, byClass, outstanding }
    });
  } catch (err) {
    next(err);
  }
}

export async function getAgingReport(req, res, next) {
  try {
    const [buckets] = await pool.query(
      `SELECT
         SUM(CASE WHEN DATEDIFF(CURDATE(), due_date) BETWEEN 0  AND 30 THEN GREATEST(GREATEST(amount - amount_paid, 0), 0) ELSE 0 END) AS b0_30,
         SUM(CASE WHEN DATEDIFF(CURDATE(), due_date) BETWEEN 31 AND 60 THEN GREATEST(GREATEST(amount - amount_paid, 0), 0) ELSE 0 END) AS b31_60,
         SUM(CASE WHEN DATEDIFF(CURDATE(), due_date) BETWEEN 61 AND 90 THEN GREATEST(GREATEST(amount - amount_paid, 0), 0) ELSE 0 END) AS b61_90,
         SUM(CASE WHEN DATEDIFF(CURDATE(), due_date) > 90 THEN GREATEST(GREATEST(amount - amount_paid, 0), 0) ELSE 0 END) AS b90_plus
       FROM fee_invoices
       WHERE status IN ('UNPAID','PARTIAL')`
    );

    const [byClass] = await pool.query(
      `SELECT c.id, c.name AS class_name,
              SUM(CASE WHEN DATEDIFF(CURDATE(), fi.due_date) BETWEEN 0  AND 30 THEN fi.amount - fi.amount_paid ELSE 0 END) AS b0_30,
              SUM(CASE WHEN DATEDIFF(CURDATE(), fi.due_date) BETWEEN 31 AND 60 THEN fi.amount - fi.amount_paid ELSE 0 END) AS b31_60,
              SUM(CASE WHEN DATEDIFF(CURDATE(), fi.due_date) BETWEEN 61 AND 90 THEN fi.amount - fi.amount_paid ELSE 0 END) AS b61_90,
              SUM(CASE WHEN DATEDIFF(CURDATE(), fi.due_date) > 90 THEN fi.amount - fi.amount_paid ELSE 0 END) AS b90_plus,
              SUM(fi.amount - fi.amount_paid) AS total
         FROM fee_invoices fi
         JOIN enrollments e ON e.student_id = fi.student_id
         JOIN classes c ON c.id = e.class_id
        WHERE fi.status IN ('UNPAID','PARTIAL')
        GROUP BY c.id, c.name
        ORDER BY total DESC`
    );

    const b = buckets[0] || {};
    res.json({
      success: true,
      data: {
        total: {
          b0_30:   Number(b.b0_30   || 0),
          b31_60:  Number(b.b31_60  || 0),
          b61_90:  Number(b.b61_90  || 0),
          b90_plus: Number(b.b90_plus || 0),
          grand: Number(b.b0_30 || 0) + Number(b.b31_60 || 0) + Number(b.b61_90 || 0) + Number(b.b90_plus || 0)
        },
        byClass
      }
    });
  } catch (err) {
    next(err);
  }
}

/* ═══════════════════════════════════════════════════════════════
   REMINDERS (BULK)
   ═══════════════════════════════════════════════════════════════ */

export async function getRemindersPreview(req, res, next) {
  try {
    const [summary] = await pool.query(
      `SELECT COUNT(DISTINCT student_id) AS students,
              COALESCE(SUM(GREATEST(GREATEST(amount - amount_paid, 0), 0)), 0) AS amount
         FROM fee_invoices
        WHERE status IN ('UNPAID','PARTIAL')`
    );

    const [top] = await pool.query(
      `SELECT u.id, u.full_name, u.school_id_number,
              COALESCE(SUM(fi.amount - fi.amount_paid), 0) AS dues
         FROM fee_invoices fi
         JOIN users u ON u.id = fi.student_id
        WHERE fi.status IN ('UNPAID','PARTIAL')
        GROUP BY u.id, u.full_name, u.school_id_number
        ORDER BY dues DESC
        LIMIT 10`
    );

    res.json({
      success: true,
      data: {
        studentCount: Number(summary[0]?.students || 0),
        totalAmount: Number(summary[0]?.amount || 0),
        topDebtors: top
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/accountant/reminders/send
 * Body: { title?, message?, deadline? }
 *
 * Creates ONE PRIVATE notice per student with outstanding dues.
 * Never broadcasts a public notice — every fee reminder is personal.
 */
/**
 * POST /api/accountant/reminders/send
 * Body: { title?, message?, deadline? }
 *
 * Creates ONE PRIVATE NOTICE per student with outstanding dues.
 * Never broadcasts a public notice — every fee reminder is addressed
 * to a specific student by recipient_id.
 */
export async function sendFeeReminder(req, res, next) {
  const conn = await pool.getConnection();
  try {
    const accountantId = req.user.id;
    const body = req.body || {};

    const deadline = body.deadline || null;
    const customTitle = (body.title || '').trim();
    const customMessage = (body.message || '').trim();

    const defaultMessage = deadline
      ? `All outstanding term fees must be paid by ${deadline}. Please clear your dues to avoid late charges. Contact the accounts office for assistance.`
      : `You have outstanding term fees. Please clear your dues at the accounts office or online to avoid late charges.`;

    await conn.beginTransaction();

    // Every student who currently owes money
    const [students] = await conn.query(
      `SELECT u.id, u.full_name,
              COALESCE(SUM(fi.amount - fi.amount_paid), 0) AS dues
         FROM users u
         JOIN roles r ON r.id = u.role_id
         JOIN fee_invoices fi ON fi.student_id = u.id
                              AND fi.status IN ('UNPAID','PARTIAL')
        WHERE r.name = 'Student'
        GROUP BY u.id, u.full_name
       HAVING dues > 0`
    );

    if (students.length === 0) {
      await conn.rollback();
      conn.release();
      return res.status(400).json({
        success: false,
        message: 'No outstanding dues — nothing to remind about.'
      });
    }

    // One private notice per student
    let sent = 0;
    const noticeIds = [];
    for (const s of students) {
      const title = customTitle || `Fee reminder — ${s.full_name}`;
      const message = customMessage
        ? customMessage.replace(/\{\{name\}\}/g, s.full_name)
                        .replace(/\{\{dues\}\}/g, Number(s.dues).toLocaleString('en-IN'))
        : `Dear ${s.full_name}, ${defaultMessage}`;

      const [ins] = await conn.query(
        `INSERT INTO notices
           (title, message, audience, recipient_id, published_by, status)
         VALUES (?, ?, 'STUDENTS', ?, ?, 'SENT')`,
        [title, message, s.id, accountantId]
      );
      noticeIds.push(ins.insertId);
      sent++;
    }

    await conn.commit();
    conn.release();

    res.json({
      success: true,
      message: `Private reminder sent to ${sent} student${sent === 1 ? '' : 's'}`,
      data: { sent, studentCount: students.length, noticeIds }
    });
  } catch (err) {
    try { await conn.rollback(); } catch { /* ignore */ }
    conn.release();
    next(err);
  }
}

/* ═══════════════════════════════════════════════════════════════
   CLASSES (for the Generate Invoices picker)
   ═══════════════════════════════════════════════════════════════ */

export async function getClasses(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT c.id, c.name, c.academic_year,
              COUNT(DISTINCT e.student_id) AS student_count
         FROM classes c
         LEFT JOIN enrollments e ON e.class_id = c.id
        GROUP BY c.id, c.name, c.academic_year
        ORDER BY c.name`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

/* ═══════════════════════════════════════════════════════════════
   PAYROLL — staff salaries
   ═══════════════════════════════════════════════════════════════ */

export async function getPayrollStaff(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.school_id_number,
              r.name AS role,
              ss.id AS salary_id,
              ss.gross_salary, ss.tax_rate, ss.pf_rate, ss.other_deduction,
              ss.effective_from, ss.is_active
         FROM users u
         JOIN roles r ON r.id = u.role_id
         LEFT JOIN staff_salaries ss ON ss.user_id = u.id
        WHERE r.name IN ('Admin','Teacher','Accountant','Librarian','HR','Lab Assistant')
        ORDER BY r.name, u.full_name`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

export async function upsertStaffSalary(req, res, next) {
  try {
    const userId = Number(req.params.userId);
    const { gross_salary, tax_rate, pf_rate, other_deduction, effective_from } = req.body;

    if (!gross_salary || Number(gross_salary) <= 0) {
      return res.status(400).json({ success: false, message: 'Gross salary must be positive' });
    }

    const [user] = await pool.query('SELECT id FROM users WHERE id = ? LIMIT 1', [userId]);
    if (user.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const [existing] = await pool.query(
      'SELECT id FROM staff_salaries WHERE user_id = ? LIMIT 1',
      [userId]
    );

    const values = [
      Number(gross_salary),
      Number(tax_rate ?? 10),
      Number(pf_rate ?? 5),
      Number(other_deduction ?? 0),
      effective_from || new Date().toISOString().slice(0, 10)
    ];

    if (existing.length > 0) {
      await pool.query(
        `UPDATE staff_salaries
            SET gross_salary = ?, tax_rate = ?, pf_rate = ?,
                other_deduction = ?, effective_from = ?, is_active = TRUE
          WHERE user_id = ?`,
        [...values, userId]
      );
    } else {
      await pool.query(
        `INSERT INTO staff_salaries
           (user_id, gross_salary, tax_rate, pf_rate, other_deduction, effective_from)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, ...values]
      );
    }

    res.json({ success: true, message: 'Salary saved' });
  } catch (err) {
    next(err);
  }
}

/* ═══════════════════════════════════════════════════════════════
   PAYROLL — runs
   ═══════════════════════════════════════════════════════════════ */

export async function getPayrollRuns(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT pr.id, pr.month, pr.total_gross, pr.total_deductions,
              pr.total_net, pr.staff_count, pr.status, pr.created_at,
              u.full_name AS run_by_name
         FROM payroll_runs pr
         LEFT JOIN users u ON u.id = pr.run_by
        ORDER BY pr.month DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

export async function getPayrollRunDetail(req, res, next) {
  try {
    const runId = Number(req.params.id);
    const [runs] = await pool.query(
      `SELECT pr.id, pr.month, pr.total_gross, pr.total_deductions,
              pr.total_net, pr.staff_count, pr.status, pr.created_at,
              u.full_name AS run_by_name
         FROM payroll_runs pr
         LEFT JOIN users u ON u.id = pr.run_by
        WHERE pr.id = ?
        LIMIT 1`,
      [runId]
    );
    if (runs.length === 0) {
      return res.status(404).json({ success: false, message: 'Payroll run not found' });
    }

    const [items] = await pool.query(
      `SELECT pi.id, pi.user_id, pi.gross, pi.tax, pi.pf, pi.other_deduction,
              pi.total_deductions, pi.net,
              u.full_name, u.school_id_number,
              r.name AS role
         FROM payroll_items pi
         JOIN users u ON u.id = pi.user_id
         JOIN roles r ON r.id = u.role_id
        WHERE pi.run_id = ?
        ORDER BY u.full_name`,
      [runId]
    );

    res.json({ success: true, data: { run: runs[0], items } });
  } catch (err) {
    next(err);
  }
}

export async function createPayrollRun(req, res, next) {
  const conn = await pool.getConnection();
  try {
    const { month, notes } = req.body;
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      conn.release();
      return res.status(400).json({ success: false, message: 'month must be YYYY-MM format' });
    }

    const [existing] = await conn.query(
      'SELECT id FROM payroll_runs WHERE month = ? LIMIT 1',
      [month]
    );
    if (existing.length > 0) {
      conn.release();
      return res.status(400).json({ success: false, message: `Payroll for ${month} already processed` });
    }

    const [salaries] = await conn.query(
      `SELECT ss.user_id, ss.gross_salary, ss.tax_rate, ss.pf_rate, ss.other_deduction
         FROM staff_salaries ss
        WHERE ss.is_active = 1`
    );

    if (salaries.length === 0) {
      conn.release();
      return res.status(400).json({ success: false, message: 'No staff salaries defined' });
    }

    await conn.beginTransaction();

    const rows = salaries.map((s) => {
      const gross = Number(s.gross_salary);
      const tax = Math.round(gross * Number(s.tax_rate) / 100 * 100) / 100;
      const pf = Math.round(gross * Number(s.pf_rate) / 100 * 100) / 100;
      const other = Number(s.other_deduction);
      const totalDed = tax + pf + other;
      const net = gross - totalDed;
      return { user_id: s.user_id, gross, tax, pf, other, totalDed, net };
    });

    const totalGross = rows.reduce((s, r) => s + r.gross, 0);
    const totalDed = rows.reduce((s, r) => s + r.totalDed, 0);
    const totalNet = rows.reduce((s, r) => s + r.net, 0);

    const [runIns] = await conn.query(
      `INSERT INTO payroll_runs
         (month, total_gross, total_deductions, total_net, staff_count, status, run_by, notes)
       VALUES (?, ?, ?, ?, ?, 'PROCESSED', ?, ?)`,
      [month, totalGross, totalDed, totalNet, rows.length, req.user.id, notes || null]
    );
    const runId = runIns.insertId;

    for (const r of rows) {
      await conn.query(
        `INSERT INTO payroll_items
           (run_id, user_id, gross, tax, pf, other_deduction, total_deductions, net)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [runId, r.user_id, r.gross, r.tax, r.pf, r.other, r.totalDed, r.net]
      );
    }

    await conn.commit();
    conn.release();

    res.json({
      success: true,
      message: `Payroll for ${month} processed — ${rows.length} staff, NPR ${totalNet.toLocaleString('en-IN')} net`,
      data: { runId, month, staffCount: rows.length, totalNet }
    });
  } catch (err) {
    try { await conn.rollback(); } catch { /* ignore */ }
    conn.release();
    next(err);
  }
}

export async function getSalarySlip(req, res, next) {
  try {
    const runId = Number(req.params.runId);
    const userId = Number(req.params.userId);

    const [rows] = await pool.query(
      `SELECT pi.id, pi.gross, pi.tax, pi.pf, pi.other_deduction,
              pi.total_deductions, pi.net,
              u.full_name, u.email, u.school_id_number,
              r.name AS role,
              pr.month, pr.created_at AS run_at
         FROM payroll_items pi
         JOIN users u ON u.id = pi.user_id
         JOIN roles r ON r.id = u.role_id
         JOIN payroll_runs pr ON pr.id = pi.run_id
        WHERE pi.run_id = ? AND pi.user_id = ?
        LIMIT 1`,
      [runId, userId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Salary slip not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
}

/* ═══════════════════════════════════════════════════════════════
   DAILY COLLECTION — Daybook
   ═══════════════════════════════════════════════════════════════ */

/**
 * GET /api/accountant/daybook?date=YYYY-MM-DD
 * If no date given, defaults to today.
 */
export async function getDaybook(req, res, next) {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ success: false, message: 'date must be YYYY-MM-DD' });
    }

    const [rows] = await pool.query(
      `SELECT r.id, r.receipt_number, r.amount, r.payment_method,
              r.payment_status, r.is_anchored, r.created_at, r.notes,
              u.full_name AS student_name, u.school_id_number,
              c.name AS class_name,
              rec.full_name AS recorded_by_name
         FROM fee_receipts r
         JOIN users u ON u.id = r.student_id
         LEFT JOIN enrollments e ON e.student_id = u.id
         LEFT JOIN classes c ON c.id = e.class_id
         LEFT JOIN users rec ON rec.id = r.recorded_by
        WHERE DATE(r.created_at) = ?
        ORDER BY r.created_at DESC`,
      [date]
    );

    const [byMethod] = await pool.query(
      `SELECT payment_method,
              COUNT(*) AS count,
              COALESCE(SUM(amount), 0) AS amount
         FROM fee_receipts
        WHERE DATE(created_at) = ? AND payment_status = 'PAID'
        GROUP BY payment_method
        ORDER BY amount DESC`,
      [date]
    );

    const totals = {
      count: rows.length,
      amount: rows.reduce((s, r) => s + Number(r.amount), 0),
      anchored: rows.filter((r) => r.is_anchored).length
    };

    res.json({
      success: true,
      data: { date, rows, byMethod, totals }
    });
  } catch (err) {
    next(err);
  }
}

/* ═══════════════════════════════════════════════════════════════
   BULK ACTIONS on invoices
   ═══════════════════════════════════════════════════════════════ */

/**
 * POST /api/accountant/invoices/bulk
 * Body: { ids: [1,2,3], action: 'cancel' | 'remind' }
 */
export async function bulkInvoiceAction(req, res, next) {
  const conn = await pool.getConnection();
  try {
    const { ids, action } = req.body;
    const accountantId = req.user.id;

    if (!Array.isArray(ids) || ids.length === 0) {
      conn.release();
      return res.status(400).json({ success: false, message: 'ids array required' });
    }
    if (!['cancel', 'remind'].includes(action)) {
      conn.release();
      return res.status(400).json({ success: false, message: 'action must be cancel or remind' });
    }

    await conn.beginTransaction();

    if (action === 'cancel') {
      // Only cancel unpaid/partial (never paid)
      const [result] = await conn.query(
        `DELETE FROM fee_invoices
          WHERE id IN (?) AND status IN ('UNPAID','PARTIAL')`,
        [ids]
      );
      await conn.commit();
      conn.release();
      return res.json({
        success: true,
        message: `${result.affectedRows} invoice${result.affectedRows === 1 ? '' : 's'} cancelled`,
        data: { affected: result.affectedRows }
      });
    }

    // action === 'remind'
    // Group by unique student, create one notice per student
    const [students] = await conn.query(
      `SELECT DISTINCT fi.student_id, u.full_name,
              COALESCE(SUM(fi.amount - fi.amount_paid), 0) AS dues
         FROM fee_invoices fi
         JOIN users u ON u.id = fi.student_id
        WHERE fi.id IN (?) AND fi.status IN ('UNPAID','PARTIAL')
        GROUP BY fi.student_id, u.full_name`,
      [ids]
    );

    let sent = 0;
    for (const s of students) {
      if (Number(s.dues) <= 0) continue;
      const title = `Fee reminder — ${s.full_name}`;
      const message = `Dear ${s.full_name}, you have NPR ${Number(s.dues).toLocaleString('en-IN')} in outstanding fees. Please clear your dues at the accounts office or online to avoid late charges.`;
      await conn.query(
        `INSERT INTO notices (title, message, audience, published_by, status)
         VALUES (?, ?, 'STUDENTS', ?, 'SENT')`,
        [title, message, accountantId]
      );
      sent++;
    }

    await conn.commit();
    conn.release();

    res.json({
      success: true,
      message: `Reminder sent to ${sent} student${sent === 1 ? '' : 's'}`,
      data: { sent }
    });
  } catch (err) {
    try { await conn.rollback(); } catch { /* ignore */ }
    conn.release();
    next(err);
  }
}

/* ═══════════════════════════════════════════════════════════════
   FEE ADJUSTMENTS — fine / discount / additional
   ═══════════════════════════════════════════════════════════════ */

export async function getAdjustments(req, res, next) {
  try {
    const studentId = Number(req.params.id);
    const [rows] = await pool.query(
      `SELECT fa.id, fa.type, fa.amount, fa.reason,
              fa.applies_to_invoice_id, fa.created_at,
              u.full_name AS created_by_name,
              fi.fee_head AS invoice_fee_head
         FROM fee_adjustments fa
         LEFT JOIN users u ON u.id = fa.created_by
         LEFT JOIN fee_invoices fi ON fi.id = fa.applies_to_invoice_id
        WHERE fa.student_id = ?
        ORDER BY fa.created_at DESC`,
      [studentId]
    );

    // Totals by type
    const totals = rows.reduce((acc, r) => {
      acc[r.type] = (acc[r.type] || 0) + Number(r.amount);
      return acc;
    }, { FINE: 0, DISCOUNT: 0, ADDITIONAL: 0 });

    res.json({ success: true, data: { rows, totals } });
  } catch (err) {
    next(err);
  }
}

export async function createAdjustment(req, res, next) {
  try {
    const { student_id, type, amount, reason, applies_to_invoice_id } = req.body;

    if (!student_id || !type || !amount) {
      return res.status(400).json({ success: false, message: 'student_id, type, amount required' });
    }
    if (!['FINE', 'DISCOUNT', 'ADDITIONAL'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid type' });
    }
    const amt = Number(amount);
    if (amt <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be positive' });
    }

    // Confirm student exists
    const [student] = await pool.query(
      `SELECT u.id FROM users u JOIN roles r ON r.id = u.role_id
        WHERE u.id = ? AND r.name = 'Student' LIMIT 1`,
      [student_id]
    );
    if (student.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const [ins] = await pool.query(
      `INSERT INTO fee_adjustments
         (student_id, type, amount, reason, applies_to_invoice_id, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        student_id,
        type,
        amt,
        reason || null,
        applies_to_invoice_id || null,
        req.user.id
      ]
    );

    res.json({
      success: true,
      message: `${type.charAt(0) + type.slice(1).toLowerCase()} of NPR ${amt.toLocaleString('en-IN')} applied`,
      data: { id: ins.insertId }
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteAdjustment(req, res, next) {
  try {
    await pool.query('DELETE FROM fee_adjustments WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Adjustment removed' });
  } catch (err) {
    next(err);
  }
}
export async function getAdjustmentsWithInvoices(req, res, next) {
  try {
    const studentId = Number(req.params.id);
    const [rows] = await pool.query(
      `SELECT fa.id, fa.type, fa.amount, fa.reason,
              fa.applies_to_invoice_id, fa.created_at,
              u.full_name AS created_by_name,
              fi.fee_head AS invoice_fee_head
         FROM fee_adjustments fa
         LEFT JOIN users u ON u.id = fa.created_by
         LEFT JOIN fee_invoices fi ON fi.id = fa.applies_to_invoice_id
        WHERE fa.student_id = ?
        ORDER BY fa.created_at DESC`,
      [studentId]
    );

    const totals = rows.reduce((acc, r) => {
      acc[r.type] = (acc[r.type] || 0) + Number(r.amount);
      return acc;
    }, { FINE: 0, DISCOUNT: 0, ADDITIONAL: 0 });

    res.json({ success: true, data: { rows, totals } });
  } catch (err) {
    next(err);
  }
}
/**
 * Day-of-week collection pattern (all-time or last 6 months).
 */
export async function getDayOfWeekReport(req, res, next) {
  try {
    const months = Math.max(1, Math.min(Number(req.query.months) || 6, 24));
    const [rows] = await pool.query(
      `SELECT DAYNAME(created_at) AS day_name,
              DAYOFWEEK(created_at) AS day_num,
              COUNT(*) AS receipts,
              COALESCE(SUM(amount), 0) AS amount
         FROM fee_receipts
        WHERE payment_status = 'PAID'
          AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)
        GROUP BY day_name, day_num
        ORDER BY day_num`,
      [months]
    );

    // Ensure all 7 days present
    const dayOrder = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const byName = Object.fromEntries(rows.map((r) => [r.day_name, r]));
    const out = dayOrder.map((d) => {
      const hit = byName[d];
      return {
        day: d,
        receipts: Number(hit?.receipts || 0),
        amount: Number(hit?.amount || 0)
      };
    });

    res.json({ success: true, data: { months, days: out } });
  } catch (err) {
    next(err);
  }
}
/* ═══════════════════════════════════════════════════════════════
   CONFIRM PENDING RECEIPT
   ═══════════════════════════════════════════════════════════════ */

export async function confirmReceipt(req, res, next) {
  const conn = await pool.getConnection();
  try {
    const receiptId = Number(req.params.id);
    const accountantId = req.user.id;

    const [rows] = await conn.query(
      `SELECT id, student_id, amount, payment_status
         FROM fee_receipts WHERE id = ? LIMIT 1`,
      [receiptId]
    );
    if (rows.length === 0) {
      conn.release();
      return res.status(404).json({ success: false, message: 'Receipt not found' });
    }
    const receipt = rows[0];
    if (receipt.payment_status !== 'PENDING') {
      conn.release();
      return res.status(400).json({ success: false, message: `Receipt is already ${receipt.payment_status}` });
    }

    await conn.beginTransaction();

    await conn.query(
      `UPDATE fee_receipts
          SET payment_status = 'PAID',
              recorded_by = ?,
              notes = CONCAT(COALESCE(notes, ''), IF(notes IS NULL OR notes='', '', ' | '), 'Confirmed by accounts')
        WHERE id = ?`,
      [accountantId, receiptId]
    );

    const [invoices] = await conn.query(
      `SELECT id, amount, amount_paid FROM fee_invoices
        WHERE student_id = ? AND status IN ('UNPAID','PARTIAL')
        ORDER BY due_date IS NULL, due_date, id`,
      [receipt.student_id]
    );

    let remaining = Number(receipt.amount);
    let fullyPaid = 0, partial = 0;
    for (const inv of invoices) {
      if (remaining <= 0) break;
      const owed = Number(inv.amount) - Number(inv.amount_paid);
      if (owed <= 0) continue;
      if (remaining >= owed) {
        await conn.query(
          `UPDATE fee_invoices SET amount_paid = amount, status = 'PAID' WHERE id = ?`,
          [inv.id]
        );
        remaining -= owed;
        fullyPaid++;
      } else {
        await conn.query(
          `UPDATE fee_invoices SET amount_paid = amount_paid + ?, status = 'PARTIAL' WHERE id = ?`,
          [remaining, inv.id]
        );
        remaining = 0;
        partial++;
      }
    }

    await conn.commit();
    conn.release();

    res.json({
      success: true,
      message: `Receipt confirmed — ${fullyPaid} paid, ${partial} partial`,
      data: { receiptId, fullyPaid, partial, unallocated: remaining }
    });
  } catch (err) {
    try { await conn.rollback(); } catch { /* ignore */ }
    conn.release();
    next(err);
  }
}