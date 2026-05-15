import { useState, useEffect } from "react";
import { FileText, CheckCircle, Clock, XCircle, BarChart3, Settings, Power, Menu, X } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../pages/AuthPages";
import { reportAPI } from "../services/api";
import logo from "../assets/2.png";

const AuthoritySidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [statsData, setStatsData] = useState({
    total_reports: 0,
    by_status: [],
  });

  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const getStatusCount = (code) => {
    return statsData.by_status?.find(s => {
      const apiCode = s.status__code?.toLowerCase() || "";
      const normalizedCode = code.toLowerCase();
      return apiCode === normalizedCode || apiCode === normalizedCode.replace("_", " ");
    })?.count || 0;
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const statsRes = await reportAPI.getStats();

        if (statsRes && statsRes.total_reports !== undefined) {
          setStatsData(statsRes);
        } else {
          const reportsRes = await reportAPI.getAll();
          let raw = [];
          if (Array.isArray(reportsRes)) {
            raw = reportsRes;
          } else if (reportsRes?.results && Array.isArray(reportsRes.results)) {
            raw = reportsRes.results;
          }

          const pending = raw.filter(r => r.status_name?.toLowerCase() === "pending").length;
          const approved = raw.filter(r => r.status_name?.toLowerCase() === "approved").length;
          const inProgress = raw.filter(r => r.status_name?.toLowerCase() === "in progress").length;
          const rejected = raw.filter(r => r.status_name?.toLowerCase() === "rejected").length;
          const resolved = raw.filter(r => r.status_name?.toLowerCase() === "resolved").length;

          setStatsData({
            total_reports: raw.length,
            by_status: [
              { status__code: "pending", count: pending },
              { status__code: "approved", count: approved },
              { status__code: "in_progress", count: inProgress },
              { status__code: "rejected", count: rejected },
              { status__code: "resolved", count: resolved },
            ],
          });
        }
      } catch (err) {
        console.error("Error fetching stats:", err);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      navigate("/auth");
    } finally {
      setIsLoggingOut(false);
      setIsMobileMenuOpen(false);
    }
  };

  const navItems = [
    { label: "All Reports", icon: <FileText size={16} />, path: "/authority/reports", statusCode: "total" },
    { label: "Pending Review", icon: <Clock size={16} />, path: "/authority/pending", statusCode: "pending" },
    { label: "Approved", icon: <CheckCircle size={16} />, path: "/authority/approved", statusCode: "approved" },
    { label: "In Progress", icon: <CheckCircle size={16} />, path: "/authority/in-progress", statusCode: "in_progress" },
    { label: "Rejected", icon: <XCircle size={16} />, path: "/authority/rejected", statusCode: "rejected" },
    { label: "Resolved", icon: <CheckCircle size={16} />, path: "/authority/resolved", statusCode: "resolved" },
  ];

  const utilityItems = [
    { label: "Analytics", icon: <BarChart3 size={16} />, path: "/authority/authority-analytics" },
    { label: "Settings", icon: <Settings size={16} />, path: "/authority/settings" },
  ];

  const isActive = (path) => location.pathname === path;

  const handleNavigation = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const getBadgeCount = (statusCode) => {
    if (statusCode == null) return 0;
    if (statusCode === "total") {
      return statsData.total_reports;
    }
    return getStatusCount(statusCode);
  };

  return (
    <>
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-gradient-to-r from-[#1B163C] to-[#100C27] z-50 px-4 py-3 flex items-center justify-between shadow-lg">
        <div>
          <img src={logo} alt="Logo" className="w-32 h-16 object-contain" />
          <div className="text-xs text-emerald-400 font-semibold -mt-2">LGU NAVAL</div>
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
            <div className="text-xs text-emerald-400 font-semibold mt-1">LGU NAVAL</div>
          </div>

          <div className="lg:hidden h-4" />

          <div className="px-4 text-[0.65rem] text-gray-400 uppercase tracking-wider mt-3 mb-1">
            Report Management
          </div>

          <nav className="space-y-1 px-2">
            {navItems.map(({ label, icon, path, statusCode }) => (
              <button
                type="button"
                key={label}
                onClick={() => handleNavigation(path)}
                className={`relative flex items-center justify-between w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive(path)
                    ? "bg-[#2E2470] text-white shadow-[0_0_12px_rgba(79,70,229,0.35)]"
                    : "text-gray-300 hover:text-white hover:bg-[#241D4D]"
                }`}
              >
                <span className="flex items-center gap-2">
                  {icon}
                  {label}
                </span>
                <div className="flex items-center gap-2">
                  {statusCode != null && getBadgeCount(statusCode) > 0 && (
                    <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {getBadgeCount(statusCode)}
                    </span>
                  )}
                  {isActive(path) && (
                    <span className="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_6px_rgba(96,165,250,0.9)]" />
                  )}
                </div>
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
                key={label}
                onClick={() => handleNavigation(path)}
                className={`relative flex items-center justify-between w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive(path)
                    ? "bg-[#2E2470] text-white shadow-[0_0_12px_rgba(79,70,229,0.35)]"
                    : "text-gray-300 hover:text-white hover:bg-[#241D4D]"
                }`}
              >
                <span className="flex items-center gap-2">
                  {icon}
                  {label}
                </span>
                {isActive(path) && (
                  <span className="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_6px_rgba(96,165,250,0.9)]" />
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-[#2D2570]/40">
          <div className="bg-[#1C153A] flex items-center gap-2 p-2 rounded-md mb-2 border border-[#2D2570]/40">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-sm">
              {(user?.name || user?.authority_name || "U").charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-sm font-semibold">{user?.name || user?.authority_name || "User"}</div>
              <div className="text-xs text-emerald-400">Authority</div>
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

export default AuthoritySidebar;
