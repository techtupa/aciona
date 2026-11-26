-- ORB-25: ocorrências (relatos dos moradores).
CREATE TABLE ocorrencias (
  id SERIAL PRIMARY KEY,
  condominio_id INT NOT NULL REFERENCES condominios (id) ON DELETE RESTRICT,
  categoria VARCHAR(30) NOT NULL DEFAULT 'outros' REFERENCES categorias (slug),
  local VARCHAR(120) NOT NULL CHECK (length(trim(local)) > 0),
  descricao TEXT NOT NULL CHECK (length(trim(descricao)) > 0),
  origem VARCHAR(20) NOT NULL DEFAULT 'formulario'
    CHECK (origem IN ('formulario', 'whatsapp', 'portaria', 'app')),
  status VARCHAR(20) NOT NULL DEFAULT 'registrada'
    CHECK (status IN ('registrada', 'em_andamento', 'resolvida')),
  -- mesmo envio repetido = mesmo id_solicitacao; o UNIQUE impede registro duplicado
  id_solicitacao UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- a fila busca por condomínio, mais recentes primeiro
CREATE INDEX idx_ocorrencias_condominio_data ON ocorrencias (condominio_id, criado_em DESC);

-- atualiza atualizado_em sozinho a cada UPDATE
CREATE FUNCTION marcar_atualizado_em() RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ocorrencias_atualizado_em
  BEFORE UPDATE ON ocorrencias
  FOR EACH ROW EXECUTE FUNCTION marcar_atualizado_em();