/**
 * Script to update full_name for existing users
 * This ensures all users have the full_name field populated
 */

const db = require('../config/db');

async function updateUserFullNames() {
    try {
        console.log('🔄 Starting to update user full names...\n');

        // Get all users without full_name or with empty full_name
        const users = await db.query(
            `SELECT id, first_name, last_name, full_name, email 
             FROM users 
             WHERE full_name IS NULL OR full_name = '' OR LTRIM(RTRIM(full_name)) = ''`
        );

        if (users.length === 0) {
            console.log('✅ All users already have full_name populated!');
            process.exit(0);
        }

        console.log(`📋 Found ${users.length} users without full_name:\n`);

        let updated = 0;
        let skipped = 0;

        for (const user of users) {
            // Create full_name from first_name and last_name
            const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();

            if (fullName) {
                await db.update(
                    'users',
                    { full_name: fullName },
                    'id = ?',
                    [user.id]
                );

                console.log(`✅ Updated user ${user.id} (${user.email}): "${fullName}"`);
                updated++;
            } else {
                console.log(`⚠️  Skipped user ${user.id} (${user.email}): No first_name or last_name`);
                skipped++;
            }
        }

        console.log('\n📊 Summary:');
        console.log(`   ✅ Updated: ${updated} users`);
        console.log(`   ⚠️  Skipped: ${skipped} users`);
        console.log('\n✨ Done!');

        process.exit(0);

    } catch (error) {
        console.error('❌ Error updating user full names:', error);
        process.exit(1);
    }
}

// Run the script
updateUserFullNames();
