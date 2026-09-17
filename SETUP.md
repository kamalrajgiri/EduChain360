# EduChain360 — Developer Setup Guide

**Read this fully before you clone.** This document walks you from a clean
machine to a fully working local development environment.

If you get stuck, check the [Troubleshooting](#troubleshooting) section at the
bottom before asking the team.

---

## 1. Prerequisites

Install these on your machine before anything else.

| Tool | Version | How to check | Install |
|------|---------|--------------|---------|
| **Node.js** | 18, 20, or 22 LTS (NOT 16 or lower) | `node --version` | https://nodejs.org |
| **npm** | 9+ (comes with Node) | `npm --version` | — |
| **MySQL** | 8.x | `mysql --version` | https://dev.mysql.com/downloads/ |
| **Git** | any recent | `git --version` | https://git-scm.com |
| **VS Code** *(recommended)* | any | — | https://code.visualstudio.com |

**Windows users:** use **Git Bash** (comes with Git for Windows) or **MINGW64**.
Plain `cmd.exe` will break some commands.

**Verify all four are installed** before proceeding:

```bash
node --version    # → v20.x.x or similar
npm --version     # → 9.x.x or 10.x.x
mysql --version   # → mysql  Ver 8.x.x
git --version     # → git version 2.x.x
```

If any of these error out, fix it before continuing.

---

## 2. Clone the Repository

```bash
git clone <repo-url> EduChain360
cd EduChain360
```

The repo has this top-level structure:

```
EduChain360/
├── Client/          # React + Vite frontend
├── Server/          # Node.js + Express backend
├── SETUP.md         # ← you are here
└── README.md
```

---

## 3. Environment File (`.env`)

The backend reads configuration from `Server/.env`. **This file is NOT in git**
for security. You must create it.

```bash
cd Server
cp .env.example .env
```

If `.env.example` doesn't exist, create `Server/.env` manually with:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=educhain360_db

# Auth
JWT_SECRET=dev_secret_change_me_in_production_please_use_a_long_random_string
JWT_EXPIRES_IN=7d

# Client (for CORS)
CLIENT_ORIGIN=http://localhost:5173
```

**Change `DB_PASSWORD`** to your actual MySQL root password (or a dedicated
MySQL user's password — see §4.1 for creating one).

**Change `JWT_SECRET`** to anything long and random. It only needs to be the
same across your own dev sessions, not shared with teammates.

---

## 4. Database Setup

### 4.1 — (Optional but recommended) create a dedicated MySQL user

Open MySQL as root:

```bash
mysql -u root -p
```

Then run:

```sql
CREATE USER 'edu'@'localhost' IDENTIFIED BY 'edu_password';
GRANT ALL PRIVILEGES ON educhain360_db.* TO 'edu'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

If you do this, update `Server/.env`:
```
DB_USER=edu
DB_PASSWORD=edu_password
```

Otherwise just use `DB_USER=root` and your root password.

### 4.2 — Create the database + schema

From the **repo root** (not from `Server/`):

```bash
mysql -u root -p < Server/src/config/schema.sql
```

This creates the `educhain360_db` database, all base tables (users, roles,
teachers, classes, subjects, enrollments, class_subjects, attendance, exams,
exam_marks, timetable_entries, notices, academic_credentials, fee_receipts,
blockchain_ledger), and seeds the 8 roles.

### 4.3 — Student-phase tables

```bash
mysql -u root -p < Server/src/config/schema_student.sql
```

Adds: `fee_invoices`, `books`, `book_issues`, and makes `receipt_hash` /
`document_hash` nullable.

### 4.4 — Avatar column

```bash
mysql -u root -p educhain360_db -e "ALTER TABLE users ADD COLUMN avatar_data MEDIUMTEXT NULL AFTER id_card_photo_url;"
```

If you get **"Duplicate column name 'avatar_data'"** → it's already there. Skip.

### 4.5 — Verify

```bash
mysql -u root -p educhain360_db -e "SHOW TABLES;"
```

You should see ~18 tables. If not, one of the steps above failed — re-run it
and check for errors.

---

## 5. Backend Setup

```bash
cd Server
npm install
```

Expected: `added XXX packages in Xs`. Warnings about deprecated packages are
normal — you only need to worry about errors.

Then run the seeds **in this order**:

```bash
npm run seed
```

Expected output:
```
🔄 Updated Admin: admin@fwu.edu.np
🔄 Updated Teacher: teacher@fwu.edu.np
   ↳ teachers.id = 1 (employee_code STF-0142)
🔄 Updated Student: student@fwu.edu.np
...
🎉 Seed complete. Login credentials (dev):
   Admin          → admin@fwu.edu.np / admin123
   Teacher        → teacher@fwu.edu.np / teacher123
   Student        → student@fwu.edu.np / student123
   ...
```

```bash
npm run seed:student
```

Expected output:
```
🌱 Seeding student data...
✅ Student seed complete:
   • Class: Grade 11 Science A (2083/2084)
   • Rajan enrolled as Roll 14
   • Attendance for last 30 days
   • Mid-term exam with submitted marks (5 subjects)
   • Fee invoices (4) + receipts (2)
   • Certificates (2)
   • Books + 1 active issue
   • Notices (3)
```

### 5.1 — Start the backend server

```bash
npm run dev
```

Expected:
```
✅ MySQL connected
🚀 EduChain360 API running on http://localhost:5000
   Health: http://localhost:5000/api/health
```

**Keep this terminal open.** Nodemon will auto-restart when you edit files.

### 5.2 — Smoke test in a **separate** terminal

```bash
curl http://localhost:5000/api/health
```

Should return `{"success":true,"service":"EduChain360 API",...}`.

---

## 6. Frontend Setup

Open a **second terminal** (leave the backend running in the first):

```bash
cd EduChain360/Client
npm install
```

Expected: `added XXX packages in Xs`.

### 6.1 — Start the frontend dev server

```bash
npm run dev
```

Expected:
```
VITE v6.x.x  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  press h + enter to show help
```

### 6.2 — Open the app

Open **http://localhost:5173** in your browser.

You should see the EduChain360 login page (navy brand panel on the left,
"Welcome back" form on the right).

---

## 7. Login Credentials

All development accounts use **plaintext passwords** (bcrypt comes later).

| Role | Email | Password | Lands on |
|------|-------|----------|----------|
| Admin | `admin@fwu.edu.np` | `admin123` | `/admin` |
| Teacher | `teacher@fwu.edu.np` | `teacher123` | `/teacher` |
| Student | `student@fwu.edu.np` | `student123` | `/student` |
| Parent | `parent@fwu.edu.np` | `parent123` | `/parent` |
| Accountant | `accountant@fwu.edu.np` | `acc123` | `/accountant` |
| Librarian | `librarian@fwu.edu.np` | `lib123` | `/librarian` |
| HR | `hr@fwu.edu.np` | `hr123` | `/hr` |
| Lab Assistant | `lab@fwu.edu.np` | `lab123` | `/lab` |

You can also log in with the **School ID** instead of email:
`ADM-001`, `TCH-001`, `STU-014`, `PAR-001`, etc.

---

## 8. Project Structure (what's where)

### Backend (`Server/`)

```
src/
├── server.js                  # Express app entry point
├── config/
│   ├── db.js                  # MySQL pool
│   ├── schema.sql             # Base tables (run once)
│   ├── schema_student.sql     # Student-phase tables (run once)
├── middleware/
│   ├── auth.js                # JWT verification → req.user
│   ├── role.js                # requireRole(...) gate
│   └── errorHandler.js
├── controllers/
│   ├── auth.controller.js     # login, me
│   ├── student.controller.js  # all student endpoints
│   └── notifications.controller.js
├── routes/
│   ├── index.js               # mounts /api/auth, /api/student, /api/notifications
│   ├── auth.routes.js
│   ├── student.routes.js
│   └── notifications.routes.js
└── utils/
    ├── seed.js                # creates 8 user logins
    └── seed-student.js        # Rajan Thapa's demo data
```

### Frontend (`Client/`)

```
src/
├── main.jsx                   # React entry, wraps <App /> in <BrowserRouter>
├── App.jsx                    # all routes
├── index.css                  # Tailwind theme + print styles
├── api/
│   ├── client.js              # axios instance + JWT interceptor
│   ├── auth.js
│   ├── student.js
│   └── notifications.js
├── context/
│   └── AuthContext.jsx        # user state, login, logout, updateUser
├── hooks/
│   └── useFetch.js            # shared fetch hook (loading/error/retry)
├── constants/
│   └── nav.js                 # per-role sidebar items
├── layouts/
│   └── DashboardLayout.jsx    # shared sidebar + topbar shell
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
│   └── admin/                 # admin-specific components (collaborator)
└── pages/
    ├── Login.jsx
    ├── Unauthorized.jsx
    ├── ProfilePlaceholder.jsx
    ├── SettingsPlaceholder.jsx
    ├── HelpPlaceholder.jsx
    ├── admin/                 # admin pages (collaborator)
    ├── teacher/
    ├── student/
    └── ...                    # one folder per role
```

---

## 9. NPM Scripts Reference

### Backend (`cd Server`)

| Command | What it does |
|---------|--------------|
| `npm run dev` | Start with nodemon (auto-restart on file change) |
| `npm start` | Start without nodemon (production-style) |
| `npm run seed` | Create the 8 role logins + teacher profile |
| `npm run seed:student` | Create Rajan Thapa's demo data |

### Frontend (`cd Client`)

| Command | What it does |
|---------|--------------|
| `npm run dev` | Vite dev server on http://localhost:5173 |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview the production build locally |

---

## 10. Development Workflow

### Terminal layout (recommended)

Keep **two terminals open**:

| Terminal | Directory | Command |
|----------|-----------|---------|
| 1 | `Server/` | `npm run dev` |
| 2 | `Client/` | `npm run dev` |

Open a **third terminal** for git / curl / mysql commands.

### Making changes

- **Backend changes** → nodemon auto-restarts within 1–2 seconds
- **Frontend changes** → Vite hot-reloads instantly (no refresh needed)
- **Schema changes** → you need to run the SQL manually; nodemon won't do it

### Daily git workflow

```bash
git checkout <your-branch>
git pull origin main                # or origin <your-branch>
# ... make changes ...
git add -A
git commit -m "feat(scope): short description"
git push origin <your-branch>
```

**Branch naming convention:**
- `main` — stable, everyone merges into this
- `student`, `teacher`, `parent`, `admin` — per-role feature branches
- `fix/<what>` — bugfix branches
- `polish/<what>` — UI/UX polish branches

### Shared files — coordinate before editing

These files are touched by every role's work. **Add your lines, don't modify
someone else's.**

| File | Rule |
|------|------|
| `Server/src/routes/index.js` | Add one `router.use('/your-role', ...)` line |
| `Client/src/App.jsx` | Add one `<Route ... />` per page |
| `Client/src/constants/nav.js` | Add one role block |
| `Client/src/index.css` | Append only |
| `Server/src/config/schema*.sql` | Append new tables only |

**Never edit another role's page folder.** Each role owns its own directory
under `pages/`.

---

## 11. Verifying Everything Works

Once both servers are running, walk through this checklist. If all pass, your
environment is healthy.

### Backend health

```bash
curl http://localhost:5000/api/health
# → {"success":true,"service":"EduChain360 API",...}
```

### Login + token

```bash
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"student@fwu.edu.np","password":"student123"}' \
  | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

echo "Token length: ${#TOKEN}"
# → Token length: 272 (or similar)
```

### Student API endpoints

```bash
curl -s http://localhost:5000/api/student/dashboard -H "Authorization: Bearer $TOKEN" | head -c 200
curl -s http://localhost:5000/api/student/notices   -H "Authorization: Bearer $TOKEN" | head -c 200
curl -s "http://localhost:5000/api/student/search?q=physics" -H "Authorization: Bearer $TOKEN" | head -c 200
```

All three should return JSON with `"success":true`.

### Frontend

Open http://localhost:5173 and log in as **Student**. You should see:

- Dashboard with 4 KPI cards
- Today's timetable
- Recent notices (3 items)
- 2 certificates

Sidebar should have 8 items: Dashboard, My Profile, Attendance, Results, Fees,
Certificates, Library, Notices.

---

## Troubleshooting

### "npm error code EJSONPARSE" / "Invalid package.json"

Your `package.json` has a syntax error (usually a missing comma).
**Copy the correct package.json from a teammate** or the repo's last known
good version. Do not try to fix it by hand.

### "vite is not recognized as an internal or external command"

You're either in the wrong directory, or `node_modules/` is missing.
```bash
cd Client
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### "Could not resolve ./pages/... " or 500 error in browser

A file was imported with the wrong extension or filename.
- Check the file exists: `ls Client/src/pages/student/`
- Check the case of the filename matches the import (Windows is case-insensitive
  but Vite is not)
- `.jsx` files must be imported **with** the `.jsx` extension in this project

### "Route not found: /api/student/..."

The server isn't mounting that route group. Open
`Server/src/routes/index.js` and verify the mount exists:

```js
router.use('/student', studentRoutes);
```

Watch for typos — `/students` (plural) is a different route than `/student`.

### "Invalid credentials" when logging in as a seeded user

The seed ran but the password may have changed during testing.

```bash
mysql -u root -p educhain360_db -e "SELECT email, password_hash FROM users WHERE email='student@fwu.edu.np';"
```

Reset to the seed value:

```bash
mysql -u root -p educhain360_db -e "UPDATE users SET password_hash='student123' WHERE email='student@fwu.edu.np';"
```

Or re-run `npm run seed` from `Server/`.

### "Unknown column 'avatar_data'" in MySQL

The migration from §4.4 hasn't been run. Run it.

### "ER_NO_SUCH_TABLE: fee_invoices" (or `books`, `book_issues`)

The student schema from §4.3 hasn't been run. Run it.

### "MySQL connection failed"

- Is MySQL actually running?
  - macOS: `brew services list | grep mysql`
  - Ubuntu: `sudo service mysql status`
  - Windows: check the Services app for "MySQL80"
- Does `DB_PASSWORD` in `Server/.env` match your real MySQL password?
- Is the database `educhain360_db` created? Run `mysql -u root -p -e "SHOW DATABASES;"`.

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

Or change `PORT=5001` in `Server/.env` **and** update
`Client/vite.config.js` proxy target to `http://localhost:5001`.

### "You cannot render a <Router> inside another <Router>"

You have two `<BrowserRouter>`s. There should be **exactly one**, in
`Client/src/main.jsx`. `App.jsx` must **not** contain a `<BrowserRouter>`.

### Vite shows "esbuild deprecated" or "Invalid input options" warnings

You're on Vite 8. Our project pins Vite 6. Reinstall:

```bash
cd Client
rm -rf node_modules package-lock.json
npm install
npm ls vite
# → should say vite@6.x.x
```

### Whitespace / line-ending warnings on Windows

Git on Windows converts line endings by default. Our repo uses LF (Linux-style).
If you see whole-file diffs on files you barely touched:

```bash
git config --global core.autocrlf input
git rm --cached -r .
git reset --hard
```

### "Missing script: seed:student"

Your `Server/package.json` doesn't have the script. Add under `"scripts"`:

```json
"seed:student": "node src/utils/seed-student.js"
```

### Everything is broken, nothing helps

Nuclear reset (⚠️ this wipes your local uncommitted changes):

```bash
cd EduChain360
git stash                       # or: git checkout -- . (worse)
git pull origin main

cd Server
rm -rf node_modules
npm install
npm run seed
npm run seed:student

cd ../Client
rm -rf node_modules
npm install
```

Then start both servers again.

---

## Need Help?

1. Search this file first — most issues are covered
2. Check the git history: `git log --oneline -20` — recent commits often
   hint at what changed
3. Ask on the team channel with:
   - The exact command you ran
   - The complete output (not a summary)
   - Your OS (`uname -a` on macOS/Linux, `ver` on Windows)
   - `node --version` and `npm --version`

---

**Last updated:** whenever someone edits this file, update the date
**Maintained by:** the whole team — if you found a setup step that broke or
helped, edit this file and push.