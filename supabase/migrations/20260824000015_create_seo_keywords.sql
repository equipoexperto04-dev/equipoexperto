-- =============================================================
-- 14. SEO KEYWORDS  (Local SEO Tracker)
-- =============================================================
CREATE TABLE IF NOT EXISTS seo_keywords (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    keyword    VARCHAR(255) NOT NULL,
    location   VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ  DEFAULT NOW(),
    updated_at TIMESTAMPTZ  DEFAULT NOW()
);
