import { useState } from "react";
import { Moon, Sun, Trash2, AlertTriangle } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

// Keys this mock app writes to localStorage — kept in one place so
// "delete all data" and the real backend migration both know what exists.
const APP_STORAGE_KEYS = [
  "educhain360_user",
  "educhain360_dark_mode",
  "educhain360_attendance",
  "educhain360_marksheets",
];

export default function Settings() {
  const { darkMode, setDarkMode } = useTheme();
  const [confirming, setConfirming] = useState(false);
  const [cleared, setCleared] = useState(false);

  function handleDeleteAll() {
    APP_STORAGE_KEYS.forEach((key) => {
      if (key !== "educhain360_dark_mode") localStorage.removeItem(key);
    });
    setConfirming(false);
    setCleared(true);
    setTimeout(() => window.location.reload(), 1200);
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-navy-900 dark:text-white mb-1">
        Settings
      </h1>
      <p className="text-gray-500 dark:text-white/60 text-sm mb-6">
        Manage your preferences for this device.
      </p>

      {/* Appearance */}
      <div className="bg-white dark:bg-navy-800 rounded-xl shadow-sm p-5 mb-4">
        <h2 className="text-navy-900 dark:text-white font-semibold mb-4">
          Appearance
        </h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-white/10 flex items-center justify-center">
              {darkMode ? (
                <Moon size={18} className="text-indigo-700 dark:text-indigo-100" />
              ) : (
                <Sun size={18} className="text-indigo-700" />
              )}
            </div>
            <div>
              <p className="text-navy-900 dark:text-white text-sm font-medium">
                Dark mode
              </p>
              <p className="text-gray-500 dark:text-white/50 text-xs">
                Switch the interface to a darker color scheme.
              </p>
            </div>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`w-12 h-7 rounded-full transition-colors relative shrink-0 ${
              darkMode ? "bg-navy-800" : "bg-gray-300"
            }`}
          >
            <span
              className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
                darkMode ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-white dark:bg-navy-800 rounded-xl shadow-sm p-5 border border-danger/20 dark:border-danger/40">
        <h2 className="text-navy-900 dark:text-white font-semibold mb-1">
          Danger zone
        </h2>
        <p className="text-gray-500 dark:text-white/50 text-xs mb-4">
          This clears mock attendance, marksheets, and your local session from
          this browser. It does not affect any real backend once connected.
        </p>

        {!confirming ? (
          <button
            onClick={() => setConfirming(true)}
            className="flex items-center gap-2 text-sm font-medium text-danger border border-danger/30 dark:border-danger/50 hover:bg-danger/10 dark:hover:bg-danger/20 px-4 py-2 rounded-md transition-colors"
          >
            <Trash2 size={16} />
            Delete all local data
          </button>
        ) : (
          <div className="bg-danger/10 dark:bg-danger/20 border border-danger/30 dark:border-danger/50 rounded-md p-4">
            <div className="flex items-start gap-2 mb-3">
              <AlertTriangle size={18} className="text-danger mt-0.5 shrink-0" />
              <p className="text-sm text-danger dark:text-danger">
                This can't be undone. You'll be logged out and all mock data on
                this device will be erased.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDeleteAll}
                className="bg-danger hover:bg-danger/90 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
              >
                Yes, delete everything
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="text-sm font-medium text-gray-600 dark:text-white/70 px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {cleared && (
          <p className="text-sm text-success mt-3">
            Data cleared — reloading...
          </p>
        )}
      </div>
    </div>
  );
}