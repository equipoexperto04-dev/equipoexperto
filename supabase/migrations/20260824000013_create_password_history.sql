-- =============================================================
-- 12. PASSWORD HISTORY
-- =============================================================
CREATE TABLE IF NOT EXISTS password_history (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMPTZ  DEFAULT NOW()
);
