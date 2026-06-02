CREATE TABLE IF NOT EXISTS spells (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  requirements JSONB NOT NULL DEFAULT '{}',
  source TEXT NOT NULL DEFAULT 'system',
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO spells (name, description, requirements, source)
SELECT * FROM (VALUES
  ('Огненный шар', 'Взрыв пламени', '{}'::jsonb, 'system'),
  ('Лечение ран', 'Восстанавливает HP', '{}'::jsonb, 'system'),
  ('Свет', 'Cantrip света', '{}'::jsonb, 'system')
) AS v(name, description, requirements, source)
WHERE NOT EXISTS (SELECT 1 FROM spells WHERE source = 'system' LIMIT 1);
