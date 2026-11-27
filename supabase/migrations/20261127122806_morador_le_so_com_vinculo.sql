-- ORB-18: o morador só lê os próprios relatos enquanto tiver vínculo com o condomínio deles.
DROP POLICY "ocorrencias: morador ve os seus" ON ocorrencias;
CREATE POLICY "ocorrencias: morador ve os seus" ON ocorrencias
  FOR SELECT TO authenticated
  USING (
    criado_por = (SELECT auth.uid())
    AND condominio_id IN (
      SELECT v.condominio_id FROM vinculos v WHERE v.usuario_id = (SELECT auth.uid())));
