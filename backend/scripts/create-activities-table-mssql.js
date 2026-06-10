require('dotenv').config();
const db = require('../config/db');

async function main() {
  try {
    await db.query(`
IF OBJECT_ID('activities', 'U') IS NULL
BEGIN
  CREATE TABLE activities (
    id INT IDENTITY(1,1) PRIMARY KEY,
    title NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX) NULL,
    type NVARCHAR(50) NOT NULL DEFAULT 'achievement',
    medal NVARCHAR(100) NULL,
    [year] INT NOT NULL DEFAULT YEAR(GETDATE()),
    image NVARCHAR(500) NULL,
    sort_order INT NOT NULL DEFAULT 0,
    status NVARCHAR(50) NOT NULL DEFAULT 'active',
    created_by INT NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
  );

  CREATE INDEX idx_activities_status ON activities(status);
  CREATE INDEX idx_activities_year ON activities([year] DESC);
  CREATE INDEX idx_activities_sort ON activities(sort_order ASC);
END
`);

    const countRows = await db.query('SELECT COUNT(*) AS cnt FROM activities');
    const count = Number(countRows?.[0]?.[0]?.cnt || 0);

    if (count === 0) {
      await db.query(`
INSERT INTO activities (title, description, type, medal, [year], sort_order, status)
VALUES
  (N'Giai III Toan Doan VLU 2024', N'Thanh tich xuat sac cua CLB', 'achievement', 'bronze', 2024, 1, 'active'),
  (N'HCV HCB Lien hoan Quoc te 2024', N'Thanh tich noi bat tai giai quoc te', 'achievement', 'gold', 2025, 2, 'active'),
  (N'Team Building 2025', N'Hoat dong ngoai khoa gan ket thanh vien', 'event', 'special', 2025, 3, 'active');
`);
    }

    const verifyRows = await db.query('SELECT COUNT(*) AS cnt FROM activities');
    console.log('activities_count=', verifyRows?.[0]?.[0]?.cnt);
  } catch (error) {
    console.error('create-activities-table-mssql failed:', error.message);
    process.exitCode = 1;
  } finally {
    if (db.end) {
      await db.end();
    }
  }
}

main();
