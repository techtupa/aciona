-- ORB-26: no reenvio, o número existente só volta se o relato for do mesmo condomínio do pedido.
-- Identificador de outro condomínio que a conta enxerga vira 403 (42501); de relato que ela não enxerga, não volta nada (409 na API).
CREATE OR REPLACE FUNCTION registrar_ocorrencia(
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
  v_condominio INT;
BEGIN
  -- envio repetido: devolve o número que já existe, se for do mesmo condomínio
  SELECT o.id, o.condominio_id INTO v_id, v_condominio
  FROM ocorrencias o WHERE o.id_solicitacao = p_id_solicitacao;
  IF v_id IS NOT NULL THEN
    IF v_condominio <> p_condominio_id THEN
      RAISE EXCEPTION 'Sua conta não tem acesso a este condomínio.' USING ERRCODE = '42501';
    END IF;
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
    RETURN;
  END IF;

  -- dois envios iguais chegaram ao mesmo tempo: o outro gravou primeiro
  SELECT o.id, o.condominio_id INTO v_id, v_condominio
  FROM ocorrencias o WHERE o.id_solicitacao = p_id_solicitacao;
  -- identificador de um registro que esta conta não enxerga: não volta nada (409 na API)
  IF v_id IS NULL THEN
    RETURN;
  END IF;
  IF v_condominio <> p_condominio_id THEN
    RAISE EXCEPTION 'Sua conta não tem acesso a este condomínio.' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY SELECT formatar_numero(v_id), TRUE;
END;
$$;
