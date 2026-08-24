-- =============================================================
-- 6. FEEDBACK
-- =============================================================
CREATE TABLE IF NOT EXISTS feedback (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    automation_id     VARCHAR(50)  NOT NULL,
    rating_service    INTEGER      NOT NULL DEFAULT 5,
    rating_product    INTEGER      NOT NULL DEFAULT 5,
    rating_overall    INTEGER      NOT NULL DEFAULT 5,
    comment           TEXT,
    contact_requested BOOLEAN      DEFAULT false,
    customer_name     VARCHAR(255),
    customer_email    VARCHAR(255),
    customer_phone    VARCHAR(50),
    created_at        TIMESTAMPTZ  DEFAULT NOW(),
    updated_at        TIMESTAMPTZ  DEFAULT NOW()
);
