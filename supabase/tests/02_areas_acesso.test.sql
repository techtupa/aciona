-- ORB-55: acesso a areas_atendimento. Logado só lê; anon não vê nada.
BEGIN;
SELECT plan(6);

INSERT INTO areas_atendimento (nome, slug) VALUES ('Área de teste', 'area-de-teste');

-- sem login (anon): nem lê nem grava
SET LOCAL ROLE anon;
SELECT throws_ok(
  $$ SELECT count(*) FROM areas_atendimento $$,
  '42501', NULL, 'anon não lê as áreas'
);
SELECT throws_ok(
  $$ INSERT INTO areas_atendimento (nome, slug) VALUES ('Outra', 'outra') $$,
  '42501', NULL, 'anon não insere área'
);

-- logado (síndico e morador usam esta mesma role): só lê
SET LOCAL ROLE authenticated;
SELECT is(
  (SELECT count(*) FROM areas_atendimento WHERE slug = 'area-de-teste'),
  1::bigint,
  'logado lê as áreas'
);
SELECT throws_ok(
  $$ INSERT INTO areas_atendimento (nome, slug) VALUES ('Outra', 'outra') $$,
  '42501', NULL, 'logado não insere área'
);
SELECT throws_ok(
  $$ UPDATE areas_atendimento SET ativo = FALSE $$,
  '42501', NULL, 'logado não atualiza área'
);
SELECT throws_ok(
  $$ DELETE FROM areas_atendimento $$,
  '42501', NULL, 'logado não apaga área'
);

RESET ROLE;
SELECT * FROM finish();
ROLLBACK;
