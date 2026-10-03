ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'Customer' CHECK (role IN ('Customer','Seller','Admin'));
ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active','Suspended'));
ALTER TABLE users ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN preferences JSONB NOT NULL DEFAULT '{"email":false,"enquiries":true}';
CREATE TABLE stores (
 user_id UUID PRIMARY KEY REFERENCES users(id), slug TEXT UNIQUE NOT NULL,
 name TEXT NOT NULL, city TEXT NOT NULL, description TEXT NOT NULL, type TEXT NOT NULL CHECK(type IN ('Business','Individual')),
 reference TEXT NOT NULL DEFAULT '', verification TEXT NOT NULL DEFAULT 'Pending' CHECK(verification IN ('Pending','Approved','Rejected')),
 review_note TEXT NOT NULL DEFAULT '', created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE listings (
 id UUID PRIMARY KEY, owner_id UUID NOT NULL REFERENCES users(id), slug TEXT UNIQUE NOT NULL,
 data JSONB NOT NULL, status TEXT NOT NULL CHECK(status IN ('Draft','Pending','Published','Paused','Sold','Archived','Rejected')),
 featured BOOLEAN NOT NULL DEFAULT false, moderation_note TEXT NOT NULL DEFAULT '',
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ
);
CREATE INDEX listings_owner_idx ON listings(owner_id);
CREATE INDEX listings_public_idx ON listings(status, created_at DESC) WHERE deleted_at IS NULL;
CREATE TABLE media (id UUID PRIMARY KEY, owner_id UUID NOT NULL REFERENCES users(id), content BYTEA NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE favourites (user_id UUID REFERENCES users(id) ON DELETE CASCADE, listing_id UUID REFERENCES listings(id), PRIMARY KEY(user_id,listing_id));
CREATE TABLE recent_views (user_id UUID REFERENCES users(id) ON DELETE CASCADE, listing_id UUID REFERENCES listings(id), viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(), PRIMARY KEY(user_id,listing_id));
CREATE TABLE listing_views (listing_id UUID REFERENCES listings(id), viewer_hash TEXT NOT NULL, day DATE NOT NULL DEFAULT CURRENT_DATE, PRIMARY KEY(listing_id,viewer_hash,day));
CREATE TABLE enquiries (id UUID PRIMARY KEY, listing_id UUID NOT NULL REFERENCES listings(id), buyer_id UUID NOT NULL REFERENCES users(id), seller_id UUID NOT NULL REFERENCES users(id), status TEXT NOT NULL DEFAULT 'New' CHECK(status IN ('New','Read','Replied','Closed')), created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX enquiries_buyer_idx ON enquiries(buyer_id);
CREATE INDEX enquiries_seller_idx ON enquiries(seller_id);
CREATE TABLE messages (id UUID PRIMARY KEY, enquiry_id UUID NOT NULL REFERENCES enquiries(id), author_id UUID NOT NULL REFERENCES users(id), text TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX messages_enquiry_idx ON messages(enquiry_id,created_at);
CREATE TABLE reviews (id UUID PRIMARY KEY, seller_id UUID NOT NULL REFERENCES users(id), author_id UUID NOT NULL REFERENCES users(id), rating INT NOT NULL CHECK(rating BETWEEN 1 AND 5), text TEXT NOT NULL, reply TEXT NOT NULL DEFAULT '', created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(seller_id,author_id));
CREATE TABLE notifications (id UUID PRIMARY KEY, user_id UUID NOT NULL REFERENCES users(id), text TEXT NOT NULL, read BOOLEAN NOT NULL DEFAULT false, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX notifications_user_idx ON notifications(user_id,created_at DESC);
CREATE TABLE reports (id UUID PRIMARY KEY, reporter_id UUID NOT NULL REFERENCES users(id), listing_id UUID NOT NULL REFERENCES listings(id), reason TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'Open' CHECK(status IN ('Open','Resolved','Dismissed')), note TEXT NOT NULL DEFAULT '', created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE articles (id UUID PRIMARY KEY, slug TEXT NOT NULL UNIQUE, data JSONB NOT NULL, status TEXT NOT NULL CHECK(status IN ('Draft','Published')), created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE reference_data (kind TEXT PRIMARY KEY CHECK(kind IN ('Categories','Brands','Models','Locations')), items JSONB NOT NULL);
INSERT INTO reference_data VALUES ('Categories','["Brakes","Engine","Lighting","Suspension","Electrical","Body & exterior"]'),('Brands','["Toyota","Honda","Suzuki","Nissan","Mitsubishi","Mazda"]'),('Models','["Prius","Fit","Alto","Axio","Vezel"]'),('Locations','["Colombo","Kandy","Galle","Kurunegala","Gampaha"]');
CREATE TABLE audit_logs (id UUID PRIMARY KEY, actor_id UUID REFERENCES users(id), action TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE FUNCTION deny_audit_changes() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Audit records are append-only'; END $$;
CREATE TRIGGER immutable_audit BEFORE UPDATE OR DELETE ON audit_logs FOR EACH ROW EXECUTE FUNCTION deny_audit_changes();
CREATE TABLE contacts (id UUID PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL, topic TEXT NOT NULL, message TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'Open' CHECK(status IN ('Open','Resolved')), created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE account_tokens (token_hash TEXT PRIMARY KEY, user_id UUID NOT NULL REFERENCES users(id), purpose TEXT NOT NULL CHECK(purpose IN ('verify','reset')), expires_at TIMESTAMPTZ NOT NULL);
CREATE TABLE mail_outbox (id UUID PRIMARY KEY, recipient TEXT NOT NULL, subject TEXT NOT NULL, body TEXT NOT NULL, attempts INT NOT NULL DEFAULT 0, available_at TIMESTAMPTZ NOT NULL DEFAULT now(), sent_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
