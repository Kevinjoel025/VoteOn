import { useState } from "react";
import { useNavigate } from "react-router";
import { Vote, Eye, EyeOff, Lock, Mail, User, AlertCircle, CheckCircle, Chrome } from "lucide-react";

import apiClient from "../../api-client.js";

export function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const validationErrors: {[key: string]: string} = {};

    // Username validation
    if (!formData.username.trim()) {
      validationErrors.username = "Username is required";
    } else if (formData.username.length < 3) {
      validationErrors.username = "Username must be at least 3 characters";
    } else if (formData.username.length > 50) {
      validationErrors.username = "Username must be less than 50 characters";
    }

    // Email validation
    if (!formData.email.trim()) {
      validationErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      validationErrors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!formData.password) {
      validationErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      validationErrors.password = "Password must be at least 8 characters";
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      validationErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      validationErrors.confirmPassword = "Passwords don't match";
    }

    return validationErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Prepare data for backend (match RegisterRequest schema)
      const registrationData = {
        username: formData.username,
        email: formData.email,
        password: formData.password
        // Note: confirmPassword is frontend-only validation
      };

      console.log('📝 Registering user:', { username: formData.username, email: formData.email });

      // Call the API (POST /api/auth/register)
      const response = await apiClient.register(registrationData);
      
      console.log('✅ Registration successful:', response);

      // Backend returns: { access_token, refresh_token, user: {...} }
      if (response.access_token) {
        // Store authentication data (same as login)
        apiClient.setToken(response.access_token);
        localStorage.setItem('refreshToken', response.refresh_token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        // Show success message briefly
        setSuccess(true);
        
        // Redirect to voter dashboard after a short delay
        setTimeout(() => {
          navigate("/voter/dashboard");
        }, 1500);
      }
      
    } catch (error: any) {
      console.error("❌ Registration failed:", error);
      
      // Handle specific error cases
      if (error.status === 400) {
        // Backend validation errors
        if (error.message?.includes("Email already registered")) {
          setErrors({ email: "This email is already registered" });
        } else if (error.message?.includes("Username already taken")) {
          setErrors({ username: "This username is already taken" });
        } else {
          setErrors({ general: error.message || "Registration failed" });
        }
      } else {
        setErrors({ general: "Registration failed. Please try again." });
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-8 py-6 flex items-center gap-4">
          <CheckCircle size={32} className="text-emerald-400" />
          <div>
            <h3 className="text-emerald-300 text-lg font-semibold">Account Created!</h3>
            <p className="text-emerald-400 text-sm">Redirecting to your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Left Panel */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
              <Vote size={20} className="text-white" />
            </div>
            <span className="text-white text-xl font-bold">VoteOn</span>
          </div>

          <div className="space-y-6 max-w-md">
            <div>
              <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-3 py-1.5 mb-4">
                <Vote size={14} className="text-indigo-400" />
                <span className="text-indigo-300 text-xs font-medium">Join the Community</span>
              </div>
              <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
                Create Your<br />Voter Account
              </h1>
              <p className="text-slate-400 leading-relaxed">
                Join our secure voting platform. One account, one vote. Your voice matters in shaping our community's future.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Secure Account", icon: "🔒" },
                { label: "One Person One Vote", icon: "✓" },
                { label: "Easy Process", icon: "⚡" },
              ].map((stat) => (
                <div key={stat.label} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 text-center">
                  <p className="text-2xl mb-1">{stat.icon}</p>
                  <p className="text-slate-400 text-xs">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            {["Email Verified", "Password Protected", "Fraud Detection", "Privacy First"].map((f) => (
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

      {/* Right Panel - Registration Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-slate-950">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6 lg:hidden">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
                <Vote size={18} className="text-white" />
              </div>
              <span className="text-white text-lg font-bold">VoteOn</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">Create Account</h2>
            <p className="text-slate-400 text-sm">Register as a voter to participate in elections</p>
          </div>

          {/* General Error Message */}
          {errors.general && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-5 flex items-center gap-3">
              <AlertCircle size={16} className="text-red-400" />
              <p className="text-red-300 text-sm">{errors.general}</p>
            </div>
          )}

          {/* Google Register */}
          <button
            type="button"
            onClick={() => { window.location.href = `${window.location.origin}/api/auth/google`; }}
            className="w-full flex items-center justify-center gap-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl py-3 text-sm font-medium transition-all mb-4"
          >
            <Chrome size={17} className="text-slate-300" />
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-slate-500 text-xs">or register with email</span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-slate-300 text-sm mb-2 font-medium">
                Username
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Choose a username"
                  className={`w-full bg-slate-900 border rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none transition-colors ${
                    errors.username 
                      ? 'border-red-500 focus:border-red-400' 
                      : 'border-slate-700 focus:border-indigo-500'
                  }`}
                />
              </div>
              {errors.username && (
                <p className="text-red-400 text-xs mt-1.5">{errors.username}</p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-slate-300 text-sm mb-2 font-medium">
                Email Address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="your.email@example.com"
                  className={`w-full bg-slate-900 border rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none transition-colors ${
                    errors.email 
                      ? 'border-red-500 focus:border-red-400' 
                      : 'border-slate-700 focus:border-indigo-500'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-xs mt-1.5">{errors.email}</p>
              )}
            </div>
            
            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-slate-300 text-sm mb-2 font-medium">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  id="password"
                  name="password"
                  type={showPass ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Create a strong password"
                  className={`w-full bg-slate-900 border rounded-xl pl-10 pr-11 py-3 text-white text-sm placeholder-slate-500 focus:outline-none transition-colors ${
                    errors.password 
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
              {errors.password && (
                <p className="text-red-400 text-xs mt-1.5">{errors.password}</p>
              )}
              <p className="text-slate-500 text-xs mt-1.5">Must be at least 8 characters</p>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-slate-300 text-sm mb-2 font-medium">
                Confirm Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPass ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Re-enter your password"
                  className={`w-full bg-slate-900 border rounded-xl pl-10 pr-11 py-3 text-white text-sm placeholder-slate-500 focus:outline-none transition-colors ${
                    errors.confirmPassword 
                      ? 'border-red-500 focus:border-red-400' 
                      : 'border-slate-700 focus:border-indigo-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-400 text-xs mt-1.5">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-3 text-sm transition-all shadow-lg shadow-indigo-600/20"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Creating Account...
                </div>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 pt-6 border-t border-slate-800">
            <p className="text-center text-slate-500 text-xs">
              Already have an account?{" "}
              <button 
                onClick={() => navigate("/")}
                className="text-indigo-400 hover:text-indigo-300 font-medium"
              >
                Sign in here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
