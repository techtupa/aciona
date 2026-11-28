-- ORB-55: as 11 áreas de atendimento cadastradas pela migração.
BEGIN;
SELECT plan(1);

SELECT set_eq(
  $$ SELECT nome, slug, ativo FROM areas_atendimento $$,
  $$ VALUES
    ('Elétrica',                    'eletrica',                    TRUE),
    ('Hidráulica',                  'hidraulica',                  TRUE),
    ('Manutenção predial',          'manutencao-predial',          TRUE),
    ('Elevadores',                  'elevadores',                  TRUE),
    ('Segurança e acesso',          'seguranca-e-acesso',          TRUE),
    ('Limpeza e conservação',       'limpeza-e-conservacao',       TRUE),
    ('Jardinagem e áreas externas', 'jardinagem-e-areas-externas', TRUE),
    ('Resíduos e saneamento',       'residuos-e-saneamento',       TRUE),
    ('Convivência e administração', 'convivencia-e-administracao', TRUE),
    ('Geral e triagem',             'geral-e-triagem',             TRUE),
    ('Gás e instalações',           'gas-e-instalacoes',           TRUE) $$,
  'o catálogo tem exatamente as 11 áreas, todas ativas'
);

SELECT * FROM finish();
ROLLBACK;
