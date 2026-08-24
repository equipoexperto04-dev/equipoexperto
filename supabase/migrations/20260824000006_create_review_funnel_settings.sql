-- =============================================================
-- 5. REVIEW FUNNEL SETTINGS
-- =============================================================
CREATE TABLE IF NOT EXISTS review_funnel_settings (
    id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                  UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    automation_id            VARCHAR(50)  UNIQUE NOT NULL,
    google_review_url        VARCHAR(255) NOT NULL,
    notification_email       VARCHAR(255) NOT NULL,
    auto_response_message    TEXT,
    is_active                BOOLEAN      DEFAULT false,
    lead_capture_active      BOOLEAN      DEFAULT false,
    filtering_questions      JSONB        DEFAULT '[]',
    whatsapp_number_fallback VARCHAR(50),
    flow_json                JSONB        DEFAULT '{}',
    whatsapp_enabled         BOOLEAN      DEFAULT TRUE,  -- migrate_channel_toggles
    email_enabled            BOOLEAN      DEFAULT TRUE,  -- migrate_channel_toggles
    created_at               TIMESTAMPTZ  DEFAULT NOW(),
    updated_at               TIMESTAMPTZ  DEFAULT NOW()
);
