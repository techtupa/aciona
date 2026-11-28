import assert from 'node:assert/strict';

const [baseUrl, origin] = process.argv.slice(2);
assert.ok(baseUrl && origin, 'Informe a URL da API e a origem exata do frontend.');
assert.equal(new URL(origin).origin, origin, 'A origem deve estar sem caminho ou barra final.');

// Um "pré-voo" por rota chamada pelo navegador, com o método que o frontend usa nela.
for (const [rota, metodo] of [['/ocorrencias', 'POST'], ['/areas', 'GET']]) {
  const response = await fetch(new URL(rota, baseUrl), {
    method: 'OPTIONS',
    headers: {
      Origin: origin,
      'Access-Control-Request-Method': metodo,
      'Access-Control-Request-Headers': 'authorization,content-type',
    },
    signal: AbortSignal.timeout(8000),
  });

  assert.equal(response.status, 204, `Preflight de ${rota} não respondeu 204.`);
  assert.equal(response.headers.get('access-control-allow-origin'), origin, `Origem não liberada em ${rota}.`);
  const methods = (response.headers.get('access-control-allow-methods') ?? '').split(',').map(value => value.trim());
  const headers = (response.headers.get('access-control-allow-headers') ?? '').toLowerCase().split(',').map(value => value.trim());
  assert.ok(methods.includes(metodo), `Método ${metodo} ausente no preflight de ${rota}.`);
  assert.ok(headers.includes('authorization') && headers.includes('content-type'), `Cabeçalhos da demo ausentes no preflight de ${rota}.`);
}
console.log('Preflight do registro de ocorrência e da consulta de áreas validado.');
