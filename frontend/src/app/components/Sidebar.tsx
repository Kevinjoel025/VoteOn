import { NavLink, useLocation, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Vote,
  BarChart3,
  Award,
  Shield,
  Users,
  CheckSquare,
  Activity,
  LogOut,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import apiClient from "../../api-client.js";

interface UserInfo {
  id: number;
  username: string;
  email: string;
  role: string;
  has_voted: boolean;
}

const voterNav = [
  { to: "/voter/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/voter/vote", icon: Vote, label: "Cast Vote" },
  { to: "/voter/results", icon: BarChart3, label: "Results" },
  { to: "/voter/nomination", icon: Award, label: "Nomination" },
];

const adminNav = [
  { to: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/admin/candidates", icon: CheckSquare, label: "Candidate Approval" },
  { to: "/admin/results", icon: BarChart3, label: "Full Results" },
  { to: "/admin/monitoring", icon: Activity, label: "Vote Monitoring" },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Error parsing user data:", e);
      }
    }
  }, [location]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const isAdmin = user?.role === "admin";
  const navItems = isAdmin ? adminNav : voterNav;
  const portalLabel = isAdmin ? "Admin Portal" : "Voter Portal";

  const handleLogout = () => {
    apiClient.setToken(null);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    navigate("/");
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
            <Vote size={18} className="text-white" />
          </div>
          <p className="text-white text-sm font-semibold">VoteOn</p>
        </div>
        {/* Close button — mobile only */}
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden text-slate-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Role indicator */}
      <div className="px-4 py-4 border-b border-slate-800">
        <div className="bg-slate-800 rounded-lg p-1 flex gap-1">
          <div
            className={`flex-1 text-center py-1.5 rounded-md text-xs font-medium ${
              isAdmin
                ? "bg-indigo-600 text-white shadow"
                : "bg-emerald-600 text-white shadow"
            }`}
          >
            {isAdmin ? (
              <span className="flex items-center justify-center gap-1.5">
                <Shield size={12} />
                Administrator
              </span>
            ) : (
              <span className="flex items-center justify-center gap-1.5">
                <Users size={12} />
                Voter
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="text-slate-500 text-xs font-medium px-3 mb-2 uppercase tracking-wider">
          {portalLabel}
        </p>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                isActive
                  ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={16} className={isActive ? "text-indigo-400" : ""} />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight size={14} className="text-indigo-400" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User info */}
      <div className="px-4 py-4 border-t border-slate-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold">
              {user?.username?.charAt(0).toUpperCase() || "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate">
              {user?.email || "Not logged in"}
            </p>
            <div className="flex items-center gap-1.5">
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  isAdmin ? "bg-amber-400" : "bg-emerald-400"
                }`}
              />
              <p className="text-slate-400 text-xs capitalize">
                {user?.role || "Guest"}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-slate-400 hover:text-red-400 text-xs transition-colors px-1 w-full"
        >
          <LogOut size={13} />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Vote size={14} className="text-white" />
          </div>
          <span className="text-white text-sm font-semibold">VoteOn</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="text-slate-400 hover:text-white transition-colors"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`md:hidden fixed top-0 left-0 h-screen w-72 bg-slate-900 border-r border-slate-800 flex flex-col z-50 transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-slate-900 border-r border-slate-800 flex-col z-50">
        <SidebarContent />
      </aside>
    </>
  );
}
