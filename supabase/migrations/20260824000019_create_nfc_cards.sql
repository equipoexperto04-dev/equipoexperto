-- =============================================================
-- 18. NFC CARDS
-- =============================================================
CREATE TABLE IF NOT EXISTS nfc_cards (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    funnel_id  VARCHAR(50)  NOT NULL,
    card_name  VARCHAR(255) NOT NULL,
    short_code VARCHAR(20)  UNIQUE NOT NULL,
    scans      INTEGER      DEFAULT 0,
    created_at TIMESTAMPTZ  DEFAULT NOW(),
    updated_at TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nfc_user
    ON nfc_cards (user_id);
