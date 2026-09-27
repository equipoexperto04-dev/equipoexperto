import pool from './pool.js';

async function migrate() {
    console.log('🔄 Running Montse Features Database Migration...');
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        await client.query(`
            CREATE TABLE IF NOT EXISTS qr_scan_logs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                employee_id VARCHAR(255),
                scanned_at TIMESTAMPTZ DEFAULT NOW(),
                ip_address VARCHAR(100),
                user_agent TEXT
            );
        `);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_qr_scans_emp ON qr_scan_logs (user_id, employee_id)`);

        await client.query(`
            CREATE TABLE IF NOT EXISTS email_dispatch_logs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                employee_id VARCHAR(255),
                recipient_email VARCHAR(255) NOT NULL,
                status VARCHAR(50) DEFAULT 'sent',
                bounced_at TIMESTAMPTZ,
                sent_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_email_dispatch_emp ON email_dispatch_logs (user_id, employee_id)`);

        await client.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS employee_id VARCHAR(255)`);
        await client.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS is_abandoned BOOLEAN DEFAULT false`);
        await client.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS email_bounced BOOLEAN DEFAULT false`);
        await client.query(`ALTER TABLE feedback ADD COLUMN IF NOT EXISTS employee_id VARCHAR(255)`);
        await client.query(`ALTER TABLE feedback ADD COLUMN IF NOT EXISTS is_unsatisfied_alert_sent BOOLEAN DEFAULT false`);
        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS facebook_pixel_id VARCHAR(100)`);
        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS chatgpt_pixel_script TEXT`);
        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS selected_onboarding_support BOOLEAN DEFAULT false`);
        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_support_paid_at TIMESTAMPTZ`);

        await client.query('COMMIT');
        console.log('✅ Montse features migration complete!');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
