        // Initialize demo data
        function initializeDemoData() {
            // Create demo users if not exists
            const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
            
            // Add demo user if not exists
            if (!registeredUsers.find(u => u.email === 'demo@hutech.edu.vn')) {
                const demoUser = {
                    id: 'demo-user-1',
                    email: 'demo@hutech.edu.vn',
                    password: 'demo123',
                    name: 'Demo User',
                    firstName: 'Demo',
                    lastName: 'User',
                    phone: '0123456789',
                    birthDate: '1990-01-01',
                    gender: 'Nam',
                    experience: 'Mới bắt đầu',
                    role: 'member',
                    registrationDate: new Date().toISOString(),
                    membershipStatus: 'active'
                };
                
                registeredUsers.push(demoUser);
                localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
                console.log('Demo user created');
            }
            
            // Add admin user if not exists
            if (!registeredUsers.find(u => u.email === 'admin@hutech.edu.vn')) {
                const adminUser = {
                    id: 'admin-user-1',
                    email: 'admin@hutech.edu.vn',
                    password: 'admin123',
                    name: 'Admin User',
                    firstName: 'Admin',
                    lastName: 'User',
                    phone: '0987654321',
                    birthDate: '1985-01-01',
                    gender: 'Nam',
                    experience: 'Chuyên nghiệp',
                    role: 'admin',
                    registrationDate: new Date().toISOString(),
                    membershipStatus: 'active'
                };
                
                registeredUsers.push(adminUser);
                localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
                console.log('Admin user created');
            }
        }

        // Initialize demo data when page loads
        document.addEventListener('DOMContentLoaded', function() {
            initializeDemoData();
        });