// Teste do ORB-55 contra o Supabase LOCAL (com as contas do seed).
// Confere a autorização e o conteúdo de GET /areas. Termina com código 1 se algum caso falhar.
// Uso (com a API rodando em outro terminal):
//   node --env-file=api/.env api/teste-areas.mjs
import assert from 'node:assert/strict';

const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, TESTE_EMAIL, TESTE_SENHA, TESTE_EMAIL_SINDICO, TESTE_SENHA_SINDICO } = process.env;
const api = process.env.API_URL ?? 'http://127.0.0.1:3000';
const origem = process.env.ALLOWED_ORIGIN ?? 'http://localhost:5173';

// A mesma relação do teste pgTAP 07, na ordem da resposta: áreas por nome, categorias pelo campo ordem.
const CATALOGO = [
  ['convivencia-e-administracao', ['barulho', 'garagem']],
  ['eletrica', ['eletrica']],
  ['elevadores', ['elevador']],
  ['gas-e-instalacoes', ['gas']],
  ['geral-e-triagem', ['outros']],
  ['hidraulica', ['hidraulica']],
  ['jardinagem-e-areas-externas', ['jardim']],
  ['limpeza-e-conservacao', ['limpeza']],
  ['manutencao-predial', ['estrutura', 'lazer']],
  ['residuos-e-saneamento', []],
  ['seguranca-e-acesso', ['portaria', 'seguranca']],
];

const pedir = (caminho, { method = 'GET', token, headers = {} } = {}) => fetch(new URL(caminho, api), {
  method,
  headers: { ...headers, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  signal: AbortSignal.timeout(10000),
});

// Login no Supabase Auth, como o frontend fará
async function entrar(email, senha) {
  assert.ok(email && senha, 'Preencha no api/.env as variáveis de e-mail e senha de teste (veja o api/.env.example).');
  const login = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: SUPABASE_PUBLISHABLE_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: senha }),
    signal: AbortSignal.timeout(10000),
  });
  const sessao = await login.json();
  assert.equal(login.status, 200, `Login de ${email} falhou: ${sessao.msg ?? sessao.error_description ?? 'sem detalhe'}`);
  return sessao.access_token;
}

let falhas = 0;
async function caso(nome, verificar) {
  try {
    await verificar();
    console.log(`ok     ${nome}`);
  } catch (erro) {
    falhas += 1;
    console.error(`FALHOU ${nome}\n       ${erro.message.replaceAll('\n', '\n       ')}`);
  }
}

await caso('1. sem token: 401 nao_autenticado', async () => {
  const resposta = await pedir('/areas');
  assert.equal(resposta.status, 401, 'GET /areas sem token deveria responder 401.');
  assert.deepEqual(await resposta.json(), { error: 'nao_autenticado', mensagem: 'Entre na sua conta.' });
});

await caso('2. token inválido: mesma resposta que /ocorrencias', async () => {
  const token = 'token-invalido';
  const referencia = await pedir('/ocorrencias?condominio_id=1', { token });
  assert.equal(referencia.status, 401, 'GET /ocorrencias com token inválido deveria responder 401 (o Supabase local está no ar?).');
  const resposta = await pedir('/areas', { token });
  assert.equal(resposta.status, referencia.status, 'GET /areas deveria ter o mesmo status de /ocorrencias.');
  assert.deepEqual(await resposta.json(), await referencia.json(), 'GET /areas deveria ter o mesmo corpo de /ocorrencias.');
});

await caso('3. POST logado: 405 com Allow: GET, OPTIONS', async () => {
  const token = await entrar(TESTE_EMAIL, TESTE_SENHA);
  const resposta = await pedir('/areas', { method: 'POST', token });
  assert.equal(resposta.status, 405, 'POST /areas deveria responder 405.');
  assert.equal(resposta.headers.get('allow'), 'GET, OPTIONS', 'Cabeçalho Allow diferente do esperado.');
});

await caso('4. OPTIONS da origem permitida: 204 com Access-Control-Allow-Origin', async () => {
  const resposta = await pedir('/areas', { method: 'OPTIONS', headers: { Origin: origem } });
  assert.equal(resposta.status, 204, 'OPTIONS /areas deveria responder 204.');
  assert.equal(resposta.headers.get('access-control-allow-origin'), origem, `A origem ${origem} deveria estar liberada.`);
});

let catalogoDoMorador;
await caso('5. morador logado: 11 áreas e 13 categorias, cada uma na área certa', async () => {
  const resposta = await pedir('/areas', { token: await entrar(TESTE_EMAIL, TESTE_SENHA) });
  assert.equal(resposta.status, 200, 'GET /areas do morador deveria responder 200.');
  const corpo = await resposta.json();
  assert.equal(corpo.total, 11, 'O total deveria ser 11.');
  assert.equal(corpo.areas.length, 11, 'A lista deveria ter 11 áreas.');

  const nomes = corpo.areas.map((area) => area.nome);
  assert.deepEqual(nomes, nomes.toSorted(new Intl.Collator('pt-BR').compare), 'As áreas deveriam vir em ordem de nome.');

  const categorias = corpo.areas.flatMap((area) => area.categorias.map((categoria) => categoria.slug));
  assert.equal(categorias.length, 13, 'Deveriam vir 13 categorias no total.');
  assert.equal(new Set(categorias).size, 13, 'Cada categoria deveria aparecer uma vez só.');

  assert.deepEqual(
    corpo.areas.map((area) => [area.slug, area.categorias.map((categoria) => categoria.slug)]),
    CATALOGO,
    'Áreas ou categorias diferentes da relação esperada.');
  assert.deepEqual(
    corpo.areas.find((area) => area.slug === 'residuos-e-saneamento')?.categorias, [],
    'A área residuos-e-saneamento deveria vir com a lista de categorias vazia.');

  for (const area of corpo.areas) {
    assert.deepEqual(Object.keys(area).toSorted(), ['categorias', 'id', 'nome', 'slug'], `Campos inesperados na área ${area.slug}.`);
    for (const categoria of area.categorias) {
      assert.deepEqual(Object.keys(categoria).toSorted(), ['nome', 'slug'], `Campos inesperados em uma categoria de ${area.slug}.`);
    }
  }
  catalogoDoMorador = corpo;
});

await caso('6. síndico logado: mesmo conteúdo do morador', async () => {
  const resposta = await pedir('/areas', { token: await entrar(TESTE_EMAIL_SINDICO, TESTE_SENHA_SINDICO) });
  assert.equal(resposta.status, 200, 'GET /areas do síndico deveria responder 200.');
  assert.ok(catalogoDoMorador, 'Sem a resposta do morador (caso 5) não há com o que comparar.');
  assert.deepEqual(await resposta.json(), catalogoDoMorador, 'O catálogo do síndico deveria ser igual ao do morador.');
});

if (falhas > 0) {
  console.error(`\n${falhas} caso(s) com falha em ${api}`);
  process.exitCode = 1;
} else {
  console.log(`\nGET /areas OK em ${api}`);
}
