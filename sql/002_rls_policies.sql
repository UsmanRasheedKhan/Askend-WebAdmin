-- Row Level Security (RLS) Policies for new tables only
-- Note: surveys, survey_responses, admin_users already have their own RLS policies

-- Reports - Admins can view and manage
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Admins can view all reports" ON reports
  FOR SELECT
  USING (
    auth.uid() IN (SELECT id FROM admin_users WHERE role IN ('super_admin', 'admin', 'moderator'))
  );

CREATE POLICY IF NOT EXISTS "Admins can update reports" ON reports
  FOR UPDATE
  USING (
    auth.uid() IN (SELECT id FROM admin_users WHERE role IN ('super_admin', 'admin'))
  );

-- Moderation Logs - Admins can view and create
ALTER TABLE moderation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Admins can view moderation logs" ON moderation_logs
  FOR SELECT
  USING (
    auth.uid() IN (SELECT id FROM admin_users WHERE role IN ('super_admin', 'admin', 'moderator'))
  );

CREATE POLICY IF NOT EXISTS "Admins can create moderation logs" ON moderation_logs
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT id FROM admin_users WHERE role IN ('super_admin', 'admin'))
  );

-- User Strikes - Admins can view
ALTER TABLE user_strikes ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Admins can view user strikes" ON user_strikes
  FOR SELECT
  USING (
    auth.uid() IN (SELECT id FROM admin_users WHERE role IN ('super_admin', 'admin', 'moderator'))
  );

-- Transactions - Admins can view
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Admins can view transactions" ON transactions
  FOR SELECT
  USING (
    auth.uid() IN (SELECT id FROM admin_users WHERE role IN ('super_admin', 'admin'))
  );

-- Withdrawals - Admins can view and manage
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Admins can view withdrawals" ON withdrawals
  FOR SELECT
  USING (
    auth.uid() IN (SELECT id FROM admin_users WHERE role IN ('super_admin', 'admin'))
  );

CREATE POLICY IF NOT EXISTS "Admins can manage withdrawals" ON withdrawals
  FOR UPDATE
  USING (
    auth.uid() IN (SELECT id FROM admin_users WHERE role IN ('super_admin', 'admin'))
  );

-- Admin Notifications - Admins can view their own
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Admins can view their own notifications" ON admin_notifications
  FOR SELECT
  USING (admin_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Admins can update their own notifications" ON admin_notifications
  FOR UPDATE
  USING (admin_id = auth.uid());

-- Realtime Alerts - Admins can view
ALTER TABLE realtime_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Admins can view realtime alerts" ON realtime_alerts
  FOR SELECT
  USING (
    auth.uid() IN (SELECT id FROM admin_users WHERE role IN ('super_admin', 'admin', 'moderator'))
  );

-- Admin Action Logs - Admins can view and create
ALTER TABLE admin_action_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Admins can view action logs" ON admin_action_logs
  FOR SELECT
  USING (
    auth.uid() IN (SELECT id FROM admin_users WHERE role IN ('super_admin', 'admin'))
  );

CREATE POLICY IF NOT EXISTS "Admins can create action logs" ON admin_action_logs
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT id FROM admin_users WHERE role IN ('super_admin', 'admin', 'moderator'))
  );
