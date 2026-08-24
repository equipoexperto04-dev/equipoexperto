-- =============================================================
-- 16. INBOX CONVERSATIONS  (Omnichannel Inbox)
-- =============================================================
CREATE TABLE IF NOT EXISTS inbox_conversations (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    contact_phone     VARCHAR(50),
    contact_email     VARCHAR(255),
    contact_name      VARCHAR(255),
    channel           VARCHAR(50)  NOT NULL DEFAULT 'whatsapp',
    last_message_time TIMESTAMPTZ  DEFAULT NOW(),
    last_message_text TEXT,
    is_read           BOOLEAN      DEFAULT FALSE,
    created_at        TIMESTAMPTZ  DEFAULT NOW(),
    updated_at        TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inbox_conv_user
    ON inbox_conversations (user_id);
