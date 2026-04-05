import { useState, useEffect } from "react";
import {
  AlertTriangle,
  Shield,
  Fingerprint,
  Globe,
  Clock,
  Ban,
  CheckCircle2,
  XCircle,
  Eye,
  Loader2,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import apiClient from "../../api-client.js";

interface SuspiciousVote {
  id: number;
  receipt_id: string;
  user_id: number;
  username: string;
  candidate_id: number;
  candidate_name: string;
  risk_score: number;
  is_suspicious: boolean;
  device_id: string | null;
  ip_address: string | null;
  timestamp: string;
  is_valid: boolean;
}

function getRiskColor(score: number) {
  if (score >= 6) return { text: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", label: "High Risk" };
  if (score >= 3) return { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", label: "Suspicious" };
  return { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", label: "Normal" };
}

export function VoteMonitoringPage() {
  const [votes, setVotes] = useState<SuspiciousVote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedVote, setSelectedVote] = useState<SuspiciousVote | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [filter, setFilter] = useState<"all" | "flagged" | "invalidated" | "valid">("all");

  useEffect(() => {
    fetchVotes();
  }, []);

  const fetchVotes = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/admin/votes/suspicious");
      setVotes(response);
      setError("");
    } catch (err) {
      console.error("❌ Error fetching suspicious votes:", err);
      setError("Failed to load suspicious votes.");
    } finally {
      setLoading(false);
    }
  };

  const handleVoteAction = async (voteId: number, action: "invalidate" | "clear_flag" | "revalidate") => {
    try {
      setActionLoading(voteId);
      
      await apiClient.post(`/admin/votes/${voteId}/action`, {
        action
      });
      
      // Refresh votes list
      await fetchVotes();
      setSelectedVote(null);
      
      console.log(`✅ Vote ${action} successful`);
    } catch (err) {
      console.error(`❌ Error performing ${action}:`, err);
      setError(`Failed to ${action} vote. Please try again.`);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredVotes = votes?.filter(vote => {
    if (filter === "flagged") return vote.is_suspicious && vote.is_valid;
    if (filter === "invalidated") return !vote.is_valid;
    if (filter === "valid") return vote.is_valid && !vote.is_suspicious;
    return true;
  }) || [];

  const stats = {
    total: votes?.length || 0,
    flagged: votes?.filter(v => v.is_suspicious && v.is_valid).length || 0,
    invalidated: votes?.filter(v => !v.is_valid).length || 0,
    highRisk: votes?.filter(v => v.risk_score >= 6).length || 0,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 size={20} className="animate-spin" />
          Loading vote monitoring data...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Vote Monitoring</h1>
        <p className="text-slate-400 text-sm mt-1">Review suspicious voting activity and fraud detection</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-6 flex items-center gap-3">
          <AlertCircle size={16} className="text-red-400" />
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Suspicious", value: stats.total, icon: AlertTriangle, color: "amber" },
          { label: "Flagged Active", value: stats.flagged, icon: Shield, color: "red" },
          { label: "Invalidated", value: stats.invalidated, icon: Ban, color: "slate" },
          { label: "High Risk", value: stats.highRisk, icon: AlertTriangle, color: "red" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className={`w-9 h-9 rounded-xl bg-${color}-600/20 flex items-center justify-center mb-3`}>
              <Icon size={16} className={`text-${color}-400`} />
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-slate-400 text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 bg-slate-900 border border-slate-800 rounded-xl p-1 w-fit">
        {[
          { key: "all", label: "All", count: stats.total },
          { key: "flagged", label: "Flagged", count: stats.flagged },
          { key: "invalidated", label: "Invalidated", count: stats.invalidated },
          { key: "valid", label: "Valid", count: (votes?.length || 0) - stats.flagged - stats.invalidated },
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setFilter(key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === key ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      {/* Votes List and Details */}
      <div className="grid grid-cols-5 gap-6">
        {/* List */}
        <div className="col-span-3 space-y-3">
          {filteredVotes.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
              <Shield size={48} className="text-slate-600 mx-auto mb-4" />
              <h3 className="text-white text-lg font-semibold mb-2">No votes found</h3>
              <p className="text-slate-400">
                {filter === "all" 
                  ? "No suspicious votes detected" 
                  : `No ${filter} votes found`}
              </p>
            </div>
          ) : (
            filteredVotes.map((vote) => {
              const risk = getRiskColor(vote.risk_score);
              
              return (
                <div
                  key={vote.id}
                  onClick={() => setSelectedVote(vote)}
                  className={`bg-slate-900 border rounded-2xl p-4 cursor-pointer transition-all ${
                    selectedVote?.id === vote.id
                      ? "border-indigo-500 ring-2 ring-indigo-500/20"
                      : "border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${risk.bg} flex items-center justify-center`}>
                        <AlertTriangle size={18} className={risk.text} />
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{vote.username}</p>
                        <p className="text-slate-500 text-xs">ID: {vote.receipt_id}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${risk.bg} ${risk.text} ${risk.border}`}>
                        Risk: {vote.risk_score}
                      </span>
                      {!vote.is_valid && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                          Invalidated
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div>
                      <p className="text-slate-500 mb-1">Candidate</p>
                      <p className="text-white font-medium">{vote.candidate_name}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 mb-1">Time</p>
                      <p className="text-white font-medium">
                        {new Date(vote.timestamp).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 mb-1">IP Address</p>
                      <p className="text-white font-medium font-mono">{vote.ip_address || "N/A"}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Detail Panel */}
        <div className="col-span-2">
          {selectedVote ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sticky top-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-white font-semibold">Vote Details</h3>
                <span className="text-slate-500 text-xs">{selectedVote.receipt_id}</span>
              </div>

              {(() => {
                const risk = getRiskColor(selectedVote.risk_score);
                
                return (
                  <div className="space-y-4">
                    {/* Risk Badge */}
                    <div className={`${risk.bg} ${risk.border} border rounded-xl p-4 flex items-center gap-3`}>
                      <AlertTriangle size={20} className={risk.text} />
                      <div>
                        <p className={`${risk.text} font-semibold`}>{risk.label}</p>
                        <p className="text-slate-400 text-xs">Risk Score: {selectedVote.risk_score}/10</p>
                      </div>
                    </div>

                    {/* Vote Info */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Voter</span>
                        <span className="text-white font-medium">{selectedVote.username}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Candidate</span>
                        <span className="text-white font-medium">{selectedVote.candidate_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Timestamp</span>
                        <span className="text-white font-medium">
                          {new Date(selectedVote.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">IP Address</span>
                        <span className="text-white font-medium font-mono">{selectedVote.ip_address || "N/A"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Device ID</span>
                        <span className="text-white font-medium font-mono text-xs">
                          {selectedVote.device_id ? `${selectedVote.device_id.slice(0, 12)}...` : "N/A"}
                        </span>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="bg-slate-800/50 rounded-xl p-3">
                      <p className="text-slate-400 text-xs mb-2">Current Status</p>
                      <div className="flex items-center gap-2">
                        {selectedVote.is_valid ? (
                          <CheckCircle2 size={14} className="text-emerald-400" />
                        ) : (
                          <XCircle size={14} className="text-red-400" />
                        )}
                        <span className={selectedVote.is_valid ? "text-emerald-400" : "text-red-400"}>
                          {selectedVote.is_valid ? "Valid Vote" : "Invalidated"}
                        </span>
                      </div>
                      {selectedVote.is_suspicious && selectedVote.is_valid && (
                        <div className="flex items-center gap-2 mt-2">
                          <AlertTriangle size={14} className="text-amber-400" />
                          <span className="text-amber-400 text-xs">Flagged as suspicious</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="pt-4 border-t border-slate-800 space-y-3">
                      {selectedVote.is_valid && selectedVote.is_suspicious && (
                        <button
                          onClick={() => handleVoteAction(selectedVote.id, "clear_flag")}
                          disabled={actionLoading === selectedVote.id}
                          className="w-full flex items-center justify-center gap-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 rounded-xl py-2.5 text-sm font-medium transition-all disabled:opacity-50"
                        >
                          {actionLoading === selectedVote.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <CheckCircle2 size={16} />
                          )}
                          Clear Suspicious Flag
                        </button>
                      )}
                      
                      {selectedVote.is_valid && (
                        <button
                          onClick={() => handleVoteAction(selectedVote.id, "invalidate")}
                          disabled={actionLoading === selectedVote.id}
                          className="w-full flex items-center justify-center gap-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 rounded-xl py-2.5 text-sm font-medium transition-all disabled:opacity-50"
                        >
                          {actionLoading === selectedVote.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Ban size={16} />
                          )}
                          Invalidate Vote
                        </button>
                      )}
                      
                      {!selectedVote.is_valid && (
                        <button
                          onClick={() => handleVoteAction(selectedVote.id, "revalidate")}
                          disabled={actionLoading === selectedVote.id}
                          className="w-full flex items-center justify-center gap-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-400 rounded-xl py-2.5 text-sm font-medium transition-all disabled:opacity-50"
                        >
                          {actionLoading === selectedVote.id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <RotateCcw size={16} />
                          )}
                          Revalidate Vote
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
                <Eye size={24} className="text-slate-600" />
              </div>
              <p className="text-slate-400 text-sm">Select a vote to view details and take action</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
