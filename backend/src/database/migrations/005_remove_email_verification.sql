-- Retire pending verification links without falsely marking addresses verified.
DELETE FROM account_tokens WHERE purpose IN ('verify','email');
DELETE FROM mail_outbox WHERE sent_at IS NULL AND subject IN ('Verify your AutoPart Hub email','Confirm your new AutoPart Hub email');
