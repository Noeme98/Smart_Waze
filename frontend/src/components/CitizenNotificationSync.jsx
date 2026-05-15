import { useEffect } from "react";
import { useAuth } from "../pages/AuthPages";
import { usePreferences } from "../context/PreferencesContext";
import { reportAPI } from "../services/api";
import { mergeReportsIntoNotifications } from "../lib/citizenNotifications";

const POLL_MS = 90_000;

/**
 * Polls the citizen's reports and records status changes as local in-app (and optional desktop) notifications.
 */
export default function CitizenNotificationSync() {
  const { user, isAuthenticated } = useAuth();
  const { locale } = usePreferences();

  useEffect(() => {
    if (!isAuthenticated || user?.type !== "citizen") return;

    let cancelled = false;

    const tick = async () => {
      try {
        const data = await reportAPI.getAll();
        if (cancelled) return;
        const list = data?.results || data || [];
        mergeReportsIntoNotifications(list, locale);
      } catch {
        /* offline or API error — skip */
      }
    };

    tick();
    const interval = setInterval(tick, POLL_MS);

    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", tick);

    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", tick);
    };
  }, [isAuthenticated, user?.type, locale]);

  return null;
}
