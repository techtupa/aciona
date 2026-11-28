-- ORB-55: toda categoria precisa ter uma área.
BEGIN;
SELECT plan(2);

SELECT col_not_null('categorias', 'area_id');

SELECT throws_ok(
  $$ INSERT INTO categorias (slug, nome, ordem) VALUES ('teste', 'Teste', 100) $$,
  '23502', NULL, 'categoria sem área é recusada'
);

SELECT * FROM finish();
ROLLBACK;
