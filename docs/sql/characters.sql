CREATE TABLE IF NOT EXISTS characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  race_id TEXT NOT NULL,
  class TEXT DEFAULT '',
  level INT DEFAULT 1,
  stats JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS character_spells (
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  spell_id TEXT NOT NULL,
  PRIMARY KEY (character_id, spell_id)
);

CREATE TABLE IF NOT EXISTS character_feats (
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  feat_id TEXT NOT NULL,
  PRIMARY KEY (character_id, feat_id)
);
