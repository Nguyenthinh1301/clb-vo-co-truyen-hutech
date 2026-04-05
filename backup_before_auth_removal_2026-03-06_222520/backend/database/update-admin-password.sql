USE clb_vo_co_truyen_hutech;
GO

-- Update admin password to: admin123456
UPDATE users 
SET password_hash = '$2a$10$dB5Ypo/5alxgV22p2Y0IzeZ/.Zv82iKC8a1ickRQFWAO3i5TFPREe'
WHERE email = 'admin@vocotruyenhutech.edu.vn';
GO

-- Verify
SELECT id, email, LEFT(password_hash, 20) as password_prefix, is_active 
FROM users 
WHERE email = 'admin@vocotruyenhutech.edu.vn';
GO
