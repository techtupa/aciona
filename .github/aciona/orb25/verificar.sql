DO $$
BEGIN
    IF (SELECT array_agg(version ORDER BY version) FROM supabase_migrations.schema_migrations)
        IS DISTINCT FROM ARRAY[
            '20261117180941', '20261117181303', '20261117181307', '20261117181314', '20261117181321'
        ] OR (SELECT count(*) FROM supabase_migrations.schema_migrations
              WHERE name IS NOT NULL AND cardinality(statements) > 0) <> 5 THEN
        RAISE EXCEPTION 'Histórico do ORB-25 divergente.';
    END IF;
    IF (SELECT count(*) FROM pg_class
        WHERE relnamespace = 'public'::regnamespace
          AND relname IN ('condominios', 'categorias', 'ocorrencias')
          AND relrowsecurity) <> 3
       OR NOT EXISTS (SELECT FROM pg_class WHERE oid = 'public.fila_ocorrencias'::regclass
                      AND 'security_invoker=true' = ANY (reloptions))
       OR (SELECT count(*) FROM pg_proc WHERE pronamespace = 'public'::regnamespace
           AND proname IN ('formatar_numero', 'registrar_ocorrencia') AND NOT prosecdef) <> 2 THEN
        RAISE EXCEPTION 'RLS, fila ou funções divergentes.';
    END IF;
    IF (SELECT count(*) FROM public.categorias) <> 13
       OR (SELECT count(*) FROM public.condominios) <> 2
       OR (SELECT count(*) FROM public.ocorrencias) <> 4
       OR EXISTS (
           SELECT FROM (VALUES
             ('25000000-0000-4000-8000-000000000001'::uuid, 'VIS', 'eletrica'),
             ('25000000-0000-4000-8000-000000000002'::uuid, 'VIS', 'hidraulica'),
             ('25000000-0000-4000-8000-000000000003'::uuid, 'AUR', 'elevador'),
             ('25000000-0000-4000-8000-000000000004'::uuid, 'AUR', 'limpeza')
           ) AS demo(id, sigla, categoria)
           LEFT JOIN public.ocorrencias AS o ON o.id_solicitacao = demo.id
           LEFT JOIN public.condominios AS c ON c.id = o.condominio_id
           WHERE (c.sigla, o.categoria) IS DISTINCT FROM (demo.sigla, demo.categoria)
       ) THEN
        RAISE EXCEPTION 'Contagens ou vínculos da carga divergentes.';
    END IF;
END;
$$;

DO $$
DECLARE
    publication_role text := current_user;
    app_role text;
    demo_condo integer := (SELECT id FROM public.condominios WHERE sigla = 'VIS');
    relation regclass;
    visible boolean;
BEGIN
    FOREACH app_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
        EXECUTE format('SET LOCAL ROLE %I', app_role);
        PERFORM set_config('search_path', 'public, extensions', true);
        FOREACH relation IN ARRAY ARRAY[
            'public.condominios'::regclass, 'public.categorias'::regclass,
            'public.ocorrencias'::regclass, 'public.fila_ocorrencias'::regclass
        ] LOOP
            BEGIN
                EXECUTE format('SELECT EXISTS (SELECT FROM %s)', relation) INTO visible;
                IF visible THEN
                    RAISE EXCEPTION 'Papel % pode ler %.', app_role, relation;
                END IF;
            EXCEPTION WHEN insufficient_privilege THEN
                NULL;
            END;
        END LOOP;
        BEGIN
            PERFORM public.registrar_ocorrencia(
                demo_condo, 'Teste ORB-25', 'Verificação de autorização', 'eletrica'
            );
            RAISE EXCEPTION 'Papel % conseguiu chamar o registro sem bloqueio.', app_role;
        EXCEPTION WHEN insufficient_privilege THEN
            NULL;
        END;
        EXECUTE format('SET LOCAL ROLE %I', publication_role);
    END LOOP;
END;
$$;

SELECT c.sigla, count(o.id) AS ocorrencias
FROM public.condominios AS c
JOIN public.ocorrencias AS o ON o.condominio_id = c.id
GROUP BY c.sigla
ORDER BY c.sigla;
