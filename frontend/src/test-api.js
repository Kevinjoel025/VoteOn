// Test API Connection
// Run this to verify your frontend can connect to backend

import apiClient from './api-client.js';

// Test the API connection
async function testAPI() {
  console.log('🧪 Testing API Connection...');
  
  try {
    // Test health endpoint
    const health = await apiClient.healthCheck();
    console.log('✅ Health Check:', health);
    
    // Test candidates endpoint  
    const candidates = await apiClient.getCandidates();
    console.log('✅ Candidates:', candidates);
    
    console.log('🎉 API Connection Successful!');
    return true;
    
  } catch (error) {
    console.error('❌ API Connection Failed:', error);
    return false;
  }
}

// Auto-run test
testAPI();

export default testAPI;