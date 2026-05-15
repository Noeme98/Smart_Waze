import { FileText, Map, Folder, MapPin, Power, Menu, X, HelpCircle, UserCircle, Bell, Contrast } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../pages/AuthPages";
import { useTranslation } from "../i18n/useTranslation";
import { unreadNotificationCount } from "../lib/citizenNotifications";
import logo from "../assets/2.png";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { logout, user } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { t } = useTranslation();
  const [unreadCount, setUnreadCount] = useState(() => unreadNotificationCount());

  useEffect(() => {
    const bump = () => setUnreadCount(unreadNotificationCount());
    bump();
    window.addEventListener("smartwayz-notifications-updated", bump);
    const id = setInterval(bump, 20000);
    return () => {
      window.removeEventListener("smartwayz-notifications-updated", bump);
      clearInterval(id);
    };
  }, []);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      navigate('/auth');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
      setIsMobileMenuOpen(false);
    }
  };

  const navItems = [
    { label: t("sidebar.newReport"), icon: <FileText size={16} />, path: "/new-report" },
    { label: t("sidebar.mapView"), icon: <Map size={16} />, path: "/map-view" },
    { label: t("sidebar.myReports"), icon: <Folder size={16} />, path: "/my-reports" },
  ];

  const helpItems = [
    { label: t("sidebar.help"), icon: <HelpCircle size={16} />, path: "/help" },
    { label: t("sidebar.account"), icon: <UserCircle size={16} />, path: "/account" },
    { label: t("sidebar.notifications"), icon: <Bell size={16} />, path: "/notifications", badge: unreadCount },
    { label: t("sidebar.accessibility"), icon: <Contrast size={16} />, path: "/accessibility" },
  ];

  const simItems = [
    { label: t("sidebar.trafficSim"), icon: <MapPin size={16} />, path: "/traffic-map" },
  ];

  const isActive = (path) => location.pathname === path;

  const handleNavigation = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-gradient-to-r from-[#1B163C] to-[#100C27] z-50 px-4 py-3 flex items-center justify-between shadow-lg">
        <img src={logo} alt="Logo" className="w-32 h-16 object-contain" />
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-white p-2 hover:bg-[#2E2470] rounded-lg transition-colors"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed lg:sticky top-0 left-0 h-screen
          bg-gradient-to-b from-[#1B163C] to-[#100C27] 
          w-64 flex flex-col justify-between 
          font-[Kanit] text-white z-40
          transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex-1 overflow-y-auto">
          {/* Logo - Desktop only */}
          <img src={logo} alt="Logo" className="hidden lg:block w-44 h-24 mx-2 my-3" />

          {/* Mobile spacing */}
          <div className="lg:hidden h-4" />

          {/* REPORT INFRASTRUCTURE ISSUE */}
          <div className="px-4 text-[0.65rem] text-gray-400 uppercase tracking-wider mt-3 mb-1">
            {t("sidebar.reportSection")}
          </div>

          <nav className="space-y-1 px-2">
            {navItems.map(({ label, icon, path }) => (
              <button
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
                  <span className="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_6px_rgba(96,165,250,0.9)]"></span>
                )}
              </button>
            ))}
          </nav>

          <div className="px-4 text-[0.65rem] text-gray-400 uppercase tracking-wider mt-6 mb-1">
            {t("sidebar.helpSection")}
          </div>

          <nav className="space-y-1 px-2">
            {helpItems.map(({ label, icon, path, badge }) => (
              <button
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
                <span className="flex items-center gap-1.5 shrink-0">
                  {badge > 0 && (
                    <span className="min-w-[1.125rem] h-[1.125rem] px-1 rounded-full bg-amber-500 text-[10px] font-bold text-black flex items-center justify-center">
                      {badge > 9 ? "9+" : badge}
                    </span>
                  )}
                  {isActive(path) && (
                    <span className="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_6px_rgba(96,165,250,0.9)]" />
                  )}
                </span>
              </button>
            ))}
          </nav>

          {/* TRAFFIC MANAGEMENT SIMULATION */}
          <div className="px-4 text-[0.65rem] text-gray-400 uppercase tracking-wider mt-6 mb-1">
            {t("sidebar.trafficSection")}
          </div>

          <nav className="space-y-1 px-2">
            {simItems.map(({ label, icon, path }) => (
              <button
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
                  <span className="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_6px_rgba(96,165,250,0.9)]"></span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* USER INFO - Fixed at bottom */}
        <div className="p-4 border-t border-[#2D2570]/40">
          <div className="bg-[#1C153A] flex items-center gap-2 p-2 rounded-md mb-2 border border-[#2D2570]/40">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
              {user?.name ? user.name.charAt(0).toUpperCase() : user?.authority_name ? user.authority_name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate">
                {user?.name || user?.authority_name || 'User'}
              </div>
              <div className="text-xs text-gray-400 capitalize truncate">
                {user?.user_type || 'citizen'}
              </div>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full bg-gradient-to-r from-[#B02147] to-[#E13B63] hover:opacity-90 text-sm rounded-md py-1.5 flex items-center justify-center gap-2 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoggingOut ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Signing out...
              </>
            ) : (
              <>
                <Power size={14} /> Sign Out
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;