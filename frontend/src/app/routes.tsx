import { createBrowserRouter } from "react-router";
import { Root } from "./Root";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { AdminLoginPage } from "./pages/AdminLoginPage";
import { VoterDashboard } from "./pages/VoterDashboard";
import { VotingPage } from "./pages/VotingPage";
import { VoterResultsPage } from "./pages/VoterResultsPage";
import { NominationPage } from "./pages/NominationPage";
import { AdminDashboard } from "./pages/AdminDashboard";
import { CandidateApprovalPage } from "./pages/CandidateApprovalPage";
import { FullResultsPage } from "./pages/FullResultsPage";
import { VoteMonitoringPage } from "./pages/VoteMonitoringPage";
import { OAuthCallbackPage } from "./pages/OAuthCallbackPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: LoginPage },
      { path: "register", Component: RegisterPage },
      { path: "admin/login", Component: AdminLoginPage },
      { path: "oauth-callback", Component: OAuthCallbackPage },
      { path: "voter/dashboard", Component: VoterDashboard },
      { path: "voter/vote", Component: VotingPage },
      { path: "voter/results", Component: VoterResultsPage },
      { path: "voter/nomination", Component: NominationPage },
      { path: "admin/dashboard", Component: AdminDashboard },
      { path: "admin/candidates", Component: CandidateApprovalPage },
      { path: "admin/results", Component: FullResultsPage },
      { path: "admin/monitoring", Component: VoteMonitoringPage },
    ],
  },
]);
