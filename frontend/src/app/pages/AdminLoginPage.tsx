import { useState } from "react";
import { useNavigate } from "react-router";
import { Shield, Eye, EyeOff, Lock, Mail, AlertCircle } from "lucide-react";
import apiClient from "../../api-client.js";

export function AdminLoginPage() {
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({ email: false, password: false });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Reset field errors
    setFieldErrors({ email: false, password: false });
    setError("");
    
    // Basic validation
    if (!email.trim()) {
      setError("Please enter your admin email address.");
      setFieldErrors(prev => ({ ...prev, email: true }));
      return;
    }
    
    if (!password.trim()) {
      setError("Please enter your admin password.");
      setFieldErrors(prev => ({ ...prev, password: true }));
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      setFieldErrors(prev => ({ ...prev, email: true }));
      return;
    }
    
    setLoading(true);

    try {
      const response = await apiClient.login({ email, password });
      
      if (response.access_token) {
        // Verify user is actually an admin
        if (response.user.role !== "admin") {
          setError("Access denied. This portal is for administrators only. Please use the voter login.");
          setLoading(false);
          return;
        }
        
        // Store authentication data
        apiClient.setToken(response.access_token);
        localStorage.setItem('refreshToken', response.refresh_token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        // Redirect to admin dashboard
        setTimeout(() => {
          navigate("/admin/dashboard");
        }, 100);
      }
    } catch (err: any) {
      console.error("❌ Login failed:", err);
      
      if (err.response?.status === 401) {
        setError("Invalid email or password. Please try again.");
        setFieldErrors({ email: true, password: true });
      } else if (err.response?.status === 403) {
        setError("Access denied. Admin access only.");
      } else {
        setError("Login failed. Please check your connection and try again.");
      }
      
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Left Panel */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center">
              <Shield size={20} className="text-white" />
            </div>
            <span className="text-white text-xl font-bold">VoteOn Admin</span>
          </div>

          <div className="space-y-6 max-w-md">
            <div>
              <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-3 py-1.5 mb-4">
                <Shield size={14} className="text-amber-400" />
                <span className="text-amber-300 text-xs font-medium">Admin Portal</span>
              </div>
              <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
                Administrative<br />Control Panel
              </h1>
              <p className="text-slate-400 leading-relaxed">
                Secure access to election management, candidate approval, fraud monitoring, and comprehensive analytics. Your session will be logged for security.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Audit Trail", icon: "📋" },
                { label: "Enhanced Security", icon: "🔐" },
                { label: "Full Control", icon: "⚙️" },
              ].map((stat) => (
                <div key={stat.label} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 text-center">
                  <p className="text-2xl mb-1">{stat.icon}</p>
                  <p className="text-slate-400 text-xs">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            {["Session Logging", "Role Verification", "2FA Ready", "Activity Monitor"].map((f) => (
              <div
                key={f}
                className="bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-400 text-xs"
              >
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-slate-950">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6 lg:hidden">
              <div className="w-9 h-9 rounded-xl bg-amber-600 flex items-center justify-center">
                <Shield size={18} className="text-white" />
              </div>
              <span className="text-white text-lg font-bold">VoteOn Admin</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">Admin Login</h2>
            <p className="text-slate-400 text-sm">Authorized personnel only</p>
          </div>

          {/* Security Warning */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 mb-6 flex items-start gap-3">
            <Shield size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-300 text-xs font-medium mb-1">Security Notice</p>
              <p className="text-amber-300/80 text-xs leading-relaxed">
                Admin access requires proper authorization. All login attempts are logged and monitored for security purposes.
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-5 flex items-center gap-3">
              <AlertCircle size={16} className="text-red-400" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-slate-300 text-sm mb-2 font-medium">
                Admin Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setFieldErrors(prev => ({ ...prev, email: false }));
                    setError("");
                  }}
                  placeholder="admin@voteon.com"
                  required
                  className={`w-full bg-slate-900 border rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none transition-colors ${
                    fieldErrors.email 
                      ? 'border-red-500 focus:border-red-400' 
                      : 'border-slate-700 focus:border-amber-500'
                  }`}
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="password" className="block text-slate-300 text-sm mb-2 font-medium">
                Admin Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  id="password"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setFieldErrors(prev => ({ ...prev, password: false }));
                    setError("");
                  }}
                  placeholder="Enter your admin password"
                  required
                  className={`w-full bg-slate-900 border rounded-xl pl-10 pr-11 py-3 text-white text-sm placeholder-slate-500 focus:outline-none transition-colors ${
                    fieldErrors.password 
                      ? 'border-red-500 focus:border-red-400' 
                      : 'border-slate-700 focus:border-amber-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-3 text-sm transition-all shadow-lg shadow-amber-600/20"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Shield size={16} />
                  Sign In as Admin
                </div>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800">
            <p className="text-center text-slate-500 text-xs">
              Not an admin?{" "}
              <button 
                onClick={() => navigate("/")}
                className="text-indigo-400 hover:text-indigo-300 font-medium"
              >
                Go to Voter Login →
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
