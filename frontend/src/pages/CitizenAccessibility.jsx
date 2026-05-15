import { Type, Contrast, Languages } from "lucide-react";
import { usePreferences } from "../context/PreferencesContext";
import { useTranslation } from "../i18n/useTranslation";

export default function CitizenAccessibility() {
  const { locale, textSize, contrast, setLocale, setTextSize, setContrast } = usePreferences();
  const { t } = useTranslation();

  const btn = (active) =>
    `flex-1 min-w-[120px] px-4 py-3 rounded-lg text-sm font-medium transition-all border ${
      active
        ? "bg-[#2E2470] border-indigo-400 text-white shadow-[0_0_12px_rgba(79,70,229,0.35)]"
        : "bg-[#1E1C3A]/60 border-gray-700 text-gray-300 hover:border-gray-500"
    }`;

  return (
    <div className="flex-1 text-white font-[Kanit] bg-gradient-to-b from-[#37366B] to-[#0A0E27] min-h-screen pt-20 lg:pt-0">
      <div className="bg-[#151F31] p-4 sm:p-6 md:p-8 lg:p-12 border-b border-gray-800">
        <div className="flex items-start gap-3">
          <Contrast className="text-sky-400 shrink-0 mt-1" size={28} />
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
              {t("accessibility.title")}
            </h1>
            <p className="text-sm sm:text-base text-gray-300 max-w-2xl">{t("accessibility.subtitle")}</p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 md:p-8 max-w-lg space-y-8">
        <section className="bg-[#1E1C3A]/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Languages className="text-purple-400" size={20} />
            {t("accessibility.language")}
          </h2>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={btn(locale === "en")} onClick={() => setLocale("en")}>
              {t("accessibility.english")}
            </button>
            <button type="button" className={btn(locale === "tl")} onClick={() => setLocale("tl")}>
              {t("accessibility.filipino")}
            </button>
          </div>
        </section>

        <section className="bg-[#1E1C3A]/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Type className="text-emerald-400" size={20} />
            {t("accessibility.textSize")}
          </h2>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={btn(textSize === "normal")} onClick={() => setTextSize("normal")}>
              {t("accessibility.normal")}
            </button>
            <button type="button" className={btn(textSize === "large")} onClick={() => setTextSize("large")}>
              {t("accessibility.large")}
            </button>
          </div>
        </section>

        <section className="bg-[#1E1C3A]/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Contrast className="text-amber-400" size={20} />
            {t("accessibility.contrast")}
          </h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={btn(contrast === "normal")}
              onClick={() => setContrast("normal")}
            >
              {t("accessibility.standard")}
            </button>
            <button type="button" className={btn(contrast === "high")} onClick={() => setContrast("high")}>
              {t("accessibility.high")}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
