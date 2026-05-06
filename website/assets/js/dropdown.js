/**
 * Khởi tạo dropdown Giới thiệu và mobile hamburger menu
 * Gọi sau khi header đã được load vào DOM
 */
function initDropdown() {
    // ── Mobile hamburger toggle ──────────────────────────────
    var navToggle = document.getElementById('nav-toggle');
    var navMenu   = document.getElementById('nav-menu');

    if (navToggle && navMenu) {
        // Clone để xóa listener cũ
        var newToggle = navToggle.cloneNode(true);
        navToggle.parentNode.replaceChild(newToggle, navToggle);

        newToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            navMenu.classList.toggle('active');
            newToggle.classList.toggle('active');
        });

        // Đóng menu khi click ra ngoài
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.nav-menu') && !e.target.closest('#nav-toggle')) {
                navMenu.classList.remove('active');
                newToggle.classList.remove('active');
            }
        });

        // Đóng menu khi click link thường (không phải dropdown)
        navMenu.querySelectorAll('.nav-link').forEach(function(link) {
            if (!link.closest('.nav-has-dropdown')) {
                link.addEventListener('click', function() {
                    navMenu.classList.remove('active');
                    newToggle.classList.remove('active');
                });
            }
        });
    }

    // ── Dropdown Giới thiệu / Tin tức ───────────────────────
    document.querySelectorAll('.nav-has-dropdown > .nav-link').forEach(function(toggle) {
        // Xóa listener cũ bằng cách clone
        var newToggle = toggle.cloneNode(true);
        toggle.parentNode.replaceChild(newToggle, toggle);

        newToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            var item = this.closest('.nav-has-dropdown');
            var isOpen = item.classList.contains('open');
            document.querySelectorAll('.nav-has-dropdown').forEach(function(d) {
                d.classList.remove('open');
            });
            if (!isOpen) item.classList.add('open');
        });
    });

    // Đóng dropdown khi click ra ngoài
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.nav-has-dropdown')) {
            document.querySelectorAll('.nav-has-dropdown').forEach(function(d) {
                d.classList.remove('open');
            });
        }
    });

    // Scroll effect
    window.addEventListener('scroll', function() {
        var header = document.querySelector('.main-header');
        if (header) header.classList.toggle('scrolled', window.scrollY > 100);
    }, { passive: true });
}
