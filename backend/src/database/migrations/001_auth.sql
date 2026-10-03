CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(254) NOT NULL UNIQUE CHECK (email = lower(trim(email))),
  password_hash TEXT NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(25) NOT NULL,
  city VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE auth_sessions (
  token_hash CHAR(64) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX auth_sessions_user_id_idx ON auth_sessions(user_id);
CREATE INDEX auth_sessions_expires_at_idx ON auth_sessions(expires_at);
