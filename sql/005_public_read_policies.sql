-- Allow public read access to user_profiles for admin panel
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Public can view user profiles" ON user_profiles
  FOR SELECT
  USING (true);

-- Allow public read access to surveys for admin panel
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Public can view surveys" ON surveys
  FOR SELECT
  USING (true);

-- Allow public read access to survey_responses for admin panel
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Public can view survey responses" ON survey_responses
  FOR SELECT
  USING (true);

-- Allow public read access to report_notifications for admin panel
ALTER TABLE report_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Public can view report notifications" ON report_notifications
  FOR SELECT
  USING (true);

-- Allow public read access to transactions for admin panel
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Public can view transactions" ON transactions
  FOR SELECT
  USING (true);

-- Allow public read access to withdrawals for admin panel
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Public can view withdrawals" ON withdrawals
  FOR SELECT
  USING (true);

-- Allow public read access to admin_users for login
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Public can view admin users" ON admin_users
  FOR SELECT
  USING (true);
