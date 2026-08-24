import nodemailer from 'nodemailer';

export default async function handler(req, res) {
    // 1. CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Method Not Allowed' });
    }

    try {
        const { smtpConfig, mailOptions, secretToken } = req.body;

        // 2. Authenticate Request
        const systemSecret = process.env.VERCEL_MAILER_SECRET;
        if (!systemSecret || secretToken !== systemSecret) {
            return res.status(401).json({ success: false, error: 'Unauthorized: Invalid secretToken' });
        }

        if (!smtpConfig || !mailOptions) {
            return res.status(400).json({ success: false, error: 'Missing smtpConfig or mailOptions payload' });
        }

        // 3. Create Transporter
        const transportOpts = {
            host: smtpConfig.host,
            port: Number(smtpConfig.port) || 587,
            secure: smtpConfig.secure === true || smtpConfig.secure === 'true',
            auth: {
                user: smtpConfig.auth_user || smtpConfig.auth?.user,
                pass: smtpConfig.auth_pass || smtpConfig.auth?.pass,
            },
            tls: { rejectUnauthorized: false },
            connectionTimeout: 8000,
            greetingTimeout: 5000,
            socketTimeout: 8000,
        };

        const transporter = nodemailer.createTransport(transportOpts);

        // 4. Send Email
        const info = await transporter.sendMail(mailOptions);

        return res.status(200).json({
            success: true,
            messageId: info.messageId,
            response: info.response,
        });

    } catch (err) {
        console.error('[VercelMailer] Send failed:', err.message);
        return res.status(500).json({
            success: false,
            error: err.message,
            code: err.code || 'SMTP_SEND_FAILED',
        });
    }
}
