-- Dados fictícios para desenvolvimento local (LGPD: nada real).
-- 20 condomínios, cada um com 5 a 40 ocorrências em etapas diferentes.
-- Rodar de novo não duplica nada.

INSERT INTO condominios (nome, sigla, cidade, torres, andares, aptos_por_andar) VALUES
  ('Vista',          'VIS', 'São Paulo',       2, 12, 4),
  ('Aurora',         'AUR', 'São Paulo',       1,  8, 4),
  ('Bosque',         'BOS', 'Campinas',        4, 10, 6),
  ('Horizonte',      'HOR', 'Santos',          1, 25, 2),
  ('Jardim',         'JAR', 'Sorocaba',        3,  6, 8),
  ('Serra',          'SER', 'Jundiaí',         2,  4, 4),
  ('Atlântico',      'ATL', 'Santos',          2, 20, 4),
  ('Ipê',            'IPE', 'Ribeirão Preto',  5,  8, 4),
  ('Lago',           'LAG', 'São José dos Campos', 1, 5, 2),
  ('Sol Nascente',   'SOL', 'Guarulhos',       6, 15, 6),
  ('Primavera',      'PRI', 'Osasco',          3, 12, 4),
  ('Monte Verde',    'MON', 'Campinas',        8, 18, 8),
  ('Recanto',        'REC', 'Piracicaba',      2,  5, 4),
  ('Bela Vista',     'BEL', 'São Paulo',       4, 22, 4),
  ('Cristal',        'CRI', 'Santo André',     1, 16, 6),
  ('Parque das Águas', 'PAR', 'Indaiatuba',    6,  4, 8),
  ('Mirante',        'MIR', 'São Paulo',       2, 30, 2),
  ('Vila Nova',      'VIL', 'Mogi das Cruzes', 3,  8, 4),
  ('Cedro',          'CED', 'Bauru',           1,  6, 4),
  ('Porto Seguro',   'POR', 'Praia Grande',    4, 14, 6)
ON CONFLICT (nome) DO NOTHING;

-- Modelos de problema por tópico. {apto} vira "Torre B, apto 704" e {torre} vira "Torre B",
-- sempre dentro das torres e andares que o condomínio tem.
WITH modelos (n, categoria, local, descricao) AS (
  SELECT ROW_NUMBER() OVER (), * FROM (VALUES
    ('eletrica',   'Hall da {torre}, térreo',        'Lâmpada do hall apagada desde ontem à noite'),
    ('eletrica',   'Corredor da {torre}',            'Lâmpada do corredor piscando sem parar'),
    ('eletrica',   'Escada da {torre}',              'Sensor de presença da escada não acende a luz'),
    ('eletrica',   'Garagem, subsolo 1',             'Metade das luzes da garagem apagadas'),
    ('eletrica',   '{apto}',                         'Disjuntor do apartamento cai toda vez que liga o chuveiro'),
    ('eletrica',   'Portão social',                  'Iluminação da entrada desligada à noite'),
    ('hidraulica', '{apto}',                         'Infiltração no teto do banheiro vindo do apartamento de cima'),
    ('hidraulica', 'Garagem, subsolo 1',             'Cano pingando em cima das vagas'),
    ('hidraulica', 'Hall da {torre}, térreo',        'Vazamento de água perto do quadro de luz'),
    ('hidraulica', '{apto}',                         'Sem água quente desde a manhã'),
    ('hidraulica', 'Casa de bombas',                 'Bomba d''água fazendo barulho alto'),
    ('hidraulica', 'Área da piscina',                'Ralo da piscina entupido'),
    ('elevador',   'Elevador social da {torre}',     'Elevador parado no térreo com a porta aberta'),
    ('elevador',   'Elevador de serviço da {torre}', 'Elevador fazendo barulho forte ao subir'),
    ('elevador',   'Elevador social da {torre}',     'Botão do 5º andar não funciona'),
    ('elevador',   'Elevador social da {torre}',     'Elevador parando desnivelado com o andar'),
    ('estrutura',  '{apto}',                         'Trinca na parede da sala aumentando'),
    ('estrutura',  'Fachada da {torre}',             'Pedaço de reboco caiu da fachada perto da entrada'),
    ('estrutura',  'Teto da garagem',                'Mancha de umidade grande no teto'),
    ('estrutura',  '{apto}',                         'Mofo na parede do quarto depois da chuva'),
    ('gas',        'Cozinha do salão de festas',     'Cheiro forte de gás perto do fogão'),
    ('gas',        'Central de gás',                 'Medidor de gás com vazamento aparente'),
    ('gas',        '{apto}',                         'Cheiro de gás no corredor de serviço'),
    ('portaria',   'Portaria',                       'Interfone não chama os apartamentos'),
    ('portaria',   'Portão da garagem',              'Portão não fecha sozinho depois que o carro passa'),
    ('portaria',   'Portão de pedestres',            'Fechadura do portão travando'),
    ('portaria',   'Portaria',                       'Encomenda entregue no apartamento errado'),
    ('portaria',   'Portão da garagem',              'Controle remoto não abre o portão'),
    ('seguranca',  'Entrada principal',              'Câmera de segurança da entrada desligada'),
    ('seguranca',  'Garagem, subsolo 1',             'Câmera da garagem sem imagem'),
    ('seguranca',  'Escada da {torre}',              'Porta corta-fogo ficando aberta com calço'),
    ('seguranca',  'Muro dos fundos',                'Cerca elétrica desligada'),
    ('limpeza',    'Lixeira do térreo',              'Lixo acumulado e com mau cheiro'),
    ('limpeza',    'Hall da {torre}, térreo',        'Hall sem limpeza há dois dias'),
    ('limpeza',    'Área da piscina',                'Água da piscina turva e com folhas'),
    ('limpeza',    'Garagem, subsolo 1',             'Óleo derramado no chão da garagem'),
    ('barulho',    '{apto}',                         'Barulho alto vindo do vizinho depois das 22h'),
    ('barulho',    '{apto}',                         'Obra com barulho fora do horário permitido'),
    ('barulho',    'Salão de festas',                'Festa com som alto depois da meia-noite'),
    ('barulho',    '{apto}',                         'Cachorro latindo o dia inteiro'),
    ('garagem',    'Garagem, vaga 31',               'Carro de visitante ocupando vaga de morador'),
    ('garagem',    'Garagem, subsolo 2',             'Carro estacionado em cima da faixa de pedestre'),
    ('garagem',    'Garagem, vaga 12',               'Moto encostada na vaga e arranhando o carro'),
    ('lazer',      'Academia',                       'Esteira com a correia solta'),
    ('lazer',      'Parquinho',                      'Balanço com a corrente quebrada'),
    ('lazer',      'Quadra',                         'Rede da quadra rasgada'),
    ('lazer',      'Salão de festas',                'Ar-condicionado do salão não gela'),
    ('jardim',     'Jardim interno',                 'Galho grande da árvore quase caindo sobre o parquinho'),
    ('jardim',     'Jardim da entrada',              'Grama alta e mato tomando a calçada'),
    ('jardim',     'Jardim interno',                 'Irrigação ligada o dia todo'),
    ('outros',     'Portaria',                       'Pedido de cópia da ata da última assembleia'),
    ('outros',     'Hall da {torre}, térreo',        'Mural de avisos com recados vencidos'),
    ('outros',     '{apto}',                         'Correspondência de outro morador entregue aqui')
  ) AS m (categoria, local, descricao)
),
quantidade (sigla, qtd) AS (VALUES
  ('VIS', 12), ('AUR', 5),  ('BOS', 38), ('HOR', 9),  ('JAR', 22),
  ('SER', 6),  ('ATL', 27), ('IPE', 18), ('LAG', 5),  ('SOL', 40),
  ('PRI', 15), ('MON', 36), ('REC', 7),  ('BEL', 31), ('CRI', 11),
  ('PAR', 20), ('MIR', 14), ('VIL', 10), ('CED', 8),  ('POR', 25)
),
sorteio AS (
  -- "sorteio" fixo: o md5 do nome do item dá sempre os mesmos números,
  -- então todo mundo que roda o seed recebe exatamente os mesmos dados
  SELECT c.id AS condominio_id, c.sigla, c.torres, c.andares, c.aptos_por_andar, g.k,
         decode(md5(c.sigla || '-' || g.k), 'hex') AS h
  FROM condominios c
  JOIN quantidade q ON q.sigla = c.sigla
  CROSS JOIN LATERAL generate_series(1, q.qtd) AS g (k)
),
montado AS (
  SELECT s.*, m.categoria, m.descricao,
         'Torre ' || chr(65 + get_byte(s.h, 2) % s.torres) AS torre,
         (get_byte(s.h, 3) % s.andares + 1) * 100 + get_byte(s.h, 4) % s.aptos_por_andar + 1 AS apto,
         m.local AS local_modelo,
         -- até 60 dias atrás
         ((get_byte(s.h, 5) * 256 + get_byte(s.h, 6)) % (60 * 24)) * INTERVAL '1 hour'
           + (get_byte(s.h, 7) % 60) * INTERVAL '1 minute' AS idade,
         get_byte(s.h, 8) % 10 AS dado_origem,
         get_byte(s.h, 9) % 10 AS dado_status
  FROM sorteio s
  JOIN modelos m ON m.n = (get_byte(s.h, 0) * 256 + get_byte(s.h, 1)) % (SELECT COUNT(*) FROM modelos) + 1
)
INSERT INTO ocorrencias (condominio_id, categoria, local, descricao, origem, status, id_solicitacao, criado_em, atualizado_em)
SELECT
  condominio_id,
  categoria,
  replace(replace(local_modelo, '{apto}', torre || ', apto ' || apto), '{torre}', torre),
  descricao,
  CASE WHEN dado_origem < 6 THEN 'formulario'
       WHEN dado_origem < 8 THEN 'whatsapp'
       WHEN dado_origem < 9 THEN 'portaria'
       ELSE 'app' END,
  -- quanto mais antigo, mais chance de já estar resolvido
  CASE
    WHEN idade < INTERVAL '1 day'  THEN CASE WHEN dado_status < 8 THEN 'registrada' ELSE 'em_andamento' END
    WHEN idade < INTERVAL '7 days' THEN CASE WHEN dado_status < 4 THEN 'registrada'
                                             WHEN dado_status < 8 THEN 'em_andamento' ELSE 'resolvida' END
    ELSE CASE WHEN dado_status < 1 THEN 'registrada'
              WHEN dado_status < 3 THEN 'em_andamento' ELSE 'resolvida' END
  END,
  md5('aciona-seed-' || sigla || '-' || k)::uuid,
  NOW() - idade,
  NOW() - idade / 2
FROM montado
-- pula o que já existe (rodar de novo não gasta números)
WHERE NOT EXISTS (
  SELECT 1 FROM ocorrencias o WHERE o.id_solicitacao = md5('aciona-seed-' || montado.sigla || '-' || montado.k)::uuid
)
-- o mais antigo recebe o menor número, como aconteceria de verdade
ORDER BY idade DESC
ON CONFLICT (id_solicitacao) DO NOTHING;