const STATUS_SNAPSHOT_KEY = "smartwayz_report_status_snapshot";
const NOTIFICATIONS_KEY = "smartwayz_notifications";

export function emitNotificationsUpdated() {
  try {
    window.dispatchEvent(new CustomEvent("smartwayz-notifications-updated"));
  } catch {
    /* ignore */
  }
}

function safeParse(json, fallback) {
  try {
    return JSON.parse(json) || fallback;
  } catch {
    return fallback;
  }
}

export function getStatusSnapshot() {
  return safeParse(localStorage.getItem(STATUS_SNAPSHOT_KEY) || "{}", {});
}

export function setStatusSnapshot(map) {
  try {
    localStorage.setItem(STATUS_SNAPSHOT_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export function getStoredNotifications() {
  const list = safeParse(localStorage.getItem(NOTIFICATIONS_KEY) || "[]", []);
  return Array.isArray(list) ? list : [];
}

export function setStoredNotifications(list) {
  try {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

function notifyDesktop(title, body) {
  if (typeof Notification === "undefined") return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(title, { body, silent: false });
  } catch {
    /* ignore */
  }
}

/**
 * Compare fetched reports to last known status; append local notifications when status changes.
 * First time we see a report id we only record status (no notification).
 */
export function mergeReportsIntoNotifications(reports, locale = "en") {
  const prev = getStatusSnapshot();
  const next = { ...prev };
  const existing = getStoredNotifications();
  const newItems = [];

  const statusLabel = (r) =>
    r.status_name || r.status_display || r.status || "updated";

  for (const r of reports || []) {
    const id = r.id;
    if (id == null) continue;
    const key = String(id);
    const current = statusLabel(r);
    if (Object.prototype.hasOwnProperty.call(prev, key)) {
      if (prev[key] !== current) {
        const title =
          locale === "tl" ? "Nagbago ang status ng ulat" : "Report status updated";
        const body =
          locale === "tl"
            ? `${r.title || "Ulat"}: ${current}`
            : `${r.title || "Report"}: ${current}`;
        newItems.push({
          id: `n-${key}-${Date.now()}`,
          reportId: id,
          title,
          body,
          read: false,
          createdAt: new Date().toISOString(),
        });
        if (document.hidden) {
          notifyDesktop(title, body);
        }
      }
    }
    next[key] = current;
  }

  setStatusSnapshot(next);
  if (newItems.length) {
    setStoredNotifications([...newItems, ...existing].slice(0, 100));
    emitNotificationsUpdated();
  }
  return newItems.length;
}

export function markAllNotificationsRead() {
  const list = getStoredNotifications().map((n) => ({ ...n, read: true }));
  setStoredNotifications(list);
  emitNotificationsUpdated();
}

export function clearNotifications() {
  setStoredNotifications([]);
  emitNotificationsUpdated();
}

export function unreadNotificationCount() {
  return getStoredNotifications().filter((n) => !n.read).length;
}

export function requestNotificationPermission() {
  if (typeof Notification === "undefined") return Promise.resolve("unsupported");
  return Notification.requestPermission();
}
