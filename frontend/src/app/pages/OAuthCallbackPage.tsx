import { useEffect } from "react";
import { useNavigate } from "react-router";
import { Loader2 } from "lucide-react";
import apiClient from "../../api-client.js";

/**
 * OAuthCallbackPage
 * Handles the redirect from Google OAuth via backend.
 * Reads tokens from query params, stores them, then navigates to the dashboard.
 */
export function OAuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const userRaw = params.get("user");
    const redirect = params.get("redirect") || "/voter/dashboard";

    if (accessToken && refreshToken && userRaw) {
      try {
        const user = JSON.parse(userRaw);
        apiClient.setToken(accessToken);
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        localStorage.setItem("user", JSON.stringify(user));
        navigate(redirect, { replace: true });
      } catch (e) {
        console.error("Failed to parse OAuth callback params:", e);
        navigate("/", { replace: true });
      }
    } else {
      // Something went wrong — send back to login
      navigate("/", { replace: true });
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 size={36} className="text-indigo-400 animate-spin" />
        <p className="text-slate-400 text-sm">Completing Google sign-in...</p>
      </div>
    </div>
  );
}
