// Teste manual do ORB-26 contra o Supabase LOCAL.
// Entra com a conta de teste, registra um chamado e repete o mesmo envio.
// Uso (com a API rodando em outro terminal):
//   node --env-file=api/.env api/teste-gravacao.mjs
import { randomUUID } from 'node:crypto';

const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, TESTE_EMAIL, TESTE_SENHA } = process.env;
const api = process.env.API_URL ?? 'http://127.0.0.1:3000';
const condominioId = Number(process.env.TESTE_CONDOMINIO_ID ?? 1);

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

// 2. Registra o mesmo chamado duas vezes (simula o morador clicando duas vezes)
const envio = {
  condominio_id: condominioId,
  local: 'Hall da Torre A, térreo',
  descricao: 'Lâmpada do hall apagada (teste local)',
  categoria: 'eletrica',
  id_solicitacao: randomUUID(),
};
for (const tentativa of ['1º envio', '2º envio (repetido)']) {
  const resposta = await fetch(`${api}/ocorrencias`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${sessao.access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(envio),
  });
  console.log(tentativa, '→', resposta.status, JSON.stringify(await resposta.json()));
}