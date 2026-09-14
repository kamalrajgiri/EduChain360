/**
 * Per-role navigation for the sidebar.
 * Only Teacher is fully defined here — other roles get expanded
 * when we build them in later phases.
 */
export const NAV = {
  Teacher: [
    { code: 'DA', label: 'Dashboard',     path: '/teacher' },  ],

  Admin: [
    { code: 'DA', label: 'Dashboard', path: '/admin' }
  ],
  Student: [
    { code: 'DA', label: 'Dashboard', path: '/student' }
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