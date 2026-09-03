import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../src/db/pool.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const sampleIssues = [
    {
        name: 'Maria Garcia',
        email: 'maria.garcia@example.es',
        subject: 'Question regarding Stripe billing plan upgrade',
        message: 'Hello, I tried to upgrade from the Starter to the Pro Plan, but my card was declined. Could you please check if international payments are enabled for my account?',
        priority: 'high',
        status: 'open',
        source: 'navbar_support'
    },
    {
        name: 'David Rodriguez',
        email: 'david.rodriguez@techstudio.io',
        subject: 'Google Business Review Link integration issue',
        message: 'The review booster link isn\'t automatically fetching our Google Place ID when we enter our business address. Can someone help configure this manually?',
        priority: 'medium',
        status: 'in_progress',
        source: 'floating_widget'
    },
    {
        name: 'Laura Fernandez',
        email: 'l.fernandez@clinicasalud.es',
        subject: 'Feedback: WhatsApp follow-up message delay',
        message: 'We noticed a 5 minute delay in sending automated WhatsApp follow-up messages after a customer leaves 5-star feedback. Is this expected behavior?',
        priority: 'low',
        status: 'resolved',
        source: 'contact_form'
    },
    {
        name: 'Carlos Mendez',
        email: 'carlos.mendez@consulting.com',
        subject: 'Urgent: Unable to export leads CSV file',
        message: 'Clicking Export CSV in the Leads Hub throws a timeout error when exporting more than 500 leads. Please resolve ASAP as our sales team needs this for weekly reporting.',
        priority: 'urgent',
        status: 'open',
        source: 'dashboard_support'
    }
];

async function seedCustomerIssues() {
    console.log('\n=========================================');
    console.log('🌱 SEEDING CUSTOMER ISSUES INTO DATABASE');
    console.log('=========================================\n');

    try {
        // Ensure table exists
        await pool.query(`
            CREATE TABLE IF NOT EXISTS support_tickets (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(255),
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                subject VARCHAR(255),
                message TEXT NOT NULL,
                status VARCHAR(50) DEFAULT 'open',
                priority VARCHAR(50) DEFAULT 'medium',
                source VARCHAR(50) DEFAULT 'website',
                admin_notes TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);

        for (const issue of sampleIssues) {
            const query = `
                INSERT INTO support_tickets (name, email, subject, message, priority, status, source, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() - (random() * interval '3 days'), NOW())
                RETURNING id, name, email, subject, status, priority;
            `;
            const res = await pool.query(query, [
                issue.name,
                issue.email,
                issue.subject,
                issue.message,
                issue.priority,
                issue.status,
                issue.source
            ]);
            console.log(` ✅ Created Ticket #${res.rows[0].id}: "${res.rows[0].subject}" (${res.rows[0].status.toUpperCase()})`);
        }

        console.log('\n🎉 SUCCESS: Sample customer issues seeded successfully!');
        console.log('👉 You can now view these customer issues on the Admin Panel (/admin).\n');
        process.exit(0);
    } catch (err) {
        console.error('❌ SEEDING FAILED:', err.message);
        process.exit(1);
    }
}

seedCustomerIssues();
