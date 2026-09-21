/**
 * ═══════════════════════════════════════════════════════════════
 * FEATURE FLAGS — for demo / midterm / phased rollout
 * ═══════════════════════════════════════════════════════════════
 *
 * Flip any value to `false` to hide that page completely.
 * Nothing is deleted — set back to `true` to restore.
 * ═══════════════════════════════════════════════════════════════
 */

export const FEATURES = {
  /* ─── Student pages ─────────────────────────────────── */
  studentDashboard:       true,
  studentProfile:         true,
  studentAttendance:      true,
  studentResults:         true,
  studentFees:            true,
  studentReceipt:         true,
  studentCertificates:    true,
  studentCertificateView: true,
  studentLibrary:         true,
  studentNotices:         true,
  studentNoticeView:      true,

  /* ─── Accountant pages ──────────────────────────────── */
  accountantDashboard:    true,
  accountantProfile:      true,
  accountantDaybook:      true,
  accountantTransactions: true,
  accountantInvoices:     true,
  accountantFeeStructure: true,
  accountantPayroll:      true,
  accountantReports:      true,
  accountantNotices:      true,

  /* ─── Shared pages (all roles) ──────────────────────── */
  sharedProfile:          true,
  sharedSettings:         false,   // ← hidden for now
  sharedHelp:             true,

  /* ─── Global topbar features ────────────────────────── */
  topbarSearch:           true,
  topbarNotifications:    true,
  topbarUserMenu:         true,

  /* ─── Other roles ───────────────────────────────────── */
teacherDashboard:       true,
teacherProfile:         true,
teacherClasses:         true,
teacherAttendance:      true,
teacherExams:           true,
teacherTimetable:       true,
teacherNotices:         true,  parentDashboard:        true,
  librarianDashboard:     true,
  hrDashboard:            true,
  labDashboard:           true
};