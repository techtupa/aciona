# Banco de dados (Supabase)

Esta pasta guarda tudo o que define o banco do Aciona: o esquema, as regras de acesso, os dados fixos e os testes. O Supabase local sobe a partir daqui.

## O que tem aqui

- `migrations/`: o esquema do banco, em SQL. Rodam em ordem pelo nome do arquivo. Nunca edite uma migração que já está na `develop`: crie uma nova com `npx supabase migration new <nome>`.
- `seed.sql`: dados fictícios só para o banco local (condomínios, ocorrências e contas de teste). Nunca vai para produção.
- `tests/`: testes de banco em pgTAP, um arquivo `.test.sql` por assunto.
- `config.toml`: configuração do Supabase local.

## Como rodar

Precisa do Docker rodando e do Node.js (para o npx). Na raiz do projeto:

```sh
npx supabase start       # sobe o banco local
npx supabase status      # mostra os endereços e as chaves do banco local
npx supabase db reset    # apaga tudo do banco local (inclusive o que foi gravado à mão) e reaplica migrações e seed
npx supabase test db     # roda os testes de supabase/tests/
```
