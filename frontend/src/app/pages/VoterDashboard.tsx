import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import {
  Vote,
  CheckCircle2,
  Clock,
  Award,
  BarChart3,
  AlertCircle,
  ArrowRight,
  Calendar,
  Users,
  Shield,
  Bell,
  LogOut,
  Loader2,
} from "lucide-react";
import apiClient from "../../api-client.js";

interface Candidate {
  id: number;
  name: string;
  bio?: string;
  position?: string;
  photo_url?: string;
  approved: boolean;
}

interface UserInfo {
  id: number;
  username: string;
  email: string;
  role: string;
  has_voted: boolean;
}

export function VoterDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalVoters: 0, votesCast: 0, candidateCount: 0 });
  const [nominationStatus, setNominationStatus] = useState<{has_applied: boolean, status?: string}>({has_applied: false});

  useEffect(() => {
    fetchUserData();
    fetchCandidates();
    fetchStats();
    fetchNominationStatus();
  }, []);

  const fetchUserData = async () => {
    try {
      // Try to get from localStorage first
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      
      // Then refresh from API
      const response = await apiClient.get('/auth/me');
      setUser(response);
      localStorage.setItem('user', JSON.stringify(response));
    } catch (err) {
      console.error('Error fetching user:', err);
      // If auth fails, redirect to login
      handleLogout();
    }
  };

  const fetchCandidates = async () => {
    try {
      const response = await apiClient.get('/candidates/');
      const approved = response.candidates?.filter((c: Candidate) => c.approved) || [];
      setCandidates(approved.slice(0, 3)); // Show first 3
    } catch (err) {
      console.error('Error fetching candidates:', err);
      // If API fails, show empty state
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiClient.get('/vote/stats');
      setStats({
        totalVoters: response.total_voters || 0,
        votesCast: response.total_votes || 0,
        candidateCount: response.candidate_count || 0,
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchNominationStatus = async () => {
    try {
      const response = await apiClient.get('/nominations/my-nomination');
      setNominationStatus({
        has_applied: response.has_applied,
        status: response.nomination?.status
      });
    } catch (err) {
      console.error('Error fetching nomination status:', err);
    }
  };

  const handleLogout = () => {
    apiClient.setToken(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 size={40} className="text-indigo-500 animate-spin" />
      </div>
    );
  }

  const turnout = stats.totalVoters > 0 ? ((stats.votesCast / stats.totalVoters) * 100).toFixed(1) : 0;

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-slate-400 text-sm mb-1">Welcome back, 👋</p>
          <h1 className="text-2xl font-bold text-white">{user?.username || 'Voter'}</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600" />
            <span className="text-white text-sm">{user?.email || user?.username}</span>
          </div>
          <button
            onClick={handleLogout}
            className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-red-400 transition-colors"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Vote Status Banner */}
      <div className="bg-gradient-to-r from-indigo-600/30 to-purple-600/20 border border-indigo-500/30 rounded-2xl p-5 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-600/40 flex items-center justify-center">
            <Vote size={22} className="text-indigo-300" />
          </div>
          <div>
            <p className="text-white font-semibold">Community Election</p>
            <p className="text-slate-300 text-sm">Cast your vote for community leadership</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right mr-2">
            <p className="text-slate-300 text-xs">Your status</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {user?.has_voted ? (
                <>
                  <CheckCircle2 size={14} className="text-emerald-400" />
                  <p className="text-emerald-300 text-sm font-medium">Vote Cast</p>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <p className="text-amber-300 text-sm font-medium">Not Voted Yet</p>
                </>
              )}
            </div>
          </div>
          {!user?.has_voted && (
            <Link
              to="/voter/vote"
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl px-4 py-2.5 transition-all"
            >
              Cast Vote <ArrowRight size={15} />
            </Link>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Registered", value: stats.totalVoters.toLocaleString(), icon: Users, iconClass: "text-indigo-400", bgClass: "bg-indigo-600/20", subClass: "text-indigo-400", sub: "Registered voters" },
          { label: "Votes Cast", value: stats.votesCast.toLocaleString(), icon: Vote, iconClass: "text-emerald-400", bgClass: "bg-emerald-600/20", subClass: "text-emerald-400", sub: `${turnout}% turnout` },
          { label: "Candidates", value: stats.candidateCount.toString(), icon: Award, iconClass: "text-purple-400", bgClass: "bg-purple-600/20", subClass: "text-purple-400", sub: "Approved candidates" },
          { label: "Your Role", value: user?.role || "voter", icon: Shield, iconClass: "text-amber-400", bgClass: "bg-amber-600/20", subClass: "text-amber-400", sub: user?.has_voted ? "Voted" : "Active" },
        ].map(({ label, value, icon: Icon, iconClass, bgClass, subClass, sub }) => (
          <div key={label} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className={`w-10 h-10 rounded-xl ${bgClass} flex items-center justify-center mb-3`}>
              <Icon size={18} className={iconClass} />
            </div>
            <p className="text-2xl font-bold text-white capitalize">{value}</p>
            <p className="text-slate-400 text-xs mt-0.5">{label}</p>
            <p className={`${subClass} text-xs mt-1.5 font-medium`}>{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Candidates Preview */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-white font-semibold">Approved Candidates</h3>
            <Link to="/voter/vote" className="text-indigo-400 text-xs flex items-center gap-1 hover:text-indigo-300">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {candidates.length > 0 ? (
            <div className="space-y-3">
              {candidates.map((c) => (
                <div key={c.id} className="flex items-center gap-4 bg-slate-800/50 rounded-xl p-4 hover:bg-slate-800 transition-colors">
                  {c.photo_url ? (
                    <img src={c.photo_url} alt={c.name} className="w-12 h-12 rounded-xl object-cover object-top" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center">
                      <span className="text-xl text-slate-500">{c.name.charAt(0)}</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-white text-sm font-medium">{c.name}</p>
                      <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full border border-emerald-500/30">
                        Verified
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs mt-0.5">{c.position || c.bio || 'Candidate'}</p>
                  </div>
                  {!user?.has_voted && (
                    <Link
                      to="/voter/vote"
                      className="text-indigo-400 text-xs border border-indigo-500/30 rounded-lg px-3 py-1.5 hover:bg-indigo-600/20 transition-colors"
                    >
                      Vote
                    </Link>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <AlertCircle size={32} className="mx-auto mb-2 opacity-50" />
              <p>No candidates available yet</p>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Quick actions */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { to: "/voter/vote", icon: Vote, label: user?.has_voted ? "View Candidates" : "Cast Your Vote", iconClass: "text-indigo-400", bgClass: "bg-indigo-600/20" },
                { to: "/voter/results", icon: BarChart3, label: "View Results", iconClass: "text-purple-400", bgClass: "bg-purple-600/20" },
                { 
                  to: "/voter/nomination", 
                  icon: Award, 
                  label: nominationStatus.has_applied 
                    ? (nominationStatus.status === "approved" ? "Nomination Approved" : 
                       nominationStatus.status === "rejected" ? "Nomination Rejected" : "Nomination Pending")
                    : "Apply as Nominee", 
                  iconClass: "text-amber-400", 
                  bgClass: "bg-amber-600/20" 
                },
              ].map(({ to, icon: Icon, label, iconClass, bgClass }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800 transition-colors group"
                >
                  <div className={`w-8 h-8 rounded-lg ${bgClass} flex items-center justify-center`}>
                    <Icon size={15} className={iconClass} />
                  </div>
                  <span className="text-slate-300 text-sm group-hover:text-white transition-colors">{label}</span>
                  <ArrowRight size={14} className="text-slate-600 ml-auto group-hover:text-slate-400 transition-colors" />
                </Link>
              ))}
            </div>
          </div>

          {/* Account Info */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-4">Account Info</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-500 text-sm">Email</span>
                <span className="text-white text-sm">{user?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 text-sm">Role</span>
                <span className="text-white text-sm capitalize">{user?.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 text-sm">Vote Status</span>
                <span className={`text-sm ${user?.has_voted ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {user?.has_voted ? 'Completed' : 'Pending'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}