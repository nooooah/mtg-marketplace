-- Add emblems column to profiles
-- Emblems are JSONB arrays of { set: string, rarity: string }
-- Example: [{"set": "znr", "rarity": "mythic"}, {"set": "lea", "rarity": "rare"}]

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS emblems JSONB NOT NULL DEFAULT '[]'::jsonb;
