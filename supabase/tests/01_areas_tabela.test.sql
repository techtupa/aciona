-- ORB-55: tabela areas_atendimento (estrutura, restrições e atualizado_em).
BEGIN;
SELECT plan(18);

SELECT has_table('areas_atendimento');
SELECT col_is_pk('areas_atendimento', 'id');
SELECT col_type_is('areas_atendimento', 'id', 'integer');
SELECT col_type_is('areas_atendimento', 'nome', 'character varying(60)');
SELECT col_type_is('areas_atendimento', 'slug', 'character varying(60)');
SELECT col_type_is('areas_atendimento', 'ativo', 'boolean');
SELECT col_type_is('areas_atendimento', 'criado_em', 'timestamp with time zone');
SELECT col_type_is('areas_atendimento', 'atualizado_em', 'timestamp with time zone');
SELECT col_not_null('areas_atendimento', 'nome');
SELECT col_not_null('areas_atendimento', 'slug');
SELECT col_default_is('areas_atendimento', 'ativo', 'true');

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.areas_atendimento'::regclass),
  'RLS ligada em areas_atendimento'
);

INSERT INTO areas_atendimento (nome, slug) VALUES ('Área de teste', 'area-de-teste');

SELECT ok(
  (SELECT ativo FROM areas_atendimento WHERE slug = 'area-de-teste'),
  'área nova começa ativa'
);

SELECT throws_ok(
  $$ INSERT INTO areas_atendimento (nome, slug) VALUES ('Outro nome', 'area-de-teste') $$,
  '23505', NULL, 'slug repetido é recusado'
);
SELECT throws_ok(
  $$ INSERT INTO areas_atendimento (nome, slug) VALUES ('Área de teste', 'outro-slug') $$,
  '23505', NULL, 'nome repetido é recusado'
);
SELECT throws_ok(
  $$ INSERT INTO areas_atendimento (nome, slug) VALUES (NULL, 'sem-nome') $$,
  '23502', NULL, 'nome vazio (nulo) é recusado'
);
SELECT throws_ok(
  $$ INSERT INTO areas_atendimento (nome, slug) VALUES ('Slug ruim', 'Slug Ruim') $$,
  '23514', NULL, 'slug fora do formato é recusado'
);

-- o gatilho sobrescreve o valor enviado por NOW()
UPDATE areas_atendimento SET nome = 'Área de teste 2', atualizado_em = '2000-01-01'
WHERE slug = 'area-de-teste';

SELECT ok(
  (SELECT atualizado_em > '2000-01-01' FROM areas_atendimento WHERE slug = 'area-de-teste'),
  'atualizado_em é atualizado sozinho a cada UPDATE'
);

SELECT * FROM finish();
ROLLBACK;
