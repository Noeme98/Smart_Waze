import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from "./AuthPages";
import logoTwo from "../assets/2.png";

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);
  const bg = type === "success" ? "bg-green-600" : "bg-red-600";
  const Icon = type === "success" ? CheckCircle : AlertCircle;
  return (
    <div className={`fixed top-4 right-4 ${bg} text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3 z-50`}>
      <Icon size={20} />
      <span className="font-medium">{message}</span>
      <button type="button" onClick={onClose} className="ml-2 text-white/80 hover:text-white text-xl">
        ×
      </button>
    </div>
  );
}

const AdminAuthPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);

  const validate = () => {
    const next = {};
    if (!email) next.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) next.email = "Email is invalid";
    if (!password) next.password = "Password is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    const result = await login(email, password, "admin");
    setLoading(false);
    if (result.success) {
      setToast({ message: "Signed in.", type: "success" });
    } else {
      setToast({ message: result.error || "Sign-in failed.", type: "error" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1B163C] via-[#2D2570] to-[#0A0E27] flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="relative w-full max-w-md bg-[#1E1C3A]/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-700/50 p-8 md:p-10">
        <div className="flex flex-col items-center mb-8">
          <img src={logoTwo} alt="Safewayz" className="h-14 w-auto mb-2" />
          <h1 className="text-2xl font-bold text-white text-center">LGU dashboard access</h1>
          <p className="text-gray-400 text-sm text-center mt-1">Authorized personnel only</p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                className={`w-full bg-[#0F0C1F] text-white pl-10 pr-4 py-3 rounded-lg border ${
                  errors.email ? "border-red-500" : "border-gray-700"
                } focus:border-amber-500/80 focus:outline-none transition-all`}
                autoComplete="username"
              />
            </div>
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                className={`w-full bg-[#0F0C1F] text-white pl-10 pr-12 py-3 rounded-lg border ${
                  errors.password ? "border-red-500" : "border-gray-700"
                } focus:border-amber-500/80 focus:outline-none transition-all`}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>

          <div className="text-center pt-2">
            <Link to="/auth" className="text-sm text-gray-400 hover:text-gray-200 transition-colors">
              ← Public sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAuthPage;
