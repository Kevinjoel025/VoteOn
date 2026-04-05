import { useState } from "react";
import { useNavigate } from "react-router";
import { Vote, Eye, EyeOff, Shield, Lock, Mail, Chrome, AlertCircle } from "lucide-react";
import apiClient from "../../api-client.js";
import API_CONFIG from "../../api-config.js";



export function LoginPage() {
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({ email: false, password: false });

  const handleGoogleLogin = () => {
    window.location.href = `${window.location.origin}/api/auth/google`;
  };


  const handleLogin = async (e: React.FormEvent) => {

    e.preventDefault();
    e.stopPropagation();
    
    console.log('🔄 handleLogin called');
    
    // Reset field errors
    setFieldErrors({ email: false, password: false });
    setError(""); // Clear previous errors immediately
    
    // Basic validation
    if (!email.trim()) {
      console.log('❌ Empty email');
      setError("Please enter your email address.");
      setFieldErrors(prev => ({ ...prev, email: true }));
      return;
    }
    
    if (!password.trim()) {
      console.log('❌ Empty password');
      setError("Please enter your password.");
      setFieldErrors(prev => ({ ...prev, password: true }));
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('❌ Invalid email format');
      setError("Please enter a valid email address.");
      setFieldErrors(prev => ({ ...prev, email: true }));
      return;
    }
    
    setLoading(true);
    console.log('🔄 Starting API call with:', { email, role: 'voter' });

    try {
      const response = await apiClient.login({ email, password });
      console.log('✅ API response:', response);
      
      if (response.access_token) {
        // Store authentication data
        apiClient.setToken(response.access_token);
        localStorage.setItem('refreshToken', response.refresh_token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        console.log('✅ Login successful, redirecting...');
        
        // Verify user is actually a voter
        if (response.user.role === "admin") {
          setError("Admin users must login through the admin portal.");
          setLoading(false);
          return;
        }
        
        // Small delay to ensure state updates are visible
        setTimeout(() => {
          navigate("/voter/dashboard");
        }, 500);
      }
    } catch (error: any) {
      console.error('❌ Login failed:', error);
      
      // Handle specific error cases with user-friendly messages
      let errorMessage = "Login failed. Please try again.";
      
      if (error.status === 401) {
        errorMessage = "Invalid email or password. Please check your credentials and try again.";
        // Highlight both fields for invalid credentials
        setFieldErrors({ email: true, password: true });
      } else if (error.status === 403) {
        errorMessage = "Account is disabled. Please contact support.";
      } else if (error.status === 429) {
        errorMessage = "Too many login attempts. Please wait a moment and try again.";
      } else if (error.message?.includes('Network error')) {
        errorMessage = "Connection error. Please check your internet connection.";
      } else if (error.data?.detail) {
        // Use server-provided error message
        errorMessage = error.data.detail;
        if (error.status === 401) {
          setFieldErrors({ email: true, password: true });
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      console.log('❌ Setting error message:', errorMessage);
      setError(errorMessage);
      
      // Keep loading state for longer so user can see the error clearly
      setTimeout(() => {
        setLoading(false);
      }, 2000); // 2 seconds delay
      
      return; // Explicitly return to prevent any further execution
    }
    
    // Only set loading to false on success after the delay
    setTimeout(() => {
      setLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Left Panel */}
      <div className="hidden lg:flex flex-col w-1/2 relative overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950">
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(rgba(99,102,241,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.3) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative flex flex-col justify-between h-full px-12 py-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
              <Vote size={20} className="text-white" />
            </div>
            <span className="text-white text-xl font-bold">VoteOn</span>
          </div>

          <div>
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 bg-indigo-600/20 border border-indigo-500/30 rounded-full px-4 py-1.5 mb-6">
                <Shield size={14} className="text-indigo-400" />
                <span className="text-indigo-300 text-xs font-medium">AI-Enhanced Security</span>
              </div>
              <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
                Secure Community<br />Voting Platform
              </h1>
              <p className="text-slate-400 leading-relaxed">
                A transparent, fraud-resistant voting system with behavioral analysis, device fingerprinting, and real-time monitoring to ensure every vote counts.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Secure Voting", icon: "🔒" },
                { label: "One Vote Per User", icon: "✓" },
                { label: "Fraud Detection", icon: "🛡️" },
              ].map((stat) => (
                <div key={stat.label} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 text-center">
                  <p className="text-2xl mb-1">{stat.icon}</p>
                  <p className="text-slate-400 text-xs">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            {["One Vote Per User", "JWT Protected", "Fraud Detection", "Device Tracking"].map((f) => (
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
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6 lg:hidden">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
                <Vote size={18} className="text-white" />
              </div>
              <span className="text-white text-lg font-bold">VoteOn</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">Voter Login</h2>
            <p className="text-slate-400 text-sm">Sign in to access your voting portal</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-5 flex items-center gap-3">
              <div className="w-2 h-2 bg-red-500 rounded-full shrink-0" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}
          
          {/* Form */}
          <form className="space-y-4" noValidate>
            <div>
              <label className="text-slate-400 text-xs font-medium mb-1.5 block">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    // Clear field error when user starts typing
                    if (fieldErrors.email) {
                      setFieldErrors(prev => ({ ...prev, email: false }));
                      setError("");
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleLogin(e as any);
                    }
                  }}
                  placeholder="Enter your email"
                  required
                  className={`w-full bg-slate-900 border rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none transition-colors ${
                    fieldErrors.email 
                      ? 'border-red-500 focus:border-red-400' 
                      : 'border-slate-700 focus:border-indigo-500'
                  }`}
                />
              </div>
            </div>
            <div>
              <label className="text-slate-400 text-xs font-medium mb-1.5 block">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    // Clear field error when user starts typing
                    if (fieldErrors.password) {
                      setFieldErrors(prev => ({ ...prev, password: false }));
                      setError("");
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleLogin(e as any);
                    }
                  }}
                  placeholder="Enter your password"
                  required
                  className={`w-full bg-slate-900 border rounded-xl pl-10 pr-11 py-3 text-white text-sm placeholder-slate-500 focus:outline-none transition-colors ${
                    fieldErrors.password 
                      ? 'border-red-500 focus:border-red-400' 
                      : 'border-slate-700 focus:border-indigo-500'
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
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-slate-400 text-xs cursor-pointer">
                <input type="checkbox" className="rounded" defaultChecked />
                Remember me
              </label>
              <button type="button" className="text-indigo-400 text-xs hover:text-indigo-300">Forgot password?</button>
            </div>
          
            <button
              type="button"
              disabled={loading}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleLogin(e as any);
              }}
              className="w-full mt-6 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-3 text-sm transition-all shadow-lg shadow-indigo-600/20"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Signing in...
                </div>
              ) : (
                "Sign In as Voter"
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800">
            <p className="text-center text-slate-500 text-xs">
              New voter?{" "}
              <button 
                onClick={() => navigate("/register")}
                className="text-indigo-400 hover:text-indigo-300"
              >
                Create an account
              </button>
            </p>
            <p className="text-center text-slate-500 text-xs mt-3">
              Admin user?{" "}
              <button 
                onClick={() => navigate("/admin/login")}
                className="text-amber-400 hover:text-amber-300 font-medium"
              >
                Login through Admin Portal →
              </button>
            </p>
          </div>

          {/* Security badges */}
          <div className="flex items-center justify-center gap-4 mt-8">
            {["JWT Secured", "256-bit Encrypted", "GDPR Compliant"].map((b) => (
              <div key={b} className="flex items-center gap-1.5 text-slate-500 text-xs">
                <Lock size={11} />
                {b}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
