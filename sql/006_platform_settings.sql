-- Platform Settings Table
CREATE TABLE IF NOT EXISTS platform_settings (
  id TEXT PRIMARY KEY DEFAULT 'global',
  platform_name TEXT DEFAULT 'Survey Platform',
  currency TEXT DEFAULT 'PKR',
  report_threshold INTEGER DEFAULT 25,
  suspension_threshold INTEGER DEFAULT 3,
  platform_fee DECIMAL(5, 2) DEFAULT 10.00,
  stripe_key TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings if not exists
INSERT INTO platform_settings (id, platform_name, currency, report_threshold, suspension_threshold, platform_fee)
VALUES ('global', 'Survey Platform', 'PKR', 25, 3, 10.00)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allows anyone to read settings" ON platform_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can update settings" ON platform_settings
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT id FROM admin_users WHERE role IN ('super_admin', 'admin')
    )
  );
