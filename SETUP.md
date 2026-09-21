# EduChain360 — Developer Setup Guide

**Read this fully before you clone.** This walks you from a clean machine to a fully working local development environment.

If you get stuck, check [Troubleshooting](#troubleshooting) at the bottom.

---

## 1. Prerequisites

Install these before anything else.

| Tool | Version | How to check | Install |
|------|---------|--------------|---------|
| **Node.js** | 18, 20, or 22 LTS (NOT 16 or lower) | `node --version` | https://nodejs.org |
| **npm** | 9+ (comes with Node) | `npm --version` | — |
| **MySQL** | 8.x | `mysql --version` | https://dev.mysql.com/downloads/ |
| **Git** | any recent | `git --version` | https://git-scm.com |
| **VS Code** *(recommended)* | any | — | https://code.visualstudio.com |

**Windows users:** use **Git Bash** (comes with Git for Windows) or **MINGW64**. Plain `cmd.exe` breaks some commands.

Verify all four are installed:

```bash
node --version    # → v20.x.x or similar
npm --version     # → 9.x.x or 10.x.x
mysql --version   # → mysql  Ver 8.x.x
git --version     # → git version 2.x.x
```

If any fail, fix them before continuing.

---

## 2. Clone the Repository

```bash
git clone <repo-url> EduChain360
cd EduChain360
```

Top-level structure:

```
EduChain360/
├── Client/          # React + Vite frontend
├── Server/          # Node.js + Express backend
├── SETUP.md         # ← this file
└── README.md
```

---

## 3. Environment Configuration

The backend reads from `Server/.env`. **This file is NOT in git.** You must create it.

```bash
cd Server
cp .env.example .env
```

If `.env.example` doesn't exist, create `Server/.env` manually:

```env
# ─── Server ───────────────────────────────────────────────────
PORT=5000
NODE_ENV=development

# ─── Database ─────────────────────────────────────────────────
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=educhain360_db

# ─── Auth ─────────────────────────────────────────────────────
JWT_SECRET=change_this_to_a_long_random_string
JWT_EXPIRES_IN=7d

# ─── Client (CORS) ────────────────────────────────────────────
CLIENT_ORIGIN=http://localhost:5173

# ─── Bootstrap admin account (created by `npm run bootstrap`) ─
ADMIN_EMAIL=admin@fwu.edu.np
ADMIN_PASSWORD=admin123
ADMIN_NAME=System Administrator
ADMIN_SCHOOL_ID=ADM-001
```

**Change at least:**
- `DB_PASSWORD` → your real MySQL password
- `JWT_SECRET` → any long random string
- `ADMIN_PASSWORD` → keep `admin123` for local dev; change for anything shared

---

## 4. Database Setup

### 4.1 (Optional) Create a dedicated MySQL user

```bash
mysql -u root -p
```

```sql
CREATE USER 'edu'@'localhost' IDENTIFIED BY 'edu_password';
GRANT ALL PRIVILEGES ON educhain360_db.* TO 'edu'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

If you do this, set `DB_USER=edu` and `DB_PASSWORD=edu_password` in `.env`. Otherwise skip.

### 4.2 Create the schema

From the **repo root**:

```bash
mysql -u root -p < Server/src/config/schema.sql
```

This is the **only schema file**. It creates:
- The `educhain360_db` database
- **23 tables** — roles, users, teachers, classes, subjects, enrollments, class_subjects, attendance, exams, exam_marks, timetable_entries, notices, academic_credentials, fee_receipts, fee_invoices, fee_structure, fee_adjustments, books, book_issues, staff_salaries, payroll_runs, payroll_items, blockchain_ledger
- The **8 roles** (Admin, Teacher, Student, Parent, Accountant, Librarian, HR, Lab Assistant)

Safe to re-run — every statement uses `IF NOT EXISTS` / `INSERT IGNORE`.

### 4.3 Verify

```bash
mysql -u root -p educhain360_db -e "SHOW TABLES;"
```

You should see ~23 tables. If not, the schema didn't apply — re-run step 4.2.

---

## 5. Backend Setup

```bash
cd Server
npm install
```

Expected: `added XXX packages in Xs`.

### 5.1 Bootstrap the admin user

```bash
npm run bootstrap
```

Expected output:
```
🚀 Bootstrapping EduChain360...

📋 Roles
   ✓ 8 roles ready

👤 Admin account
   ✓ Admin user created: admin@fwu.edu.np

✅ Bootstrap complete.

   Login credentials:
     Email:    admin@fwu.edu.np
     Password: admin123
```

This is **idempotent** — safe to run anytime. It creates only:
- 8 roles
- 1 admin user (from `.env`)

**Every other account** — teachers, students, accountants, parents — is created **through the Admin dashboard** after you log in. This is the point: real data, not seeds.

### 5.2 (Dev only) Create test users

For faster local testing, add 3 more accounts (Teacher, Student, Accountant) without going through the Admin UI:

```bash
npm run test:users
```

Expected:
```
🧪 Creating test users...

   ✓ Created Teacher     teacher@fwu.edu.np
   ✓ Created Student     student@fwu.edu.np
   ✓ Created Accountant  accountant@fwu.edu.np

✅ Test users ready.
```

Re-runnable — updates in place, never duplicates.

**Do NOT run this in production.** It creates hardcoded test credentials.

### 5.3 Start the backend server

```bash
npm run dev
```

Expected:
```
✅ MySQL connected
🚀 EduChain360 API running on http://localhost:5000
   Health: http://localhost:5000/api/health
```

Keep this terminal open. Nodemon auto-restarts on file changes.

### 5.4 Smoke test (separate terminal)

```bash
curl http://localhost:5000/api/health
```

Should return `{"success":true,"service":"EduChain360 API",...}`.

---

## 6. Frontend Setup

Open a **second terminal** (leave the backend running):

```bash
cd EduChain360/Client
npm install
```

### 6.1 Start the frontend

```bash
npm run dev
```

Expected:
```
VITE v6.x.x  ready in XXX ms

➜  Local:   http://localhost:5173/
```

### 6.2 Open the app

Open **http://localhost:5173** in your browser.

You should see the EduChain360 login page (navy panel on the left, "Welcome back" form on the right).

---

## 7. Login Credentials

After `npm run bootstrap` (and optionally `npm run test:users`):

| Role | Email | Password | Lands on |
|------|-------|----------|----------|
| Admin | `admin@fwu.edu.np` | `admin123` | `/admin` |
| Teacher *(test)* | `teacher@fwu.edu.np` | `teacher123` | `/teacher` |
| Student *(test)* | `student@fwu.edu.np` | `student123` | `/student` |
| Accountant *(test)* | `accountant@fwu.edu.np` | `acc123` | `/accountant` |

You can also log in with the **School ID**:
- `ADM-001`, `TCH-001`, `STU-001`, `ACC-001`

Parent, Librarian, HR, Lab Assistant accounts don't exist by default — create them through the Admin dashboard when needed.

---

## 8. The Real-Data Workflow

Unlike a seeded demo, this project starts **empty**. Every entity is created through the UI:

```
┌─────────────────────────────────────────────────────────────┐
│ ADMIN                                                       │
│   1. Create subjects        (Physics, Math, Chemistry, …)   │
│   2. Create classes         (Grade 11 Science A, …)         │
│   3. Create teachers        (users with Teacher role)       │
│   4. Create students        (users with Student role)       │
│   5. Enroll students        (student → class + roll no.)    │
│   6. Assign teachers        (teacher → class + subject)     │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ ACCOUNTANT                                                  │
│   7. Define fee structure   (Tuition, Exam, Library, …)     │
│   8. Generate invoices      (per class, per term)           │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ TEACHER                                                     │
│   9. Create exams           (Mid-term 2083, …)              │
│  10. Enter marks            (per student, per subject)      │
│  11. Mark attendance        (daily, per class)              │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ STUDENT                                                     │
│  12. Sees dashboard, attendance, results, fees, receipts    │
└─────────────────────────────────────────────────────────────┘
```

**Nothing is pre-populated.** This is the correct "real" state — no fake data, no demo seeds mixed with real users.

---

## 9. Project Structure

### Backend (`Server/`)

```
src/
├── server.js                    Express app entry point
├── config/
│   ├── db.js                    MySQL connection pool
│   └── schema.sql               ★ THE canonical schema (run once)
├── middleware/
│   ├── auth.js                  JWT verification → req.user
│   ├── role.js                  requireRole(...) gate
│   └── errorHandler.js          404 + global error JSON
├── controllers/
│   ├── auth.controller.js       login, me, profile, photo, password
│   ├── student.controller.js    all student endpoints
│   ├── teacher.controller.js    all teacher endpoints
│   ├── accountant.controller.js all accountant endpoints
│   ├── notifications.controller.js  shared notices (role-filtered)
│   └── search.controller.js     role-dispatched search
├── routes/
│   ├── index.js                 mounts /api/* groups
│   ├── auth.routes.js
│   ├── student.routes.js
│   ├── teacher.routes.js
│   ├── accountant.routes.js
│   ├── notifications.routes.js
│   └── search.routes.js
└── utils/
    ├── bootstrap.js             ★ Creates 8 roles + 1 admin
    └── test-users.js            (dev) creates 3 test accounts
```

**Only two setup files exist:**
- `config/schema.sql` — the database
- `utils/bootstrap.js` — the first admin

Everything else is runtime code.

### Frontend (`Client/`)

```
src/
├── main.jsx                     React entry (wraps App in BrowserRouter)
├── App.jsx                      all routes
├── index.css                    Tailwind theme + print styles
├── api/
│   ├── client.js                axios + JWT interceptor
│   ├── auth.js
│   ├── student.js
│   ├── teacher.js
│   ├── accountant.js
│   ├── notifications.js
│   └── search.js
├── context/
│   └── AuthContext.jsx
├── hooks/
│   └── useFetch.js              shared loading/error/retry hook
├── constants/
│   └── nav.js                   per-role sidebar items
├── config/
│   └── features.js              feature flags for phased rollout
├── layouts/
│   └── DashboardLayout.jsx      shared sidebar + topbar shell
├── components/
│   ├── ProtectedRoute.jsx
│   ├── Spinner.jsx
│   ├── Skeleton.jsx
│   ├── EmptyState.jsx
│   ├── ErrorState.jsx
│   ├── ErrorBoundary.jsx
│   ├── Avatar.jsx
│   ├── SearchBox.jsx
│   ├── NotificationBell.jsx
│   ├── UserMenu.jsx
│   ├── NoticesList.jsx          shared across all roles
│   ├── NoticeDetail.jsx         shared across all roles
│   ├── ExportButton.jsx
│   └── admin/                   admin-specific components
└── pages/
    ├── Login.jsx
    ├── Unauthorized.jsx
    ├── ProfilePlaceholder.jsx
    ├── SettingsPlaceholder.jsx
    ├── HelpPlaceholder.jsx
    ├── admin/                   admin pages
    ├── teacher/                 teacher pages
    ├── student/                 student pages
    ├── accountant/              accountant pages
    └── ...
```

---

## 10. NPM Scripts Reference

### Backend (`cd Server`)

| Command | What it does |
|---------|--------------|
| `npm run dev` | Start with nodemon (auto-restart) |
| `npm start` | Start without nodemon |
| `npm run bootstrap` | Create 8 roles + 1 admin (idempotent) |
| `npm run test:users` | (dev) Create 3 test accounts |

### Frontend (`cd Client`)

| Command | What it does |
|---------|--------------|
| `npm run dev` | Vite dev server on :5173 |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview the production build |

---

## 11. Development Workflow

### Terminal layout

Keep **two terminals** open:

| Terminal | Directory | Command |
|----------|-----------|---------|
| 1 | `Server/` | `npm run dev` |
| 2 | `Client/` | `npm run dev` |

Open a **third** for git / curl / mysql.

### Making changes

- **Backend changes** → nodemon restarts within 1–2 seconds
- **Frontend changes** → Vite hot-reloads instantly
- **Schema changes** → edit `schema.sql`, then re-run it (safe)

### Daily git workflow

```bash
git checkout <your-branch>
git pull origin main
# ... make changes ...
git add -A
git commit -m "feat(scope): short description"
git push origin <your-branch>
```

**Branch naming:**
- `main` — stable, everyone merges into this
- `student`, `teacher`, `parent`, `accountant` — per-role feature branches
- `fix/<what>` — bugfix branches

### Shared files — coordinate before editing

These files are touched by every role's work. **Add your lines, don't modify someone else's.**

| File | Rule |
|------|------|
| `Server/src/routes/index.js` | Add one `router.use('/your-role', ...)` line |
| `Client/src/App.jsx` | Add one `<Route ... />` per page |
| `Client/src/constants/nav.js` | Add one role block |
| `Client/src/config/features.js` | Add your flags |
| `Client/src/index.css` | Append only |
| `Server/src/config/schema.sql` | Append new tables only — never edit existing |

**Never edit another role's page folder.** Each role owns its own directory under `pages/`.

---

## 12. Verifying Everything Works

### Backend health
```bash
curl http://localhost:5000/api/health
# → {"success":true,...}
```

### Login as admin
```bash
curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin@fwu.edu.np","password":"admin123"}' \
  | head -c 200
# → {"success":true,"token":"eyJ...",...}
```

### Database state
```bash
mysql -u root -p educhain360_db -e "
  SELECT u.id, u.full_name, u.email, r.name AS role
    FROM users u JOIN roles r ON r.id = u.role_id
   ORDER BY u.id;
"
```

After `bootstrap` only → **1 row** (admin).
After `test:users` → **4 rows** (admin + 3 test users).

### Frontend

Open http://localhost:5173 → log in as each role → verify the correct dashboard loads.

| Role | Expected page |
|------|---------------|
| Admin | Admin dashboard (with sidebar: Dashboard, Admissions, Users, Academics, …) |
| Teacher | Teacher dashboard with KPIs, or "no classes assigned yet" empty state |
| Student | Student dashboard with empty state (no enrollment yet) |
| Accountant | Accountant dashboard with zeroes |

---

## Troubleshooting

### "npm error code EJSONPARSE" / "Invalid package.json"
Your `package.json` has a syntax error. Copy the correct version from a teammate or `git checkout origin/main -- Client/package.json`.

### "vite is not recognized as an internal or external command"
Wrong directory or `node_modules/` missing.
```bash
cd Client
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### "Could not resolve ./pages/..." or 500 error in browser
A file was imported with the wrong extension or filename.
- Check the file exists: `ls Client/src/pages/student/`
- Case-sensitive on Linux/Mac. Windows is case-insensitive but Vite is strict.
- `.jsx` files must be imported **with** the `.jsx` extension in this project.

### "Route not found: /api/student/..."
The server isn't mounting that route group. Open `Server/src/routes/index.js` and verify:
```js
router.use('/student', studentRoutes);
```
Watch for typos — `/students` (plural) is a different route than `/student`.

### "Invalid credentials" when logging in
```bash
mysql -u root -p educhain360_db -e "
  SELECT u.email, r.name AS role FROM users u
    JOIN roles r ON r.id = u.role_id;
"
```
If no rows → run `npm run bootstrap`. If the account exists but the password doesn't match, re-run `npm run bootstrap` (admin) or `npm run test:users` (test accounts).

### "Unknown column" errors
Your DB is missing a column. Fresh install:
```bash
mysql -u root -p -e "DROP DATABASE IF EXISTS educhain360_db;"
mysql -u root -p < Server/src/config/schema.sql
npm run bootstrap
```
This wipes all data — do not run on a DB with real data you want to keep.

### "MySQL connection failed"
- Is MySQL running?
  - macOS: `brew services list | grep mysql`
  - Ubuntu: `sudo service mysql status`
  - Windows: check the Services app for "MySQL80"
- Does `DB_PASSWORD` in `Server/.env` match your real MySQL password?
- Does the database `educhain360_db` exist? `mysql -u root -p -e "SHOW DATABASES;"`

### "EADDRINUSE: address already in use :::5000"
Something else is using port 5000. Find and kill it:
```bash
# macOS / Linux
lsof -i :5000
kill -9 <PID>

# Windows (Git Bash)
netstat -ano | findstr :5000
taskkill //PID <PID> //F
```
Or change `PORT=5001` in `Server/.env` **and** update `Client/vite.config.js` proxy target.

### "You cannot render a <Router> inside another <Router>"
Two `<BrowserRouter>`s. There should be **exactly one** — in `Client/src/main.jsx`. `App.jsx` must not contain a `<BrowserRouter>`.

### Vite shows "esbuild deprecated" or "Invalid input options" warnings
You're on Vite 8. Project pins Vite 6.
```bash
cd Client
rm -rf node_modules package-lock.json
npm install
npm ls vite   # → should say vite@6.x.x
```

### Whitespace / line-ending warnings on Windows
```bash
git config --global core.autocrlf input
git rm --cached -r .
git reset --hard
```

### "fetcher is not a function" error card
A `useFetch` call received `null` instead of a function — usually because an ID isn't ready yet. The hook handles this gracefully if it's been updated (see `Client/src/hooks/useFetch.js`). If not, replace that file with the version that includes the `if (typeof fetcher !== 'function')` guard.

### Everything is broken, nothing helps — nuclear reset

⚠️ Wipes all data:

```bash
cd EduChain360
git checkout -- .
git pull origin main

# Drop and recreate the DB
mysql -u root -p -e "DROP DATABASE IF EXISTS educhain360_db;"
mysql -u root -p < Server/src/config/schema.sql

# Reinstall + bootstrap
cd Server
rm -rf node_modules
npm install
npm run bootstrap
npm run test:users   # optional

cd ../Client
rm -rf node_modules
npm install
```

Then start both servers again.

---

## Need Help?

1. Search this file first — most issues are covered
2. Check the git history: `git log --oneline -20`
3. Ask on the team channel with:
   - The exact command you ran
   - The complete output (not a summary)
   - Your OS (`uname -a` on macOS/Linux, `ver` on Windows)
   - `node --version` and `npm --version`

---

**Maintained by:** the whole team — if you found a setup step that broke or helped, edit this file and push.