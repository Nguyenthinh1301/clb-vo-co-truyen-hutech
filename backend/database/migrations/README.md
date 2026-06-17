# Database Migrations

## Overview

This folder contains database migration scripts for incremental schema changes.

## Available Migrations

### 001_increase_varchar_limits.sql
**Date:** 2026-06-10  
**Purpose:** Fix "value too long for type character varying(500)" error

**Changes:**
- Increase `news.excerpt` from VARCHAR(500) to VARCHAR(1000)
- Increase `news.tags` from VARCHAR(500) to VARCHAR(1000)
- Increase `news.featured_image` from VARCHAR(500) to VARCHAR(1000)
- Increase `gallery_albums.cover_image` from VARCHAR(500) to VARCHAR(1000)
- Increase `events.featured_image` from VARCHAR(500) to VARCHAR(1000)
- Increase `announcements.image_url` from VARCHAR(500) to VARCHAR(1000)
- Increase `reviews.avatar_url` from VARCHAR(500) to VARCHAR(1000)

**Reason:** 
Long content, image URLs (especially from Cloudinary), and excerpts were exceeding 500 character limit.

## How to Run Migrations

### Option 1: Using Node.js Script (Recommended)

```bash
cd backend
node scripts/run-migration.js 001_increase_varchar_limits.sql
```

### Option 2: Using psql (Manual)

```bash
# Connect to production database
psql $DATABASE_URL

# Run migration
\i backend/database/migrations/001_increase_varchar_limits.sql
```

### Option 3: Using Render Dashboard

1. Go to https://dashboard.render.com
2. Select your database
3. Click "Connect" → "External Connection"
4. Copy connection string
5. Use psql to connect and run migration

## Verification

After running migration, verify the changes:

```sql
-- Check column types
SELECT 
    column_name, 
    data_type, 
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'news' 
AND column_name IN ('excerpt', 'tags', 'featured_image');
```

Expected output:
```
 column_name    | data_type         | character_maximum_length
----------------+-------------------+------------------------
 excerpt        | character varying | 1000
 tags           | character varying | 1000
 featured_image | character varying | 1000
```

## Rollback

If needed, to rollback:

```sql
ALTER TABLE news ALTER COLUMN excerpt TYPE VARCHAR(500);
ALTER TABLE news ALTER COLUMN tags TYPE VARCHAR(500);
ALTER TABLE news ALTER COLUMN featured_image TYPE VARCHAR(500);
-- ... etc
```

**Note:** Rollback will fail if any existing data exceeds 500 characters.

## Production Deployment

### Step 1: Backup Database (Important!)

```bash
# Render dashboard → Database → Backups
# Or use pg_dump
pg_dump $DATABASE_URL > backup_before_migration_$(date +%Y%m%d).sql
```

### Step 2: Run Migration

```bash
# SSH to Render or use local with production DATABASE_URL
export DATABASE_URL="postgresql://..."
node backend/scripts/run-migration.js 001_increase_varchar_limits.sql
```

### Step 3: Verify

```bash
# Test creating news with long content
curl -X POST https://clb-vo-co-truyen-hutech.onrender.com/api/cms/news \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test",
    "content": "Content",
    "excerpt": "'"$(head -c 600 < /dev/zero | tr '\0' 'A')"'"
  }'
```

### Step 4: Deploy Updated Schema

Push updated `pg-schema.sql` to GitHub so new deployments use the updated schema.

## Notes

- Always backup before running migrations
- Test migrations on development database first
- Migrations are run manually, not automatically
- Keep migration scripts for documentation purposes
- Each migration should be idempotent when possible

## Troubleshooting

### Error: "column does not exist"
Check if migration was already run or table schema is different.

### Error: "permission denied"
Ensure DATABASE_URL has write permissions.

### Error: "syntax error"
Check SQL syntax in migration file.

## Future Migrations

When creating new migrations:

1. Create file: `XXX_description.sql` (increment number)
2. Add documentation in this README
3. Test on development database
4. Backup production database
5. Run on production
6. Update schema files
7. Commit everything to Git
