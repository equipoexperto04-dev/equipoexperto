import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

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
        console.log('🔄 Connected to database. Dropping all tables...');
        
        const tablesRes = await client.query(
            "SELECT tablename FROM pg_tables WHERE schemaname = 'public'"
        );
        
        console.log(`Found ${tablesRes.rows.length} tables to drop.`);
        
        for (const row of tablesRes.rows) {
            const tableName = row.tablename;
            console.log(`Dropping table: ${tableName}...`);
            await client.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE`);
        }
        
        console.log('✅ Dropped all tables successfully.');
    } catch (error) {
        console.error('❌ Error during database reset:', error);
        process.exit(1);
    } finally {
        if (client) {
            client.release();
        }
        await pool.end();
    }
}

run();
