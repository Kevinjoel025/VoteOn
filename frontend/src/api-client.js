// API Client Service for VoteOn
// Handles all HTTP requests to the backend

import API_CONFIG from './api-config.js';

class ApiClient {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
  }

  // Get stored authentication token
  getToken() {
    return localStorage.getItem('accessToken');
  }

  // Set authentication token
  setToken(token) {
    if (token) {
      localStorage.setItem('accessToken', token);
    } else {
      localStorage.removeItem('accessToken');
    }
  }

  // Get request headers with authentication
  getHeaders(contentType = 'application/json') {
    const headers = { ...API_CONFIG.HEADERS };
    
    if (contentType) {
      headers['Content-Type'] = contentType;
    }
    
    const token = this.getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    return headers;
  }

  // Generic request method with error handling
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      headers: this.getHeaders(options.contentType),
      timeout: this.timeout,
      ...options,
    };

    try {
      console.log(`🔄 API Request: ${config.method || 'GET'} ${url}`);
      console.log(`🔄 Request data:`, options.body);
      
      const response = await fetch(url, config);
      console.log(`📡 Response status: ${response.status} ${response.statusText}`);
      
      // Handle other HTTP errors (let login page handle 401 for login attempts)
      if (!response.ok) {
        let errorData = {};
        try {
          errorData = await response.json();
          console.log(`❌ Error response data:`, errorData);
        } catch (e) {
          // If response is not JSON, use status text
          errorData = { detail: response.statusText };
        }
        
        const error = new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
        error.status = response.status;
        error.data = errorData;
        console.error(`❌ Throwing error:`, error);
        throw error;
      }
      
      const data = await response.json();
      console.log(`✅ API Success: ${config.method || 'GET'} ${url}`, data);
      return data;
      
    } catch (error) {
      console.error(`❌ API Error: ${config.method || 'GET'} ${url}`, error);
      
      // Network errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error - please check your connection');
      }
      
      throw error;
    }
  }

  // HTTP Methods
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint, data = null) {
    return this.request(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : null,
    });
  }

  async put(endpoint, data = null) {
    return this.request(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : null,
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // Authentication Methods
  async login(credentials) {
    return this.post(API_CONFIG.ENDPOINTS.LOGIN, credentials);
  }

  async register(userData) {
    return this.post(API_CONFIG.ENDPOINTS.REGISTER, userData);
  }

  async logout() {
    return this.post(API_CONFIG.ENDPOINTS.LOGOUT);
  }

  // Candidate Methods
  async getCandidates() {
    return this.get(API_CONFIG.ENDPOINTS.CANDIDATES);
  }

  // Voting Methods
  async castVote(voteData) {
    return this.post(API_CONFIG.ENDPOINTS.VOTE, voteData);
  }

  // Results Methods
  async getResults() {
    return this.get(API_CONFIG.ENDPOINTS.RESULTS);
  }

  // Admin Methods
  async getAdminDashboard() {
    return this.get(API_CONFIG.ENDPOINTS.ADMIN_DASHBOARD);
  }

  // Health check
  async healthCheck() {
    try {
      const response = await this.get('/health');
      console.log('💚 Backend is healthy:', response);
      return response;
    } catch (error) {
      console.error('💔 Backend health check failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new ApiClient();