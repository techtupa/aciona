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

-- Agora toda categoria tem área. Se sobrasse alguma sem área, este comando falharia e a migração toda seria desfeita.
ALTER TABLE categorias ALTER COLUMN area_id SET NOT NULL;

-- Área inativa não recebe categoria nova: a chave estrangeira não vê o "ativo", então a conferência é aqui.
CREATE FUNCTION impedir_area_inativa() RETURNS TRIGGER AS $$
DECLARE
  v_nome VARCHAR(60);
BEGIN
  -- reenviar a mesma área não é ligação nova
  IF TG_OP = 'UPDATE' AND NEW.area_id = OLD.area_id THEN
    RETURN NEW;
  END IF;
  SELECT a.nome INTO v_nome FROM areas_atendimento a WHERE a.id = NEW.area_id AND NOT a.ativo;
  IF FOUND THEN
    RAISE EXCEPTION 'A área "%" está inativa e não aceita categorias.', v_nome
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_categorias_area_ativa
  BEFORE INSERT OR UPDATE OF area_id ON categorias
  FOR EACH ROW EXECUTE FUNCTION impedir_area_inativa();
