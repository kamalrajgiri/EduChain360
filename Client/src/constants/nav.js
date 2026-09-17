/**
 * Per-role navigation for the sidebar.
 * Only roles currently being built have a full menu — the rest keep a single
 * Dashboard entry until their vertical ships.
 */
export const NAV = {
  Student: [
    { code: 'DA', label: 'Dashboard',    path: '/student' },
    { code: 'PR', label: 'My Profile',   path: '/student/profile' },
    { code: 'AT', label: 'Attendance',   path: '/student/attendance' },
    { code: 'RE', label: 'Results',      path: '/student/results' },
    { code: 'FE', label: 'Fees',         path: '/student/fees' },
    { code: 'CE', label: 'Certificates', path: '/student/certificates' },
    { code: 'LI', label: 'Library',      path: '/student/library' },
    { code: 'NO', label: 'Notices',      path: '/student/notices' }
  ],

  Admin: [
    { code: 'DA', label: 'Dashboard', path: '/admin' }
  ],
  Teacher: [
    { code: 'DA', label: 'Dashboard', path: '/teacher' }
  ],
  Parent: [
    { code: 'DA', label: 'Dashboard', path: '/parent' }
  ],
  Accountant: [
    { code: 'DA', label: 'Dashboard', path: '/accountant' }
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