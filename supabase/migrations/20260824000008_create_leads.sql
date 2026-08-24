-- =============================================================
-- 7. LEADS
-- =============================================================
CREATE TABLE IF NOT EXISTS leads (
    id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                  UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name                VARCHAR(255) NOT NULL,
    email                    VARCHAR(255) NOT NULL,
    phone                    VARCHAR(50)  NOT NULL,
    message                  TEXT,
    notes                    TEXT,
    source                   VARCHAR(100) DEFAULT 'QR Survey',
    lead_status              VARCHAR(50)  DEFAULT 'New',
    followup_status          VARCHAR(50)  DEFAULT 'pending',
    followup_status_reminder VARCHAR(50)  DEFAULT 'pending',
    consent_given            BOOLEAN      DEFAULT false,
    marketing_consent        BOOLEAN      DEFAULT false,
    filtering_responses      JSONB        DEFAULT '{}',
    followup_step_index      INTEGER      DEFAULT 0,
    last_followup_at         TIMESTAMPTZ,
    lead_score               INTEGER      DEFAULT 0,
    lead_score_tier          VARCHAR(10)  DEFAULT 'low',
    hot_alert_sent_at        TIMESTAMPTZ,
    created_at               TIMESTAMPTZ  DEFAULT NOW(),
    updated_at               TIMESTAMPTZ  DEFAULT NOW()
);

-- Dedup indices (partial — skip empty strings)
CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_user_email
    ON leads (user_id, lower(email))
    WHERE email IS NOT NULL AND email != '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_user_phone
    ON leads (user_id, regexp_replace(phone, '[^0-9]', '', 'g'))
    WHERE phone IS NOT NULL AND phone != '';
