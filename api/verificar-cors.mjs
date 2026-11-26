import assert from 'node:assert/strict';

const [baseUrl, origin] = process.argv.slice(2);
assert.ok(baseUrl && origin, 'Informe a URL da API e a origem exata do frontend.');
assert.equal(new URL(origin).origin, origin, 'A origem deve estar sem caminho ou barra final.');

const response = await fetch(new URL('/ocorrencias', baseUrl), {
  method: 'OPTIONS',
  headers: {
    Origin: origin,
    'Access-Control-Request-Method': 'POST',
    'Access-Control-Request-Headers': 'authorization,content-type',
  },
  signal: AbortSignal.timeout(8000),
});

assert.equal(response.status, 204);
assert.equal(response.headers.get('access-control-allow-origin'), origin);
const methods = (response.headers.get('access-control-allow-methods') ?? '').split(',').map(value => value.trim());
const headers = (response.headers.get('access-control-allow-headers') ?? '').toLowerCase().split(',').map(value => value.trim());
assert.ok(methods.includes('POST'), 'Método POST ausente no preflight.');
assert.ok(headers.includes('authorization') && headers.includes('content-type'), 'Cabeçalhos da demo ausentes no preflight.');
console.log('Preflight do registro de ocorrência validado.');
