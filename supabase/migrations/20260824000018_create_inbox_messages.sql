-- =============================================================
-- 17. INBOX MESSAGES
-- =============================================================
CREATE TABLE IF NOT EXISTS inbox_messages (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID        NOT NULL REFERENCES inbox_conversations(id) ON DELETE CASCADE,
    sender_type     VARCHAR(50)  NOT NULL,   -- 'contact' or 'business'
    text            TEXT,
    is_read         BOOLEAN      DEFAULT FALSE,
    created_at      TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inbox_msg_conv
    ON inbox_messages (conversation_id);
