-- =============================================================
-- 8. LEAD FOLLOWUP SETTINGS
-- =============================================================
CREATE TABLE IF NOT EXISTS lead_followup_settings (
    id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id              UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    is_active            BOOLEAN      DEFAULT false,
    delay_value          INTEGER      DEFAULT 24,
    delay_unit           VARCHAR(20)  DEFAULT 'hours',
    message              TEXT,
    reminder_active      BOOLEAN      DEFAULT false,
    reminder_delay_value INTEGER      DEFAULT 48,
    reminder_delay_unit  VARCHAR(20)  DEFAULT 'hours',
    reminder_message     TEXT,
    followup_sequence    JSONB        DEFAULT '[]',
    flow_json            JSONB        DEFAULT '{}',
    whatsapp_enabled     BOOLEAN      DEFAULT TRUE,  -- migrate_channel_toggles
    email_enabled        BOOLEAN      DEFAULT TRUE,  -- migrate_channel_toggles
    created_at           TIMESTAMPTZ  DEFAULT NOW(),
    updated_at           TIMESTAMPTZ  DEFAULT NOW()
);
