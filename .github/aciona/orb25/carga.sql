-- ORB-25 · Carga fictícia de Vista e Aurora após as cinco migrations do PR #6.
-- Insere somente dados da aplicação. Os UUIDs estáveis permitem reexecutar a carga.
BEGIN;

INSERT INTO public.condominios (nome, sigla, cidade, torres, andares, aptos_por_andar)
VALUES
    ('Vista', 'VIS', 'São Paulo', 2, 12, 4),
    ('Aurora', 'AUR', 'São Paulo', 1, 8, 4)
ON CONFLICT DO NOTHING;

DO $$
BEGIN
    IF (
        SELECT count(*)
        FROM public.condominios
        WHERE (nome, sigla, cidade, torres, andares, aptos_por_andar) IN (
            ('Vista', 'VIS', 'São Paulo', 2, 12, 4),
            ('Aurora', 'AUR', 'São Paulo', 1, 8, 4)
        )
    ) <> 2 THEN
        RAISE EXCEPTION 'A carga ORB-25 encontrou um condomínio incompatível com os dados fictícios previstos.';
    END IF;
END;
$$;

CREATE TEMP TABLE orb25_ocorrencias_ficticias (
    id_solicitacao uuid PRIMARY KEY,
    sigla varchar(5) NOT NULL,
    categoria varchar(30) NOT NULL,
    local varchar(120) NOT NULL,
    descricao text NOT NULL,
    status varchar(20) NOT NULL
) ON COMMIT DROP;

INSERT INTO orb25_ocorrencias_ficticias VALUES
    ('25000000-0000-4000-8000-000000000001', 'VIS', 'eletrica',
        'Torre A, hall do 2º andar', 'Demonstração ORB-25: luminária apagada no hall.', 'registrada'),
    ('25000000-0000-4000-8000-000000000002', 'VIS', 'hidraulica',
        'Torre B, área comum', 'Demonstração ORB-25: torneira da área comum com vazamento.', 'em_andamento'),
    ('25000000-0000-4000-8000-000000000003', 'AUR', 'elevador',
        'Torre A, elevador social', 'Demonstração ORB-25: botão de chamada intermitente.', 'registrada'),
    ('25000000-0000-4000-8000-000000000004', 'AUR', 'limpeza',
        'Torre A, entrada', 'Demonstração ORB-25: limpeza do piso da entrada solicitada.', 'resolvida');

INSERT INTO public.ocorrencias (id_solicitacao, condominio_id, categoria, local, descricao, origem, status)
SELECT demo.id_solicitacao, c.id, demo.categoria, demo.local, demo.descricao, 'formulario', demo.status
FROM orb25_ocorrencias_ficticias AS demo
JOIN public.condominios AS c ON c.sigla = demo.sigla
ON CONFLICT (id_solicitacao) DO NOTHING;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM orb25_ocorrencias_ficticias AS demo
        JOIN public.condominios AS c ON c.sigla = demo.sigla
        LEFT JOIN public.ocorrencias AS o ON o.id_solicitacao = demo.id_solicitacao
        WHERE o.condominio_id IS DISTINCT FROM c.id
    ) THEN
        RAISE EXCEPTION 'A carga ORB-25 encontrou uma ocorrência fictícia vinculada ao condomínio incorreto.';
    END IF;
END;
$$;

COMMIT;
