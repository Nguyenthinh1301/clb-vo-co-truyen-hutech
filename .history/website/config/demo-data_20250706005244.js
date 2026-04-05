// Demo user data for testing profile page
const demoUserData = {
    id: 1,
    username: 'demo_user',
    email: 'demo@example.com',
    fullName: 'Nguyễn Văn Demo',
    phone: '0123456789',
    birthDate: '1995-05-15',
    gender: 'male',
    address: '123 Nguyễn Văn Cừ, Quận 5, TP.HCM',
    bio: 'Tôi là một võ sĩ đam mê với võ thuật cổ truyền. Đã tham gia CLB được 3 năm và luôn nỗ lực trong việc rèn luyện.',
    profileImage: '../../assets/images/default-avatar.svg',
    role: 'Thành viên tích cực',
    joinDate: '2021-09-15',
    
    // Martial arts information
    martialArts: {
        style: 'taekwondo',
        beltRank: 'Đai đen 1 đẳng',
        trainingYears: 5,
        joinDate: '2021-09-15',
        specialties: 'Đấu thực chiến, Biểu diễn quyền, Phá gỗ'
    },
    
    // Achievements
    achievements: [
        {
            id: 1,
            title: 'Huy chương Vàng',
            competition: 'Giải Taekwondo Sinh viên TP.HCM',
            rank: '1',
            date: '2023-11-15',
            description: 'Hạng cân 60kg nam'
        },
        {
            id: 2,
            title: 'Huy chương Đồng',
            competition: 'Giải Võ thuật Truyền thống Quốc gia',
            rank: '3',
            date: '2023-06-20',
            description: 'Môn biểu diễn quyền'
        },
        {
            id: 3,
            title: 'Giải Khuyến khích',
            competition: 'Festival Võ thuật Đông Nam Á',
            rank: 'other',
            date: '2022-12-10',
            description: 'Tham gia biểu diễn đồng đội'
        }
    ],
    
    // Account settings
    settings: {
        emailNotifications: true,
        trainingReminders: true,
        language: 'vi'
    },
    
    // Activity log
    lastLogin: '2024-01-06T10:30:00Z',
    loginCount: 125,
    profileViews: 89
};

// Function to load demo data
function loadDemoData() {
    // Save demo data to localStorage
    localStorage.setItem('currentUser', JSON.stringify(demoUserData));
    localStorage.setItem('authToken', 'demo_token_' + Date.now());
    
    console.log('Demo data loaded successfully!');
    console.log('Demo user:', demoUserData.fullName);
    
    // Redirect to profile page
    window.location.href = 'views/account/profile.html';
}

// Function to clear demo data
function clearDemoData() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    localStorage.removeItem('activityLogs');
    
    console.log('Demo data cleared!');
    window.location.href = 'index.html';
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { demoUserData, loadDemoData, clearDemoData };
}

// Console commands for testing
console.log('Demo data functions available:');
console.log('- loadDemoData(): Load demo user and redirect to profile');
console.log('- clearDemoData(): Clear all demo data and redirect to home');
console.log('- demoUserData: View demo user object');
