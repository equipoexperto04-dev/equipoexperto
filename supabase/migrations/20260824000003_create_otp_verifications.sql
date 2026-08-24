-- =============================================================
-- 2. OTP VERIFICATIONS
-- =============================================================
CREATE TABLE IF NOT EXISTS otp_verifications (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    email       VARCHAR(255) NOT NULL,
    otp_code    VARCHAR(6)   NOT NULL,
    expires_at  TIMESTAMPTZ  NOT NULL,
    created_at  TIMESTAMPTZ  DEFAULT NOW()
);
