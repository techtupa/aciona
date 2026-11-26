-- ORB-25 (base para o ORB-26 e o ORB-27): número do chamado, registro de chamado novo e fila.

-- 1 vira AC-0001; passando de 9999 continua certo (AC-10000)
CREATE FUNCTION formatar_numero(p_id INT) RETURNS TEXT
LANGUAGE sql IMMUTABLE AS $$
  SELECT 'AC-' || lpad(p_id::text, greatest(4, length(p_id::text)), '0');
$$;

-- Registra um chamado novo vindo da tela do morador.
-- Se o mesmo envio chegar duas vezes (mesmo id_solicitacao), devolve o número que já existe.
CREATE FUNCTION registrar_ocorrencia(
  p_condominio_id INT,
  p_local TEXT,
  p_descricao TEXT,
  p_categoria TEXT DEFAULT 'outros',
  p_origem TEXT DEFAULT 'formulario',
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
  VALUES (p_condominio_id, COALESCE(p_categoria, 'outros'), trim(p_local), trim(p_descricao),
          COALESCE(p_origem, 'formulario'), p_id_solicitacao)
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
$$;

-- A fila do síndico. security_invoker = respeita a RLS de quem consulta.
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
JOIN categorias cat ON cat.slug = o.categoria;