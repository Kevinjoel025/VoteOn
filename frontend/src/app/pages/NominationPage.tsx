import { useState, useEffect } from "react";
import { Award, CheckCircle2, Clock, XCircle, AlertCircle, ChevronRight, X, Loader2 } from "lucide-react";
import apiClient from "../../api-client.js";

const NOMINATION_TERMS = [
  "I am a registered voter and have been for at least 6 months",
  "I have no criminal convictions in the past 5 years",
  "I understand that all information provided will be verified",
  "I consent to a background check being performed",
  "I will conduct myself with integrity throughout the election process",
  "I will not engage in vote-buying, intimidation, or other electoral fraud",
  "I accept that false information may result in disqualification and legal action",
  "I understand that nomination approval is at the admin's discretion",
  "I will respect the election results regardless of the outcome",
  "I agree to abide by all community election rules and regulations"
];

const REQUIREMENTS = [
  "Must be a registered voter for at least 6 months",
  "No criminal record in the past 5 years",
  "Provide at least 2 endorsements from community members",
  "Submit a comprehensive bio (minimum 50 characters)",
  "Submit a detailed manifesto (minimum 100 characters)"
];

interface NominationData {
  position: string;
  bio: string;
  manifesto: string;
  endorser_ids: number[];
  documents: string[];
}

interface ExistingNomination {
  id: number;
  position: string;
  status: string;
  created_at: string;
  admin_notes?: string;
}

export function NominationPage() {
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [existingNomination, setExistingNomination] = useState<ExistingNomination | null>(null);
  const [error, setError] = useState("");
  const [showTerms, setShowTerms] = useState(false);
  const [formData, setFormData] = useState<NominationData>({
    position: "",
    bio: "",
    manifesto: "",
    endorser_ids: [],
    documents: []
  });
  const [agreed, setAgreed] = useState(false);
  const [nominationId, setNominationId] = useState<number | null>(null);

  // Check if user already has a nomination on mount
  useEffect(() => {
    const checkExistingNomination = async () => {
      try {
        const response = await apiClient.get("/nominations/my-nomination");
        if (response.has_applied && response.nomination) {
          setExistingNomination(response.nomination);
        }
      } catch (err) {
        // No nomination found, show form normally
      } finally {
        setCheckingStatus(false);
      }
    };
    checkExistingNomination();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError("");
  };

  const validateForm = () => {
    if (!formData.position.trim()) {
      return "Please select a position";
    }
    if (formData.bio.length < 50) {
      return "Bio must be at least 50 characters";
    }
    if (formData.manifesto.length < 100) {
      return "Manifesto must be at least 100 characters";
    }
    if (!agreed) {
      return "You must agree to the nomination terms";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await apiClient.post("/nominations/apply", formData);
      setNominationId(response.id);
      setSubmitted(true);
    } catch (err: any) {
      console.error("❌ Nomination submission failed:", err);
      if (err.status === 400) {
        if (err.message?.includes("already have a nomination")) {
          setError("You already have a pending nomination application. Please wait for admin review.");
        } else {
          setError(err.message || "Invalid nomination data");
        }
      } else if (err.status === 401) {
        setError("Please login to submit a nomination");
      } else {
        setError("Failed to submit nomination. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Loading status check
  if (checkingStatus) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 size={20} className="animate-spin" />
          Checking nomination status...
        </div>
      </div>
    );
  }

  // Already applied — show status screen
  if (existingNomination) {
    const statusConfig = {
      pending: {
        icon: <Clock size={32} className="text-amber-400" />,
        bgClass: "bg-amber-600/20 border-amber-500/40",
        titleColor: "text-amber-300",
        label: "Under Review",
        description: "Your nomination is being reviewed by the admin. You'll be notified of the decision.",
      },
      approved: {
        icon: <CheckCircle2 size={32} className="text-emerald-400" />,
        bgClass: "bg-emerald-600/20 border-emerald-500/40",
        titleColor: "text-emerald-300",
        label: "Approved!",
        description: "Congratulations! Your nomination has been approved. You are now an active candidate.",
      },
      rejected: {
        icon: <XCircle size={32} className="text-red-400" />,
        bgClass: "bg-red-600/20 border-red-500/40",
        titleColor: "text-red-300",
        label: "Not Approved",
        description: "Your nomination was not approved this time. Please contact the admin for more details.",
      },
    };

    const config = statusConfig[existingNomination.status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className={`w-20 h-20 rounded-full border-2 flex items-center justify-center mx-auto mb-5 ${config.bgClass}`}>
            {config.icon}
          </div>
          <h2 className={`text-2xl font-bold mb-2 ${config.titleColor}`}>Nomination {config.label}</h2>
          <p className="text-slate-400 mb-6">{config.description}</p>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-left space-y-3 mb-6">
            {[
              { label: "Application ID", value: `#${existingNomination.id}` },
              { label: "Position", value: existingNomination.position },
              { label: "Applied On", value: new Date(existingNomination.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) },
              { label: "Status", value: existingNomination.status.charAt(0).toUpperCase() + existingNomination.status.slice(1) },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between">
                <span className="text-slate-500 text-sm">{label}</span>
                <span className={`text-sm font-medium ${
                  label === "Status"
                    ? existingNomination.status === "approved" ? "text-emerald-400"
                    : existingNomination.status === "rejected" ? "text-red-400"
                    : "text-amber-400"
                    : "text-white"
                }`}>{value}</span>
              </div>
            ))}

            {existingNomination.admin_notes && (
              <div className="pt-3 border-t border-slate-800">
                <p className="text-slate-500 text-xs mb-1">Admin Notes</p>
                <p className="text-slate-300 text-sm">{existingNomination.admin_notes}</p>
              </div>
            )}
          </div>

          <button
            onClick={() => window.location.href = "/voter/dashboard"}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }



  // Success screen after submission
  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-indigo-600/20 border-2 border-indigo-500/40 flex items-center justify-center mx-auto mb-5">
            <Clock size={28} className="text-indigo-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Application Submitted!</h2>
          <p className="text-slate-400 mb-6">
            Your nomination for <span className="text-white font-medium">{formData.position}</span> has been submitted and is pending admin review.
          </p>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-left space-y-3 mb-6">
            {[
              { label: "Application ID", value: `#${nominationId || 'PENDING'}` },
              { label: "Submitted", value: new Date().toLocaleString() },
              { label: "Position", value: formData.position },
              { label: "Status", value: "Pending Review" },
              { label: "Expected Decision", value: "Within 3 business days" },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between">
                <span className="text-slate-500 text-sm">{label}</span>
                <span className={`text-sm font-medium ${label === "Status" ? "text-amber-400" : "text-white"}`}>{value}</span>
              </div>
            ))}
          </div>
          <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-xl p-4 text-indigo-300 text-sm text-left">
            <p className="font-medium mb-1">What happens next?</p>
            <ol className="space-y-1 text-xs text-indigo-300/80 list-decimal list-inside">
              <li>Admin reviews your bio and manifesto</li>
              <li>Background check is performed</li>
              <li>You'll be notified of the decision</li>
              <li>If approved, you'll appear as a candidate</li>
            </ol>
          </div>
          <button 
            onClick={() => window.location.href = "/voter/dashboard"} 
            className="mt-5 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      {/* Terms Modal */}
      {showTerms && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h3 className="text-xl font-bold text-white">Nomination Terms & Conditions</h3>
              <button 
                onClick={() => setShowTerms(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <p className="text-slate-400 text-sm mb-4">
                By submitting your nomination application, you agree to the following terms:
              </p>
              <div className="space-y-3">
                {NOMINATION_TERMS.map((term, index) => (
                  <div key={index} className="flex items-start gap-3 text-sm">
                    <div className="w-6 h-6 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-indigo-400 text-xs font-bold">{index + 1}</span>
                    </div>
                    <p className="text-slate-300">{term}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <p className="text-amber-300 text-sm font-medium mb-2">⚠️ Important Notice</p>
                <p className="text-amber-300/80 text-xs leading-relaxed">
                  Violation of any of these terms may result in immediate disqualification, 
                  removal from the ballot, and potential legal action. All applications are 
                  subject to verification and background checks.
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-slate-800 flex gap-3">
              <button
                onClick={() => setShowTerms(false)}
                className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setAgreed(true);
                  setShowTerms(false);
                }}
                className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors"
              >
                I Agree to Terms
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-slate-500 text-sm mb-2">
          <span>Voter Portal</span>
          <ChevronRight size={14} />
          <span className="text-slate-300">Nomination</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Apply for Nomination</h1>
        <p className="text-slate-400 text-sm mt-1">Stand as a candidate in the 2026 Community General Election</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 space-y-5">
          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 flex items-center gap-3">
              <AlertCircle size={16} className="text-red-400" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Position Selection */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold">1</div>
                Position Selection
              </h3>
              <div>
                <label className="block text-slate-300 text-sm mb-2 font-medium">
                  Select Position to Contest
                </label>
                <select
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                >
                  <option value="">Choose a position...</option>
                  <option value="Community President">Community President</option>
                  <option value="Vice President">Vice President</option>
                  <option value="Secretary">Secretary</option>
                  <option value="Treasurer">Treasurer</option>
                  <option value="Board Member">Board Member</option>
                </select>
              </div>
            </div>

            {/* Biography */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold">2</div>
                Your Biography
              </h3>
              <div>
                <label className="block text-slate-300 text-sm mb-2 font-medium">
                  Tell us about yourself (minimum 50 characters)
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Describe your background, experience, and why you're qualified for this position..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                  required
                />
                <p className="text-slate-500 text-xs mt-1.5">
                  {formData.bio.length} / 50 minimum characters
                </p>
              </div>
            </div>

            {/* Manifesto */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold">3</div>
                Election Manifesto
              </h3>
              <div>
                <label className="block text-slate-300 text-sm mb-2 font-medium">
                  What will you do if elected? (minimum 100 characters)
                </label>
                <textarea
                  name="manifesto"
                  value={formData.manifesto}
                  onChange={handleInputChange}
                  rows={6}
                  placeholder="Outline your vision, goals, and specific actions you plan to take if elected. What problems will you solve? What improvements will you make?"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                  required
                />
                <p className="text-slate-500 text-xs mt-1.5">
                  {formData.manifesto.length} / 100 minimum characters
                </p>
              </div>
            </div>

            {/* Terms Agreement */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold">4</div>
                Terms & Agreement
              </h3>
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0"
                />
                <div className="flex-1">
                  <p className="text-slate-300 text-sm">
                    I have read and agree to the{" "}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowTerms(true);
                      }}
                      className="text-indigo-400 hover:text-indigo-300 underline font-medium"
                    >
                      nomination terms and conditions
                    </button>
                  </p>
                  <p className="text-slate-500 text-xs mt-1">
                    Click the link above to view all terms before agreeing
                  </p>
                </div>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !agreed}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-3.5 text-sm transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Submitting Application...
                </>
              ) : (
                <>
                  <Award size={16} />
                  Submit Nomination Application
                </>
              )}
            </button>
          </form>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Requirements */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-indigo-400" />
              Requirements
            </h3>
            <ul className="space-y-2">
              {REQUIREMENTS.map((req, i) => (
                <li key={i} className="flex items-start gap-2 text-slate-400 text-xs">
                  <div className="w-1 h-1 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Process Timeline */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Clock size={16} className="text-indigo-400" />
              Review Process
            </h3>
            <div className="space-y-3">
              {[
                { step: "Submit Application", time: "Now" },
                { step: "Admin Review", time: "1-2 days" },
                { step: "Background Check", time: "1 day" },
                { step: "Decision", time: "3 days total" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 text-xs font-bold">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-xs font-medium">{item.step}</p>
                    <p className="text-slate-500 text-xs">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Help */}
          <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-2xl p-5">
            <h3 className="text-indigo-300 font-semibold mb-2 text-sm">Need Help?</h3>
            <p className="text-indigo-300/80 text-xs leading-relaxed">
              Questions about the nomination process? Contact the election committee at{" "}
              <span className="text-indigo-400 font-medium">elections@voteon.com</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
