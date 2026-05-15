import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./pages/AuthPages";
import RoleBasedSidebar from "./components/RoleBasedSidebar";
import NewReport from "./pages/NewReport";
import MapView from "./pages/MapView";
import CitizenHelp from "./pages/CitizenHelp";
import CitizenAccount from "./pages/CitizenAccount";
import CitizenNotifications from "./pages/CitizenNotifications";
import CitizenAccessibility from "./pages/CitizenAccessibility";
import MyReports from "./pages/MyReports";
import CitizenNotificationSync from "./components/CitizenNotificationSync";
import AuthPages from "./pages/AuthPages";
import AdminAuthPage from "./pages/AdminAuthPage";
import AuthorityReports from "./pages/Authority/AuthorityReports";
import PendingReports from "./pages/Authority/PendingReports";
import { Outlet, useLocation } from "react-router-dom";
import InProgressReports from "./pages/Authority/InProgressReports";
import ApprovedReports from "./pages/Authority/ApprovedReports";
import ResolvedReports from "./pages/Authority/ResolvedReports";
import RejectedReports from "./pages/Authority/RejectedReports";
import AuthorityAnalytics from "./pages/Authority/AuthorityAnalytics";
import AuthoritySettings from "./pages/Authority/AuthoritySettings";
import TrafficSimulation from "./pages/TrafficSimulation";
import AdminOverview from "./pages/Admin/AdminOverview";
import AdminAuthorities from "./pages/Admin/AdminAuthorities";
import AdminCitizens from "./pages/Admin/AdminCitizens";
import AdminReportsReadOnly from "./pages/Admin/AdminReportsReadOnly";
import GlobalAdminShortcut from "./components/GlobalAdminShortcut";

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="text-white">Loading...</div>;

  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return children;
};

// Auth Route Wrapper
const AuthRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) return <div className="text-white">Loading...</div>;

  if (isAuthenticated) {
    const t = user?.type;
    const dest =
      t === "authority"
        ? "/authority/reports"
        : t === "admin"
          ? "/admin/overview"
          : "/new-report";
    return <Navigate to={dest} replace />;
  }

  return children;
};

const DashboardLayout = () => (
  <div className="flex min-h-screen bg-[#1a1535]">
    <RoleBasedSidebar />
    <div className="flex-1 overflow-y-auto">
      <Outlet />
    </div>
  </div>
);

const IndexRedirect = () => {
  const { user } = useAuth();
  if (user?.type === "admin") return <Navigate to="/admin/overview" replace />;
  if (user?.type === "authority") return <Navigate to="/authority/reports" replace />;
  return <Navigate to="/new-report" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <CitizenNotificationSync />
      <GlobalAdminShortcut />
      <Routes>

        {/* Auth */}
        <Route
          path="/auth"
          element={
            <AuthRoute>
              <AuthPages />
            </AuthRoute>
          }
        />
        <Route
          path="/auth/admin"
          element={
            <AuthRoute>
              <AdminAuthPage />
            </AuthRoute>
          }
        />

        {/* Protected Dashboard */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<IndexRedirect />} />

          {/* Citizen Routes */}
          <Route path="new-report" element={<NewReport />} />
          <Route path="map-view" element={<MapView />} />
          <Route path="my-reports" element={<MyReports />} />
          <Route path="help" element={<CitizenHelp />} />
          <Route path="account" element={<CitizenAccount />} />
          <Route path="notifications" element={<CitizenNotifications />} />
          <Route path="accessibility" element={<CitizenAccessibility />} />
          <Route path="traffic-map" element={<TrafficSimulation />} />
          <Route path="scenarios" element={<TrafficSimulation />} />
          <Route path="controls" element={<TrafficSimulation />} />
          <Route path="analysis" element={<TrafficSimulation />} />

          {/* Authority Routes */}
          <Route path="authority" element={<Navigate to="/authority/reports" replace />} />
          <Route path="authority/reports" element={<AuthorityReports />} />
          <Route path="authority/pending" element={<PendingReports />} />
          <Route path="authority/in-progress" element={<InProgressReports />} />
          <Route path="authority/approved" element={<ApprovedReports />} />
          <Route path="authority/rejected" element={<RejectedReports />} />
          <Route path="authority/resolved" element={<ResolvedReports />} />
          <Route path="authority/authority-analytics" element={<AuthorityAnalytics />} />
          <Route path="authority/settings" element={<AuthoritySettings />} />

          {/* System admin — oversight & account management (not report workflow) */}
          <Route path="admin" element={<Navigate to="/admin/overview" replace />} />
          <Route path="admin/overview" element={<AdminOverview />} />
          <Route path="admin/authorities" element={<AdminAuthorities />} />
          <Route path="admin/reports" element={<AdminReportsReadOnly />} />
          <Route path="admin/citizens" element={<AdminCitizens />} />
          <Route path="admin/settings" element={<AuthoritySettings />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;
