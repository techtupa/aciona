-- ORB-18: quem vê e quem opera cada ocorrência.
-- Morador: registra e vê só os próprios chamados, apenas nos condomínios a que está vinculado.
-- Síndico: vê a fila inteira dos condomínios dele e muda o status.
-- Sem vínculo: não vê nem grava nada.

-- 1. Vínculo de cada conta (Supabase Auth) com um condomínio
CREATE TABLE vinculos (
  usuario_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  condominio_id INT NOT NULL REFERENCES condominios (id) ON DELETE CASCADE,
  papel VARCHAR(20) NOT NULL CHECK (papel IN ('morador', 'sindico')),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (usuario_id, condominio_id)
);
CREATE INDEX idx_vinculos_condominio ON vinculos (condominio_id);
ALTER TABLE vinculos ENABLE ROW LEVEL SECURITY;

-- 2. Quem registrou o chamado (preenchido sozinho com o login de quem grava)
ALTER TABLE ocorrencias
  ADD COLUMN criado_por UUID REFERENCES auth.users (id) ON DELETE SET NULL DEFAULT auth.uid();
CREATE INDEX idx_ocorrencias_criado_por ON ocorrencias (criado_por);

-- 3. Regras (políticas RLS). (SELECT auth.uid()) é o id de quem está logado.

-- cada pessoa vê os próprios vínculos (o seletor de condomínio usa isso)
CREATE POLICY "vinculos: ver os meus" ON vinculos
  FOR SELECT TO authenticated
  USING (usuario_id = (SELECT auth.uid()));

-- condomínios: só os que a pessoa tem vínculo
CREATE POLICY "condominios: ver os meus" ON condominios
  FOR SELECT TO authenticated
  USING (id IN (SELECT v.condominio_id FROM vinculos v WHERE v.usuario_id = (SELECT auth.uid())));

-- tópicos: lista pública para quem está logado (o formulário mostra as opções)
CREATE POLICY "categorias: ver todas" ON categorias
  FOR SELECT TO authenticated
  USING (true);

-- ocorrências, leitura: síndico vê a fila do condomínio; morador vê só o que ele registrou
CREATE POLICY "ocorrencias: sindico ve a fila" ON ocorrencias
  FOR SELECT TO authenticated
  USING (condominio_id IN (
    SELECT v.condominio_id FROM vinculos v
    WHERE v.usuario_id = (SELECT auth.uid()) AND v.papel = 'sindico'));

CREATE POLICY "ocorrencias: morador ve os seus" ON ocorrencias
  FOR SELECT TO authenticated
  USING (criado_por = (SELECT auth.uid()));

-- ocorrências, gravação: só em condomínio vinculado, sempre em nome de quem está logado
-- e sempre começando como 'registrada' (ninguém abre um chamado já "resolvido")
CREATE POLICY "ocorrencias: registrar no meu condominio" ON ocorrencias
  FOR INSERT TO authenticated
  WITH CHECK (
    criado_por = (SELECT auth.uid())
    AND status = 'registrada'
    AND condominio_id IN (SELECT v.condominio_id FROM vinculos v WHERE v.usuario_id = (SELECT auth.uid())));

-- ao gravar, só dá pra preencher os campos do relato; status, datas e criado_por
-- ficam com o valor padrão do banco (mesmo chamando a API REST do Supabase direto)
REVOKE INSERT ON ocorrencias FROM anon, authenticated;
GRANT INSERT (condominio_id, categoria, local, descricao, origem, id_solicitacao) ON ocorrencias TO authenticated;

-- ocorrências, operação: só o síndico muda, e só no condomínio dele
CREATE POLICY "ocorrencias: sindico atualiza" ON ocorrencias
  FOR UPDATE TO authenticated
  USING (condominio_id IN (
    SELECT v.condominio_id FROM vinculos v
    WHERE v.usuario_id = (SELECT auth.uid()) AND v.papel = 'sindico'))
  WITH CHECK (condominio_id IN (
    SELECT v.condominio_id FROM vinculos v
    WHERE v.usuario_id = (SELECT auth.uid()) AND v.papel = 'sindico'));

-- o síndico só pode mudar o status (não reescreve o relato do morador)
REVOKE UPDATE ON ocorrencias FROM anon, authenticated;
GRANT UPDATE (status) ON ocorrencias TO authenticated;

-- ninguém apaga ocorrência pela API
REVOKE DELETE ON ocorrencias FROM anon, authenticated;

-- 4. A função de registro só pode ser chamada por quem está logado
REVOKE EXECUTE ON FUNCTION registrar_ocorrencia(INT, TEXT, TEXT, TEXT, TEXT, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION registrar_ocorrencia(INT, TEXT, TEXT, TEXT, TEXT, UUID) TO authenticated;