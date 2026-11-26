-- ORB-25: tópicos das ocorrências. O que não se encaixa vai para "Outros".
-- A lista fica na migração (e não no seed) porque o sistema precisa dela em qualquer ambiente.
CREATE TABLE categorias (
  slug VARCHAR(30) PRIMARY KEY,
  nome VARCHAR(60) NOT NULL UNIQUE,
  ordem INT NOT NULL
);

INSERT INTO categorias (slug, nome, ordem) VALUES
  ('eletrica',   'Elétrica e iluminação',          1),
  ('hidraulica', 'Vazamentos e hidráulica',        2),
  ('elevador',   'Elevadores',                     3),
  ('estrutura',  'Estrutura (trincas e infiltração)', 4),
  ('gas',        'Gás',                            5),
  ('portaria',   'Portaria e acesso',              6),
  ('seguranca',  'Segurança e câmeras',            7),
  ('limpeza',    'Limpeza e lixo',                 8),
  ('barulho',    'Barulho e convivência',          9),
  ('garagem',    'Garagem e vagas',               10),
  ('lazer',      'Áreas de lazer',                11),
  ('jardim',     'Jardinagem',                    12),
  ('outros',     'Outros',                        99);