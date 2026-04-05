import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { Lock, TrendingUp, Users, Eye, EyeOff, Calendar, AlertCircle, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import apiClient from "../../api-client.js";

interface CandidateResult {
  id: number;
  name: string;
  position: string;
  vote_count: number;
  percentage: number;
  photo_url: string | null;
}

interface ResultsData {
  candidates: CandidateResult[];
  total_votes: number;
  turnout_percentage: number;
  voting_status: string;
  message: string;
}

interface Stats {
  total_voters: number;
  votes_cast: number;
  candidates_count: number;
}

const colors = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe"];

export function VoterResultsPage() {
  const [showExact, setShowExact] = useState(false);
  const [results, setResults] = useState<ResultsData | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch results and stats in parallel
        const [resultsResponse, statsResponse] = await Promise.all([
          apiClient.get("/results/voter"),
          apiClient.get("/vote/stats")
        ]);
        
        setResults(resultsResponse);
        setStats(statsResponse);
        setError("");
      } catch (err) {
        console.error("❌ Error fetching results:", err);
        setError("Failed to load results. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Auto-refresh every 30 seconds for real-time updates
    const interval = setInterval(fetchData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 size={20} className="animate-spin" />
          Loading results...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-6 py-4 flex items-center gap-3">
          <AlertCircle size={20} className="text-red-400" />
          <p className="text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  if (!results || !stats) {
    return null;
  }

  // Prepare chart data
  const chartData = results.candidates.map(candidate => ({
    name: candidate.name.split(' ')[0], // First name only for chart
    value: candidate.percentage
  }));

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Live Results</h1>
            <p className="text-slate-400 text-sm mt-1">Community Election · {results.message}</p>
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Auto-refreshing every 30s
          </div>
        </div>
      </div>

      {/* Restricted notice */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 flex items-center gap-3 mb-6">
        <Lock size={16} className="text-amber-400 shrink-0" />
        <div>
          <p className="text-amber-300 text-sm font-medium">Limited Results View</p>
          <p className="text-amber-400/70 text-xs">
            Live results are shown for transparency. Vote counts update in real-time as votes are cast.
          </p>
        </div>
      </div>

      {/* Turnout stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 flex items-center justify-center">
              <Users size={16} className="text-indigo-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{results.total_votes.toLocaleString()}</p>
          <p className="text-slate-400 text-xs mt-0.5">Total Votes Cast</p>
          <p className="text-indigo-400 text-xs mt-1">of {stats.total_voters.toLocaleString()} registered</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/20 flex items-center justify-center">
              <TrendingUp size={16} className="text-emerald-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{results.turnout_percentage}%</p>
          <p className="text-slate-400 text-xs mt-0.5">Voter Turnout</p>
          <p className="text-emerald-400 text-xs mt-1">
            {results.turnout_percentage >= 60 ? "Excellent turnout" : results.turnout_percentage >= 40 ? "Good turnout" : "Moderate turnout"}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 flex items-center justify-center">
              <Calendar size={16} className="text-purple-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white">{stats.candidates_count}</p>
          <p className="text-slate-400 text-xs mt-0.5">Active Candidates</p>
          <p className="text-purple-400 text-xs mt-1">
            Status: {results.voting_status === "active" ? "Voting Open" : "Voting Closed"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Candidate results */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-white font-semibold">Candidate Standing</h3>
            <button
              onClick={() => setShowExact(!showExact)}
              className="flex items-center gap-1.5 text-slate-400 hover:text-white text-xs transition-colors"
            >
              {showExact ? <EyeOff size={13} /> : <Eye size={13} />}
              {showExact ? "Hide" : "Show"} exact vote counts
            </button>
          </div>

          <div className="space-y-5">
            {results.candidates.map((candidate, i) => (
              <div key={candidate.id}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: colors[i % colors.length] }}
                    >
                      {i + 1}
                    </div>
                    <span className="text-white text-sm font-medium">{candidate.name}</span>
                    {candidate.position && (
                      <span className="text-slate-500 text-xs">• {candidate.position}</span>
                    )}
                    {i === 0 && results.candidates.length > 1 && (
                      <span className="bg-indigo-600/20 text-indigo-400 text-xs px-2 py-0.5 rounded-full border border-indigo-500/30">
                        Leading
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-white text-sm font-semibold">{candidate.percentage}%</span>
                    {showExact && (
                      <span className="text-slate-500 text-xs ml-2">{candidate.vote_count.toLocaleString()} votes</span>
                    )}
                  </div>
                </div>
                <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ 
                      width: `${candidate.percentage}%`, 
                      background: colors[i % colors.length] 
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {results.candidates.length === 0 && (
            <div className="text-center py-8">
              <p className="text-slate-400">No candidates available yet.</p>
            </div>
          )}
        </div>

        {/* Chart */}
        <div className="lg:col-span-2 space-y-4">
          {results.candidates.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h3 className="text-white font-semibold mb-4">Visual Distribution</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData} barSize={28}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8 }}
                    labelStyle={{ color: "#fff" }}
                    formatter={(v: number) => [`${v}%`, "Share"]}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={colors[i % colors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-4">Election Info</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Status</span>
                <span className={`text-sm font-medium ${results.voting_status === 'active' ? 'text-green-400' : 'text-amber-400'}`}>
                  {results.voting_status === 'active' ? 'Open' : 'Closed'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Candidates</span>
                <span className="text-white text-sm">{results.candidates.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Participation</span>
                <span className="text-white text-sm">{results.turnout_percentage}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Regional breakdown - blurred for voters */}
      <div className="mt-6 bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Regional Breakdown</h3>
          <div className="flex items-center gap-1.5 text-slate-400 text-xs bg-slate-800 rounded-lg px-3 py-1.5">
            <Lock size={12} />
            Full view — Admin only
          </div>
        </div>
        <div className="relative">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 blur-sm pointer-events-none select-none">
            {["North District", "South District", "East Ward", "West Ward"].map((region) => (
              <div key={region} className="bg-slate-800 rounded-xl p-4">
                <p className="text-white text-sm font-medium mb-1">{region}</p>
                <p className="text-2xl font-bold text-indigo-400">{Math.floor(Math.random() * 40 + 20)}%</p>
                <p className="text-slate-400 text-xs mt-1">Turnout</p>
              </div>
            ))}
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-slate-900/90 backdrop-blur-sm border border-slate-700 rounded-xl px-6 py-3 flex items-center gap-2">
              <Lock size={16} className="text-slate-400" />
              <span className="text-slate-300 text-sm">Admin access required for detailed regional data</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}