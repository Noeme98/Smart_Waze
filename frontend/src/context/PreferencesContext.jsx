import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "smartwayz_preferences";

const defaultPrefs = {
  locale: "en",
  textSize: "normal",
  contrast: "normal",
};

const PreferencesContext = createContext(null);

function loadPrefs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultPrefs };
    const parsed = JSON.parse(raw);
    const locale = parsed.locale === "tl" ? "tl" : "en";
    const textSize = parsed.textSize === "large" ? "large" : "normal";
    const contrast = parsed.contrast === "high" ? "high" : "normal";
    return { ...defaultPrefs, ...parsed, locale, textSize, contrast };
  } catch {
    return { ...defaultPrefs };
  }
}

function savePrefs(prefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}

function applyDom(prefs) {
  const root = document.documentElement;
  root.setAttribute("data-locale", prefs.locale);
  root.setAttribute("data-a11y-text", prefs.textSize);
  root.setAttribute("data-a11y-contrast", prefs.contrast);
}

export function PreferencesProvider({ children }) {
  const [prefs, setPrefsState] = useState(() => loadPrefs());

  useEffect(() => {
    applyDom(prefs);
    savePrefs(prefs);
  }, [prefs]);

  const setPrefs = (partial) => {
    setPrefsState((prev) => ({ ...prev, ...partial }));
  };

  const value = useMemo(
    () => ({
      locale: prefs.locale,
      textSize: prefs.textSize,
      contrast: prefs.contrast,
      setLocale: (locale) => setPrefs({ locale }),
      setTextSize: (textSize) => setPrefs({ textSize }),
      setContrast: (contrast) => setPrefs({ contrast }),
    }),
    [prefs]
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    throw new Error("usePreferences must be used within PreferencesProvider");
  }
  return ctx;
}
