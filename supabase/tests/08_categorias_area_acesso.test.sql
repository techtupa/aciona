-- ORB-55: quem está logado não troca a área de uma categoria (a RLS de categorias não tem política de escrita).
BEGIN;
SELECT plan(1);

SET LOCAL ROLE authenticated;
UPDATE categorias
SET area_id = (SELECT id FROM areas_atendimento WHERE slug = 'geral-e-triagem')
WHERE slug = 'eletrica';
RESET ROLE;

SELECT is(
  (SELECT a.slug FROM categorias c JOIN areas_atendimento a ON a.id = c.area_id WHERE c.slug = 'eletrica'),
  'eletrica',
  'logado não troca a área de uma categoria'
);

SELECT * FROM finish();
ROLLBACK;
