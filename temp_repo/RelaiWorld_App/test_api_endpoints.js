const fetch = require('node-fetch');

async function testAPIEndpoints() {
  const baseURL = 'http://localhost:3000';
  
  console.log('Testing API endpoints...\n');
  
  // Test 1: Check if server is running
  try {
    console.log('1. Testing server health...');
    const healthResponse = await fetch(`${baseURL}/health`);
    if (healthResponse.ok) {
      console.log('✅ Server is running');
    } else {
      console.log('❌ Server health check failed');
    }
  } catch (error) {
    console.log('❌ Server is not running:', error.message);
    return;
  }
  
  // Test 2: Test API test endpoint
  try {
    console.log('\n2. Testing API test endpoint...');
    const testResponse = await fetch(`${baseURL}/api/test`);
    if (testResponse.ok) {
      const result = await testResponse.json();
      console.log('✅ API test endpoint working:', result);
    } else {
      console.log('❌ API test endpoint failed');
    }
  } catch (error) {
    console.log('❌ API test endpoint error:', error.message);
  }
  
  // Test 3: Test shortform endpoint (without data)
  try {
    console.log('\n3. Testing shortform endpoint...');
    const shortformResponse = await fetch(`${baseURL}/api/unverified/shortform`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ test: 'data' }),
    });
    
    console.log('Status:', shortformResponse.status);
    const result = await shortformResponse.json();
    console.log('Response:', result);
    
    if (shortformResponse.status === 400) {
      console.log('✅ Endpoint exists (400 is expected for invalid data)');
    } else if (shortformResponse.ok) {
      console.log('✅ Endpoint working');
    } else {
      console.log('❌ Endpoint failed');
    }
  } catch (error) {
    console.log('❌ Shortform endpoint error:', error.message);
  }
}

testAPIEndpoints(); 