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

## Catálogo de áreas de atendimento (ORB-55)

Definido em `migrations/20261124162740_catalogo_areas_atendimento.sql`. A consulta pela API é o `GET /areas`, descrito no [README da API](../api/README.md#consulta-de-áreas-orb-55).

### Decisões de modelagem

- **Catálogo global.** A tabela `areas_atendimento` não tem condomínio: não há personalização por condomínio.
- **Uma área, várias categorias (1:N).** Cada categoria aponta para uma área em `categorias.area_id`, que é `NOT NULL`. Não há tabela associativa.
- **Identificadores.** O `slug` é único e o banco confere o formato (letras minúsculas sem acento e números, separados por hífen). O `nome` também é único e não pode ser vazio nem ter só espaços.
- **Datas.** As colunas são `criado_em` e `atualizado_em` (o card cita `created_at` e `updated_at`), para seguir o padrão em português do banco e usar o trigger `marcar_atualizado_em`, que já existia.
- **Inativar em vez de excluir.** Para tirar uma área de uso, mude `ativo` para `false`: as categorias continuam ligadas a ela. O banco recusa apagar área com categoria (`ON DELETE RESTRICT`); área sem categoria ainda pode ser apagada. Um trigger impede que área inativa receba categoria, seja nova ou vinda de outra área. Reativada, ela volta a aceitar.
- **Acesso.** Em `areas_atendimento`, quem está logado (`authenticated`) lê pela RLS, e a escrita é revogada de `anon` e `authenticated`; `anon` também não lê. Em `categorias`, a RLS não tem política de escrita, então quem está logado não troca a área de uma categoria. A manutenção é feita por migração ou pelo acesso administrativo ao banco.
- **Dados fixos.** As 11 áreas e o vínculo das 13 categorias ficam na migração, e não no seed, porque o sistema precisa deles em qualquer ambiente.

### O que os testes cobrem

| Arquivo em `tests/` | Cobertura |
| --- | --- |
| `01_areas_tabela` | Estrutura e RLS ligada; criação (área nova começa ativa); edição (`atualizado_em`); duplicidade de slug e de nome; dado inválido (nome nulo, vazio ou só com espaços, slug fora do formato) |
| `02_areas_acesso` | Bloqueio de escrita: `anon` não lê nem insere; logado lê, mas não insere, atualiza nem apaga |
| `03_areas_catalogo` | Catálogo com exatamente as 11 áreas, todas ativas |
| `04_categorias_area` | Integridade: chave estrangeira, as 13 categorias nas áreas aprovadas e só "Resíduos e saneamento" sem categoria |
| `05_categorias_area_obrigatoria` | Integridade e dado inválido: categoria sem área é recusada |
| `06_areas_bloqueios` | Integridade e edição: exclusão, inativação, reativação e ligação de categoria a área inativa |
| `07_consulta_categoria_area` | Consulta: logado lê as 13 categorias com a área de cada uma |
| `08_categorias_area_acesso` | Bloqueio de escrita: logado não troca a área de uma categoria |
