import React, { useMemo, useState } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  Search,
  Trash2,
  GraduationCap,
  Wallet,
  ShieldCheck,
  BookOpen,
  Library,
  UserCog,
  Settings,
  Filter,
  ChevronDown,
} from "lucide-react";

import PageHeader from "../../components/admin/PageHeader.jsx";
import { adminNotifications as initialNotifications } from "../../data/adminNotifications.js";

/* =========================================================
   ICONS
========================================================= */

const notificationIcons = {
  admission: GraduationCap,
  finance: Wallet,
  blockchain: ShieldCheck,
  academic: BookOpen,
  library: Library,
  hr: UserCog,
  system: Settings,
};

/* =========================================================
   COLORS
========================================================= */

const notificationColors = {
  admission:
    "bg-primary-subtle text-primary",

  finance:
    "bg-secondary-subtle text-secondary",

  blockchain:
    "bg-secondary-subtle text-secondary",

  academic:
    "bg-primary-subtle text-primary",

  library:
    "bg-primary-subtle text-primary",

  hr:
    "bg-primary-subtle text-primary",

  system:
    "bg-background text-text-muted",
};

/* =========================================================
   PAGE
========================================================= */

export default function Notifications() {
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem(
        "educhain360_admin_notifications"
      );

      return saved
        ? JSON.parse(saved)
        : initialNotifications;
    } catch {
      return initialNotifications;
    }
  });

  const [activeFilter, setActiveFilter] =
    useState("all");

  const [category, setCategory] =
    useState("all");

  const [search, setSearch] =
    useState("");

  /* =======================================================
     SAVE LOCAL NOTIFICATION STATE
  ======================================================= */

  const saveNotifications = (next) => {
    setNotifications(next);

    try {
      localStorage.setItem(
        "educhain360_admin_notifications",
        JSON.stringify(next)
      );
    } catch {
      // Ignore storage errors.
    }
  };

  /* =======================================================
     COUNTS
  ======================================================= */

  const unreadCount = notifications.filter(
    (notification) => notification.unread
  ).length;

  const totalCount = notifications.length;

  /* =======================================================
     FILTERED NOTIFICATIONS
  ======================================================= */

  const filteredNotifications = useMemo(() => {
    const query = search.trim().toLowerCase();

    return notifications.filter(
      (notification) => {
        const matchesRead =
          activeFilter === "all"
            ? true
            : notification.unread;

        const matchesCategory =
          category === "all"
            ? true
            : notification.type === category;

        const matchesSearch =
          !query ||
          notification.title
            .toLowerCase()
            .includes(query) ||
          notification.message
            .toLowerCase()
            .includes(query);

        return (
          matchesRead &&
          matchesCategory &&
          matchesSearch
        );
      }
    );
  }, [
    notifications,
    activeFilter,
    category,
    search,
  ]);

  /* =======================================================
     MARK ONE AS READ
  ======================================================= */

  const markAsRead = (id) => {
    const next = notifications.map(
      (notification) =>
        notification.id === id
          ? {
              ...notification,
              unread: false,
            }
          : notification
    );

    saveNotifications(next);
  };

  /* =======================================================
     MARK ALL AS READ
  ======================================================= */

  const markAllAsRead = () => {
    const next = notifications.map(
      (notification) => ({
        ...notification,
        unread: false,
      })
    );

    saveNotifications(next);
  };

  /* =======================================================
     DELETE
  ======================================================= */

  const deleteNotification = (id) => {
    const next = notifications.filter(
      (notification) =>
        notification.id !== id
    );

    saveNotifications(next);
  };

  /* =======================================================
     RESET
  ======================================================= */

  const resetNotifications = () => {
    saveNotifications(
      initialNotifications
    );
  };

  return (
    <div className="space-y-6">

      {/* ===================================================
          PAGE HEADER
      =================================================== */}

      <PageHeader
        eyebrow="ADMINISTRATION"
        title="Notifications"
        description="Review system alerts, admission activity, finance updates, academic reminders and blockchain events."
        action={
          unreadCount > 0 ? (
            <button
              type="button"
              onClick={markAllAsRead}
              className="primary-button"
            >
              <CheckCheck size={15} />
              Mark all as read
            </button>
          ) : (
            <button
              type="button"
              onClick={resetNotifications}
              className="secondary-button"
            >
              Reset demo notifications
            </button>
          )
        }
      />

      {/* ===================================================
          SUMMARY CARDS
      =================================================== */}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">

        <div className="dashboard-card p-5">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-xs font-medium text-text-muted">
                Total notifications
              </p>

              <h3 className="mt-2 text-2xl font-bold text-text-main">
                {totalCount}
              </h3>
            </div>

            <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary-subtle text-primary">
              <Bell size={19} />
            </div>

          </div>

          <p className="mt-3 text-[10px] text-text-muted">
            Notifications available in the Admin workspace
          </p>

        </div>

        <div className="dashboard-card p-5">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-xs font-medium text-text-muted">
                Unread
              </p>

              <h3 className="mt-2 text-2xl font-bold text-primary">
                {unreadCount}
              </h3>
            </div>

            <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary-light text-primary">
              <Bell size={19} />
            </div>

          </div>

          <p className="mt-3 text-[10px] text-text-muted">
            Require your attention
          </p>

        </div>

        <div className="dashboard-card p-5">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-xs font-medium text-text-muted">
                Read
              </p>

              <h3 className="mt-2 text-2xl font-bold text-status-verified">
                {totalCount - unreadCount}
              </h3>
            </div>

            <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#edf7f0] text-status-verified">
              <CheckCheck size={19} />
            </div>

          </div>

          <p className="mt-3 text-[10px] text-text-muted">
            Already reviewed
          </p>

        </div>

      </section>

      {/* ===================================================
          FILTER / SEARCH
      =================================================== */}

      <section className="dashboard-card">

        <div className="toolbar">

          <div className="table-search">

            <Search size={15} />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search notifications..."
            />

          </div>

          <div className="flex flex-wrap items-center gap-2">

            {/* Read filter */}

            <button
              type="button"
              onClick={() =>
                setActiveFilter("all")
              }
              className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
                activeFilter === "all"
                  ? "bg-primary text-white"
                  : "border border-border bg-surface text-text-muted hover:bg-primary-subtle hover:text-primary"
              }`}
            >
              All
            </button>

            <button
              type="button"
              onClick={() =>
                setActiveFilter("unread")
              }
              className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
                activeFilter === "unread"
                  ? "bg-primary text-white"
                  : "border border-border bg-surface text-text-muted hover:bg-primary-subtle hover:text-primary"
              }`}
            >
              Unread
              {unreadCount > 0 && (
                <span className="ml-1.5">
                  ({unreadCount})
                </span>
              )}
            </button>

            {/* Category */}

            <div className="relative">

              <Filter
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
              />

              <select
                value={category}
                onChange={(event) =>
                  setCategory(
                    event.target.value
                  )
                }
                className="filter-select appearance-none pl-8 pr-8"
              >
                <option value="all">
                  All categories
                </option>

                <option value="admission">
                  Admissions
                </option>

                <option value="finance">
                  Finance
                </option>

                <option value="academic">
                  Academics
                </option>

                <option value="blockchain">
                  Blockchain
                </option>

                <option value="library">
                  Library
                </option>

                <option value="hr">
                  HR
                </option>

                <option value="system">
                  System
                </option>
              </select>

              <ChevronDown
                size={13}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
              />

            </div>

          </div>

        </div>

        {/* =================================================
            NOTIFICATION LIST
        ================================================= */}

        <div className="notification-list">

          {filteredNotifications.length === 0 ? (

            <div className="py-16 text-center">

              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary-subtle text-primary">
                <Bell size={23} />
              </div>

              <h3 className="mt-4 text-sm font-bold text-text-main">
                No notifications found
              </h3>

              <p className="mt-1 text-xs text-text-muted">
                Try changing your search or filter.
              </p>

            </div>

          ) : (

            filteredNotifications.map(
              (notification) => {

                const Icon =
                  notificationIcons[
                    notification.type
                  ] || Bell;

                const iconColor =
                  notificationColors[
                    notification.type
                  ] ||
                  "bg-primary-subtle text-primary";

                return (
                  <article
                    key={notification.id}
                    className={`notification-item group ${
                      notification.unread
                        ? "unread"
                        : ""
                    }`}
                  >

                    {/* Icon */}

                    <div
                      className={`notification-icon ${iconColor}`}
                    >
                      <Icon size={17} />
                    </div>

                    {/* Content */}

                    <div className="notification-content">

                      <div className="flex flex-wrap items-start justify-between gap-2">

                        <div className="min-w-0">

                          <div className="flex items-center gap-2">

                            <strong>
                              {notification.title}
                            </strong>

                            {notification.unread && (
                              <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                            )}

                          </div>

                          <p>
                            {notification.message}
                          </p>

                        </div>

                        <span className="whitespace-nowrap">
                          {notification.time}
                        </span>

                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">

                        <span className="rounded-full bg-background px-2 py-1 text-[9px] font-semibold capitalize text-text-muted">
                          {notification.type}
                        </span>

                        <span className="text-[10px] text-text-muted">
                          {notification.date}
                        </span>

                      </div>

                    </div>

                    {/* Actions */}

                    <div className="flex shrink-0 items-center gap-1 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">

                      {notification.unread && (
                        <button
                          type="button"
                          title="Mark as read"
                          onClick={() =>
                            markAsRead(
                              notification.id
                            )
                          }
                          className="table-action"
                        >
                          <Check size={14} />
                        </button>
                      )}

                      <button
                        type="button"
                        title="Delete notification"
                        onClick={() =>
                          deleteNotification(
                            notification.id
                          )
                        }
                        className="grid h-8 w-8 place-items-center rounded-lg border border-border text-text-muted transition hover:border-status-tampered hover:bg-[#fff4f4] hover:text-status-tampered"
                      >
                        <Trash2 size={14} />
                      </button>

                    </div>

                  </article>
                );
              }
            )

          )}

        </div>

        {/* =================================================
            FOOTER
        ================================================= */}

        {filteredNotifications.length > 0 && (
          <div className="border-t border-border px-5 py-3">

            <p className="text-[10px] text-text-muted">
              Showing{" "}
              <span className="font-bold text-text-main">
                {filteredNotifications.length}
              </span>{" "}
              of{" "}
              <span className="font-bold text-text-main">
                {totalCount}
              </span>{" "}
              notifications
            </p>

          </div>
        )}

      </section>

    </div>
  );
}