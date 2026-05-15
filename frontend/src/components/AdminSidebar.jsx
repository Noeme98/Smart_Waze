import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FileText,
  UserCircle,
  Settings,
  Power,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../pages/AuthPages";
import logo from "../assets/2.png";

const navItems = [
  { label: "Overview", icon: <LayoutDashboard size={16} />, path: "/admin/overview" },
  { label: "Office accounts", icon: <Users size={16} />, path: "/admin/authorities" },
  { label: "All reports", icon: <FileText size={16} />, path: "/admin/reports" },
  { label: "Citizens", icon: <UserCircle size={16} />, path: "/admin/citizens" },
];

const utilityItems = [
  { label: "Settings", icon: <Settings size={16} />, path: "/admin/settings" },
];

const AdminSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      navigate("/auth/admin");
    } finally {
      setIsLoggingOut(false);
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <>
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-gradient-to-r from-[#1B163C] to-[#100C27] z-50 px-4 py-3 flex items-center justify-between shadow-lg">
        <div>
          <img src={logo} alt="Logo" className="w-32 h-16 object-contain" />
          <div className="text-xs text-amber-400 font-semibold -mt-2">LGU Admin</div>
        </div>
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-white p-2 hover:bg-[#2E2470] rounded-lg transition-colors"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div
        className={`
          fixed lg:sticky top-0 left-0 h-screen
          bg-gradient-to-b from-[#1B163C] to-[#100C27] 
          w-64 flex flex-col justify-between 
          font-[Kanit] text-white z-40
          transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="flex-1 overflow-y-auto pt-20 lg:pt-0">
          <div className="hidden lg:block p-6">
            <img src={logo} alt="Logo" className="w-44 h-24 mb-2" />
            <div className="text-xs text-amber-400 font-semibold mt-1">System administration</div>
          </div>
          <div className="lg:hidden h-4" />

          <div className="px-4 text-[0.65rem] text-gray-400 uppercase tracking-wider mt-3 mb-1">
            Administration
          </div>
          <nav className="space-y-1 px-2">
            {navItems.map(({ label, icon, path }) => (
              <button
                type="button"
                key={path}
                onClick={() => {
                  navigate(path);
                  setIsMobileMenuOpen(false);
                }}
                className={`relative flex items-center justify-between w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive(path)
                    ? "bg-amber-900/40 text-white border border-amber-700/50"
                    : "text-gray-300 hover:text-white hover:bg-[#241D4D]"
                }`}
              >
                <span className="flex items-center gap-2">
                  {icon}
                  {label}
                </span>
                {isActive(path) && (
                  <span className="w-2 h-2 bg-amber-400 rounded-full shadow-[0_0_6px_rgba(251,191,36,0.8)]" />
                )}
              </button>
            ))}
          </nav>

          <div className="px-4 text-[0.65rem] text-gray-400 uppercase tracking-wider mt-6 mb-1">
            Utilities
          </div>
          <nav className="space-y-1 px-2">
            {utilityItems.map(({ label, icon, path }) => (
              <button
                type="button"
                key={path}
                onClick={() => {
                  navigate(path);
                  setIsMobileMenuOpen(false);
                }}
                className={`relative flex items-center justify-between w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive(path)
                    ? "bg-amber-900/40 text-white border border-amber-700/50"
                    : "text-gray-300 hover:text-white hover:bg-[#241D4D]"
                }`}
              >
                <span className="flex items-center gap-2">
                  {icon}
                  {label}
                </span>
                {isActive(path) && (
                  <span className="w-2 h-2 bg-amber-400 rounded-full shadow-[0_0_6px_rgba(251,191,36,0.8)]" />
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-[#2D2570]/40">
          <div className="bg-[#1C153A] flex items-center gap-2 p-2 rounded-md mb-2 border border-[#2D2570]/40">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white font-bold text-sm">
              {(user?.name || "A").charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-sm font-semibold">{user?.name || "Administrator"}</div>
              <div className="text-xs text-amber-400">System admin</div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full bg-gradient-to-r from-[#B02147] to-[#E13B63] hover:opacity-90 text-sm rounded-md py-1.5 flex items-center justify-center gap-2 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoggingOut ? "Signing out..." : <><Power size={14} /> Sign Out</>}
          </button>
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;
