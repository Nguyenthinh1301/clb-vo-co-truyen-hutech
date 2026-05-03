/**
 * Test login for an1@gmail.com
 */

const http = require('http');

const testData = {
    email: 'an1@gmail.com',
    password: 'An12345678'
};

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    }
};

console.log('🔐 Testing login for:', testData.email);
console.log('─'.repeat(60));

const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('\n📊 Response Status:', res.statusCode);
        console.log('─'.repeat(60));
        
        try {
            const result = JSON.parse(data);
            
            if (res.statusCode === 200 && result.success) {
                console.log('\n✅ ĐĂNG NHẬP THÀNH CÔNG!\n');
                console.log('User Information:');
                console.log('─'.repeat(60));
                console.log('Email:', result.data.user.email);
                console.log('Username:', result.data.user.username);
                console.log('Full Name:', result.data.user.full_name || `${result.data.user.first_name} ${result.data.user.last_name}`);
                console.log('Role:', result.data.user.role);
                console.log('Membership:', result.data.user.membership_status);
                console.log('Active:', result.data.user.is_active ? 'Yes' : 'No');
                console.log('Created:', result.data.user.created_at);
                console.log('\nToken:', result.data.token.substring(0, 50) + '...');
                console.log('\n✅ Tài khoản hoạt động bình thường!');
            } else {
                console.log('\n❌ ĐĂNG NHẬP THẤT BẠI!\n');
                console.log('Lỗi:', result.message);
                console.log('\nChi tiết:');
                console.log(JSON.stringify(result, null, 2));
                
                console.log('\n📋 Khả năng:');
                console.log('1. Tài khoản chưa được tạo trong database');
                console.log('2. Mật khẩu không đúng (phân biệt HOA/thường)');
                console.log('3. Email không đúng (có khoảng trắng?)');
                console.log('4. Tài khoản bị vô hiệu hóa (is_active = 0)');
            }
        } catch (error) {
            console.log('\n❌ LỖI PARSE JSON!');
            console.log('Raw response:', data);
        }
        
        console.log('\n' + '─'.repeat(60));
    });
});

req.on('error', (error) => {
    console.log('\n❌ LỖI KẾT NỐI!\n');
    console.log('Error:', error.message);
    console.log('\nVui lòng kiểm tra:');
    console.log('1. Backend đang chạy (npm start trong thư mục backend)');
    console.log('2. Port 3000 không bị chặn');
    console.log('3. Firewall không chặn kết nối');
});

req.write(JSON.stringify(testData));
req.end();
