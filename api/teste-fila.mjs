// Teste manual do ORB-27 contra o Supabase LOCAL.
// Entra com a conta de teste, lista os condomínios dela e mostra a fila de um condomínio.
// Uso (com a API rodando em outro terminal):
//   node --env-file=api/.env api/teste-fila.mjs
const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, TESTE_EMAIL, TESTE_SENHA } = process.env;
const api = process.env.API_URL ?? 'http://127.0.0.1:3000';
const condominioId = process.env.TESTE_CONDOMINIO_ID ?? '1';

// 1. Login no Supabase Auth, como o frontend fará
const login = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
  method: 'POST',
  headers: { apikey: SUPABASE_PUBLISHABLE_KEY, 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: TESTE_EMAIL, password: TESTE_SENHA }),
});
const sessao = await login.json();
if (!login.ok) {
  console.error('Login falhou:', login.status, sessao.msg ?? sessao.error_description ?? sessao);
  process.exit(1);
}
console.log(`Login OK como ${TESTE_EMAIL}`);
const headers = { Authorization: `Bearer ${sessao.access_token}` };

// 2. Os condomínios dessa conta (o que o seletor do topo vai mostrar)
const meus = await fetch(`${api}/meus-condominios`, { headers });
console.log('Meus condomínios →', meus.status, JSON.stringify(await meus.json()));

// 3. A fila do condomínio escolhido
const fila = await fetch(`${api}/ocorrencias?condominio_id=${condominioId}`, { headers });
const corpo = await fila.json();
if (!fila.ok) {
  console.log(`Fila do condomínio ${condominioId} →`, fila.status, JSON.stringify(corpo));
} else {
  console.log(`Fila do condomínio ${condominioId} → ${fila.status} | papel: ${corpo.papel} | total: ${corpo.total}`);
  for (const o of corpo.ocorrencias.slice(0, 5)) {
    console.log(`  ${o.numero}  ${o.status.padEnd(12)}  ${o.categoria} — ${o.local}`);
  }
  if (corpo.total > 5) console.log(`  ... e mais ${corpo.total - 5}`);
}

// 4. Paginação: uma página do meio e uma depois da última
for (const consulta of ['pagina=2&por_pagina=5', 'pagina=999']) {
  const resposta = await fetch(`${api}/ocorrencias?condominio_id=${condominioId}&${consulta}`, { headers });
  const dados = await resposta.json();
  console.log(`Fila (${consulta}) →`, resposta.status, `| itens: ${dados.ocorrencias?.length} | total: ${dados.total}`);
}
