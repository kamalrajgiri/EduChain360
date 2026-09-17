import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

const TEACHERS_KEY = "educhain360_teachers";
const SESSION_KEY = "educhain360_user";

// Seed account so the panel isn't empty on first run. Every other teacher who
// signs up gets added alongside this one in the same mock "table".
const SEED_TEACHERS = [
  { name: "Deepak Joshi", password: "teacher123", role: "Teacher", initials: "DJ" },
];

// TODO: this whole file is a stand-in for real auth. Once the backend exists:
// - login() becomes fetch("/api/auth/login", { method: "POST", body: { name, password } })
//   returning a JWT, which replaces the localStorage session object below.
// - register() becomes fetch("/api/auth/register", ...) hitting your USER/STAFF
//   tables, instead of writing to the "teachers" mock list here.
function loadTeachers() {
  try {
    const saved = JSON.parse(localStorage.getItem(TEACHERS_KEY));
    return saved && saved.length ? saved : SEED_TEACHERS;
  } catch {
    return SEED_TEACHERS;
  }
}

function saveTeachers(teachers) {
  localStorage.setItem(TEACHERS_KEY, JSON.stringify(teachers));
}

function initialsFor(name) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] || "T";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem(SESSION_KEY);
    return saved ? JSON.parse(saved) : null;
  });

  async function login(fullName, password) {
    await new Promise((r) => setTimeout(r, 500)); // simulate network delay

    const normalizedInput = fullName.trim().toLowerCase();
    const teachers = loadTeachers();
    const match = teachers.find(
      (t) => t.name.trim().toLowerCase() === normalizedInput
    );

    if (!match || match.password !== password) {
      return { success: false, error: "Invalid name or password." };
    }

    const sessionUser = {
      name: match.name,
      role: match.role,
      initials: match.initials,
    };
    setUser(sessionUser);
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
    return { success: true };
  }

  // Any teacher can create their own account — this is what makes login work
  // for more than one hardcoded person. Names are unique, case-insensitively.
  async function register(fullName, password) {
    await new Promise((r) => setTimeout(r, 500));

    const trimmedName = fullName.trim();
    if (trimmedName.length < 2) {
      return { success: false, error: "Please enter your full name." };
    }
    if (password.length < 4) {
      return { success: false, error: "Password must be at least 4 characters." };
    }

    const teachers = loadTeachers();
    const exists = teachers.some(
      (t) => t.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );
    if (exists) {
      return {
        success: false,
        error: "An account with this name already exists. Try signing in instead.",
      };
    }

    const newTeacher = {
      name: trimmedName,
      password,
      role: "Teacher",
      initials: initialsFor(trimmedName),
    };
    saveTeachers([...teachers, newTeacher]);

    const sessionUser = {
      name: newTeacher.name,
      role: newTeacher.role,
      initials: newTeacher.initials,
    };
    setUser(sessionUser);
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
    return { success: true };
  }

  function logout() {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}