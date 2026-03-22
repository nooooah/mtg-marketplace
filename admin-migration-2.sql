-- Admin settings seed migration
-- Seeds default admin credentials and email settings into app_settings table

INSERT INTO app_settings (key, value) VALUES
  ('admin_username', 'admin'),
  ('admin_password', 'mtgAdmin123!'),
  ('admin_email', 'noah.loyola@gmail.com'),
  ('waitlist_notify_email', 'noah.loyola@gmail.com')
ON CONFLICT (key) DO NOTHING;
