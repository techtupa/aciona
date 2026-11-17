import assert from 'node:assert/strict';

const baseUrl = process.argv[2] ?? 'http://127.0.0.1:3000';
const expectedRevision = process.argv[3];
const request = (path, method = 'GET') => fetch(new URL(path, baseUrl), {
  method,
  signal: AbortSignal.timeout(8000),
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

console.log(`Aciona API OK em ${baseUrl} (${body.revision})`);
