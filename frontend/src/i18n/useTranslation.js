import { useCallback, useMemo } from "react";
import { usePreferences } from "../context/PreferencesContext";
import { translate } from "./strings";

export function useTranslation() {
  const { locale } = usePreferences();
  const t = useCallback((path) => translate(locale, path), [locale]);
  return useMemo(() => ({ t, locale }), [t, locale]);
}
