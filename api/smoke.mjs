import assert from 'node:assert/strict';

const baseUrl = process.argv[2] ?? 'http://127.0.0.1:3000';
const expectedRevision = process.argv[3];
const request = (path, method = 'GET', options = {}) => fetch(new URL(path, baseUrl), {
  method,
  signal: AbortSignal.timeout(8000),
  ...options,
});

const health = await request('/health');
assert.equal(health.status, 200);
assert.match(health.headers.get('content-type'), /^application\/json\b/);
const body = await health.json();
assert.equal(body.status, 'ok');
assert.equal(body.service, 'aciona-api');
assert.ok(body.revision);
if (expectedRevision) assert.equal(body.revision, expectedRevision);

const wrongMethod = await request('/health', 'POST');
assert.equal(wrongMethod.status, 405);
assert.equal(wrongMethod.headers.get('allow'), 'GET');
assert.equal((await wrongMethod.json()).error, 'method_not_allowed');

const missingRoute = await request('/rota-inexistente');
assert.equal(missingRoute.status, 404);
assert.equal((await missingRoute.json()).error, 'not_found');

// ORB-26: POST /ocorrencias (testes que não precisam do Supabase)
const semLogin = await request('/ocorrencias', 'POST', {
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({}),
});
assert.equal(semLogin.status, 401);
assert.equal((await semLogin.json()).error, 'nao_autenticado');

const camposVazios = await request('/ocorrencias', 'POST', {
  headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token-de-teste' },
  body: JSON.stringify({ condominio_id: 1, local: '   ', descricao: '' }),
});
assert.equal(camposVazios.status, 400);
const erroCampos = await camposVazios.json();
assert.equal(erroCampos.error, 'dados_invalidos');
assert.ok(erroCampos.campos.local);
assert.ok(erroCampos.campos.descricao);
assert.ok(erroCampos.campos.id_solicitacao);

const jsonQuebrado = await request('/ocorrencias', 'POST', {
  headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token-de-teste' },
  body: '{ isso não é json',
});
assert.equal(jsonQuebrado.status, 400);
assert.equal((await jsonQuebrado.json()).error, 'json_invalido');

const metodoErrado = await request('/ocorrencias', 'DELETE');
assert.equal(metodoErrado.status, 405);

// ORB-27: GET /ocorrencias e GET /meus-condominios (testes que não precisam do Supabase)
const filaSemLogin = await request('/ocorrencias?condominio_id=1');
assert.equal(filaSemLogin.status, 401);
assert.equal((await filaSemLogin.json()).error, 'nao_autenticado');

const filaSemCondominio = await request('/ocorrencias', 'GET', { headers: { Authorization: 'Bearer token-de-teste' } });
assert.equal(filaSemCondominio.status, 400);
assert.ok((await filaSemCondominio.json()).campos.condominio_id);

const filaCondominioInvalido = await request('/ocorrencias?condominio_id=abc', 'GET', { headers: { Authorization: 'Bearer token-de-teste' } });
assert.equal(filaCondominioInvalido.status, 400);

const condominiosSemLogin = await request('/meus-condominios');
assert.equal(condominiosSemLogin.status, 401);

// ORB-27: paginação das listagens (validação, sem Supabase)
const comToken = { headers: { Authorization: 'Bearer token-de-teste' } };

const paginaZero = await request('/ocorrencias?condominio_id=1&pagina=0', 'GET', comToken);
assert.equal(paginaZero.status, 400);
assert.ok((await paginaZero.json()).campos.pagina);

const porPaginaGrande = await request('/ocorrencias?condominio_id=1&por_pagina=101', 'GET', comToken);
assert.equal(porPaginaGrande.status, 400);
assert.ok((await porPaginaGrande.json()).campos.por_pagina);

const paginaTexto = await request('/meus-condominios?pagina=abc', 'GET', comToken);
assert.equal(paginaTexto.status, 400);
assert.ok((await paginaTexto.json()).campos.pagina);

console.log(`Aciona API OK em ${baseUrl} (${body.revision})`);