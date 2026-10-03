CREATE TABLE rate_limits (key TEXT PRIMARY KEY, hits INT NOT NULL, expires_at TIMESTAMPTZ NOT NULL, blocked_until TIMESTAMPTZ);
CREATE INDEX rate_limits_expiry_idx ON rate_limits(expires_at);
