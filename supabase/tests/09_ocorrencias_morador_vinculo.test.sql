-- ORB-18: o morador só lê os próprios relatos enquanto tiver vínculo; o síndico segue com a fila dele.
BEGIN;
SELECT plan(6);

-- contas e vínculos só deste teste (os condomínios Vista e Aurora vêm do seed)
INSERT INTO auth.users (id) VALUES
  ('00000000-0000-0000-0000-000000000901'),
  ('00000000-0000-0000-0000-000000000902');

-- ids guardados antes de trocar de role: sem vínculo, a RLS esconde o condomínio
SELECT set_config('teste.vista', id::text, TRUE) FROM condominios WHERE nome = 'Vista';
SELECT set_config('teste.aurora', id::text, TRUE) FROM condominios WHERE nome = 'Aurora';

INSERT INTO vinculos (usuario_id, condominio_id, papel) VALUES
  ('00000000-0000-0000-0000-000000000901', current_setting('teste.vista')::int, 'morador'),
  ('00000000-0000-0000-0000-000000000902', current_setting('teste.vista')::int, 'sindico');

INSERT INTO ocorrencias (condominio_id, local, descricao)
VALUES (current_setting('teste.aurora')::int, 'Portaria', 'Relato de teste no Aurora');

-- morador do Vista, com vínculo
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000901","role":"authenticated"}';
SELECT * FROM registrar_ocorrencia(
  current_setting('teste.vista')::int, 'Portaria', 'Relato de teste no Vista',
  p_id_solicitacao => '00000000-0000-0000-0000-000000000911');
SELECT is(
  (SELECT count(*) FROM ocorrencias WHERE id_solicitacao = '00000000-0000-0000-0000-000000000911'),
  1::bigint,
  'com vínculo, o morador lê o próprio relato'
);

-- o vínculo do morador é removido
RESET ROLE;
DELETE FROM vinculos WHERE usuario_id = '00000000-0000-0000-0000-000000000901';
SELECT is(
  (SELECT count(*) FROM ocorrencias WHERE id_solicitacao = '00000000-0000-0000-0000-000000000911'),
  1::bigint,
  'o relato continua gravado depois que o vínculo é removido'
);
SELECT set_config('teste.total_vista', count(*)::text, TRUE)
FROM ocorrencias WHERE condominio_id = current_setting('teste.vista')::int;

SET LOCAL ROLE authenticated;
SELECT is(
  (SELECT count(*) FROM ocorrencias),
  0::bigint,
  'sem vínculo, o morador não lê mais o relato antigo'
);
SELECT throws_ok(
  $$ SELECT * FROM registrar_ocorrencia(
       current_setting('teste.vista')::int, 'Portaria', 'Relato depois da saída') $$,
  '42501', NULL, 'sem vínculo, o morador não registra'
);

-- síndico do Vista
SET LOCAL request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000000902","role":"authenticated"}';
SELECT is(
  (SELECT count(*) FROM fila_ocorrencias WHERE condominio_id = current_setting('teste.vista')::int),
  current_setting('teste.total_vista')::bigint,
  'o síndico do Vista continua lendo a fila inteira do Vista'
);
SELECT is(
  (SELECT count(*) FROM ocorrencias WHERE condominio_id = current_setting('teste.aurora')::int),
  0::bigint,
  'o síndico do Vista não vê nada do Aurora'
);

RESET ROLE;
SELECT * FROM finish();
ROLLBACK;
