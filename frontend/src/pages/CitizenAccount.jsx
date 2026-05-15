import { User, Mail, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "./AuthPages";
import { useTranslation } from "../i18n/useTranslation";

const CitizenAccount = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const name = user?.name || "—";
  const email = user?.email || "—";

  return (
    <div className="flex-1 text-white font-[Kanit] bg-gradient-to-b from-[#37366B] to-[#0A0E27] min-h-screen pt-20 lg:pt-0">
      <div className="bg-[#151F31] p-4 sm:p-6 md:p-8 lg:p-12 border-b border-gray-800">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">{t("account.title")}</h1>
        <p className="text-sm text-gray-300">{t("account.intro")}</p>
      </div>

      <div className="p-4 sm:p-6 md:p-8 max-w-lg space-y-6">
        <section className="bg-[#1E1C3A]/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <User className="text-purple-400" size={20} />
            {t("account.profile")}
          </h2>
          <dl className="space-y-4">
            <div>
              <dt className="text-xs uppercase tracking-wider text-gray-500 mb-1">{t("account.name")}</dt>
              <dd className="text-base">{name}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-gray-500 mb-1 flex items-center gap-1">
                <Mail size={12} />
                {t("account.email")}
              </dt>
              <dd className="text-base break-all">{email}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-gray-500 mb-1 flex items-center gap-1">
                <Shield size={12} />
                {t("account.role")}
              </dt>
              <dd className="text-base text-emerald-400 capitalize">{user?.user_type || user?.type || "citizen"}</dd>
            </div>
          </dl>
        </section>

        <p className="text-sm text-gray-400 leading-relaxed">
          {t("account.helpLink")}{" "}
          <Link to="/help" className="text-purple-400 hover:text-purple-300">
            {t("account.helpAnchor")}
          </Link>
          .
        </p>
      </div>
    </div>
  );
};

export default CitizenAccount;
