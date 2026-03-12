-- Add font_family and border_color columns to binders table
ALTER TABLE binders ADD COLUMN IF NOT EXISTS font_family TEXT DEFAULT NULL;
ALTER TABLE binders ADD COLUMN IF NOT EXISTS border_color TEXT DEFAULT NULL;
