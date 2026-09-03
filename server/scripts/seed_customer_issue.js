import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../src/db/pool.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function seedKishoreTicket() {
    console.log('\n=========================================');
    console.log('🌱 GENERATING CUSTOMER ISSUE FOR KISHORE');
    console.log('=========================================\n');

    try {
        // Clear previous tickets
        await pool.query('TRUNCATE support_tickets RESTART IDENTITY;');

        const query = `
            INSERT INTO support_tickets (name, email, subject, message, priority, status, source, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
            RETURNING id, name, email, subject, status, priority;
        `;
        const res = await pool.query(query, [
            'Kishore',
            'kishore.05mk@gmail.com',
            'Question regarding custom domain & Stripe webhook setup',
            'Hello support team! I need assistance configuring my custom domain equipoexperto.com with the live Stripe webhook endpoint. Could you please confirm if the webhook URL is active?',
            'high',
            'open',
            'website_support'
        ]);

        const ticket = res.rows[0];
        console.log(` ✅ Ticket #${ticket.id} created successfully!`);
        console.log(`    Customer Name : ${ticket.name}`);
        console.log(`    Customer Email: ${ticket.email}`);
        console.log(`    Subject       : ${ticket.subject}`);
        console.log(`    Status        : ${ticket.status.toUpperCase()}`);
        console.log('\n👉 You can now view this ticket in the Admin Panel (/dashboard/admin/users).\n');
        process.exit(0);
    } catch (err) {
        console.error('❌ SEEDING FAILED:', err.message);
        process.exit(1);
    }
}

seedKishoreTicket();
