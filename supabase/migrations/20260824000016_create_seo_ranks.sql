-- =============================================================
-- 15. SEO RANKS
-- =============================================================
CREATE TABLE IF NOT EXISTS seo_ranks (
    id               UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    keyword_id       UUID    NOT NULL REFERENCES seo_keywords(id) ON DELETE CASCADE,
    rank             INTEGER  NOT NULL,
    competitors_json JSONB    DEFAULT '[]',
    created_at       TIMESTAMPTZ DEFAULT NOW()
);
