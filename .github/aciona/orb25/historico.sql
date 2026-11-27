INSERT INTO supabase_migrations.schema_migrations (version, name, statements) VALUES ('20261117180941', 'criar_condominios', '{"-- ORB-25: condomínios atendidos pelo Aciona.
CREATE TABLE condominios (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL UNIQUE,
  sigla VARCHAR(5) NOT NULL UNIQUE,
  cidade VARCHAR(60) NOT NULL,
  torres INT NOT NULL CHECK (torres BETWEEN 1 AND 30),
  andares INT NOT NULL CHECK (andares BETWEEN 1 AND 60),
  aptos_por_andar INT NOT NULL CHECK (aptos_por_andar BETWEEN 1 AND 20),
  -- calculado pelo próprio banco, ninguém digita
  total_apartamentos INT GENERATED ALWAYS AS (torres * andares * aptos_por_andar) STORED,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
)"}'::text[]);
INSERT INTO supabase_migrations.schema_migrations (version, name, statements) VALUES ('20261117181303', 'criar_categorias', E'{"-- ORB-25: tópicos das ocorrências. O que não se encaixa vai para \\"Outros\\".
-- A lista fica na migração (e não no seed) porque o sistema precisa dela em qualquer ambiente.
CREATE TABLE categorias (
  slug VARCHAR(30) PRIMARY KEY,
  nome VARCHAR(60) NOT NULL UNIQUE,
  ordem INT NOT NULL
)","INSERT INTO categorias (slug, nome, ordem) VALUES
  (''eletrica'',   ''Elétrica e iluminação'',          1),
  (''hidraulica'', ''Vazamentos e hidráulica'',        2),
  (''elevador'',   ''Elevadores'',                     3),
  (''estrutura'',  ''Estrutura (trincas e infiltração)'', 4),
  (''gas'',        ''Gás'',                            5),
  (''portaria'',   ''Portaria e acesso'',              6),
  (''seguranca'',  ''Segurança e câmeras'',            7),
  (''limpeza'',    ''Limpeza e lixo'',                 8),
  (''barulho'',    ''Barulho e convivência'',          9),
  (''garagem'',    ''Garagem e vagas'',               10),
  (''lazer'',      ''Áreas de lazer'',                11),
  (''jardim'',     ''Jardinagem'',                    12),
  (''outros'',     ''Outros'',                        99)"}'::text[]);
INSERT INTO supabase_migrations.schema_migrations (version, name, statements) VALUES ('20261117181307', 'criar_ocorrencias', '{"-- ORB-25: ocorrências (relatos dos moradores).
CREATE TABLE ocorrencias (
  id SERIAL PRIMARY KEY,
  condominio_id INT NOT NULL REFERENCES condominios (id) ON DELETE RESTRICT,
  categoria VARCHAR(30) NOT NULL DEFAULT ''outros'' REFERENCES categorias (slug),
  local VARCHAR(120) NOT NULL CHECK (length(trim(local)) > 0),
  descricao TEXT NOT NULL CHECK (length(trim(descricao)) > 0),
  origem VARCHAR(20) NOT NULL DEFAULT ''formulario''
    CHECK (origem IN (''formulario'', ''whatsapp'', ''portaria'', ''app'')),
  status VARCHAR(20) NOT NULL DEFAULT ''registrada''
    CHECK (status IN (''registrada'', ''em_andamento'', ''resolvida'')),
  -- mesmo envio repetido = mesmo id_solicitacao; o UNIQUE impede registro duplicado
  id_solicitacao UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
)","-- a fila busca por condomínio, mais recentes primeiro
CREATE INDEX idx_ocorrencias_condominio_data ON ocorrencias (condominio_id, criado_em DESC)","-- atualiza atualizado_em sozinho a cada UPDATE
CREATE FUNCTION marcar_atualizado_em() RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql","CREATE TRIGGER trg_ocorrencias_atualizado_em
  BEFORE UPDATE ON ocorrencias
  FOR EACH ROW EXECUTE FUNCTION marcar_atualizado_em()"}'::text[]);
INSERT INTO supabase_migrations.schema_migrations (version, name, statements) VALUES ('20261117181314', 'registro_e_fila', '{"-- ORB-25 (base para o ORB-26 e o ORB-27): número do chamado, registro de chamado novo e fila.

-- 1 vira AC-0001; passando de 9999 continua certo (AC-10000)
CREATE FUNCTION formatar_numero(p_id INT) RETURNS TEXT
LANGUAGE sql IMMUTABLE AS $$
  SELECT ''AC-'' || lpad(p_id::text, greatest(4, length(p_id::text)), ''0'');
$$","-- Registra um chamado novo vindo da tela do morador.
-- Se o mesmo envio chegar duas vezes (mesmo id_solicitacao), devolve o número que já existe.
CREATE FUNCTION registrar_ocorrencia(
  p_condominio_id INT,
  p_local TEXT,
  p_descricao TEXT,
  p_categoria TEXT DEFAULT ''outros'',
  p_origem TEXT DEFAULT ''formulario'',
  p_id_solicitacao UUID DEFAULT gen_random_uuid()
) RETURNS TABLE (numero TEXT, ja_existia BOOLEAN)
LANGUAGE plpgsql AS $$
DECLARE
  v_id INT;
BEGIN
  -- envio repetido: devolve o número que já existe, sem gravar de novo
  SELECT o.id INTO v_id FROM ocorrencias o WHERE o.id_solicitacao = p_id_solicitacao;
  IF v_id IS NOT NULL THEN
    RETURN QUERY SELECT formatar_numero(v_id), TRUE;
    RETURN;
  END IF;

  INSERT INTO ocorrencias (condominio_id, categoria, local, descricao, origem, id_solicitacao)
  VALUES (p_condominio_id, COALESCE(p_categoria, ''outros''), trim(p_local), trim(p_descricao),
          COALESCE(p_origem, ''formulario''), p_id_solicitacao)
  ON CONFLICT (id_solicitacao) DO NOTHING
  RETURNING id INTO v_id;

  IF v_id IS NOT NULL THEN
    RETURN QUERY SELECT formatar_numero(v_id), FALSE;
  ELSE
    -- dois envios iguais chegaram ao mesmo tempo: o outro gravou primeiro
    RETURN QUERY SELECT formatar_numero(o.id), TRUE
                 FROM ocorrencias o WHERE o.id_solicitacao = p_id_solicitacao;
  END IF;
END;
$$","-- A fila do síndico. security_invoker = respeita a RLS de quem consulta.
CREATE VIEW fila_ocorrencias WITH (security_invoker = true) AS
SELECT
  formatar_numero(o.id) AS numero,
  o.id,
  o.condominio_id,
  c.nome AS condominio,
  cat.nome AS categoria,
  o.local,
  LEFT(o.descricao, 120) AS resumo,
  o.status,
  o.origem,
  o.criado_em
FROM ocorrencias o
JOIN condominios c ON c.id = o.condominio_id
JOIN categorias cat ON cat.slug = o.categoria"}'::text[]);
INSERT INTO supabase_migrations.schema_migrations (version, name, statements) VALUES ('20261117181321', 'ligar_rls', '{"-- ORB-25: liga a RLS nas tabelas.
-- Sem política nenhuma, ninguém lê nem grava pela API do Supabase (anon e authenticated).
-- As regras por condomínio entram com os vínculos de morador e síndico (ORB-18).
ALTER TABLE condominios ENABLE ROW LEVEL SECURITY","ALTER TABLE categorias ENABLE ROW LEVEL SECURITY","ALTER TABLE ocorrencias ENABLE ROW LEVEL SECURITY"}'::text[]);
