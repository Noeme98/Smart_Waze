import AuthoritySidebar from "../components/AuthoritySidebar";
import { Outlet } from "react-router-dom";

export default function AuthorityLayout() {
  return (
    <div className="flex">
      <AuthoritySidebar />
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}
