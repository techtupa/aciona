-- ORB-55: base dos testes de banco e regressão das categorias existentes.
BEGIN;
SELECT plan(1);

SELECT set_eq(
  $$ SELECT slug, nome, ordem FROM categorias $$,
  $$ VALUES
    ('eletrica',   'Elétrica e iluminação',             1),
    ('hidraulica', 'Vazamentos e hidráulica',           2),
    ('elevador',   'Elevadores',                        3),
    ('estrutura',  'Estrutura (trincas e infiltração)', 4),
    ('gas',        'Gás',                               5),
    ('portaria',   'Portaria e acesso',                 6),
    ('seguranca',  'Segurança e câmeras',               7),
    ('limpeza',    'Limpeza e lixo',                    8),
    ('barulho',    'Barulho e convivência',             9),
    ('garagem',    'Garagem e vagas',                  10),
    ('lazer',      'Áreas de lazer',                   11),
    ('jardim',     'Jardinagem',                       12),
    ('outros',     'Outros',                           99) $$,
  'as 13 categorias existem com os mesmos slugs, nomes e ordem'
);

SELECT * FROM finish();
ROLLBACK;
