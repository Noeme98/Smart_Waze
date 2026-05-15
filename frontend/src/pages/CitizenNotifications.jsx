import { useCallback, useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { useTranslation } from "../i18n/useTranslation";
import {
  clearNotifications,
  getStoredNotifications,
  markAllNotificationsRead,
  requestNotificationPermission,
} from "../lib/citizenNotifications";

export default function CitizenNotifications() {
  const { t } = useTranslation();
  const [items, setItems] = useState(() => getStoredNotifications());
  const [perm, setPerm] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "unsupported"
  );

  const refresh = useCallback(() => {
    setItems(getStoredNotifications());
  }, []);

  useEffect(() => {
    refresh();
    const onUpdate = () => refresh();
    window.addEventListener("smartwayz-notifications-updated", onUpdate);
    return () => window.removeEventListener("smartwayz-notifications-updated", onUpdate);
  }, [refresh]);

  const handleMarkRead = () => {
    markAllNotificationsRead();
    refresh();
  };

  const handleClear = () => {
    clearNotifications();
    refresh();
  };

  const handleEnableDesktop = async () => {
    const p = await requestNotificationPermission();
    setPerm(p);
  };

  return (
    <div className="flex-1 text-white font-[Kanit] bg-gradient-to-b from-[#37366B] to-[#0A0E27] min-h-screen pt-20 lg:pt-0">
      <div className="bg-[#151F31] p-4 sm:p-6 md:p-8 lg:p-12 border-b border-gray-800">
        <div className="flex items-start gap-3">
          <Bell className="text-amber-400 shrink-0 mt-1" size={28} />
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
              {t("notifications.title")}
            </h1>
            <p className="text-sm sm:text-base text-gray-300 max-w-2xl">{t("notifications.subtitle")}</p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 md:p-8 max-w-2xl space-y-6">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleMarkRead}
            className="px-4 py-2 rounded-lg bg-[#2E2470] hover:bg-[#3d32a0] text-sm font-medium transition-colors"
          >
            {t("notifications.markRead")}
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="px-4 py-2 rounded-lg border border-gray-600 text-gray-200 hover:bg-white/5 text-sm font-medium transition-colors"
          >
            {t("notifications.clear")}
          </button>
        </div>

        {perm === "default" && (
          <section className="bg-[#1E1C3A]/60 backdrop-blur-sm rounded-xl p-5 border border-gray-700/50">
            <p className="text-sm text-gray-300 mb-3">{t("notifications.desktopHint")}</p>
            <button
              type="button"
              onClick={handleEnableDesktop}
              className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-sm font-medium"
            >
              {t("notifications.enableDesktop")}
            </button>
          </section>
        )}

        {items.length === 0 ? (
          <p className="text-gray-400 text-sm leading-relaxed">{t("notifications.empty")}</p>
        ) : (
          <ul className="space-y-3">
            {items.map((n) => (
              <li
                key={n.id}
                className={`rounded-xl border p-4 ${
                  n.read ? "border-gray-700/40 bg-[#1E1C3A]/40" : "border-amber-500/30 bg-[#1E1C3A]/80"
                }`}
              >
                <div className="text-sm font-semibold text-white">{n.title}</div>
                <div className="text-sm text-gray-300 mt-1">{n.body}</div>
                {n.createdAt && (
                  <div className="text-xs text-gray-500 mt-2">
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
