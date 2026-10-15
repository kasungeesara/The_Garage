ALTER TABLE stores ADD COLUMN shop_expires_at TIMESTAMPTZ;
ALTER TABLE stores ADD COLUMN expiry_applied_at TIMESTAMPTZ;
ALTER TABLE stores ADD COLUMN phone TEXT NOT NULL DEFAULT '';
ALTER TABLE stores ADD COLUMN whatsapp TEXT NOT NULL DEFAULT '';
ALTER TABLE stores ADD COLUMN logo TEXT NOT NULL DEFAULT '';
UPDATE stores s SET phone=u.phone,
 whatsapp=CASE WHEN u.phone ~ '^0[0-9]{9}$' THEN '94'||substring(u.phone FROM 2)
   WHEN u.phone ~ '^\+?[1-9][0-9]{7,14}$' THEN u.phone ELSE '' END
 FROM users u WHERE u.id=s.user_id;
ALTER TABLE listings ADD COLUMN keep_on_free BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE listings ADD COLUMN paused_by_plan BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE payment_orders (
 id UUID PRIMARY KEY, user_id UUID NOT NULL REFERENCES users(id),
 purpose TEXT NOT NULL CHECK(purpose IN ('shop','product')),
 listing_id UUID REFERENCES listings(id),
 amount_minor BIGINT NOT NULL CHECK(amount_minor>0), currency TEXT NOT NULL DEFAULT 'LKR',
 duration_days INT CHECK(duration_days=30),
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','successful','failed')),
 provider TEXT, provider_payment_id TEXT, confirmed_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE(provider,provider_payment_id),
 CHECK((purpose='shop' AND duration_days=30 AND amount_minor=200000 AND listing_id IS NULL) OR (purpose='product' AND listing_id IS NOT NULL AND duration_days IS NULL))
);
CREATE INDEX payment_orders_user_idx ON payment_orders(user_id,created_at DESC);

-- Reconcile on reads and scheduled maintenance. Preserve the seller's chosen five.
CREATE FUNCTION expire_shop_plans() RETURNS void LANGUAGE plpgsql AS $$
DECLARE shop RECORD;
BEGIN
 FOR shop IN SELECT user_id FROM stores WHERE (shop_expires_at<=now()
   AND (expiry_applied_at IS NULL OR expiry_applied_at<shop_expires_at))
   OR (shop_expires_at IS NULL AND expiry_applied_at IS NULL)
   ORDER BY user_id FOR UPDATE LOOP
  UPDATE listings SET status='Paused',paused_by_plan=true,featured=false,updated_at=now()
  WHERE id IN (SELECT id FROM listings WHERE owner_id=shop.user_id AND status='Published' AND deleted_at IS NULL
    ORDER BY keep_on_free DESC,created_at,id OFFSET 5);
  UPDATE stores SET expiry_applied_at=now() WHERE user_id=shop.user_id;
 END LOOP;
END $$;

-- The store row serialises every activation, including concurrent moderation.
CREATE FUNCTION enforce_listing_plan() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE expiry TIMESTAMPTZ; cap INT; used INT;
BEGIN
 IF NEW.status='Published' AND NEW.deleted_at IS NULL AND
   (TG_OP='INSERT' OR OLD.status<>'Published' OR OLD.deleted_at IS NOT NULL OR OLD.owner_id<>NEW.owner_id) THEN
  SELECT shop_expires_at INTO expiry FROM stores WHERE user_id=NEW.owner_id FOR UPDATE;
  cap:=CASE WHEN expiry>now() THEN 100 ELSE 5 END;
  SELECT count(*) INTO used FROM listings WHERE owner_id=NEW.owner_id AND status='Published' AND deleted_at IS NULL AND id<>NEW.id;
  IF used>=cap THEN RAISE EXCEPTION 'Active listing limit reached (%). Pause a listing or upgrade your plan.',cap USING ERRCODE='P0001'; END IF;
  NEW.paused_by_plan:=false;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER listing_plan_limit BEFORE INSERT OR UPDATE ON listings FOR EACH ROW EXECUTE FUNCTION enforce_listing_plan();
