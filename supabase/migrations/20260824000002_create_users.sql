-- =============================================================
-- 1. USERS
-- =============================================================
CREATE TABLE IF NOT EXISTS users (
    id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name                     VARCHAR(255) NOT NULL,
    email                    VARCHAR(255) UNIQUE NOT NULL,
    password_hash            VARCHAR(255) NOT NULL,
    company_name             VARCHAR(255),
    phone                    VARCHAR(50),
    plan                     VARCHAR(50)  DEFAULT 'free',
    role                     VARCHAR(50)  DEFAULT 'owner',
    status                   VARCHAR(50)  DEFAULT 'active',
    onboarding_completed     BOOLEAN      DEFAULT false,
    weekly_reports_enabled   BOOLEAN      DEFAULT true,
    trial_ends_at            TIMESTAMPTZ,
    stripe_customer_id       VARCHAR(255),
    stripe_subscription_id   VARCHAR(255),
    auth_provider            VARCHAR(50),
    created_at               TIMESTAMPTZ  DEFAULT NOW(),
    updated_at               TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email
    ON users (email);

CREATE INDEX IF NOT EXISTS idx_users_stripe_customer
    ON users (stripe_customer_id)
    WHERE stripe_customer_id IS NOT NULL;
