-- Report Notifications Table for tracking user reports on surveys
CREATE TABLE IF NOT EXISTS report_notifications (
  id BIGSERIAL PRIMARY KEY,
  survey_id TEXT NOT NULL,
  reporter_id TEXT NOT NULL,
  creator_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'action_taken')),
  admin_action TEXT,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Indexes
CREATE INDEX idx_report_notifications_survey_id ON report_notifications(survey_id);
CREATE INDEX idx_report_notifications_reporter_id ON report_notifications(reporter_id);
CREATE INDEX idx_report_notifications_creator_id ON report_notifications(creator_id);
CREATE INDEX idx_report_notifications_status ON report_notifications(status);
CREATE INDEX idx_report_notifications_created_at ON report_notifications(created_at);

-- RLS Policies for Report Notifications
ALTER TABLE report_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all report notifications" ON report_notifications
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM admin_users WHERE role IN ('super_admin', 'admin', 'moderator')
    )
  );

CREATE POLICY "Admins can update report notifications" ON report_notifications
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM admin_users WHERE role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Users can insert report notifications" ON report_notifications
  FOR INSERT
  WITH CHECK (true);
