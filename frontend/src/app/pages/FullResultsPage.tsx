import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  AreaChart,
  Area,
  Legend,
} from "recharts";
import { Download, TrendingUp, Users, Vote, Award, MapPin, Loader2, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import apiClient from "../../api-client.js";

interface CandidateResult {
  id: number;
  name: string;
  position: string;
  party: string;
  vote_count: number;
  percentage: number;
  photo_url: string | null;
  bio: string;
  manifesto: string;
}

interface VoteTrend {
  date: string;
  votes: number;
}

interface FullResultsData {
  candidates: CandidateResult[];
  summary: {
    total_votes: number;
    total_voters: number;
    turnout_percentage: number;
    voting_status: string;
  };
  analytics: {
    vote_trends: VoteTrend[];
    fraud_statistics: {
      suspicious_votes: number;
      flagged_votes: number;
      clean_votes: number;
    };
  };
}

const COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#818cf8"];

export function FullResultsPage() {
  const [results, setResults] = useState<FullResultsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchFullResults();
  }, []);

  const fetchFullResults = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/results/admin/full");
      setResults(response);
      setError("");
    } catch (err) {
      console.error("❌ Error fetching full results:", err);
      setError("Failed to load results. Please ensure you have admin access.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 size={20} className="animate-spin" />
          Loading detailed results...
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

  if (!results) {
    return null;
  }

  // Prepare chart data from real results
  const chartData = results.candidates.map((candidate, index) => ({
    name: candidate.name.split(' ')[0], // First name for chart
    value: candidate.percentage,
    votes: candidate.vote_count,
    color: COLORS[index % COLORS.length]
  }));

  const pieData = results.candidates.map((candidate, index) => ({
    name: candidate.name,
    value: candidate.vote_count,
    color: COLORS[index % COLORS.length]
  }));

  // Prepare trend data (last 7 days if available)
  const trendData = results.analytics.vote_trends.map((trend, index) => ({
    day: new Date(trend.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    votes: trend.votes
  }));

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Election Results</h1>
          <p className="text-slate-400 text-sm mt-1">
            Complete election analytics and detailed breakdown • Status: {results.summary.voting_status}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "Total Votes",
            value: results.summary.total_votes.toLocaleString(),
            icon: Vote,
            color: "indigo",
            note: `${results.summary.turnout_percentage}% turnout`
          },
          {
            label: "Registered Voters",
            value: results.summary.total_voters.toLocaleString(),
            icon: Users,
            color: "emerald",
            note: "Eligible voters"
          },
          {
            label: "Candidates",
            value: results.candidates.length.toString(),
            icon: Award,
            color: "purple",
            note: "Approved nominees"
          },
          {
            label: "Clean Votes",
            value: `${Math.round((results.analytics.fraud_statistics.clean_votes / results.summary.total_votes) * 100)}%`,
            icon: TrendingUp,
            color: "amber",
            note: "No fraud detected"
          },
        ].map(({ label, value, icon: Icon, color, note }) => (
          <div key={label} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl bg-${color}-600/20 flex items-center justify-center`}>
                <Icon size={18} className={`text-${color}-400`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-slate-400 text-xs mt-0.5">{label}</p>
            <p className={`text-${color}-400 text-xs mt-1`}>{note}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-6 mb-6">
        {/* Winner Card */}
        <div className="md:col-span-2 bg-gradient-to-br from-indigo-600/10 to-purple-600/10 border border-indigo-500/20 rounded-2xl p-6">
          <div className="flex items-center gap-1.5 mb-4">
            <Award size={16} className="text-indigo-400" />
            <h3 className="text-white font-semibold">Current Leader</h3>
          </div>

          {results.candidates.length > 0 && (
            <>
              <div className="flex items-center gap-3 mb-4">
                {results.candidates[0].photo_url && (
                  <img
                    src={results.candidates[0].photo_url}
                    alt={results.candidates[0].name}
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                )}
                <div>
                  <h4 className="text-white font-semibold">{results.candidates[0].name}</h4>
                  <p className="text-indigo-400 text-sm">{results.candidates[0].party}</p>
                </div>
              </div>

              <div className="flex items-center justify-between mb-3">
                <span className="text-slate-400 text-sm">Vote Share</span>
                <span className="text-white font-semibold">{results.candidates[0].percentage}%</span>
              </div>

              <div className="h-2 bg-slate-800 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full bg-indigo-500 rounded-full"
                  style={{ width: `${results.candidates[0].percentage}%` }}
                />
              </div>

              <p className="text-slate-300 text-sm">{results.candidates[0].vote_count.toLocaleString()} votes</p>
            </>
          )}
        </div>

        {/* Vote Distribution Chart */}
        <div className="md:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4">Vote Distribution</h3>

          {results.candidates.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} barSize={32}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8 }}
                  labelStyle={{ color: "#fff" }}
                  formatter={(value: number, name: string, props: any) => [
                    `${value}% (${props.payload.votes?.toLocaleString()} votes)`,
                    "Share"
                  ]}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-slate-400">
              No candidate data available
            </div>
          )}
        </div>

        {/* Pie Chart */}
        <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4">Results Breakdown</h3>

          {results.candidates.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8 }}
                  formatter={(value: number) => [`${value?.toLocaleString()} votes`, "Votes"]}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-slate-400">
              No data available
            </div>
          )}
        </div>
      </div>

      {/* Detailed Results Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
        <h3 className="text-white font-semibold mb-5">Detailed Results</h3>

        <div className="overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-slate-400 text-xs uppercase tracking-wide font-medium text-left pb-3">Rank</th>
                <th className="text-slate-400 text-xs uppercase tracking-wide font-medium text-left pb-3">Candidate</th>
                <th className="text-slate-400 text-xs uppercase tracking-wide font-medium text-left pb-3">Party</th>
                <th className="text-slate-400 text-xs uppercase tracking-wide font-medium text-right pb-3">Votes</th>
                <th className="text-slate-400 text-xs uppercase tracking-wide font-medium text-right pb-3">Percentage</th>
                <th className="text-slate-400 text-xs uppercase tracking-wide font-medium text-right pb-3">Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {results.candidates.map((candidate, index) => {
                const margin = index > 0 ?
                  results.candidates[index - 1].vote_count - candidate.vote_count : 0;

                return (
                  <tr key={candidate.id}>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                          style={{ background: COLORS[index % COLORS.length] }}
                        >
                          {index + 1}
                        </div>
                        {index === 0 && (
                          <Award size={14} className="text-yellow-400" />
                        )}
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        {candidate.photo_url && (
                          <img
                            src={candidate.photo_url}
                            alt={candidate.name}
                            className="w-8 h-8 rounded-lg object-cover"
                          />
                        )}
                        <span className="text-white font-medium">{candidate.name}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className="text-slate-300">{candidate.party}</span>
                    </td>
                    <td className="py-4 text-right">
                      <span className="text-white font-semibold">{candidate.vote_count.toLocaleString()}</span>
                    </td>
                    <td className="py-4 text-right">
                      <span className="text-white">{candidate.percentage}%</span>
                    </td>
                    <td className="py-4 text-right">
                      <span className="text-slate-400">
                        {index === 0 ? "—" : `−${margin.toLocaleString()}`}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vote Trends */}
      {trendData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-4">Voting Activity Trends</h3>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorVotes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8 }}
                  labelStyle={{ color: "#fff" }}
                />
                <Area type="monotone" dataKey="votes" stroke="#6366f1" fillOpacity={1} fill="url(#colorVotes)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-4">Security Overview</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-800 rounded-xl">
                <span className="text-slate-300">Clean Votes</span>
                <span className="text-emerald-400 font-semibold">
                  {results.analytics.fraud_statistics.clean_votes.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-800 rounded-xl">
                <span className="text-slate-300">Flagged for Review</span>
                <span className="text-amber-400 font-semibold">
                  {results.analytics.fraud_statistics.suspicious_votes.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-800 rounded-xl">
                <span className="text-slate-300">Invalid Votes</span>
                <span className="text-red-400 font-semibold">
                  {results.analytics.fraud_statistics.flagged_votes.toLocaleString()}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-sm">Security Score</span>
                  <span className="text-emerald-400 font-semibold">
                    {Math.round((results.analytics.fraud_statistics.clean_votes / results.summary.total_votes) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}