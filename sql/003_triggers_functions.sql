-- Triggers and Functions for Auto-Moderation Logic

-- Function to check report count and create alerts
CREATE OR REPLACE FUNCTION check_report_threshold()
RETURNS TRIGGER AS $$
BEGIN
  DECLARE
    report_count INTEGER;
  BEGIN
    -- Get current report count for this survey
    SELECT COUNT(*) INTO report_count
    FROM reports
    WHERE survey_id = NEW.survey_id
      AND status != 'dismissed';

    -- If 2+ reports on survey, create alert
    IF report_count >= 2 THEN
      INSERT INTO realtime_alerts (type, severity, title, message, metadata)
      VALUES (
        'report_threshold',
        'warning',
        'Survey reached report threshold',
        'Survey has received 2+ reports and requires review',
        jsonb_build_object('survey_id', NEW.survey_id, 'report_count', report_count)
      ) ON CONFLICT DO NOTHING;
    END IF;

    RETURN NEW;
  END;
$$ LANGUAGE plpgsql;

-- Function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO admin_action_logs (
    admin_id,
    action,
    target_type,
    old_values,
    new_values,
    created_at
  )
  VALUES (
    COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
    TG_OP,
    TG_TABLE_NAME,
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(NEW) ELSE row_to_json(NEW) END,
    NOW()
  );

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql;

-- Function to update survey response count
CREATE OR REPLACE FUNCTION update_survey_response_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE surveys
  SET responses_collected = responses_collected + 1
  WHERE id = NEW.survey_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check report threshold
CREATE TRIGGER IF NOT EXISTS trg_check_report_threshold
AFTER INSERT ON reports
FOR EACH ROW
EXECUTE FUNCTION check_report_threshold();

-- Trigger to log survey changes
CREATE TRIGGER IF NOT EXISTS trg_log_survey_changes
AFTER UPDATE OR DELETE ON surveys
FOR EACH ROW
EXECUTE FUNCTION log_admin_action();

-- Trigger to log report changes
CREATE TRIGGER IF NOT EXISTS trg_log_report_changes
AFTER UPDATE ON reports
FOR EACH ROW
EXECUTE FUNCTION log_admin_action();

-- Trigger to update survey response count
CREATE TRIGGER IF NOT EXISTS trg_update_survey_response_count
AFTER INSERT ON survey_responses
FOR EACH ROW
EXECUTE FUNCTION update_survey_response_count();

-- Triggers for timestamp updates on new tables
CREATE TRIGGER IF NOT EXISTS trg_reports_timestamp
BEFORE UPDATE ON reports
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER IF NOT EXISTS trg_moderation_logs_timestamp
BEFORE UPDATE ON moderation_logs
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER IF NOT EXISTS trg_user_strikes_timestamp
BEFORE UPDATE ON user_strikes
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER IF NOT EXISTS trg_transactions_timestamp
BEFORE UPDATE ON transactions
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER IF NOT EXISTS trg_withdrawals_timestamp
BEFORE UPDATE ON withdrawals
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER IF NOT EXISTS trg_admin_action_logs_timestamp
BEFORE UPDATE ON admin_action_logs
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();
