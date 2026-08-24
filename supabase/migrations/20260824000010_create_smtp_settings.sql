-- =============================================================
-- 9. SMTP SETTINGS  (Custom Domain Email)
-- =============================================================
CREATE TABLE IF NOT EXISTS smtp_settings (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    host        VARCHAR(255) NOT NULL,
    port        INTEGER      NOT NULL DEFAULT 587,
    secure      BOOLEAN      DEFAULT false,
    auth_user   VARCHAR(255) NOT NULL,
    auth_pass   TEXT         NOT NULL,
    from_email  VARCHAR(255) NOT NULL,
    from_name   VARCHAR(255),
    is_active   BOOLEAN      DEFAULT false,
    created_at  TIMESTAMPTZ  DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  DEFAULT NOW()
);
