#!/usr/bin/env bash
set -euo pipefail

: "${DATABASE_URL:?Credencial do banco ausente}"
if [[ ${ACIONA_PRODUCTION:-0} == 1 ]]; then
  [[ $DATABASE_URL =~ ^postgresql://[a-z_0-9]+\.bhsdoqkssaeleokyhhuh:[^@]+@aws-1-us-east-1\.pooler\.supabase\.com:5432/postgres\?sslmode=require$ ]] || {
    echo 'Conexão diferente do pooler do projeto Aciona.' >&2
    exit 1
  }
fi

repo=$(git rev-parse --show-toplevel)
package="$repo/.github/aciona/orb25"
source_commit=7916eeb542fbc1e72a8ca5fb846ad40657b36d44
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
if ! git cat-file -e "$source_commit^{commit}" 2>/dev/null; then
  git fetch -q --no-tags --depth=1 origin "$source_commit"
fi
git archive "$source_commit" supabase/config.toml supabase/migrations | tar -x -C "$work"
migrations=(
  20261117180941_criar_condominios.sql
  20261117181303_criar_categorias.sql
  20261117181307_criar_ocorrencias.sql
  20261117181314_registro_e_fila.sql
  20261117181321_ligar_rls.sql
)
mapfile -t actual < <(cd "$work/supabase/migrations" && printf '%s\n' *)
[[ "${actual[*]}" == "${migrations[*]}" ]] || { echo 'Lista de migrations diferente do ORB-25.' >&2; exit 1; }
(cd "$package" && echo '20126603ca3615ddf6f53ee2e24c1b84266c7d853296e41af5b3b058c28d3afb  carga.sql' | sha256sum --check)
printf '%s\n' "${migrations[@]}" | jq -R . | jq -s . > "$work/esperadas.json"

dry_run() {
  supabase db push --workdir "$work" --db-url "$DATABASE_URL" --skip-vault --dry-run --yes --output-format json
}
history_exists=$(psql "$DATABASE_URL" -XqAt -v ON_ERROR_STOP=1 \
  -c "BEGIN; SET LOCAL ROLE postgres; SELECT to_regclass('supabase_migrations.schema_migrations') IS NOT NULL; COMMIT;")
case "$history_exists" in
  f)
    dry_run > "$work/dry-run.json"
    jq -e --slurpfile esperadas "$work/esperadas.json" '
      .dryRun and .migrations == $esperadas[0]
      and ((.roles // []) == []) and ((.seeds // []) == [])
    ' "$work/dry-run.json" >/dev/null
    jq '{upToDate, migrations}' "$work/dry-run.json"
    apply=true
    ;;
  t)
    echo 'Histórico existente. A execução apenas valida o pacote publicado.'
    apply=false
    ;;
  *) exit 1 ;;
esac

# O histórico de referência foi exportado de uma execução local do CLI 2.122.0.
# O arquivo da carga mantém os bytes do anexo. A transação externa engloba seus comandos.
tr -d '\r' < "$package/carga.sql" | sed -e '/^BEGIN;$/d' -e '/^COMMIT;$/d' > "$work/carga-transacional.sql"
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -v apply="$apply" -v work="$work" -v package="$package" -f "$package/publicar.sql"
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -c 'BEGIN; SET LOCAL ROLE postgres;' -f "$package/verificar.sql" -c COMMIT
if [[ ${ACIONA_PRODUCTION:-0} != 1 ]]; then
  dry_run | jq -e '.upToDate == true and ((.migrations // []) == [])' >/dev/null
fi
