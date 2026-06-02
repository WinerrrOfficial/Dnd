CREATE TABLE IF NOT EXISTS races (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  traits JSONB NOT NULL DEFAULT '{}',
  source TEXT NOT NULL DEFAULT 'system',
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO races (name, description, traits, source)
SELECT * FROM (VALUES
  ('Человек', 'Универсальная раса', '{"bonus": "+1 ко всем характеристикам"}'::jsonb, 'system'),
  ('Эльф', 'Грациозный и долгоживущий', '{"darkvision": 60}'::jsonb, 'system'),
  ('Дварф', 'Выносливый горный житель', '{"darkvision": 60, "resistance": "яд"}'::jsonb, 'system')
) AS v(name, description, traits, source)
WHERE NOT EXISTS (SELECT 1 FROM races WHERE source = 'system' LIMIT 1);
