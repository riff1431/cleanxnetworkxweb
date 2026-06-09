INSERT INTO public.theme_settings (setting_key, setting_value, setting_type, category, label, description)
VALUES ('global_font', 'Inter', 'font', 'branding', 'Global Font', 'Set the primary font used across the entire website')
ON CONFLICT DO NOTHING;