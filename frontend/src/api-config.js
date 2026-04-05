// API Configuration for VoteOn Frontend
// Backend: Local Development

const API_CONFIG = {
  // Use relative URL - Vite will proxy to backend
  BASE_URL: '/api',
  
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