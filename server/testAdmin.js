const axios = require('axios');

const API_BASE = 'https://aramco-review-backend.onrender.com/api';

async function testAdminEndpoints() {
  try {
    console.log('Testing admin endpoints...');

    // Test stations endpoint
    console.log('\n1. Testing /api/stations...');
    const stationsRes = await axios.get(`${API_BASE}/stations`, {
      headers: { Authorization: 'Bearer dev-admin-token' }
    });
    console.log(`Stations found: ${stationsRes.data.length}`);

    // Test admin stats endpoint
    console.log('\n2. Testing /api/admin/stats...');
    const statsRes = await axios.get(`${API_BASE}/admin/stats`, {
      headers: { Authorization: 'Bearer dev-admin-token' }
    });
    console.log('Admin stats:', JSON.stringify(statsRes.data, null, 2));

    console.log('\n✅ All admin endpoints working correctly!');

  } catch (error) {
    console.error('❌ Error testing admin endpoints:', error.response?.data || error.message);
  }
}

testAdminEndpoints();
