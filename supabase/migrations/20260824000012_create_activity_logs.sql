-- =============================================================
-- 11. ACTIVITY LOGS
-- =============================================================
CREATE TABLE IF NOT EXISTS activity_logs (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    automation_name VARCHAR(100) NOT NULL,
    trigger_type    VARCHAR(50),
    status          VARCHAR(20),
    detail          VARCHAR(255),
    metadata        JSONB,
    created_at      TIMESTAMPTZ  DEFAULT NOW()
);
