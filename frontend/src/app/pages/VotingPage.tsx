import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  CheckCircle2,
  Lock,
  Shield,
  AlertCircle,
  ChevronRight,
  Eye,
  EyeOff,
  Fingerprint,
  Star,
  Loader2,
} from "lucide-react";
import apiClient from "../../api-client.js";

interface Candidate {
  id: number;
  name: string;
  bio?: string;
  position?: string;
  manifesto?: string;
  photo_url?: string;
  vote_count?: number;
  approved: boolean;
}

type Step = "select" | "confirm" | "auth" | "success";

// Device fingerprint helper
function getDeviceInfo() {
  return {
    user_agent: navigator.userAgent,
    screen_resolution: `${window.screen.width}x${window.screen.height}`,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

export function VotingPage() {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const [step, setStep] = useState<Step>("select");
  const [showPass, setShowPass] = useState(false);
  const [password, setPassword] = useState("");
  const [voting, setVoting] = useState(false);
  const [voteResult, setVoteResult] = useState<any>(null);
  const [hasVoted, setHasVoted] = useState(false);

  // Get current user from localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Fetch candidates on mount
  useEffect(() => {
    fetchCandidates();
    checkVotingStatus();
  }, []);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/candidates/');
      // Filter only approved candidates
      const approvedCandidates = response.candidates?.filter((c: Candidate) => c.approved) || [];
      setCandidates(approvedCandidates);
    } catch (err: any) {
      setError(err.message || 'Failed to load candidates');
      console.error('Error fetching candidates:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkVotingStatus = async () => {
    try {
      const response = await apiClient.get('/auth/me');
      if (response.has_voted) {
        setHasVoted(true);
      }
    } catch (err) {
      console.error('Error checking voting status:', err);
    }
  };

  const handleVote = async () => {
    if (!selected || !password.trim()) {
      setError("Please enter your password to confirm your vote.");
      return;
    }

    try {
      setVoting(true);
      setError("");

      const voteData = {
        candidate_id: selected,
        password: password,
        device_info: getDeviceInfo(),
      };

      console.log('🗳️ Submitting vote:', voteData);
      const response = await apiClient.post('/vote/', voteData);
      console.log('✅ Vote response:', response);
      
      setVoteResult(response);
      setHasVoted(true);
      setStep("success");
      
      // Update local user state
      const updatedUser = { ...user, has_voted: true };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
    } catch (err: any) {
      console.error('❌ Vote failed:', err);
      if (err.message?.includes('already voted')) {
        setError("You have already voted in this election.");
        setHasVoted(true);
      } else if (err.message?.includes('password') || err.status === 401) {
        setError("Incorrect password. Please try again.");
      } else {
        setError(err.message || 'Failed to submit vote. Please try again.');
      }
    } finally {
      setVoting(false);
    }
  };

  const selectedCandidate = candidates.find((c) => c.id === selected);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={40} className="text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading candidates...</p>
        </div>
      </div>
    );
  }

  // Already voted state
  if (hasVoted && step !== "success") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-amber-600/20 border-2 border-amber-500/40 flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={36} className="text-amber-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Already Voted</h2>
          <p className="text-slate-400 mb-6">
            You have already cast your vote in this election. Each voter can only vote once.
          </p>
          <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-xl p-4 text-indigo-300 text-sm mb-6">
            <Shield size={16} className="inline mr-2" />
            Your vote has been securely recorded and cannot be changed.
          </div>
          <button
            onClick={() => navigate('/voter/dashboard')}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl px-8 py-3 text-sm transition-all"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Success state
  if (step === "success") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-600/20 border-2 border-emerald-500/40 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={36} className="text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Vote Cast Successfully!</h2>
          <p className="text-slate-400 mb-6">
            Your vote for <span className="text-white font-medium">{selectedCandidate?.name}</span> has been securely recorded and verified.
          </p>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-left mb-6 space-y-3">
            {[
              { label: "Vote ID", value: voteResult?.vote_id || `#VT-${Date.now()}` },
              { label: "Timestamp", value: new Date().toLocaleString() },
              { label: "Risk Score", value: `${voteResult?.risk_score || 0} — ${voteResult?.is_suspicious ? 'Flagged' : 'Normal'} ✓` },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between">
                <span className="text-slate-500 text-sm">{label}</span>
                <span className="text-white text-sm font-medium">{value}</span>
              </div>
            ))}
          </div>
          <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-xl p-4 text-indigo-300 text-sm">
            <Shield size={16} className="inline mr-2" />
            You cannot vote again in this election. Your participation is valued!
          </div>
          <button
            onClick={() => navigate('/voter/dashboard')}
            className="mt-5 text-slate-400 text-sm hover:text-white transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // No candidates state
  if (candidates.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <AlertCircle size={48} className="text-slate-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">No Candidates Available</h2>
          <p className="text-slate-400 mb-6">
            There are no approved candidates to vote for at this time.
          </p>
          <button
            onClick={() => navigate('/voter/dashboard')}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl px-8 py-3 text-sm transition-all"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">
          <span>Voter Portal</span>
          <ChevronRight size={14} />
          <span className="text-slate-300">Cast Vote</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Cast Your Vote</h1>
        <p className="text-slate-400 text-sm mt-1">Community Election · One vote per registered voter</p>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 flex items-center gap-3 mb-6">
          <AlertCircle size={16} className="text-red-400 shrink-0" />
          <p className="text-red-300 text-sm">{error}</p>
          <button onClick={() => setError("")} className="ml-auto text-red-400 hover:text-red-300">×</button>
        </div>
      )}

      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-8 max-w-lg">
        {[
          { label: "Select Candidate", key: "select" },
          { label: "Review & Confirm", key: "confirm" },
          { label: "Authenticate", key: "auth" },
        ].map((s, i) => {
          const steps: Step[] = ["select", "confirm", "auth"];
          const currentIdx = steps.indexOf(step);
          const isActive = steps.indexOf(s.key as Step) === currentIdx;
          const isDone = steps.indexOf(s.key as Step) < currentIdx;
          return (
            <div key={s.key} className="flex items-center flex-1">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                  isDone ? "bg-emerald-600 border-emerald-600" :
                  isActive ? "bg-indigo-600 border-indigo-600" :
                  "bg-slate-900 border-slate-700"
                }`}>
                  {isDone ? <CheckCircle2 size={14} className="text-white" /> : (
                    <span className={isActive ? "text-white" : "text-slate-500"}>{i + 1}</span>
                  )}
                </div>
                <span className={`text-xs font-medium whitespace-nowrap ${
                  isActive ? "text-white" : isDone ? "text-emerald-400" : "text-slate-500"
                }`}>{s.label}</span>
              </div>
              {i < 2 && <div className="flex-1 h-px bg-slate-800 mx-3" />}
            </div>
          );
        })}
      </div>

      {/* Security info bar */}
      <div className="flex items-center gap-4 bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 mb-6">
        <div className="flex items-center gap-2 text-emerald-400 text-xs">
          <Fingerprint size={14} />
          Device tracking enabled
        </div>
        <div className="w-px h-4 bg-slate-700" />
        <div className="flex items-center gap-2 text-emerald-400 text-xs">
          <Shield size={14} />
          JWT authenticated
        </div>
        <div className="w-px h-4 bg-slate-700" />
        <div className="flex items-center gap-2 text-emerald-400 text-xs">
          <Lock size={14} />
          Fraud detection active
        </div>
      </div>

      {step === "select" && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {candidates.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelected(c.id)}
                className={`relative text-left rounded-2xl border-2 overflow-hidden transition-all ${
                  selected === c.id
                    ? "border-indigo-500 bg-indigo-600/10 shadow-lg shadow-indigo-600/10"
                    : "border-slate-800 bg-slate-900 hover:border-slate-600"
                }`}
              >
                {selected === c.id && (
                  <div className="absolute top-3 right-3 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center z-10">
                    <CheckCircle2 size={14} className="text-white" />
                  </div>
                )}
                {c.photo_url ? (
                  <img src={c.photo_url} alt={c.name} className="w-full h-40 object-cover object-top" />
                ) : (
                  <div className="w-full h-40 bg-slate-800 flex items-center justify-center">
                    <span className="text-4xl text-slate-600">{c.name.charAt(0)}</span>
                  </div>
                )}
                <div className="p-4">
                  <p className="text-white font-semibold text-lg">{c.name}</p>
                  <p className="text-indigo-400 text-xs mb-2">{c.position || 'Candidate'}</p>
                  <p className="text-slate-400 text-sm leading-relaxed line-clamp-2">
                    {c.bio || c.manifesto || "Candidate for community election"}
                  </p>
                </div>
              </button>
            ))}
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 flex items-center gap-3 mb-6">
            <AlertCircle size={16} className="text-amber-400 shrink-0" />
            <p className="text-amber-300 text-xs">
              Your vote is final and cannot be changed once submitted. You may only vote once in this election.
            </p>
          </div>

          <button
            disabled={!selected}
            onClick={() => setStep("confirm")}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl px-8 py-3 text-sm transition-all"
          >
            Continue to Review
          </button>
        </>
      )}

      {step === "confirm" && selectedCandidate && (
        <div className="max-w-xl">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden mb-5">
            <div className="bg-indigo-600/10 border-b border-indigo-500/20 px-5 py-3">
              <p className="text-indigo-300 text-sm font-medium">Please confirm your selection</p>
            </div>
            <div className="p-5 flex items-center gap-4">
              {selectedCandidate.photo_url ? (
                <img src={selectedCandidate.photo_url} alt={selectedCandidate.name} className="w-16 h-16 rounded-xl object-cover object-top" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-slate-800 flex items-center justify-center">
                  <span className="text-2xl text-slate-600">{selectedCandidate.name.charAt(0)}</span>
                </div>
              )}
              <div>
                <p className="text-white text-lg font-bold">{selectedCandidate.name}</p>
                <p className="text-slate-400 text-xs mt-1">Candidate ID: #{selectedCandidate.id}</p>
              </div>
            </div>
            <div className="px-5 pb-5 pt-0">
              <p className="text-indigo-400 text-xs mb-1">{selectedCandidate.position || 'Candidate'}</p>
              <p className="text-slate-400 text-sm leading-relaxed">
                {selectedCandidate.bio || selectedCandidate.manifesto || "Candidate for community election"}
              </p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-5 space-y-2">
            <p className="text-slate-300 text-sm font-medium mb-3">Vote Summary</p>
            {[
              { label: "Election", value: "Community Election" },
              { label: "Your Choice", value: selectedCandidate.name },
              { label: "Voter", value: user.email || user.username || "Current User" },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between">
                <span className="text-slate-500 text-xs">{label}</span>
                <span className="text-white text-xs font-medium">{value}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep("select")} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl py-3 text-sm font-medium transition-all">
              Change Selection
            </button>
            <button onClick={() => setStep("auth")} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 text-sm font-medium transition-all">
              Proceed to Authentication
            </button>
          </div>
        </div>
      )}

      {step === "auth" && selectedCandidate && (
        <div className="max-w-md">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center">
                <Lock size={18} className="text-indigo-400" />
              </div>
              <div>
                <p className="text-white font-semibold">Re-Authentication Required</p>
                <p className="text-slate-400 text-xs">Confirm your identity before casting vote</p>
              </div>
            </div>

            <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-xl p-3 mb-5 flex items-center gap-3">
              {selectedCandidate.photo_url ? (
                <img src={selectedCandidate.photo_url} alt={selectedCandidate.name} className="w-10 h-10 rounded-lg object-cover object-top" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                  <span className="text-xl text-slate-600">{selectedCandidate.name.charAt(0)}</span>
                </div>
              )}
              <div>
                <p className="text-slate-300 text-xs">Voting for</p>
                <p className="text-white text-sm font-semibold">{selectedCandidate.name}</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="text-slate-400 text-xs font-medium mb-1.5 block">Your Password *</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Enter your account password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-11 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <p className="text-slate-500 text-xs mt-1.5">This confirms it's really you and prevents unauthorized voting.</p>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-3 mb-5 space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-slate-400">
                <Fingerprint size={12} className="text-indigo-400" />
                Device fingerprint: <span className="text-slate-300">{getDeviceInfo().user_agent.substring(0, 20)}...</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Shield size={12} className="text-emerald-400" />
                Timezone: {getDeviceInfo().timezone}
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setStep("confirm")} 
                disabled={voting}
                className="flex-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 rounded-xl py-3 text-sm font-medium transition-all"
              >
                Back
              </button>
              <button
                onClick={handleVote}
                disabled={voting || !password.trim()}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl py-3 text-sm font-medium transition-all flex items-center justify-center gap-2"
              >
                {voting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Vote"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
