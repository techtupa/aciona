-- ORB-55: categorias.area_id e o mapeamento das 13 categorias para as áreas.
BEGIN;
SELECT plan(4);

SELECT col_type_is('categorias', 'area_id', 'integer');
SELECT fk_ok('categorias', 'area_id', 'areas_atendimento', 'id');

SELECT set_eq(
  $$ SELECT c.slug AS categoria, a.slug AS area FROM categorias c LEFT JOIN areas_atendimento a ON a.id = c.area_id $$,
  $$ VALUES
    ('eletrica',   'eletrica'),
    ('hidraulica', 'hidraulica'),
    ('elevador',   'elevadores'),
    ('estrutura',  'manutencao-predial'),
    ('gas',        'gas-e-instalacoes'),
    ('portaria',   'seguranca-e-acesso'),
    ('seguranca',  'seguranca-e-acesso'),
    ('limpeza',    'limpeza-e-conservacao'),
    ('barulho',    'convivencia-e-administracao'),
    ('garagem',    'convivencia-e-administracao'),
    ('lazer',      'manutencao-predial'),
    ('jardim',     'jardinagem-e-areas-externas'),
    ('outros',     'geral-e-triagem') $$,
  'cada uma das 13 categorias está ligada à área aprovada'
);

SELECT set_eq(
  $$ SELECT a.slug FROM areas_atendimento a
     WHERE NOT EXISTS (SELECT 1 FROM categorias c WHERE c.area_id = a.id) $$,
  $$ VALUES ('residuos-e-saneamento') $$,
  'só "Resíduos e saneamento" fica sem categoria'
);

SELECT * FROM finish();
ROLLBACK;
