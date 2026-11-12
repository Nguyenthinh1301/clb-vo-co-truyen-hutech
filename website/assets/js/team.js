/**
 * Đội ngũ CLB — đọc dữ liệu từ API /api/team và hiển thị lên:
 *   - views/doi-ngu.html               → TeamSite.renderTeamPage()
 *   - views/thanh-vien/<slug>.html     → TeamSite.renderProfile()   (tự lấy slug từ tên file)
 *   - views/thanh-vien/ho-so.html?slug= → TeamSite.renderProfile()  (thành viên mới thêm từ Admin)
 *   - components/coaches-section.html  → TeamSite.renderHomeCoaches()
 *
 * Nội dung HTML tĩnh sẵn có trong trang được giữ làm bản dự phòng:
 * nếu API lỗi / chưa có dữ liệu thì trang vẫn hiển thị bình thường.
 * Cần nạp assets/js/config.js trước file này.
 */
(function () {
    'use strict';

    var API_BASE    = (window.APP_CONFIG && window.APP_CONFIG.API_BASE) || 'http://localhost:3001/api';
    var BACKEND_URL = API_BASE.replace(/\/api$/, '');

    // Các thành viên đã có trang tĩnh riêng (có nội dung dự phòng)
    var STATIC_PAGES = ['tran-vo-minh-ngoc', 'nguyen-quoc-an', 'pham-dac-truong-huy',
                        'ho-minh-thuan', 'xuan-giang', 'kim-nga', 'bao-anh'];

    var GROUP_ICON = { board: 'crown', coach: 'dumbbell', media: 'bullhorn', other: 'users' };
    var MEDAL      = { gold: '🥇', silver: '🥈', bronze: '🥉', star: '⭐' };

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function img(url) {
        if (!url) return '';
        if (/^https?:\/\//i.test(url)) return url;
        if (url.indexOf('/uploads') === 0) return BACKEND_URL + url;   // ảnh upload từ Admin
        return url.replace(/^\//, '');                                 // ảnh tĩnh (base href của trang)
    }

    function profileUrl(m) {
        return STATIC_PAGES.indexOf(m.slug) !== -1
            ? 'views/thanh-vien/' + m.slug + '.html'
            : 'views/thanh-vien/ho-so.html?slug=' + encodeURIComponent(m.slug);
    }

    function fetchJson(path) {
        return fetch(API_BASE + path, { cache: 'no-cache' }).then(function (r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.json();
        }).then(function (j) {
            if (!j || !j.success) throw new Error((j && j.message) || 'API lỗi');
            return j.data;
        });
    }

    // ═════════════ Trang Đội ngũ ═════════════
    function memberCard(m) {
        var photo = m.avatar
            ? '<div class="member-photo member-photo--' + esc(m.slug) + '"><img src="' + esc(img(m.avatar)) + '" alt="' + esc(m.full_name) + '" loading="lazy"></div>'
            : '<div class="member-photo-placeholder"><i class="fas fa-user"></i></div>';
        var details = (m.card_details || []).filter(function (d) { return d && (d.label || d.value); })
            .map(function (d) { return '<li><span class="dl">' + esc(d.label) + '</span><span class="dv">' + esc(d.value) + '</span></li>'; })
            .join('');
        return '<div class="member-card">' + photo +
            '<div class="member-body">' +
                '<h4>' + esc(m.short_name || m.full_name) + '</h4>' +
                (m.role ? '<div class="member-badge">' + esc(m.role) + '</div>' : '') +
                (details ? '<ul class="member-details">' + details + '</ul>' : '') +
                '<a href="' + esc(profileUrl(m)) + '" class="member-detail-btn"><i class="fas fa-user"></i> Xem chi tiết</a>' +
            '</div></div>';
    }

    function renderTeamPage() {
        return fetchJson('/team').then(function (list) {
            if (!list || !list.length) return;
            ['board', 'coach', 'media', 'other'].forEach(function (g) {
                var grid    = document.getElementById('team-' + g);
                var section = document.getElementById('team-' + g + '-section');
                if (!grid) return;
                var items = list.filter(function (m) { return (m.group_key || 'other') === g; });
                grid.innerHTML = items.map(memberCard).join('');
                if (section) section.style.display = items.length ? '' : 'none';
            });
        }).catch(function (e) { console.info('[Team] Dùng nội dung tĩnh:', e.message); });
    }

    // ═════════════ Trang hồ sơ ═════════════
    function currentSlug() {
        var q = new URLSearchParams(window.location.search).get('slug');
        if (q) return q;
        var file = window.location.pathname.split('/').pop() || '';
        return file.replace(/\.html?$/i, '');
    }

    function bioHtml(text) {
        return String(text || '').split(/\n{2,}/).map(function (p) {
            return esc(p.trim()).replace(/\n/g, '<br>');
        }).filter(Boolean).join('<br><br>');
    }

    function renderProfile(slug) {
        slug = slug || currentSlug();
        if (!slug || slug === 'ho-so') {
            showProfileError('Không tìm thấy thành viên.');
            return Promise.resolve();
        }
        return fetchJson('/team/' + encodeURIComponent(slug)).then(function (m) {
            document.title = m.full_name + ' – CLB Võ Cổ Truyền HUTECH';

            var av = document.querySelector('.profile-avatar-wrap');
            if (av) {
                if (m.avatar) {
                    av.classList.remove('profile-avatar-placeholder');
                    av.innerHTML = '<img src="' + esc(img(m.avatar)) + '" alt="' + esc(m.full_name) + '">';
                } else {
                    av.classList.add('profile-avatar-placeholder');
                    av.innerHTML = '<i class="fas fa-user"></i>';
                }
            }

            var bc = document.querySelector('.profile-breadcrumb');
            if (bc) bc.innerHTML = '<a href="index.html">Trang chủ</a> &rsaquo; <a href="views/doi-ngu.html">Đội ngũ CLB</a> &rsaquo; ' + esc(m.full_name);

            var h1 = document.querySelector('.profile-hero-text h1');
            if (h1) h1.textContent = m.full_name;

            var badge = document.querySelector('.profile-role-badge');
            if (badge) {
                badge.innerHTML = '<i class="fas fa-' + esc(m.role_icon || GROUP_ICON[m.group_key] || 'user') + '"></i> ' + esc(m.role || '');
                badge.style.display = m.role ? '' : 'none';
            }

            var stats = document.querySelector('.profile-stats-row');
            if (stats) {
                stats.innerHTML = (m.stats || []).filter(function (s) { return s && (s.value || s.label); })
                    .map(function (s) { return '<div class="profile-stat"><strong>' + esc(s.value) + '</strong><span>' + esc(s.label) + '</span></div>'; })
                    .join('');
            }

            var sections = document.querySelectorAll('.profile-main .profile-section');
            var bioSec = sections[0], achSec = sections[1];
            if (bioSec) {
                bioSec.querySelector('.profile-section-title').innerHTML = '<i class="fas fa-user-circle"></i> ' + esc(m.bio_title || 'Giới thiệu');
                bioSec.querySelector('.profile-bio').innerHTML = bioHtml(m.bio);
                bioSec.style.display = m.bio ? '' : 'none';
            }
            if (achSec) {
                var ach = (m.achievements || []).filter(function (a) { return a && (a.title || a.desc); });
                achSec.querySelector('.profile-section-title').innerHTML = '<i class="fas fa-medal"></i> ' + esc(m.ach_title || 'Thành tích nổi bật');
                achSec.querySelector('.achievement-timeline').innerHTML = ach.map(function (a) {
                    var medal = a.medal || a.medal_text
                        ? '<span class="ach-medal ' + esc(a.medal === 'star' ? 'gold' : (a.medal || '')) + '">' + (MEDAL[a.medal] ? MEDAL[a.medal] + ' ' : '') + esc(a.medal_text || '') + '</span>'
                        : '';
                    return '<div class="ach-item">' +
                        (a.year ? '<div class="ach-year">' + esc(a.year) + '</div>' : '') +
                        (a.title ? '<div class="ach-title">' + esc(a.title) + '</div>' : '') +
                        (a.desc ? '<div class="ach-desc">' + esc(a.desc) + '</div>' : '') +
                        medal + '</div>';
                }).join('');
                achSec.style.display = ach.length ? '' : 'none';
            }

            var info = document.querySelector('.sidebar-info-list');
            if (info) {
                var rows = (m.info || []).filter(function (d) { return d && (d.label || d.value); });
                info.innerHTML = rows.map(function (d) {
                    return '<li><span class="sil-label">' + esc(d.label) + '</span><span class="sil-value">' + esc(d.value) + '</span></li>';
                }).join('');
                info.closest('.sidebar-card').style.display = rows.length ? '' : 'none';
            }

            var gal = document.querySelector('.sidebar-gallery');
            if (gal) {
                var pics = (m.gallery || []).filter(Boolean);
                gal.innerHTML = pics.map(function (u) {
                    return '<img src="' + esc(img(u)) + '" alt="' + esc(m.full_name) + '" loading="lazy">';
                }).join('');
                gal.closest('.sidebar-card').style.display = pics.length ? '' : 'none';
            }

            document.body.classList.remove('team-loading');
        }).catch(function (e) {
            console.info('[Team] Dùng nội dung tĩnh:', e.message);
            // Trang chung ho-so.html không có nội dung dự phòng → báo lỗi
            if (document.body.hasAttribute('data-team-dynamic')) {
                showProfileError(/404/.test(e.message) ? 'Không tìm thấy thành viên.' : 'Không tải được thông tin thành viên. Vui lòng thử lại sau.');
            }
        });
    }

    function showProfileError(msg) {
        document.body.classList.remove('team-loading');
        var h1 = document.querySelector('.profile-hero-text h1');
        if (h1) h1.textContent = msg;
        var main = document.querySelector('.profile-main');
        if (main) main.style.display = 'none';
        var side = document.querySelector('.profile-sidebar');
        if (side) side.style.display = 'none';
    }

    // ═════════════ Trang chủ — mục Đội ngũ ═════════════
    // Hiển thị những thành viên được tick "Hiện ở trang chủ" trong Admin › Đội ngũ CLB.
    // Ảnh, họ tên, chức vụ và các dòng "Thông tin trên thẻ" dùng chung dữ liệu với trang Đội ngũ / hồ sơ.
    function homeCard(m) {
        var avatar = m.avatar
            ? '<img src="' + esc(img(m.avatar)) + '" alt="' + esc(m.full_name) + '" loading="lazy">'
            : '<i class="fas fa-user coach-avatar-ph"></i>';
        var details = (m.card_details || []).filter(function (d) { return d && (d.label || d.value); }).slice(0, 3)
            .map(function (d) {
                return '<li><span class="cd-label">' + esc(d.label) + '</span><span class="cd-value">' + esc(d.value) + '</span></li>';
            }).join('');
        return '<a class="coach-card" href="' + esc(profileUrl(m)) + '">' +
            '<div class="coach-card-front">' +
                '<div class="coach-avatar">' + avatar + '</div>' +
                '<div class="coach-info"><h3>' + esc(m.full_name) + '</h3>' +
                    (m.role ? '<div class="coach-title">' + esc(m.role) + '</div>' : '') +
                    (details ? '<ul class="coach-details">' + details + '</ul>' : '') +
                '</div>' +
                '<div class="coach-flip-hint"><i class="fas fa-user"></i> Xem chi tiết</div>' +
            '</div></a>';
    }

    function renderHomeCoaches() {
        var grid = document.querySelector('#coaches .coaches-grid');
        if (!grid) return Promise.resolve();

        // Làm mờ nội dung tĩnh trong lúc chờ dữ liệu từ Admin (tránh nháy thông tin cũ)
        grid.classList.add('is-loading');
        var done = false;
        var reveal = function () { if (!done) { done = true; grid.classList.remove('is-loading'); } };
        setTimeout(reveal, 4000); // API chậm → vẫn hiện nội dung tĩnh

        return fetchJson('/team?home=1').then(function (list) {
            if (!list || !list.length) return;
            grid.innerHTML = list.map(homeCard).join('');
            grid.setAttribute('data-count', String(Math.min(list.length, 4)));
        }).catch(function (e) {
            console.info('[Team] Trang chủ dùng nội dung tĩnh:', e.message);
        }).then(reveal);
    }

    window.TeamSite = {
        renderTeamPage: renderTeamPage,
        renderProfile: renderProfile,
        renderHomeCoaches: renderHomeCoaches
    };
})();
