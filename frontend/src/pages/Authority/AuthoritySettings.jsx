import { User, Mail, Shield, Server } from "lucide-react";
import { useAuth } from "../AuthPages";
import { getApiBaseUrl } from "../../config/apiBaseUrl";

const AuthoritySettings = () => {
  const { user } = useAuth();
  const displayName = user?.authority_name || user?.name || "Authority user";
  const email = user?.email || "—";
  const apiBase = getApiBaseUrl();

  return (
    <div className="flex-1 text-white font-[Kanit] bg-gradient-to-b from-[#37366B] to-[#0A0E27] min-h-screen pt-20 lg:pt-0">
      <div className="bg-[#151F31] p-4 sm:p-6 md:p-8 lg:p-12 border-b border-gray-800">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2">
          SETTINGS
        </h1>
        <p className="text-sm sm:text-base text-gray-300">
          Account and workspace information for your authority profile
        </p>
      </div>

      <div className="p-4 sm:p-6 md:p-8 max-w-3xl space-y-6">
        <section className="bg-[#1E1C3A]/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <User className="text-emerald-400" size={20} />
            Account
          </h2>
          <dl className="space-y-4">
            <div>
              <dt className="text-xs uppercase tracking-wider text-gray-500 mb-1">Name</dt>
              <dd className="text-base text-white">{displayName}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-gray-500 mb-1 flex items-center gap-1">
                <Mail size={12} className="inline" />
                Email
              </dt>
              <dd className="text-base text-white break-all">{email}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-gray-500 mb-1 flex items-center gap-1">
                <Shield size={12} className="inline" />
                Role
              </dt>
              <dd className="text-base text-emerald-400 font-medium">Authority</dd>
            </div>
          </dl>
        </section>

        <section className="bg-[#1E1C3A]/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Server className="text-purple-400" size={20} />
            Application
          </h2>
          <p className="text-sm text-gray-400 mb-2">
            API endpoint this browser uses for reports and authentication.
          </p>
          <code className="block text-xs sm:text-sm bg-[#0F0C1F] text-gray-300 rounded-lg px-3 py-2 border border-gray-700/50 break-all">
            {apiBase}
          </code>
        </section>
      </div>
    </div>
  );
};

export default AuthoritySettings;
