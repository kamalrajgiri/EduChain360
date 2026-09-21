import { FEATURES } from '../config/features.js';

const FULL_NAV = {
  Student: [
    { code: 'DA', label: 'Dashboard',    path: '/student',              flag: 'studentDashboard' },
    { code: 'PR', label: 'My Profile',   path: '/student/profile',      flag: 'studentProfile' },
    { code: 'AT', label: 'Attendance',   path: '/student/attendance',   flag: 'studentAttendance' },
    { code: 'RE', label: 'Results',      path: '/student/results',      flag: 'studentResults' },
    { code: 'FE', label: 'Fees',         path: '/student/fees',         flag: 'studentFees' },
    { code: 'CE', label: 'Certificates', path: '/student/certificates', flag: 'studentCertificates' },
    { code: 'LI', label: 'Library',      path: '/student/library',      flag: 'studentLibrary' },
    { code: 'NO', label: 'Notices',      path: '/student/notices',      flag: 'studentNotices' }
  ],

  Accountant: [
  { code: 'DA', label: 'Dashboard',      path: '/accountant',                flag: 'accountantDashboard' },
  { code: 'PR', label: 'My Profile',     path: '/accountant/profile',        flag: 'accountantProfile' },
  { code: 'DB', label: 'Daybook',        path: '/accountant/daybook',        flag: 'accountantDaybook' },
  { code: 'FC', label: 'Fee Collection', path: '/accountant/transactions',   flag: 'accountantTransactions' },
  { code: 'IN', label: 'Invoices',       path: '/accountant/invoices',       flag: 'accountantInvoices' },
  { code: 'FS', label: 'Fee Structure',  path: '/accountant/fee-structure',  flag: 'accountantFeeStructure' },
  { code: 'PY', label: 'Payroll',        path: '/accountant/payroll',        flag: 'accountantPayroll' },
  { code: 'RP', label: 'Reports',        path: '/accountant/reports',        flag: 'accountantReports' },
  { code: 'NO', label: 'Notices',        path: '/accountant/notices',        flag: 'accountantNotices' }
],

  Admin: [
    { code: 'DA', label: 'Dashboard', path: '/admin' }
  ],
 Teacher: [
  { code: 'DA', label: 'Dashboard',      path: '/teacher',              flag: 'teacherDashboard' },
  { code: 'PR', label: 'My Profile',     path: '/teacher/profile',      flag: 'teacherProfile' },
  { code: 'MC', label: 'My Classes',     path: '/teacher/classes',      flag: 'teacherClasses' },
  { code: 'AT', label: 'Attendance',     path: '/teacher/attendance',   flag: 'teacherAttendance' },
  { code: 'EX', label: 'Exams & Marks',  path: '/teacher/exams',        flag: 'teacherExams' },
  { code: 'TT', label: 'Timetable',      path: '/teacher/timetable',    flag: 'teacherTimetable' },
  { code: 'NO', label: 'Notices',        path: '/teacher/notices',      flag: 'teacherNotices' }
],
  Parent: [
    { code: 'DA', label: 'Dashboard', path: '/parent' }
  ],
  Librarian: [
    { code: 'DA', label: 'Dashboard', path: '/librarian' }
  ],
  HR: [
    { code: 'DA', label: 'Dashboard', path: '/hr' }
  ],
  'Lab Assistant': [
    { code: 'DA', label: 'Dashboard', path: '/lab' }
  ]
};

export const NAV = Object.fromEntries(
  Object.entries(FULL_NAV).map(([role, items]) => [
    role,
    items.filter((item) => !item.flag || FEATURES[item.flag] !== false)
  ])
);