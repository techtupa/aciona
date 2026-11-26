-- ORB-55: área em uso não é apagada; categoria não é ligada a área inativa.
BEGIN;
SELECT plan(10);

SELECT throws_ok(
  $$ DELETE FROM areas_atendimento WHERE slug = 'eletrica' $$,
  '23503', NULL, 'área com categoria não pode ser apagada'
);
SELECT lives_ok(
  $$ DELETE FROM areas_atendimento WHERE slug = 'residuos-e-saneamento' $$,
  'área sem categoria pode ser apagada'
);

-- inativar uma área em uso é permitido e não mexe nas categorias dela
SELECT lives_ok(
  $$ UPDATE areas_atendimento SET ativo = FALSE WHERE slug = 'eletrica' $$,
  'área em uso pode ser inativada'
);
SELECT ok(
  (SELECT c.area_id = a.id FROM categorias c, areas_atendimento a
   WHERE c.slug = 'eletrica' AND a.slug = 'eletrica'),
  'a categoria continua ligada à área inativada'
);
SELECT lives_ok(
  $$ UPDATE categorias SET nome = 'Elétrica e luz' WHERE slug = 'eletrica' $$,
  'categoria de área inativa pode mudar outros campos'
);
SELECT lives_ok(
  $$ UPDATE categorias SET area_id = (SELECT id FROM areas_atendimento WHERE slug = 'eletrica')
     WHERE slug = 'eletrica' $$,
  'reenviar o mesmo area_id de uma área inativa não é ligação nova'
);

-- novas ligações a área inativa são recusadas
SELECT throws_ok(
  $$ INSERT INTO categorias (slug, nome, ordem, area_id)
     VALUES ('teste', 'Teste', 100, (SELECT id FROM areas_atendimento WHERE slug = 'eletrica')) $$,
  '23514', NULL, 'categoria nova não pode ser ligada a área inativa'
);
SELECT throws_ok(
  $$ UPDATE categorias SET area_id = (SELECT id FROM areas_atendimento WHERE slug = 'eletrica')
     WHERE slug = 'gas' $$,
  '23514', NULL, 'categoria existente não pode ser movida para área inativa'
);

-- reativada, a área volta a aceitar ligações
SELECT lives_ok(
  $$ UPDATE areas_atendimento SET ativo = TRUE WHERE slug = 'eletrica' $$,
  'área inativa pode ser reativada'
);
SELECT lives_ok(
  $$ UPDATE categorias SET area_id = (SELECT id FROM areas_atendimento WHERE slug = 'eletrica')
     WHERE slug = 'gas' $$,
  'categoria pode ser ligada a área reativada'
);

SELECT * FROM finish();
ROLLBACK;
