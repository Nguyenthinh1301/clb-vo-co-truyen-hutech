/**
 * Script tạo bảng reviews (Cảm nhận sinh viên)
 * Chạy: node scripts/create-reviews-table.js
 */

const mssqlDb = require('../config/mssql-database');
require('dotenv').config();

async function createReviewsTable() {
    console.log('🚀 Tạo bảng reviews...\n');

    try {
        // Kiểm tra bảng đã tồn tại chưa
        const exists = await mssqlDb.query(
            "SELECT 1 as found FROM sys.tables WHERE name = 'reviews'"
        );

        if (exists && exists.length > 0) {
            console.log('✅ Bảng reviews đã tồn tại, bỏ qua.\n');
            process.exit(0);
        }

        // Tạo bảng — dùng mssqlDb trực tiếp để tránh auto-convert của adapter
        await mssqlDb.query(`
            CREATE TABLE reviews (
                id          INT IDENTITY(1,1) PRIMARY KEY,
                author_name NVARCHAR(255)  NOT NULL,
                faculty     NVARCHAR(255)  NULL,
                year        INT            NULL,
                rating      INT            DEFAULT 5,
                content     NVARCHAR(MAX)  NOT NULL,
                avatar_url  NVARCHAR(500)  NULL,
                status      NVARCHAR(50)   DEFAULT 'active',
                created_by  INT            NULL,
                created_at  DATETIME       DEFAULT GETDATE(),
                updated_at  DATETIME       DEFAULT GETDATE()
            )
        `);
        console.log('✅ Tạo bảng reviews thành công');

        // Tạo indexes
        await mssqlDb.query(`CREATE INDEX idx_reviews_status  ON reviews(status)`);
        await mssqlDb.query(`CREATE INDEX idx_reviews_rating  ON reviews(rating)`);
        await mssqlDb.query(`CREATE INDEX idx_reviews_created ON reviews(created_at)`);
        console.log('✅ Tạo indexes thành công');

        // Seed dữ liệu mẫu — dùng adapter để tận dụng hàm insert
        const db = require('../config/db');
        const samples = [
            { author_name: 'Nguyễn Văn A', faculty: 'Khoa CNTT',      year: 2022, rating: 5, content: 'Tham gia CLB Võ Cổ Truyền HUTECH là một trong những quyết định đúng đắn nhất của mình. Không chỉ học được kỹ thuật võ thuật, mình còn rèn luyện được tính kỷ luật và tinh thần kiên trì trong cuộc sống.', status: 'active' },
            { author_name: 'Trần Thị B',   faculty: 'Khoa Kinh tế',   year: 2023, rating: 5, content: 'Mình vốn không biết gì về võ thuật, nhưng các anh chị HLV rất tận tâm và kiên nhẫn. Sau 6 tháng, mình đã có thể thi đấu và đạt huy chương tại giải sinh viên. Cảm ơn CLB rất nhiều!', status: 'active' },
            { author_name: 'Lê Minh C',    faculty: 'Khoa Cơ khí',    year: 2021, rating: 5, content: 'CLB không chỉ là nơi tập võ mà còn là gia đình thứ hai của mình ở trường. Các buổi team building, thiện nguyện cùng nhau tạo nên những kỷ niệm không thể quên.', status: 'active' },
            { author_name: 'Phạm Thị D',   faculty: 'Khoa Thiết kế',  year: 2020, rating: 5, content: 'Được biểu diễn tại HUTECH Global Festival và nhận giải nhất là kỷ niệm đáng nhớ nhất trong 4 năm đại học. Tự hào khi là thành viên của CLB Võ Cổ Truyền HUTECH!', status: 'active' },
            { author_name: 'Hoàng Văn E',  faculty: 'Khoa Luật',      year: 2024, rating: 4, content: 'Lịch tập linh hoạt ở cả hai cơ sở giúp mình dễ dàng sắp xếp thời gian. Chương trình học từ cơ bản đến nâng cao rất bài bản, phù hợp cho người mới bắt đầu như mình.', status: 'active' },
            { author_name: 'Mai Thị F',    faculty: 'Khoa Dược',      year: 2022, rating: 5, content: 'Võ cổ truyền không chỉ rèn thể lực mà còn dạy mình cách đứng vững trước khó khăn. Triết lý "thất bại lớn nhất là chưa bao giờ cố gắng" luôn là động lực của mình.', status: 'active' }
        ];

        for (const s of samples) {
            await db.insert('reviews', s);
        }
        console.log(`✅ Đã seed ${samples.length} cảm nhận mẫu`);

        console.log('\n🎉 Hoàn tất! Bảng reviews đã sẵn sàng.\n');
        process.exit(0);

    } catch (err) {
        console.error('❌ Lỗi:', err.message);
        process.exit(1);
    }
}

createReviewsTable();
