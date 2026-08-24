-- =============================================================
-- 4. WHATSAPP SESSIONS  (Baileys persistent auth state)
-- =============================================================
CREATE TABLE IF NOT EXISTS whatsapp_sessions (
    user_id     UUID  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key         TEXT  NOT NULL,
    value       TEXT  NOT NULL,
    updated_at  TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, key)
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_user_id
    ON whatsapp_sessions (user_id);
