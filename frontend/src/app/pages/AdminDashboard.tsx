import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import {
  Users,
  Vote,
  AlertTriangle,
  TrendingUp,
  Activity,
  CheckSquare,
  BarChart3,
  Shield,
  Clock,
  ArrowRight,
  Zap,
  Loader2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import apiClient from "../../api-client.js";

interface DashboardStats {
  total_voters: number;
  total_votes: number;
  suspicious_votes: number;
  pending_nominations: number;
  turnout_percentage: number;
}

interface CandidateStanding {
  name: string;
  votes: number;
  color: string;
}

interface RecentActivity {
  user: string;
  action: string;
  candidate: string;
  time: string;
  risk: number;
  status: string;
}

const COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe"];

export function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    total_voters: 0,
    total_votes: 0,
    suspicious_votes: 0,
    pending_nominations: 0,
    turnout_percentage: 0,
  });
  const [candidateData, setCandidateData] = useState<CandidateStanding[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  useEffect(() => {
    // Check if user is admin
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      if (user.role !== 'admin') {
        navigate('/voter/dashboard');
        return;
      }
    } else {
      navigate('/');
      return;
    }
    
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch stats from multiple endpoints
      const [statsRes, candidatesRes, nominationsRes, votesRes] = await Promise.all([
        apiClient.get('/vote/stats').catch(() => null),
        apiClient.get('/candidates/').catch(() => ({ candidates: [] })),
        apiClient.get('/nominations/pending').catch(() => ({ nominations: [] })),
        apiClient.get('/admin/suspicious-votes').catch(() => ({ votes: [] })),
      ]);

      // Process stats
      if (statsRes) {
        setStats({
          total_voters: statsRes.total_voters || 0,
          total_votes: statsRes.total_votes || 0,
          suspicious_votes: votesRes?.votes?.length || 0,
          pending_nominations: nominationsRes?.nominations?.length || 0,
          turnout_percentage: statsRes.turnout_percentage || 0,
        });
      }

      // Process candidate standings
      if (candidatesRes?.candidates) {
        const standings = candidatesRes.candidates
          .filter((c: any) => c.approved)
          .map((c: any, i: number) => ({
            name: c.name.split(' ')[0] + ' ' + (c.name.split(' ')[1]?.[0] || '') + '.',
            votes: c.vote_count || 0,
            color: COLORS[i % COLORS.length],
          }))
          .sort((a: CandidateStanding, b: CandidateStanding) => b.votes - a.votes)
          .slice(0, 5);
        setCandidateData(standings);
      }

      // Process recent activity from suspicious votes
      if (votesRes?.votes) {
        const activities = votesRes.votes.slice(0, 5).map((v: any) => ({
          user: `voter_${v.user_id || 'unknown'}`,
          action: 'Vote cast',
          candidate: v.candidate_name || 'Unknown',
          time: formatTimeAgo(v.created_at),
          risk: v.risk_score || 0,
          status: v.risk_score > 5 ? 'suspicious' : v.risk_score > 2 ? 'warning' : 'normal',
        }));
        setRecentActivity(activities);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    if (!dateStr) return 'just now';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 size={40} className="text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-emerald-400 text-xs font-medium">Election Live</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">Community Election — Real-time Overview</p>
        </div>
        <div className="flex items-center gap-3">
          {stats.suspicious_votes > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2 flex items-center gap-2">
              <AlertTriangle size={14} className="text-amber-400" />
              <span className="text-amber-300 text-sm font-medium">{stats.suspicious_votes} Suspicious Votes</span>
            </div>
          )}
          <Link to="/admin/monitoring" className="bg-red-600/20 border border-red-500/30 hover:bg-red-600/30 rounded-xl px-4 py-2 flex items-center gap-2 transition-all">
            <Shield size={14} className="text-red-400" />
            <span className="text-red-300 text-sm font-medium">Review Now</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {[
          { label: "Total Registered", value: stats.total_voters.toLocaleString(), icon: Users, iconClass: "text-indigo-400", bgClass: "bg-indigo-600/20", changeClass: "text-emerald-400", change: "Voters" },
          { label: "Votes Cast", value: stats.total_votes.toLocaleString(), icon: Vote, iconClass: "text-emerald-400", bgClass: "bg-emerald-600/20", changeClass: "text-emerald-400", change: "Total" },
          { label: "Voter Turnout", value: `${stats.turnout_percentage.toFixed(1)}%`, icon: TrendingUp, iconClass: "text-purple-400", bgClass: "bg-purple-600/20", changeClass: "text-purple-400", change: "Rate" },
          { label: "Suspicious Votes", value: stats.suspicious_votes.toString(), icon: AlertTriangle, iconClass: "text-red-400", bgClass: "bg-red-600/20", changeClass: "text-red-400", change: "Flagged" },
          { label: "Pending Nominations", value: stats.pending_nominations.toString(), icon: Clock, iconClass: "text-amber-400", bgClass: "bg-amber-600/20", changeClass: "text-amber-400", change: "Awaiting" },
        ].map(({ label, value, icon: Icon, iconClass, bgClass, changeClass, change }) => (
          <div key={label} className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl ${bgClass} flex items-center justify-center`}>
                <Icon size={16} className={iconClass} />
              </div>
              <span className={`text-xs font-medium ${changeClass}`}>
                {change}
              </span>
            </div>
            <p className="text-xl font-bold text-white">{value}</p>
            <p className="text-slate-500 text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Candidate totals - takes 2 columns now */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4">Current Standings</h3>
          {candidateData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={candidateData} layout="vertical" barSize={20}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} width={80} />
                  <Tooltip
                    contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8 }}
                    labelStyle={{ color: "#fff" }}
                  />
                  <Bar dataKey="votes" radius={[0, 6, 6, 0]}>
                    {candidateData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {candidateData.map((c) => (
                  <div key={c.name} className="flex items-center justify-between bg-slate-800/40 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: c.color }} />
                      <span className="text-slate-400 text-xs">{c.name}</span>
                    </div>
                    <span className="text-white text-xs font-medium">{c.votes.toLocaleString()} votes</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <BarChart3 size={32} className="mx-auto mb-2 opacity-50" />
              <p>No candidates yet</p>
            </div>
          )}
        </div>

        {/* Quick admin actions */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4">Admin Controls</h3>
          <div className="space-y-2">
            {[
              { to: "/admin/candidates", icon: CheckSquare, label: "Approve Nominees", badge: stats.pending_nominations > 0 ? `${stats.pending_nominations} pending` : null, badgeClass: "text-amber-400 bg-amber-500/10 border-amber-500/20", iconClass: "text-amber-400", bgClass: "bg-amber-600/20" },
              { to: "/admin/monitoring", icon: AlertTriangle, label: "Review Suspicious", badge: stats.suspicious_votes > 0 ? `${stats.suspicious_votes} flagged` : null, badgeClass: "text-red-400 bg-red-500/10 border-red-500/20", iconClass: "text-red-400", bgClass: "bg-red-600/20" },
              { to: "/admin/results", icon: BarChart3, label: "Full Results", badge: null, badgeClass: "", iconClass: "text-indigo-400", bgClass: "bg-indigo-600/20" },
            ].map(({ to, icon: Icon, label, badge, badgeClass, iconClass, bgClass }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800 transition-colors group"
              >
                <div className={`w-8 h-8 rounded-lg ${bgClass} flex items-center justify-center`}>
                  <Icon size={15} className={iconClass} />
                </div>
                <span className="text-slate-300 text-sm group-hover:text-white transition-colors flex-1">{label}</span>
                {badge && (
                  <span className={`text-xs border rounded-full px-2 py-0.5 ${badgeClass}`}>
                    {badge}
                  </span>
                )}
                <ArrowRight size={14} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Activity size={15} />
            Recent Activity
          </h3>
          <Link to="/admin/monitoring" className="text-indigo-400 text-xs flex items-center gap-1 hover:text-indigo-300">
            Full monitor <ArrowRight size={12} />
          </Link>
        </div>
        {recentActivity.length > 0 ? (
          <div className="space-y-2">
            {recentActivity.map((a, i) => (
              <div key={i} className="flex items-center gap-4 bg-slate-800/40 hover:bg-slate-800/60 rounded-xl px-4 py-3 transition-colors">
                <div className={`w-2 h-2 rounded-full shrink-0 ${
                  a.status === "normal" ? "bg-emerald-400" :
                  a.status === "warning" ? "bg-amber-400" : "bg-red-400 animate-pulse"
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{a.user}</p>
                  <p className="text-slate-500 text-xs">{a.action} {a.candidate !== "—" ? `→ ${a.candidate}` : ""}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${
                    a.risk === 0 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                    a.risk <= 5 ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                    "bg-red-500/10 text-red-400 border-red-500/20"
                  }`}>
                    <Zap size={10} />
                    Risk: {a.risk}
                  </div>
                  <p className="text-slate-500 text-xs mt-0.5">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            <Activity size={24} className="mx-auto mb-2 opacity-50" />
            <p>No recent activity to display</p>
          </div>
        )}
      </div>
    </div>
  );
}