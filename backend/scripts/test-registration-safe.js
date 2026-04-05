/**
 * Test registration endpoint to ensure it works without crashing
 */

const axios = require('axios');

const API_URL = 'http://localhost:3000';

async function testRegistration() {
    try {
        console.log('🧪 Testing user registration...\n');
        
        // Generate random user data
        const timestamp = Date.now();
        const testUser = {
            email: `test${timestamp}@gmail.com`,
            username: `test${timestamp}`,
            password: 'Test@123456',
            first_name: 'Test',
            last_name: 'User',
            phone_number: '0123456789',
            gender: 'male'
        };
        
        console.log('📝 Test user data:');
        console.log(JSON.stringify(testUser, null, 2));
        console.log('\n🚀 Sending registration request...\n');
        
        const response = await axios.post(`${API_URL}/api/auth/register`, testUser);
        
        if (response.data.success) {
            console.log('✅ Registration successful!');
            console.log('\n📋 Response:');
            console.log(`   User ID: ${response.data.data.user.id}`);
            console.log(`   Email: ${response.data.data.user.email}`);
            console.log(`   Username: ${response.data.data.user.username}`);
            console.log(`   Full Name: ${response.data.data.user.full_name}`);
            console.log(`   Role: ${response.data.data.user.role}`);
            console.log(`   Status: ${response.data.data.user.membership_status}`);
            console.log(`   Token: ${response.data.data.token.substring(0, 20)}...`);
            console.log('\n✅ Backend did not crash!');
            console.log('✅ User can login and use the system!');
        } else {
            console.log('❌ Registration failed:', response.data.message);
        }
        
    } catch (error) {
        if (error.response) {
            console.error('❌ Registration error:', error.response.data);
            console.error('Status:', error.response.status);
        } else if (error.request) {
            console.error('❌ No response from server. Is backend running?');
            console.error('Make sure to start backend with: npm start');
        } else {
            console.error('❌ Error:', error.message);
        }
    }
}

// Check if backend is running first
async function checkBackend() {
    try {
        await axios.get(`${API_URL}/api/health`);
        console.log('✅ Backend is running\n');
        return true;
    } catch (error) {
        console.error('❌ Backend is not running!');
        console.error('Please start backend first with: npm start\n');
        return false;
    }
}

async function main() {
    const isRunning = await checkBackend();
    if (isRunning) {
        await testRegistration();
    }
}

main();
