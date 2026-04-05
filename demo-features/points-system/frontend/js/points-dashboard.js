/**
 * Points Dashboard Demo JavaScript
 * Xử lý logic cho demo hệ thống tích điểm
 */

// Tab switching
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active from all tab buttons
    document.querySelectorAll('.tab').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName + '-tab').classList.add('active');
    
    // Add active to clicked button
    event.target.classList.add('active');
}

// Redeem reward
function redeemReward(rewardName, points) {
    if (confirm(`Bạn có chắc muốn đổi ${rewardName} với ${points} điểm?`)) {
        alert('Đây là DEMO. Trong phiên bản thực, quà sẽ được gửi đến bạn!');
    }
}

// Initialize demo
document.addEventListener('DOMContentLoaded', function() {
    console.log('Points System Demo loaded');
    
    // Add click handlers to redeem buttons
    document.querySelectorAll('.btn-redeem:not(.disabled)').forEach(btn => {
        btn.addEventListener('click', function() {
            const card = this.closest('.reward-card');
            const rewardName = card.querySelector('h3').textContent;
            const points = card.querySelector('.reward-points').textContent;
            redeemReward(rewardName, points);
        });
    });
    
    // Animate progress bars
    setTimeout(() => {
        document.querySelectorAll('.progress-fill').forEach(bar => {
            const width = bar.style.width;
            bar.style.width = '0%';
            setTimeout(() => {
                bar.style.width = width;
            }, 100);
        });
    }, 500);
});
