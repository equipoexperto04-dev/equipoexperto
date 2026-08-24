(function() {
    // 1. Configuration & Constants
    const script = document.currentScript;
    const token = script.getAttribute('data-token');
    const FINAL_API_URL = (script.getAttribute('data-api-url') || '').trim().replace(/\/+$/, '');

    if (!token) {
        console.error("Montseaumate Widget: Missing data-token");
        return;
    }
    if (!FINAL_API_URL) {
        console.error('Montseaumate Widget: Add data-api-url="https://your-api.example.com" to the script tag (no trailing slash).');
        return;
    }

    // 2. Inject Styles
    const styles = `
        #mm-widget-container * {
            box-sizing: border-box;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        #mm-widget-bubble {
            position: fixed;
            bottom: 24px;
            right: 24px;
            width: 60px;
            height: 60px;
            border-radius: 30px;
            background: #6366f1;
            box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 999999;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        #mm-widget-bubble:hover {
            transform: scale(1.1) translateY(-4px);
            box-shadow: 0 15px 30px -5px rgba(99, 102, 241, 0.5);
        }
        #mm-widget-bubble svg {
            color: white;
            width: 28px;
            height: 28px;
        }
        #mm-widget-modal {
            position: fixed;
            bottom: 96px;
            right: 24px;
            width: 360px;
            max-width: calc(100vw - 48px);
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 50px -12px rgba(0, 0, 0, 0.15);
            z-index: 999999;
            overflow: hidden;
            display: none;
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.3s ease;
        }
        #mm-widget-modal.active {
            display: block;
            opacity: 1;
            transform: translateY(0);
        }
        #mm-widget-header {
            background: #6366f1;
            padding: 24px;
            color: white;
            position: relative;
        }
        #mm-widget-header h3 {
            margin: 0;
            font-size: 18px;
            font-weight: 600;
        }
        #mm-widget-header p {
            margin: 8px 0 0;
            font-size: 13px;
            opacity: 0.9;
        }
        #mm-widget-close {
            position: absolute;
            top: 16px;
            right: 16px;
            cursor: pointer;
            opacity: 0.7;
            transition: opacity 0.2s;
        }
        #mm-widget-close:hover { opacity: 1; }
        #mm-widget-form {
            padding: 24px;
        }
        .mm-input-group {
            margin-bottom: 16px;
        }
        .mm-input-group label {
            display: block;
            font-size: 12px;
            font-weight: 600;
            color: #64748b;
            margin-bottom: 6px;
            text-transform: uppercase;
            letter-spacing: 0.025em;
        }
        .mm-input-group input, .mm-input-group textarea {
            width: 100%;
            padding: 12px 16px;
            border: 1.5px solid #e2e8f0;
            border-radius: 12px;
            font-size: 14px;
            transition: border-color 0.2s;
        }
        .mm-input-group input:focus {
            outline: none;
            border-color: #6366f1;
        }
        #mm-widget-submit {
            width: 100%;
            padding: 14px;
            background: #6366f1;
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }
        #mm-widget-submit:hover { background: #4f46e5; }
        #mm-widget-submit:disabled { background: #cbd5e1; cursor: not-allowed; }
        #mm-success-view {
            padding: 40px 24px;
            text-align: center;
            display: none;
        }
        #mm-success-view.active { display: block; }
        .mm-success-icon {
            width: 50px;
            height: 50px;
            background: #dcfce7;
            color: #16a34a;
            border-radius: 25px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 16px;
        }
    `;

    const styleEl = document.createElement('style');
    styleEl.innerHTML = styles;
    document.head.appendChild(styleEl);

    // 3. Create DOM Structure
    const container = document.createElement('div');
    container.id = 'mm-widget-container';
    container.innerHTML = `
        <div id="mm-widget-bubble">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
        </div>
        <div id="mm-widget-modal">
            <div id="mm-widget-header">
                <div id="mm-widget-close">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </div>
                <h3>Let's talk!</h3>
                <p>Send us a quick message and our digital employee will reply on WhatsApp instantly.</p>
            </div>
            <div id="mm-widget-form-body">
                <form id="mm-widget-form">
                    <div class="mm-input-group">
                        <label>Your Name</label>
                        <input type="text" id="mm-name" placeholder="John Doe" required>
                    </div>
                    <div class="mm-input-group">
                        <label>WhatsApp Number</label>
                        <input type="tel" id="mm-phone" placeholder="+34 600 000 000" required>
                    </div>
                    <div class="mm-input-group">
                        <label>Email Address</label>
                        <input type="email" id="mm-email" placeholder="john@example.com" required>
                    </div>
                    <button type="submit" id="mm-widget-submit">Send Message</button>
                    <p style="font-size: 10px; color: #94a3b8; text-align: center; margin-top: 12px;">By submitting, you agree to be contacted via WhatsApp.</p>
                </form>
            </div>
            <div id="mm-success-view">
                <div class="mm-success-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <h4 style="margin: 0 0 8px; color: #1e293b;">Message Sent!</h4>
                <p style="margin: 0; font-size: 14px; color: #64748b;">Keep an eye on your WhatsApp, we're replying right now.</p>
                <button onclick="document.getElementById('mm-widget-modal').classList.remove('active')" style="margin-top: 20px; background: none; border: 1px solid #e2e8f0; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 13px;">Close</button>
            </div>
        </div>
    `;
    document.body.appendChild(container);

    // 4. Interaction Logic
    const bubble = document.getElementById('mm-widget-bubble');
    const modal = document.getElementById('mm-widget-modal');
    const close = document.getElementById('mm-widget-close');
    const form = document.getElementById('mm-widget-form');
    const submitBtn = document.getElementById('mm-widget-submit');
    const formBody = document.getElementById('mm-widget-form-body');
    const successView = document.getElementById('mm-success-view');

    bubble.onclick = () => modal.classList.toggle('active');
    close.onclick = (e) => {
        e.stopPropagation();
        modal.classList.remove('active');
    };

    form.onsubmit = async (e) => {
        e.preventDefault();
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Sending...';

        const payload = {
            full_name: document.getElementById('mm-name').value,
            phone: document.getElementById('mm-phone').value,
            email: document.getElementById('mm-email').value,
            message: "Submitted via Website Widget",
            consent_given: true,
            source: 'Website Widget'
        };

        try {
            const response = await fetch(`${FINAL_API_URL}/api/l/${token}/lead`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            
            if (data.success) {
                formBody.style.display = 'none';
                successView.classList.add('active');
                // Auto-close after 5 seconds if they don't
                setTimeout(() => modal.classList.remove('active'), 5000);
            } else {
                alert(data.message || "Error sending message. Please try again.");
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Send Message';
            }
        } catch (err) {
            console.error("Montseaumate Error:", err);
            alert("Connection error. Please check your internet.");
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Send Message';
        }
    };
})();
