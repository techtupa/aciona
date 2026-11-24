-- ORB-55: catálogo de áreas de atendimento.
CREATE TABLE areas_atendimento (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(60) NOT NULL UNIQUE,
  slug VARCHAR(60) NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_areas_atendimento_atualizado_em
  BEFORE UPDATE ON areas_atendimento
  FOR EACH ROW EXECUTE FUNCTION marcar_atualizado_em();

ALTER TABLE areas_atendimento ENABLE ROW LEVEL SECURITY;

-- só leitura para quem está logado (síndico e morador); escrita só pelo acesso administrativo ao banco
REVOKE ALL ON areas_atendimento FROM anon, authenticated;
GRANT SELECT ON areas_atendimento TO authenticated;

CREATE POLICY "areas_atendimento: ver todas" ON areas_atendimento
  FOR SELECT TO authenticated
  USING (true);

-- A lista fica na migração (e não no seed) porque o sistema precisa dela em qualquer ambiente.
INSERT INTO areas_atendimento (nome, slug) VALUES
  ('Elétrica',                    'eletrica'),
  ('Hidráulica',                  'hidraulica'),
  ('Manutenção predial',          'manutencao-predial'),
  ('Elevadores',                  'elevadores'),
  ('Segurança e acesso',          'seguranca-e-acesso'),
  ('Limpeza e conservação',       'limpeza-e-conservacao'),
  ('Jardinagem e áreas externas', 'jardinagem-e-areas-externas'),
  ('Resíduos e saneamento',       'residuos-e-saneamento'),
  ('Convivência e administração', 'convivencia-e-administracao'),
  ('Geral e triagem',             'geral-e-triagem'),
  ('Gás e instalações',           'gas-e-instalacoes');

-- Cada categoria pertence a uma área. A coluna nasce aceitando nulo para ser preenchida abaixo.
ALTER TABLE categorias
  ADD COLUMN area_id INT REFERENCES areas_atendimento (id) ON DELETE RESTRICT;

UPDATE categorias c
SET area_id = a.id
FROM (VALUES
  ('eletrica',   'eletrica'),
  ('hidraulica', 'hidraulica'),
  ('elevador',   'elevadores'),
  ('estrutura',  'manutencao-predial'),
  ('gas',        'gas-e-instalacoes'),
  ('portaria',   'seguranca-e-acesso'),
  ('seguranca',  'seguranca-e-acesso'),
  ('limpeza',    'limpeza-e-conservacao'),
  ('barulho',    'convivencia-e-administracao'),
  ('garagem',    'convivencia-e-administracao'),
  ('lazer',      'manutencao-predial'),
  ('jardim',     'jardinagem-e-areas-externas'),
  ('outros',     'geral-e-triagem')
) AS m (categoria_slug, area_slug)
JOIN areas_atendimento a ON a.slug = m.area_slug
WHERE c.slug = m.categoria_slug;
