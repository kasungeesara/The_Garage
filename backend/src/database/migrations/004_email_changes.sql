ALTER TABLE account_tokens DROP CONSTRAINT account_tokens_purpose_check;
ALTER TABLE account_tokens ADD CONSTRAINT account_tokens_purpose_check CHECK(purpose IN ('verify','reset','email'));
ALTER TABLE account_tokens ADD COLUMN target_email VARCHAR(254);
