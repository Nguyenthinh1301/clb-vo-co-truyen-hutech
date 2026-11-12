/**
 * Dữ liệu ban đầu cho bảng team_members (Đội ngũ CLB).
 * Lấy từ các trang tĩnh website/views/thanh-vien/*.html — chỉ nạp khi bảng còn trống.
 *
 * Ảnh dạng "assets/..." là ảnh tĩnh của website; ảnh upload từ Admin sẽ có dạng "/uploads/..." hoặc URL đầy đủ.
 */
const CLB = { label: 'Đơn vị', value: 'CLB VCT HUTECH' };

const COACH_ACH = [
    { year: '', title: 'Thành viên xuất sắc CLB', desc: 'Được công nhận là thành viên xuất sắc của CLB Võ Cổ Truyền HUTECH.', medal: 'star', medal_text: 'Xuất sắc' }
];
const MEDIA_TASKS = [
    { year: '', title: 'Sản xuất nội dung', desc: 'Hỗ trợ sản xuất ảnh và video cho các hoạt động của CLB.', medal: '', medal_text: '' },
    { year: '', title: 'Quản lý mạng xã hội', desc: 'Đăng tải và tương tác trên các kênh truyền thông của CLB.', medal: '', medal_text: '' },
    { year: '', title: 'Hỗ trợ sự kiện', desc: 'Ghi lại và truyền thông các sự kiện, buổi tập luyện của CLB.', medal: '', medal_text: '' }
];

module.exports = [
    {
        slug: 'tran-vo-minh-ngoc', full_name: 'Trần Võ Minh Ngọc', short_name: 'Minh Ngọc',
        role: 'Chủ Nhiệm CLB', group_key: 'board', role_icon: 'crown', show_home: true, sort_order: 1,
        avatar: 'assets/images_Avatar/Avatar_Anh_Ngoc.jpg',
        card_details: [
            { label: 'Cấp bậc', value: 'Cấp 16 – 4 đẳng' }, { label: 'Kinh nghiệm', value: '12 năm' },
            { label: 'Giải thưởng', value: '20+ giải' }, { label: 'Nổi bật', value: 'HCV Quốc tế 2022, 2023' }
        ],
        stats: [
            { value: '12', label: 'Năm KN' }, { value: '20+', label: 'Giải thưởng' },
            { value: '100+', label: 'Học viên' }, { value: '4 đẳng', label: 'Cấp bậc' }
        ],
        info: [
            { label: 'Cấp bậc', value: 'Cấp 16 – 4 đẳng' }, { label: 'Kinh nghiệm', value: '12 năm' },
            { label: 'Chuyên môn', value: 'Kỹ thuật, Chiến thuật' }, { label: 'Học viên', value: '100+' },
            { label: 'Giải thưởng', value: '20+' }, CLB
        ],
        bio_title: 'Tiểu sử',
        bio: 'Trần Võ Minh Ngọc là Chủ Nhiệm CLB Võ Cổ Truyền HUTECH, người đã gắn bó và cống hiến cho phong trào võ thuật của trường hơn 12 năm. Với cấp bậc 4 đẳng, anh không chỉ là một võ sĩ xuất sắc mà còn là người thầy tận tâm, truyền cảm hứng cho hàng trăm học viên qua các thế hệ.\n\nAnh chuyên sâu về kỹ thuật thi đấu và chiến thuật, đã dẫn dắt CLB đạt nhiều thành tích nổi bật tại các giải đấu trong nước và quốc tế. Dưới sự lãnh đạo của anh, CLB HUTECH liên tục phát triển về số lượng lẫn chất lượng.',
        ach_title: 'Thành tích nổi bật',
        achievements: [
            { year: '2023', title: 'Liên hoan Võ thuật Quốc tế 2023', desc: 'Đại diện CLB HUTECH tham dự và thi đấu xuất sắc tại giải đấu quốc tế.', medal: 'gold', medal_text: 'Huy chương Vàng' },
            { year: '2022', title: 'Liên hoan Võ thuật Quốc tế 2022', desc: 'Thi đấu nội dung quyền thuật cá nhân, đạt thành tích cao nhất.', medal: 'gold', medal_text: 'Huy chương Vàng' },
            { year: '2021', title: 'Giải Võ Cổ Truyền Sinh viên TP.HCM', desc: 'Tham dự nội dung đối kháng và quyền thuật.', medal: 'silver', medal_text: 'Huy chương Bạc' },
            { year: '2020', title: 'Giải Vô địch Võ Cổ Truyền HUTECH', desc: 'Đạt giải nhất nội dung quyền thuật cá nhân.', medal: 'gold', medal_text: 'Huy chương Vàng' },
            { year: '2019', title: 'Giải Võ Cổ Truyền Toàn quốc', desc: 'Đại diện TP.HCM tham dự giải toàn quốc.', medal: 'bronze', medal_text: 'Huy chương Đồng' }
        ],
        gallery: ['assets/images_Avatar/Ngoc_3.jpg', 'assets/images_Avatar/Ngoc_1.jpg', 'assets/images_Avatar/Ngoc_2.jpg']
    },
    {
        slug: 'nguyen-quoc-an', full_name: 'Nguyễn Quốc An', short_name: 'Quốc An',
        role: 'Phó Chủ Nhiệm CLB, HLV', group_key: 'board', role_icon: 'star', show_home: true, sort_order: 2,
        avatar: 'assets/images_Avatar/Avatar_An_3.jpg',
        card_details: [
            { label: 'Cấp bậc', value: 'Cấp 15 – 3 đẳng' }, { label: 'Kinh nghiệm', value: '8 năm' },
            { label: 'Giải thưởng', value: '10+ giải' }, { label: 'Nổi bật', value: 'HCB, HCV Quốc tế 2024, 2025' }
        ],
        stats: [
            { value: '8', label: 'Năm KN' }, { value: '10+', label: 'Giải thưởng' },
            { value: '70+', label: 'Học viên' }, { value: '3 đẳng', label: 'Cấp bậc' }
        ],
        info: [
            { label: 'Cấp bậc', value: 'Cấp 15 – 3 đẳng' }, { label: 'Kinh nghiệm', value: '8 năm' },
            { label: 'Chuyên môn', value: 'Quyền thuật, Đối kháng' }, { label: 'Học viên', value: '70+' },
            { label: 'Giải thưởng', value: '20+' }, CLB
        ],
        bio_title: 'Tiểu sử',
        bio: 'Nguyễn Quốc An là Phó Chủ Nhiệm CLB Võ Cổ Truyền HUTECH, chuyên gia về quyền thuật và đối kháng. Với 8 năm kinh nghiệm, anh là một trong những võ sĩ trẻ xuất sắc nhất của CLB, đặc biệt nổi bật ở nội dung thi đấu quyền thuật.\n\nThành tích đáng chú ý nhất là đạt cả Huy chương Vàng lẫn Huy chương Bạc tại Liên hoan Võ thuật Quốc tế 2024 — minh chứng cho sự toàn diện trong kỹ thuật thi đấu. Anh hiện đang phụ trách đào tạo đội tuyển thi đấu của CLB.',
        ach_title: 'Thành tích nổi bật',
        achievements: [
            { year: '2018', title: 'Vô Địch Đại hội Thể Dục Thể Thao 2018 – Quyền thuật', desc: 'Thi đấu nội dung quyền thuật cá nhân, đạt thành tích cao nhất.', medal: 'gold', medal_text: 'Huy chương Vàng' },
            { year: '2022', title: 'Đại hội Thể Dục Thể Thao 2022 – Quyền thuật', desc: 'Thi đấu nội dung quyền thuật cá nhân, đạt thành tích cao nhất.', medal: 'silver', medal_text: 'Huy chương Bạc' },
            { year: '2023', title: 'Liên hoan Võ thuật Quốc tế 2023 – Quyền thuật', desc: 'Thi đấu nội dung quyền thuật cá nhân, đạt thành tích cao nhất.', medal: 'silver', medal_text: 'Huy chương Bạc' },
            { year: '2024', title: 'Đại hội Thể Dục Thể Thao 2024 – Quyền Thuật', desc: 'Thi đấu nội dung đối kháng cá nhân.', medal: 'silver', medal_text: 'Huy chương Bạc' },
            { year: '2024', title: 'Liên hoan Võ thuật Quốc tế 2024 – Quyền Thuật', desc: 'Thi đấu nội dung đối kháng cá nhân.', medal: 'bronze', medal_text: 'Huy chương Đồng' },
            { year: '2025', title: 'Liên Hoan Võ Cổ Truyền TP.HCM', desc: 'Tham dự nội dung đối kháng và quyền thuật.', medal: 'gold', medal_text: 'Huy chương Vàng' }
        ],
        gallery: ['assets/images_Avatar/Avatar_An_3.jpg', 'assets/images_CLB/Hinh_CLB_3.jpg', 'assets/images_CLB/Hinh_CLB_4.jpg']
    },
    {
        slug: 'pham-dac-truong-huy', full_name: 'Phạm Đắc Trường Huy', short_name: 'Phạm Đắc Trường Huy',
        role: 'HLV Quyền Thuật', group_key: 'coach', role_icon: 'dumbbell', show_home: false, sort_order: 1,
        avatar: 'assets/images_Avatar/huy.jpg',
        card_details: [
            { label: 'Kinh nghiệm', value: '2 năm' }, { label: 'Chuyên môn', value: 'Quyền thuật' },
            { label: 'Bằng cấp', value: 'Đang cập nhật' }, { label: 'Nổi bật', value: 'Thành viên xuất sắc CLB' }
        ],
        stats: [ { value: '2', label: 'Năm KN' }, { value: 'Quyền', label: 'Chuyên môn' }, { value: 'CLB', label: 'HUTECH' } ],
        info: [
            { label: 'Vai trò', value: 'Huấn luyện viên' }, { label: 'Chuyên môn', value: 'Quyền thuật' },
            { label: 'Kinh nghiệm', value: '2 năm' }, { label: 'Bằng cấp', value: 'Đang cập nhật' }, CLB
        ],
        bio_title: 'Giới thiệu',
        bio: 'Phạm Đắc Trường Huy là Huấn Luyện Viên Quyền Thuật của CLB Võ Cổ Truyền HUTECH. Với chuyên môn sâu về quyền thuật, anh đảm nhận vai trò đào tạo và hướng dẫn các học viên trong CLB.\n\nLà thành viên xuất sắc của CLB, Trường Huy luôn nỗ lực truyền đạt kỹ thuật và tinh thần võ đạo đến các thế hệ học viên trẻ, góp phần duy trì và phát triển phong trào võ cổ truyền tại HUTECH.',
        ach_title: 'Thành tích & Hoạt động',
        achievements: COACH_ACH.concat([
            { year: '', title: 'Huấn luyện quyền thuật', desc: 'Trực tiếp hướng dẫn và đào tạo học viên về kỹ thuật quyền thuật cơ bản và nâng cao.', medal: '', medal_text: '' },
            { year: '', title: 'Tham gia thi đấu', desc: 'Đại diện CLB tham dự các giải đấu võ cổ truyền cấp trường và thành phố.', medal: '', medal_text: '' }
        ]),
        gallery: ['assets/images_Tap_Luyen/Hinh_Tap_Luyen_1.jpg', 'assets/images_Tap_Luyen/Hinh_Tap_Luyen_2.jpg', 'assets/images_CLB/Hinh_CLB_1.jpg']
    },
    {
        slug: 'ho-minh-thuan', full_name: 'Hồ Minh Thuận', short_name: 'Hồ Minh Thuận',
        role: 'Huấn Luyện Viên', group_key: 'coach', role_icon: 'dumbbell', show_home: false, sort_order: 2,
        avatar: 'assets/images_Avatar/Thuan.jpg',
        card_details: [
            { label: 'Kinh nghiệm', value: '2 năm' }, { label: 'Chuyên môn', value: 'Đối kháng' },
            { label: 'Bằng cấp', value: 'Đang cập nhật' }, { label: 'Nổi bật', value: 'Thành viên xuất sắc CLB' }
        ],
        stats: [ { value: '2', label: 'Năm KN' }, { value: 'Thiếu nhi', label: 'Chuyên môn' }, { value: 'CLB', label: 'HUTECH' } ],
        info: [
            { label: 'Vai trò', value: 'Huấn luyện viên' }, { label: 'Chuyên môn', value: 'Thiếu nhi, Đối kháng' },
            { label: 'Kinh nghiệm', value: '2 năm' }, { label: 'Bằng cấp', value: 'Đang cập nhật' }, CLB
        ],
        bio_title: 'Giới thiệu',
        bio: 'Hồ Minh Thuận là Huấn Luyện Viên của CLB Võ Cổ Truyền HUTECH, chuyên về đào tạo thiếu nhi và đối kháng. Anh là một trong những HLV trẻ nhiệt huyết, luôn tận tâm với công việc giảng dạy.\n\nVới phương pháp đào tạo phù hợp với từng lứa tuổi, đặc biệt là thiếu nhi, Minh Thuận đã giúp nhiều em nhỏ tiếp cận và yêu thích võ cổ truyền từ sớm, góp phần phát triển phong trào võ thuật truyền thống.',
        ach_title: 'Thành tích & Hoạt động',
        achievements: COACH_ACH.concat([
            { year: '', title: 'Đào tạo thiếu nhi', desc: 'Phụ trách lớp học thiếu nhi, xây dựng chương trình đào tạo phù hợp với lứa tuổi.', medal: '', medal_text: '' },
            { year: '', title: 'Huấn luyện đối kháng', desc: 'Hướng dẫn kỹ thuật đối kháng cho học viên chuẩn bị thi đấu.', medal: '', medal_text: '' },
            { year: '', title: 'Tham gia thi đấu', desc: 'Đại diện CLB tham dự các giải đấu võ cổ truyền cấp trường và thành phố.', medal: '', medal_text: '' }
        ]),
        gallery: ['assets/images_Tap_Luyen/Hinh_Tap_Luyen_1.jpg', 'assets/images_Tap_Luyen/Hinh_Tap_Luyen_3.jpg', 'assets/images_CLB/Hinh_CLB_2.jpg']
    },
    {
        slug: 'xuan-giang', full_name: 'Xuân Giang', short_name: 'Xuân Giang',
        role: 'Trưởng Ban Truyền Thông', group_key: 'media', role_icon: 'bullhorn', show_home: false, sort_order: 1,
        avatar: 'assets/images_Avatar/giang.jpg',
        card_details: [ { label: 'Vai trò', value: 'Trưởng ban' }, { label: 'Ban', value: 'Truyền thông' } ],
        stats: [ { value: 'Ban', label: 'Truyền thông' }, { value: 'Trưởng', label: 'Vai trò' }, { value: 'CLB', label: 'HUTECH' } ],
        info: [ { label: 'Vai trò', value: 'Trưởng ban' }, { label: 'Ban', value: 'Truyền thông' }, CLB ],
        bio_title: 'Giới thiệu',
        bio: 'Xuân Giang là Trưởng Ban Truyền Thông của CLB Võ Cổ Truyền HUTECH, người chịu trách nhiệm xây dựng và phát triển hình ảnh CLB trên các nền tảng truyền thông.\n\nVới niềm đam mê võ thuật và khả năng sáng tạo nội dung, Xuân Giang đã góp phần đưa hình ảnh CLB đến gần hơn với cộng đồng sinh viên HUTECH và các bạn yêu thích võ cổ truyền.',
        ach_title: 'Nhiệm vụ',
        achievements: [
            { year: '', title: 'Quản lý truyền thông', desc: 'Phụ trách fanpage, website và các kênh mạng xã hội của CLB.', medal: '', medal_text: '' },
            { year: '', title: 'Sản xuất nội dung', desc: 'Lên kế hoạch và sản xuất nội dung ảnh, video cho các hoạt động CLB.', medal: '', medal_text: '' },
            { year: '', title: 'Truyền thông sự kiện', desc: 'Đảm bảo các sự kiện, giải đấu của CLB được truyền thông rộng rãi.', medal: '', medal_text: '' }
        ],
        gallery: ['assets/images_CLB/Hinh_CLB_1.jpg', 'assets/images_CLB/Hinh_CLB_2.jpg', 'assets/images_CLB/Hinh_CLB_3.jpg']
    },
    {
        slug: 'kim-nga', full_name: 'Kim Nga', short_name: 'Kim Nga',
        role: 'Thành Viên Truyền Thông', group_key: 'media', role_icon: 'bullhorn', show_home: false, sort_order: 2,
        avatar: 'assets/images_Avatar/kim_nga1.jpg',
        card_details: [ { label: 'Vai trò', value: 'Thành viên' }, { label: 'Ban', value: 'Truyền thông' } ],
        stats: [ { value: 'Ban', label: 'Truyền thông' }, { value: 'Thành viên', label: 'Vai trò' }, { value: 'CLB', label: 'HUTECH' } ],
        info: [ { label: 'Vai trò', value: 'Thành viên' }, { label: 'Ban', value: 'Truyền thông' }, CLB ],
        bio_title: 'Giới thiệu',
        bio: 'Kim Nga là thành viên Ban Truyền Thông của CLB Võ Cổ Truyền HUTECH, đóng góp tích cực vào việc xây dựng nội dung và hình ảnh cho CLB.\n\nVới sự nhiệt tình và sáng tạo, Kim Nga luôn nỗ lực mang đến những nội dung chất lượng, giúp CLB tiếp cận được nhiều bạn sinh viên hơn và lan tỏa tinh thần võ thuật truyền thống.',
        ach_title: 'Nhiệm vụ',
        achievements: MEDIA_TASKS,
        gallery: ['assets/images_Avatar/kim_nga2.jpg', 'assets/images_CLB/Hinh_CLB_1.jpg', 'assets/images_CLB/Hinh_CLB_2.jpg']
    },
    {
        slug: 'bao-anh', full_name: 'Bảo Ánh', short_name: 'Bảo Ánh',
        role: 'Thành Viên Truyền Thông', group_key: 'media', role_icon: 'bullhorn', show_home: false, sort_order: 3,
        avatar: '',
        card_details: [ { label: 'Vai trò', value: 'Thành viên' }, { label: 'Ban', value: 'Truyền thông' } ],
        stats: [ { value: 'Ban', label: 'Truyền thông' }, { value: 'Thành viên', label: 'Vai trò' }, { value: 'CLB', label: 'HUTECH' } ],
        info: [ { label: 'Vai trò', value: 'Thành viên' }, { label: 'Ban', value: 'Truyền thông' }, CLB ],
        bio_title: 'Giới thiệu',
        bio: 'Bảo Ánh là thành viên Ban Truyền Thông của CLB Võ Cổ Truyền HUTECH, góp phần xây dựng và phát triển hình ảnh CLB trên các nền tảng số.\n\nVới tinh thần nhiệt huyết và sáng tạo, Bảo Ánh luôn đồng hành cùng đội ngũ truyền thông để mang đến những nội dung ý nghĩa, lan tỏa giá trị của võ cổ truyền đến cộng đồng sinh viên.',
        ach_title: 'Nhiệm vụ',
        achievements: MEDIA_TASKS,
        gallery: ['assets/images_CLB/Hinh_CLB_1.jpg', 'assets/images_CLB/Hinh_CLB_2.jpg', 'assets/images_CLB/Hinh_CLB_3.jpg']
    }
];
