-- ORB-26: no reenvio, o número só volta para um pedido do mesmo condomínio e para quem enxerga o relato.
BEGIN;
SELECT plan(7);

-- contas e vínculos só deste teste (os condomínios Vista e Aurora vêm do seed)
INSERT INTO auth.users (id) VALUES
  ('00000000-0000-0000-0000-000000001001'),
  ('00000000-0000-0000-0000-000000001002');

SELECT set_config('teste.vista', id::text, TRUE) FROM condominios WHERE nome = 'Vista';
SELECT set_config('teste.aurora', id::text, TRUE) FROM condominios WHERE nome = 'Aurora';

INSERT INTO vinculos (usuario_id, condominio_id, papel) VALUES
  ('00000000-0000-0000-0000-000000001001', current_setting('teste.vista')::int, 'morador'),
  ('00000000-0000-0000-0000-000000001002', current_setting('teste.vista')::int, 'morador');

SELECT set_config('teste.total_aurora', count(*)::text, TRUE)
FROM ocorrencias WHERE condominio_id = current_setting('teste.aurora')::int;

-- morador do Vista envia o identificador X
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000001001","role":"authenticated"}';
CREATE TEMP TABLE primeiro_envio AS
SELECT * FROM registrar_ocorrencia(
  current_setting('teste.vista')::int, 'Portaria', 'Relato de teste no Vista',
  p_id_solicitacao => '00000000-0000-0000-0000-000000001011');
SELECT ok(
  (SELECT numero ~ '^AC-[0-9]{4,}$' AND NOT ja_existia FROM primeiro_envio),
  'o primeiro envio de X no Vista devolve um número e ja_existia falso'
);
SELECT results_eq(
  $$ SELECT * FROM registrar_ocorrencia(
       current_setting('teste.vista')::int, 'Portaria', 'Relato de teste no Vista',
       p_id_solicitacao => '00000000-0000-0000-0000-000000001011') $$,
  $$ SELECT numero, TRUE FROM primeiro_envio $$,
  'repetir X no Vista devolve o mesmo número e ja_existia verdadeiro'
);

RESET ROLE;
SELECT is(
  (SELECT count(*) FROM ocorrencias WHERE id_solicitacao = '00000000-0000-0000-0000-000000001011'),
  1::bigint,
  'existe uma única ocorrência com X'
);

-- o mesmo morador usa X num pedido para o Aurora
SET LOCAL ROLE authenticated;
SELECT throws_ok(
  $$ SELECT * FROM registrar_ocorrencia(
       current_setting('teste.aurora')::int, 'Portaria', 'Relato de teste no Aurora',
       p_id_solicitacao => '00000000-0000-0000-0000-000000001011') $$,
  '42501', 'Sua conta não tem acesso a este condomínio.',
  'usar X num pedido para o Aurora é recusado'
);

RESET ROLE;
SELECT is(
  (SELECT count(*) FROM ocorrencias WHERE condominio_id = current_setting('teste.aurora')::int),
  current_setting('teste.total_aurora')::bigint,
  'nada é gravado no Aurora'
);
SELECT set_config('teste.total', count(*)::text, TRUE) FROM ocorrencias;

-- outro morador do Vista, que não enxerga o relato, usa X
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub":"00000000-0000-0000-0000-000000001002","role":"authenticated"}';
SELECT is_empty(
  $$ SELECT * FROM registrar_ocorrencia(
       current_setting('teste.vista')::int, 'Portaria', 'Relato de outro morador',
       p_id_solicitacao => '00000000-0000-0000-0000-000000001011') $$,
  'outro morador do Vista não recebe o número de X'
);

RESET ROLE;
SELECT is(
  (SELECT count(*) FROM ocorrencias),
  current_setting('teste.total')::bigint,
  'o envio do outro morador não grava nada'
);

SELECT * FROM finish();
ROLLBACK;
