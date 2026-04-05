import { Outlet, useLocation } from "react-router";
import { Sidebar } from "./components/Sidebar";

export function Root() {
  const location = useLocation();
  const isLogin = location.pathname === "/" || location.pathname === "/register" || location.pathname === "/admin/login" || location.pathname === "/oauth-callback";


  return (
    <div className="flex min-h-screen bg-slate-950">
      {!isLogin && <Sidebar />}
      <div className={`flex-1 min-h-screen ${!isLogin ? "md:ml-64 pt-14 md:pt-0" : ""}`}>
        <Outlet />
      </div>
    </div>
  );
}
