/**
 * Reset password via API endpoint
 * This works if your server is running and has access to Supabase
 * Usage: node reset_password_via_api.js <email> <newPassword>
 */

const http = require('http');

const email = process.argv[2];
const newPassword = process.argv[3] || 'Password123!';

if (!email) {
    console.error('❌ Please provide an email address');
    console.log('Usage: node reset_password_via_api.js <email> [newPassword]');
    console.log('Example: node reset_password_via_api.js sureshsuresh86882481@gmail.com Password123!');
    process.exit(1);
}

const postData = JSON.stringify({
    email: email,
    newPassword: newPassword
});

// Try port 5173 first (frontend proxy), fallback to 3000 (backend direct)
const port = process.env.PORT || 5173;
const options = {
    hostname: 'localhost',
    port: port,
    path: '/api/user/update-password',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
    }
};

console.log(`🔄 Resetting password for: ${email}`);
console.log(`📝 New password: ${newPassword}`);
console.log('');

const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const response = JSON.parse(data);
            if (res.statusCode === 200) {
                console.log('✅ Password reset successful!');
                console.log('   Response:', response.message);
            } else {
                console.error(`❌ Password reset failed (${res.statusCode})`);
                console.error('   Response:', response);
            }
        } catch (e) {
            console.log('Response:', data);
        }
    });
});

req.on('error', (e) => {
    console.error(`❌ Problem with request: ${e.message}`);
    console.error(`   Make sure your server is running on http://localhost:${port}`);
    console.error('   If using frontend proxy, ensure both frontend (5173) and backend (3000) are running');
});

req.write(postData);
req.end();

