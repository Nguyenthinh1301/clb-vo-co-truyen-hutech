/**
 * Tạo bảng activities trên PostgreSQL production
 * Chạy: node scripts/create-activities-table.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env.production') });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    const client = await pool.connect();
    try {
        console.log('Creating activities table...');

        await client.query(`
            CREATE TABLE IF NOT EXISTS activities (
                id          SERIAL PRIMARY KEY,
                title       VARCHAR(255) NOT NULL,
                description TEXT,
                type        VARCHAR(50)  DEFAULT 'achievement'
                                CHECK (type IN ('achievement','performance','event','training','other')),
                medal       VARCHAR(100),
                year        INT          DEFAULT EXTRACT(YEAR FROM NOW()),
                image       VARCHAR(500),
                sort_order  INT          DEFAULT 0,
                status      VARCHAR(50)  DEFAULT 'active'
                                CHECK (status IN ('active','inactive')),
                created_by  INT REFERENCES users(id) ON DELETE SET NULL,
                created_at  TIMESTAMP    DEFAULT NOW(),
                updated_at  TIMESTAMP    DEFAULT NOW()
            )
        `);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_activities_type   ON activities(type)`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_activities_year   ON activities(year DESC)`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_activities_status ON activities(status)`);
        console.log('✅ Table created');

        // Seed dữ liệu từ trang tĩnh hiện tại
        const existing = await client.query('SELECT COUNT(*) as cnt FROM activities');
        if (parseInt(existing.rows[0].cnt) === 0) {
            console.log('Seeding initial data...');
            const seeds = [
                { title: 'Giải III Toàn Đoàn — Giải Võ Cổ Truyền Sinh Viên VLU TP.HCM 2024', description: 'Thành tích xuất sắc với sự tham gia của toàn thể học viên CLB.', type: 'achievement', medal: 'bronze', year: 2024, sort_order: 1 },
                { title: 'HCV & HCB — Giải Liên hoan Võ cổ truyền Quốc tế TP.HCM 2024', description: 'Thành tích vượt trội tại đấu trường quốc tế, khẳng định đẳng cấp của CLB.', type: 'achievement', medal: 'gold', year: 2025, sort_order: 2 },
                { title: 'HCV — Giải Liên hoan Võ cổ truyền Đất Phương Nam TP.HCM 2022', description: 'Cột mốc lịch sử — lần đầu tiên CLB đạt huy chương vàng tại giải quốc tế.', type: 'achievement', medal: 'gold', year: 2022, sort_order: 3 },
                { title: 'Thi đấu Võ nhạc Đất Phương Nam 2025', description: 'Cuộc thi đấu đại diện Trường Đại học Công nghệ TP. HCM — màn trình diễn ấn tượng.', type: 'performance', medal: 'special', year: 2025, sort_order: 4 },
                { title: 'Huy chương — Giải Võ cổ truyền Sinh viên TP.HCM 2023', description: 'Tham gia và đạt thành tích tại giải đấu đối kháng.', type: 'achievement', medal: 'silver', year: 2023, sort_order: 5 },
                { title: 'Giải nhất biểu diễn — HUTECH Global Festival 2023', description: 'Đạt giải nhất biểu diễn tại HUTECH Global Festival — sự kiện quốc tế lớn của trường.', type: 'performance', medal: 'gold', year: 2023, sort_order: 6 },
                { title: 'Biểu diễn sinh hoạt đầu khóa 2024', description: 'Tham gia giao lưu chào đón tân sinh viên — màn trình diễn ấn tượng và chuyên nghiệp.', type: 'performance', medal: 'special', year: 2024, sort_order: 7 },
                { title: 'Team Building 2025', description: 'Hoạt động ngoại khóa gắn kết thành viên CLB với các trò chơi và chia sẻ kinh nghiệm.', type: 'event', medal: 'special', year: 2025, sort_order: 8 },
            ];
            for (const s of seeds) {
                await client.query(
                    `INSERT INTO activities (title, description, type, medal, year, sort_order, status)
                     VALUES ($1,$2,$3,$4,$5,$6,'active')`,
                    [s.title, s.description, s.type, s.medal, s.year, s.sort_order]
                );
            }
            console.log(`✅ Seeded ${seeds.length} activities`);
        } else {
            console.log('ℹ️  Data already exists, skipping seed');
        }

        // Verify
        const count = await client.query('SELECT COUNT(*) as cnt FROM activities');
        console.log(`\n✅ Done! Total activities: ${count.rows[0].cnt}`);

    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

run();
