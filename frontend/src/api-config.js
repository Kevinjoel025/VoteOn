// API Configuration for VoteOn Frontend
// Local dev: BASE_URL stays `/api` (Vite proxy in vite.config.ts).
// Production (e.g. Netlify): set VITE_API_BASE_URL at build time, e.g. https://your-api.com/api

const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || '/api',
  
  // API Endpoints
  ENDPOINTS: {
    // Authentication
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
    LOGOUT: '/auth/logout',
    
    // Candidates
    CANDIDATES: '/candidates',
    
    // Voting
    VOTE: '/votes/cast',
    
    // Results
    RESULTS: '/results',
    
    // Nominations
    NOMINATIONS: '/nominations',
    APPLY_NOMINATION: '/nominations/apply',
    
    // Admin Endpoints
    ADMIN_DASHBOARD: '/admin/dashboard',
    ADMIN_NOMINATIONS: '/admin/nominations',
    ADMIN_USERS: '/admin/users',
    ADMIN_VOTES: '/admin/votes'
  },
  
  // Request timeout
  TIMEOUT: 10000,
  
  // Default headers
  HEADERS: {
    'Content-Type': 'application/json',
  }
};

export default API_CONFIG;