CREATE TABLE IF NOT EXISTS feats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  traits JSONB NOT NULL DEFAULT '{}',
  source TEXT NOT NULL DEFAULT 'system',
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO feats (name, description, traits, source)
SELECT * FROM (VALUES
  ('Кристалл', 'Фокус магии', '{"type": "focus"}'::jsonb, 'system'),
  ('Медитация', 'Восстановление ки', '{"type": "focus"}'::jsonb, 'system'),
  ('Острый глаз', 'Бонус к стрельбе', '{"type": "focus"}'::jsonb, 'system')
) AS v(name, description, traits, source)
WHERE NOT EXISTS (SELECT 1 FROM feats WHERE source = 'system' LIMIT 1);
