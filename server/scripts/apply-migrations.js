import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('❌ DATABASE_URL is not defined in the environment variables.');
    process.exit(1);
}

const normalizeDatabaseUrl = (connStr) => {
    if (!connStr) return connStr;
    try {
        const url = new URL(connStr);
        url.searchParams.delete('sslmode');
        return url.toString();
    } catch {
        return connStr;
    }
};

const shouldUseSsl = (connStr) => {
    if (!connStr) return false;
    try {
        const url = new URL(connStr);
        const host = url.hostname.toLowerCase();
        const sslMode = url.searchParams.get('sslmode');
        if (sslMode === 'disable') return false;
        if (['localhost', '127.0.0.1', '::1'].includes(host)) return false;
        return true;
    } catch {
        return false;
    }
};

const pool = new pg.Pool({
    connectionString: normalizeDatabaseUrl(connectionString),
    ssl: shouldUseSsl(connectionString) ? { rejectUnauthorized: false } : false,
});

async function run() {
    let client;
    try {
        client = await pool.connect();
        console.log('🔄 Connected to database. Starting migration runner...');
        
        // Path to the migrations directory
        const migrationsDir = path.join(__dirname, '../../supabase/migrations');
        
        if (!fs.existsSync(migrationsDir)) {
            console.error(`❌ Migrations directory does not exist: ${migrationsDir}`);
            process.exit(1);
        }
        
        // Read files and sort them alphabetically
        const files = fs.readdirSync(migrationsDir)
            .filter(f => f.endsWith('.sql'))
            .sort();
            
        console.log(`📂 Found ${files.length} migration files.\n`);
        
        for (const file of files) {
            const filePath = path.join(migrationsDir, file);
            const sql = fs.readFileSync(filePath, 'utf8');
            
            console.log(`🚀 Applying migration: ${file}...`);
            await client.query(sql);
            console.log(`✅ Applied ${file} successfully.\n`);
        }
        
        console.log('🎉 All migrations applied successfully!');
    } catch (error) {
        console.error('❌ Error during migrations execution:', error);
        process.exit(1);
    } finally {
        if (client) {
            client.release();
        }
        await pool.end();
    }
}

run();
