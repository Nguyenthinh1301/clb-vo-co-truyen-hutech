/**
 * Re-seed activities với đúng tiếng Việt
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env.production') });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

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

async function run() {
    const client = await pool.connect();
    try {
        // Kiểm tra bài nào đã có (theo title)
        const existing = await client.query('SELECT title FROM activities');
        const existingTitles = new Set(existing.rows.map(r => r.title));
        
        let added = 0;
        for (const s of seeds) {
            if (!existingTitles.has(s.title)) {
                await client.query(
                    `INSERT INTO activities (title, description, type, medal, year, sort_order, status)
                     VALUES ($1,$2,$3,$4,$5,$6,'active')`,
                    [s.title, s.description, s.type, s.medal, s.year, s.sort_order]
                );
                console.log(`✅ Added: ${s.title.substring(0, 50)}`);
                added++;
            } else {
                console.log(`ℹ️  Exists: ${s.title.substring(0, 50)}`);
            }
        }

        const total = await client.query('SELECT COUNT(*) as cnt FROM activities');
        console.log(`\n✅ Done! Added ${added} new. Total: ${total.rows[0].cnt}`);
    } catch(e) {
        console.error('ERROR:', e.message);
    } finally {
        client.release();
        await pool.end();
    }
}
run();
