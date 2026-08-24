-- =============================================================
-- 13. ERROR EVENTS  (Admin control panel)
-- =============================================================
CREATE TABLE IF NOT EXISTS error_events (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    level       VARCHAR(10)  DEFAULT 'error',
    code        VARCHAR(100),
    message     TEXT,
    stack       TEXT,
    context     JSONB        DEFAULT '{}',
    user_id     UUID,                         -- no FK; may be null / anonymous
    route       TEXT,
    method      VARCHAR(10),
    ip          VARCHAR(100),
    resolved    BOOLEAN      DEFAULT FALSE,
    resolved_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_error_events_created
    ON error_events (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_error_events_level
    ON error_events (level);
