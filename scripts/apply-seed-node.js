#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration
const SUPABASE_URL = 'https://ccmciliwfdtdspdlkuos.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DATABASE_URL = `postgresql://postgres:hh8tP8TL2pQhCSst@db.ccmciliwfdtdspdlkuos.supabase.co:5432/postgres`;

console.log('🚀 Applying seed data to UAT database...\n');

// Read seed file
const seedPath = path.join(__dirname, '..', 'supabase', 'seed.sql');
if (!fs.existsSync(seedPath)) {
    console.error('❌ Error: seed.sql file not found at:', seedPath);
    process.exit(1);
}

console.log('📄 Reading seed file...');
const seedSQL = fs.readFileSync(seedPath, 'utf8');

// Parse and execute SQL statements
async function applySeed() {
    try {
        // Use pg library for direct database connection
        const { Client } = require('pg');
        const client = new Client({
            connectionString: DATABASE_URL,
        });

        console.log('🔗 Connecting to database...');
        await client.connect();

        console.log('💾 Executing seed data...');

        // Split SQL into individual statements (basic split on semicolon)
        // Note: This is a simple approach and might not work for complex SQL
        const statements = seedSQL.split(/;\s*$/gm).filter(stmt => stmt.trim());

        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < statements.length; i++) {
            const stmt = statements[i].trim();
            if (!stmt) continue;

            try {
                await client.query(stmt);
                successCount++;
                process.stdout.write('.');
            } catch (err) {
                errorCount++;
                console.error(`\n❌ Error in statement ${i + 1}:`, err.message.substring(0, 100));
                // Continue with other statements
            }
        }

        console.log(`\n\n✅ Seed application complete!`);
        console.log(`   Successful statements: ${successCount}`);
        console.log(`   Failed statements: ${errorCount}`);

        await client.end();
        process.exit(errorCount > 0 ? 1 : 0);
    } catch (error) {
        console.error('❌ Fatal error:', error.message);
        process.exit(1);
    }
}

// Check if pg is installed
try {
    require.resolve('pg');
    applySeed();
} catch (e) {
    console.log('📦 Installing pg library...');
    const { execSync } = require('child_process');
    execSync('npm install pg', { stdio: 'inherit' });
    applySeed();
}