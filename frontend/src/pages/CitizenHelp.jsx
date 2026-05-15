import { HelpCircle, FileText, MapPin, Camera, AlertTriangle, Phone, Mail } from "lucide-react";
import { usePreferences } from "../context/PreferencesContext";
import { HELP_SECTIONS } from "../i18n/helpContent";
import { translate } from "../i18n/strings";

const sectionIcons = [FileText, MapPin, Camera, AlertTriangle];

const CitizenHelp = () => {
  const { locale } = usePreferences();
  const sections = HELP_SECTIONS[locale] || HELP_SECTIONS.en;

  return (
    <div className="flex-1 text-white font-[Kanit] bg-gradient-to-b from-[#37366B] to-[#0A0E27] min-h-screen pt-20 lg:pt-0">
      <div className="bg-[#151F31] p-4 sm:p-6 md:p-8 lg:p-12 border-b border-gray-800">
        <div className="flex items-start gap-3">
          <HelpCircle className="text-emerald-400 shrink-0 mt-1" size={28} />
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
              {translate(locale, "help.pageTitle")}
            </h1>
            <p className="text-sm sm:text-base text-gray-300 max-w-2xl">{translate(locale, "help.pageIntro")}</p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 md:p-8 max-w-3xl space-y-6">
        {sections.map(({ title, body }, idx) => {
          const Icon = sectionIcons[idx] || FileText;
          return (
            <section
              key={title}
              className="bg-[#1E1C3A]/60 backdrop-blur-sm rounded-xl p-5 sm:p-6 border border-gray-700/50"
            >
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Icon className="text-purple-400" size={20} />
                {title}
              </h2>
              <ul className="space-y-2 text-sm text-gray-300 list-disc pl-5">
                {body.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </section>
          );
        })}

        <section className="bg-[#1E1C3A]/60 backdrop-blur-sm rounded-xl p-5 sm:p-6 border border-gray-700/50">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Phone className="text-emerald-400" size={20} />
            {translate(locale, "help.contactTitle")}
          </h2>
          <p className="text-sm text-gray-400 mb-4">{translate(locale, "help.contactIntro")}</p>
          <div className="space-y-2 text-sm">
            <a
              href="tel:+6353XXXXXXXX"
              className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300"
            >
              <Phone size={16} />
              {translate(locale, "help.phoneLabel")}
            </a>
            <a
              href="mailto:info@lgu-naval.example"
              className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300"
            >
              <Mail size={16} />
              info@lgu-naval.example
            </a>
          </div>
        </section>
      </div>
    </div>
  );
};

export default CitizenHelp;
