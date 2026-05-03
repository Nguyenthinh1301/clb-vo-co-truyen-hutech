/**
 * Register account for an1@gmail.com via API
 */

const http = require('http');

const testData = {
    email: 'an1@gmail.com',
    username: 'an1',
    password: 'An12345678',
    first_name: 'An',
    last_name: 'Nguyen',
    phone_number: '0123456789',
    date_of_birth: '2000-01-01',
    gender: 'male'
};

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/register',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    }
};

console.log('📝 Registering account for:', testData.email);
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
            
            if (res.statusCode === 201 && result.success) {
                console.log('\n✅ ĐĂNG KÝ THÀNH CÔNG!\n');
                console.log('User Information:');
                console.log('─'.repeat(60));
                console.log('ID:', result.data.user.id);
                console.log('Email:', result.data.user.email);
                console.log('Username:', result.data.user.username);
                console.log('Full Name:', result.data.user.full_name);
                console.log('Role:', result.data.user.role);
                console.log('Membership:', result.data.user.membership_status);
                console.log('Created:', result.data.user.created_at);
                
                console.log('\n🔑 Login Credentials:');
                console.log('─'.repeat(60));
                console.log('Email: an1@gmail.com');
                console.log('Password: An12345678');
                
                console.log('\n✅ Tài khoản đã được tạo và có thể đăng nhập!');
                console.log('\nTest login: node test-login-an1.js');
            } else if (res.statusCode === 409) {
                console.log('\n⚠️  TÀI KHOẢN ĐÃ TỒN TẠI!\n');
                console.log('Email này đã được đăng ký trước đó.');
                console.log('\nBạn có thể:');
                console.log('1. Thử đăng nhập: node test-login-an1.js');
                console.log('2. Sử dụng email khác');
                console.log('3. Xóa tài khoản cũ và tạo lại');
            } else {
                console.log('\n❌ ĐĂNG KÝ THẤT BẠI!\n');
                console.log('Lỗi:', result.message);
                
                if (result.errors && Array.isArray(result.errors)) {
                    console.log('\nChi tiết lỗi:');
                    result.errors.forEach((err, i) => {
                        console.log(`${i + 1}. ${err.field}: ${err.message}`);
                    });
                }
                
                console.log('\nFull response:');
                console.log(JSON.stringify(result, null, 2));
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
