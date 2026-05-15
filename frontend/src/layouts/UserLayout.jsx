import Sidebar from "../components/Sidebar";
import { Outlet } from "react-router-dom";

export default function UserLayout() {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}
