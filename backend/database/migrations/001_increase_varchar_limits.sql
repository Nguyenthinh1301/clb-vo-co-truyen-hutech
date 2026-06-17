-- Migration: Increase VARCHAR limits for news table
-- Date: 2026-06-10
-- Reason: Fix "value too long for type character varying(500)" error

-- Increase excerpt from 500 to 1000 characters
ALTER TABLE news ALTER COLUMN excerpt TYPE VARCHAR(1000);

-- Increase tags from 500 to 1000 characters
ALTER TABLE news ALTER COLUMN tags TYPE VARCHAR(1000);

-- Increase featured_image from 500 to 1000 characters (for long URLs)
ALTER TABLE news ALTER COLUMN featured_image TYPE VARCHAR(1000);

-- Optional: Do the same for other tables with similar limits
-- Gallery albums
ALTER TABLE gallery_albums ALTER COLUMN cover_image TYPE VARCHAR(1000);

-- Events
ALTER TABLE events ALTER COLUMN featured_image TYPE VARCHAR(1000);

-- Announcements  
ALTER TABLE announcements ALTER COLUMN image_url TYPE VARCHAR(1000);

-- Reviews
ALTER TABLE reviews ALTER COLUMN avatar_url TYPE VARCHAR(1000);
