/**
 * Khởi tạo hamburger menu và scroll effect
 * Gọi sau khi header đã được load vào DOM
 * Dropdown (Giới thiệu, Tin tức) dùng inline onclick trong header.html
 */
function initDropdown() {
    // ── Mobile hamburger toggle ──────────────────────────────
    var navToggle = document.getElementById('nav-toggle');
    var navMenu   = document.getElementById('nav-menu');

    if (navToggle && navMenu) {
        // Xóa inline onclick cũ, gắn listener mới
        var newToggle = navToggle.cloneNode(true);
        navToggle.parentNode.replaceChild(newToggle, navToggle);

        newToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            navMenu.classList.toggle('active');
            newToggle.classList.toggle('active');
        });

        // Đóng menu khi click ra ngoài
        document.addEventListener('click', function(e) {
            if (!e.target.closest('#nav-menu') && !e.target.closest('#nav-toggle')) {
                navMenu.classList.remove('active');
                newToggle.classList.remove('active');
                document.querySelectorAll('.nav-has-dropdown').forEach(function(d) {
                    d.classList.remove('open');
                });
            }
        });

        // Đóng menu khi click link thường
        navMenu.querySelectorAll('.nav-link').forEach(function(link) {
            if (!link.closest('.nav-has-dropdown')) {
                link.addEventListener('click', function() {
                    navMenu.classList.remove('active');
                    newToggle.classList.remove('active');
                });
            }
        });
    }

    // ── Scroll effect ────────────────────────────────────────
    window.addEventListener('scroll', function() {
        var header = document.querySelector('.main-header');
        if (header) header.classList.toggle('scrolled', window.scrollY > 100);
    }, { passive: true });
}
