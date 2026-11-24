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
