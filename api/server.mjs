import { createServer } from 'node:http';

const port = Number(process.env.PORT ?? 3000);
const revision = process.env.ACIONA_REVISION ?? 'local';

function sendJson(response, statusCode, body, extraHeaders = {}) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...extraHeaders,
  });
  response.end(JSON.stringify(body));
}

const server = createServer((request, response) => {
  const path = request.url?.split('?', 1)[0];

  if (path !== '/health') {
    sendJson(response, 404, { error: 'not_found' });
    return;
  }

  if (request.method !== 'GET') {
    sendJson(response, 405, { error: 'method_not_allowed' }, { Allow: 'GET' });
    return;
  }

  sendJson(response, 200, { status: 'ok', service: 'aciona-api', revision });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Aciona API listening on port ${port}`);
});
