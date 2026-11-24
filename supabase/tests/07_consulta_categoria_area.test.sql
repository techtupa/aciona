-- ORB-55: quem está logado consulta cada categoria com a sua área (passando pela RLS das duas tabelas).
BEGIN;
SELECT plan(1);

SET LOCAL ROLE authenticated;
SELECT set_eq(
  $$ SELECT c.slug AS categoria, a.slug AS area
     FROM categorias c JOIN areas_atendimento a ON a.id = c.area_id $$,
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
  'logado consulta as 13 categorias com a área de cada uma'
);
RESET ROLE;

SELECT * FROM finish();
ROLLBACK;
