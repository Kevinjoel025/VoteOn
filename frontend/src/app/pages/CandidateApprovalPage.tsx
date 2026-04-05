import { useState, useEffect } from "react";
import { CheckCircle2, XCircle, Clock, Eye, Trash2, ChevronRight, Search, Filter, AlertCircle, User, Award, Loader2 } from "lucide-react";
import apiClient from "../../api-client.js";

type NomStatus = "pending" | "approved" | "rejected";
type TabState = "nominations" | "candidates";

interface Nomination {
  id: number;
  user_id: number;
  username: string;
  email: string;
  position: string;
  bio: string;
  manifesto: string;
  documents: string[] | null;
  endorsers: number[] | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

interface Candidate {
  id: number;
  name: string;
  position: string;
  bio: string;
  manifesto: string;
  photo_url: string | null;
  vote_count: number;
  approved: boolean;
}

export function CandidateApprovalPage() {
  const [activeTab, setActiveTab] = useState<TabState>("nominations");
  const [nominations, setNominations] = useState<Nomination[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [selectedNom, setSelectedNom] = useState<Nomination | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<NomStatus | "all">("all");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [nomRes, candRes] = await Promise.all([
        apiClient.get("/admin/nominations/pending").catch(() => []),
        apiClient.get("/candidates/").catch(() => ({ candidates: [] }))
      ]);
      setNominations(Array.isArray(nomRes) ? nomRes : []);
      setCandidates(candRes?.candidates || []);
      setError("");
    } catch (err) {
      console.error("❌ Error fetching data:", err);
      setError("Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  const handleNominationAction = async (nominationId: number, action: "approve" | "reject") => {
    try {
      setActionLoading(nominationId);
      await apiClient.post(`/admin/nominations/${nominationId}/action`, {
        action,
        admin_notes: adminNotes || undefined
      });
      setNominations(prev => prev.filter(nom => nom.id !== nominationId));
      setSelectedNom(null);
      setAdminNotes("");
      // Refresh candidates list in case we approved one
      const candRes = await apiClient.get("/candidates/").catch(() => ({ candidates: [] }));
      setCandidates(candRes?.candidates || []);
      console.log(`✅ Nomination ${action}ed successfully`);
    } catch (err) {
      console.error(`❌ Error ${action}ing nomination:`, err);
      setError(`Failed to ${action} nomination. Please try again.`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveCandidate = async (candidateId: number) => {
    if (!window.confirm("Are you sure you want to remove this active candidate? All their votes will be invalidated!")) return;
    try {
      setActionLoading(candidateId);
      await apiClient.delete(`/admin/candidates/${candidateId}`);
      setCandidates(prev => prev.filter(c => c.id !== candidateId));
      setSelectedCandidate(null);
      console.log(`✅ Candidate removed successfully`);
    } catch (err) {
      console.error(`❌ Error removing candidate:`, err);
      setError(`Failed to remove candidate. Please try again.`);
    } finally {
      setActionLoading(null);
    }
  };

  // Filter nominations
  const filteredNominations = nominations?.filter(nom => {
    const matchesSearch = nom.username.toLowerCase().includes(search.toLowerCase()) ||
                         nom.email.toLowerCase().includes(search.toLowerCase()) ||
                         nom.position.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || nom.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  // Filter candidates
  const filteredCandidates = candidates?.filter(cand => {
    const matchesSearch = cand.name.toLowerCase().includes(search.toLowerCase()) ||
                          cand.position.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  }) || [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock size={14} className="text-amber-400" />;
      case "approved": return <CheckCircle2 size={14} className="text-emerald-400" />;
      case "rejected": return <XCircle size={14} className="text-red-400" />;
      default: return <AlertCircle size={14} className="text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "text-amber-400 bg-amber-500/10 border-amber-500/20";
      case "approved": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "rejected": return "text-red-400 bg-red-500/10 border-red-500/20";
      default: return "text-slate-400 bg-slate-500/10 border-slate-500/20";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 size={20} className="animate-spin" />
          Loading data...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Candidate Management</h1>
        <p className="text-slate-400 text-sm mt-1">Review pending applications and manage active candidates</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-6 flex items-center gap-3">
          <AlertCircle size={16} className="text-red-400" />
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-900 border border-slate-800 rounded-xl p-1 mb-6 w-fit">
        <button
          onClick={() => { setActiveTab("nominations"); setSelectedCandidate(null); }}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === "nominations"
              ? "bg-indigo-600 text-white shadow-md"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          }`}
        >
          <Clock size={16} />
          Pending Nominations
          {nominations.length > 0 && (
            <span className="ml-1.5 bg-amber-500 text-slate-900 px-1.5 py-0.5 rounded-full text-xs font-bold">
              {nominations.length}
            </span>
          )}
        </button>
        <button
          onClick={() => { setActiveTab("candidates"); setSelectedNom(null); }}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === "candidates"
              ? "bg-indigo-600 text-white shadow-md"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          }`}
        >
          <Award size={16} />
          Active Candidates
        </button>
      </div>

      {/* Filters (only show status filter for nominations) */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>
        
        {activeTab === "nominations" && (
          <div className="relative">
            <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as NomStatus | "all")}
              className="bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-8 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 appearance-none"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        )}
      </div>

      {/* Active Tab Content */}
      {activeTab === "nominations" ? (
        filteredNominations.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
            <User size={48} className="text-slate-600 mx-auto mb-4" />
            <h3 className="text-white text-lg font-semibold mb-2">No nominations found</h3>
            <p className="text-slate-400">
              {search ? "Try adjusting your search criteria" : "No pending nominations at this time"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Nominations List */}
            <div className="space-y-4">
              {filteredNominations.map((nomination) => (
                <div
                  key={nomination.id}
                  className={`bg-slate-900 border border-slate-800 rounded-2xl p-5 cursor-pointer transition-all ${
                    selectedNom?.id === nomination.id ? "ring-2 ring-indigo-500 border-indigo-500" : "hover:border-slate-700"
                  }`}
                  onClick={() => setSelectedNom(nomination)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-white font-semibold text-sm">{nomination.username}</h3>
                      <p className="text-slate-400 text-xs">{nomination.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(nomination.status)}`}>
                        {getStatusIcon(nomination.status)}
                        {nomination.status}
                      </span>
                      <ChevronRight size={14} className="text-slate-500" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-slate-300 text-sm">
                      <span className="text-slate-500">Position:</span> {nomination.position}
                    </p>
                    <p className="text-slate-400 text-xs line-clamp-2">{nomination.manifesto}</p>
                    <p className="text-slate-500 text-xs">Applied: {formatDate(nomination.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Nomination Detail Panel */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-fit">
              {selectedNom ? (
                <>
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-white">{selectedNom.username}</h2>
                      <p className="text-slate-400">{selectedNom.email}</p>
                    </div>
                    <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${getStatusColor(selectedNom.status)}`}>
                      {getStatusIcon(selectedNom.status)}
                      {selectedNom.status}
                    </span>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="text-slate-400 text-sm font-medium block mb-2">Position Applied For</label>
                      <p className="text-white">{selectedNom.position}</p>
                    </div>
                    <div>
                      <label className="text-slate-400 text-sm font-medium block mb-2">Biography</label>
                      <p className="text-slate-300 text-sm leading-relaxed">{selectedNom.bio}</p>
                    </div>
                    <div>
                      <label className="text-slate-400 text-sm font-medium block mb-2">Manifesto</label>
                      <p className="text-slate-300 text-sm leading-relaxed">{selectedNom.manifesto}</p>
                    </div>
                    {selectedNom.status === "pending" && (
                      <>
                        <div>
                          <label className="text-slate-400 text-sm font-medium block mb-2">Admin Notes (Optional)</label>
                          <textarea
                            value={adminNotes}
                            onChange={(e) => setAdminNotes(e.target.value)}
                            placeholder="Add notes for this decision..."
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm resize-none focus:outline-none focus:border-indigo-500"
                            rows={3}
                          />
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-slate-800">
                          <button
                            onClick={() => handleNominationAction(selectedNom.id, "approve")}
                            disabled={actionLoading === selectedNom.id}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 text-white px-4 py-3 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2"
                          >
                            {actionLoading === selectedNom.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                            Approve
                          </button>
                          <button
                            onClick={() => handleNominationAction(selectedNom.id, "reject")}
                            disabled={actionLoading === selectedNom.id}
                            className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white px-4 py-3 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2"
                          >
                            {actionLoading === selectedNom.id ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                            Reject
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <Eye size={48} className="text-slate-600 mx-auto mb-4" />
                  <h3 className="text-white text-lg font-semibold mb-2">Select a Nomination</h3>
                  <p className="text-slate-400">Click on a nomination to view details and take action</p>
                </div>
              )}
            </div>
          </div>
        )
      ) : (
        /* Candidates Tab */
        filteredCandidates.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
            <Award size={48} className="text-slate-600 mx-auto mb-4" />
            <h3 className="text-white text-lg font-semibold mb-2">No active candidates</h3>
            <p className="text-slate-400">Approve nominations to see them listed here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Candidates List */}
            <div className="space-y-4">
              {filteredCandidates.map((candidate) => (
                <div
                  key={candidate.id}
                  className={`bg-slate-900 border border-slate-800 rounded-2xl p-5 cursor-pointer transition-all ${
                    selectedCandidate?.id === candidate.id ? "ring-2 ring-indigo-500 border-indigo-500" : "hover:border-slate-700"
                  }`}
                  onClick={() => setSelectedCandidate(candidate)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {candidate.photo_url ? (
                        <img src={candidate.photo_url} alt={candidate.name} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-semibold text-white">
                          {candidate.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h3 className="text-white font-semibold text-sm">{candidate.name}</h3>
                        <p className="text-emerald-400 text-xs mt-0.5">Approved Candidate</p>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-slate-500" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-slate-300 text-sm">
                      <span className="text-slate-500">Position:</span> {candidate.position}
                    </p>
                    <p className="text-slate-400 text-xs">Votes Received: {candidate.vote_count}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Candidate Detail Panel */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-fit">
              {selectedCandidate ? (
                <>
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      {selectedCandidate.photo_url ? (
                        <img src={selectedCandidate.photo_url} alt={selectedCandidate.name} className="w-14 h-14 rounded-xl object-cover" />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-white text-xl">
                          {selectedCandidate.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h2 className="text-xl font-bold text-white">{selectedCandidate.name}</h2>
                        <span className="inline-flex mt-1 items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border text-emerald-400 bg-emerald-500/10 border-emerald-500/20">
                          <CheckCircle2 size={12} /> Active Candidate
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="text-slate-400 text-sm font-medium block mb-2">Position</label>
                      <p className="text-white">{selectedCandidate.position}</p>
                    </div>
                    <div>
                      <label className="text-slate-400 text-sm font-medium block mb-2">Biography</label>
                      <p className="text-slate-300 text-sm leading-relaxed">{selectedCandidate.bio}</p>
                    </div>
                    <div>
                      <label className="text-slate-400 text-sm font-medium block mb-2">Manifesto</label>
                      <p className="text-slate-300 text-sm leading-relaxed">{selectedCandidate.manifesto}</p>
                    </div>
                    <div>
                      <label className="text-slate-400 text-sm font-medium block mb-2">Total Votes Generated</label>
                      <p className="text-white font-bold">{selectedCandidate.vote_count}</p>
                    </div>

                    <div className="pt-4 border-t border-slate-800">
                      <button
                        onClick={() => handleRemoveCandidate(selectedCandidate.id)}
                        disabled={actionLoading === selectedCandidate.id}
                        className="w-full bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-500/30 px-4 py-3 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2"
                      >
                        {actionLoading === selectedCandidate.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        Remove Candidate (Dangerous)
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <Eye size={48} className="text-slate-600 mx-auto mb-4" />
                  <h3 className="text-white text-lg font-semibold mb-2">Select a Candidate</h3>
                  <p className="text-slate-400">Click on a candidate to view details and take actions</p>
                </div>
              )}
            </div>
          </div>
        )
      )}
    </div>
  );
}
