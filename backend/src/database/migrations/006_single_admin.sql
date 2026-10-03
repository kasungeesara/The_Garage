-- Include suspended admins: suspension must not allow another admin account.
-- Existing multiple-admin databases must be resolved explicitly before migrating.
CREATE UNIQUE INDEX users_single_admin_idx ON users (role) WHERE role = 'Admin';
