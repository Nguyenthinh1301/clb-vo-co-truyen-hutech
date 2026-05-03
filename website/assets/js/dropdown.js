/**
 * Khởi tạo dropdown Giới thiệu trên navbar
 * Gọi sau khi header đã được load vào DOM
 */
function initDropdown() {
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

    document.addEventListener('click', function(e) {
        if (!e.target.closest('.nav-has-dropdown')) {
            document.querySelectorAll('.nav-has-dropdown').forEach(function(d) {
                d.classList.remove('open');
            });
        }
    });
}
