BEGIN;
SET LOCAL ROLE postgres;
SET LOCAL search_path = public, extensions;
SET LOCAL lock_timeout = '10s';
SELECT pg_advisory_xact_lock(20261117, 25);

\if :apply
DO $$
BEGIN
    IF to_regclass('supabase_migrations.schema_migrations') IS NOT NULL
       OR EXISTS (SELECT FROM pg_class WHERE relnamespace = 'public'::regnamespace)
       OR EXISTS (SELECT FROM pg_proc WHERE pronamespace = 'public'::regnamespace) THEN
        RAISE EXCEPTION 'O banco mudou desde a simulação ou contém objetos anteriores.';
    END IF;
END;
$$;

\set m1 :work '/supabase/migrations/20261117180941_criar_condominios.sql'
\set m2 :work '/supabase/migrations/20261117181303_criar_categorias.sql'
\set m3 :work '/supabase/migrations/20261117181307_criar_ocorrencias.sql'
\set m4 :work '/supabase/migrations/20261117181314_registro_e_fila.sql'
\set m5 :work '/supabase/migrations/20261117181321_ligar_rls.sql'
\set history :package '/historico.sql'
\set fixture :work '/carga-transacional.sql'
\i :m1
\i :m2
\i :m3
\i :m4
\i :m5

CREATE SCHEMA IF NOT EXISTS supabase_migrations;
CREATE TABLE supabase_migrations.schema_migrations (
    version text PRIMARY KEY,
    statements text[],
    name text
);
\i :history
\i :fixture

DO $$
BEGIN
    IF EXISTS (
        SELECT FROM orb25_ocorrencias_ficticias AS demo
        JOIN public.condominios AS c ON c.sigla = demo.sigla
        JOIN public.ocorrencias AS o USING (id_solicitacao)
        WHERE (o.condominio_id, o.categoria, o.local, o.descricao, o.origem, o.status)
            IS DISTINCT FROM (c.id, demo.categoria, demo.local, demo.descricao, 'formulario', demo.status)
    ) THEN
        RAISE EXCEPTION 'Conteúdo divergente na carga fictícia.';
    END IF;
END;
$$;
\endif

\ir verificar.sql
COMMIT;
