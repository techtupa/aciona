import { createServer } from 'node:http';

const port = Number(process.env.PORT ?? 3000);
const revision = process.env.ACIONA_REVISION ?? 'local';

// Supabase: endereço do projeto e chave PÚBLICA (sb_publishable_...).
// A chave secreta / service_role nunca entra aqui: quem decide o acesso é a RLS,
// com a sessão da própria pessoa.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;

// Endereço do frontend que pode chamar a API pelo navegador (CORS).
const origemPermitida = process.env.ALLOWED_ORIGIN ?? 'http://localhost:5173';

const LIMITE_CORPO = 16 * 1024; // 16 KB é bem mais do que um relato precisa
const FORMATO_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FORMATO_CATEGORIA = /^[a-z_]{1,30}$/;

function cabecalhosCors(request) {
  const origin = request.headers.origin;
  if (!origin || origin !== origemPermitida) return {};
  return { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' };
}

function sendJson(response, statusCode, body, extraHeaders = {}) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...extraHeaders,
  });
  response.end(JSON.stringify(body));
}

// Lê o corpo do pedido como JSON, com limite de tamanho.
async function lerJson(request) {
  const tipo = request.headers['content-type'] ?? '';
  if (!tipo.startsWith('application/json')) {
    return { erro: 415, corpo: { error: 'tipo_nao_suportado', mensagem: 'Envie os dados em JSON.' } };
  }
  let tamanho = 0;
  const partes = [];
  for await (const parte of request) {
    tamanho += parte.length;
    if (tamanho > LIMITE_CORPO) {
      return { erro: 413, corpo: { error: 'corpo_grande_demais' } };
    }
    partes.push(parte);
  }
  try {
    return { dados: JSON.parse(Buffer.concat(partes).toString('utf8')) };
  } catch {
    return { erro: 400, corpo: { error: 'json_invalido', mensagem: 'O corpo do pedido não é um JSON válido.' } };
  }
}

// Confere os campos do formulário. Devolve as mensagens por campo,
// para o formulário mostrar cada erro embaixo do campo certo.
function validarOcorrencia(dados) {
  const campos = {};
  const texto = (valor) => (typeof valor === 'string' ? valor.trim() : '');

  if (!Number.isInteger(dados?.condominio_id) || dados.condominio_id <= 0) {
    campos.condominio_id = 'Informe o condomínio.';
  }
  const local = texto(dados?.local);
  if (!local) campos.local = 'Informe o local do problema.';
  else if (local.length > 120) campos.local = 'Use no máximo 120 caracteres.';

  const descricao = texto(dados?.descricao);
  if (!descricao) campos.descricao = 'Descreva o problema.';
  else if (descricao.length > 2000) campos.descricao = 'Use no máximo 2000 caracteres.';

  const categoria = dados?.categoria ?? null;
  if (categoria !== null && (typeof categoria !== 'string' || !FORMATO_CATEGORIA.test(categoria))) {
    campos.categoria = 'Tópico inválido.';
  }
  if (typeof dados?.id_solicitacao !== 'string' || !FORMATO_UUID.test(dados.id_solicitacao)) {
    campos.id_solicitacao = 'Identificador de envio ausente ou inválido.';
  }

  if (Object.keys(campos).length > 0) return { campos };
  return {
    ocorrencia: {
      p_condominio_id: dados.condominio_id,
      p_local: local,
      p_descricao: descricao,
      p_categoria: categoria,
      p_origem: 'formulario',
      p_id_solicitacao: dados.id_solicitacao,
    },
  };
}

// Traduz o erro do banco (via Supabase) para uma resposta que o formulário entende.
function traduzirErroDoBanco(status, erro) {
  const codigo = erro?.code;
  if (status === 401 || codigo === 'PGRST301' || codigo === 'PGRST303') {
    return [401, { error: 'sessao_invalida', mensagem: 'Sua sessão expirou. Entre de novo.' }];
  }
  if (codigo === '42501') {
    return [403, { error: 'sem_acesso', mensagem: 'Sua conta não tem acesso a este condomínio.' }];
  }
  if (codigo === '23503') {
    const campo = String(erro?.details ?? erro?.message ?? '').includes('categoria') ? 'categoria' : 'condominio_id';
    const mensagem = campo === 'categoria' ? 'Tópico inválido.' : 'Condomínio não encontrado.';
    return [400, { error: 'dados_invalidos', campos: { [campo]: mensagem } }];
  }
  if (codigo === '23514' || codigo === '22001') {
    return [400, { error: 'dados_invalidos', mensagem: 'Confira o local e a descrição.' }];
  }
  return [503, { error: 'falha_gravacao', mensagem: 'Não foi possível salvar agora. Tente de novo.', recuperavel: true }];
}

async function registrarOcorrencia(request, response, cors) {
  // 1. Quem está enviando? (sessão do Supabase Auth, enviada pelo frontend)
  const autorizacao = request.headers.authorization ?? '';
  const token = autorizacao.startsWith('Bearer ') ? autorizacao.slice(7).trim() : '';
  if (!token) {
    sendJson(response, 401, { error: 'nao_autenticado', mensagem: 'Entre na sua conta para registrar.' }, cors);
    return;
  }

  // 2. O que foi enviado está certo?
  const lido = await lerJson(request);
  if (lido.erro) {
    sendJson(response, lido.erro, lido.corpo, cors);
    return;
  }
  const { campos, ocorrencia } = validarOcorrencia(lido.dados);
  if (campos) {
    sendJson(response, 400, { error: 'dados_invalidos', campos }, cors);
    return;
  }

  if (!supabaseUrl || !supabaseKey) {
    console.error('SUPABASE_URL ou SUPABASE_PUBLISHABLE_KEY não configurados');
    sendJson(response, 503, { error: 'falha_gravacao', mensagem: 'Não foi possível salvar agora. Tente de novo.', recuperavel: true }, cors);
    return;
  }

  // 3. Grava pelo banco, NO NOME da pessoa: a RLS decide se ela pode gravar nesse condomínio.
  let resposta;
  try {
    resposta = await fetch(`${supabaseUrl}/rest/v1/rpc/registrar_ocorrencia`, {
      method: 'POST',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ocorrencia),
      signal: AbortSignal.timeout(8000),
    });
  } catch (erro) {
    console.error('Falha ao falar com o Supabase:', erro.message);
    sendJson(response, 503, { error: 'falha_gravacao', mensagem: 'Não foi possível salvar agora. Tente de novo.', recuperavel: true }, cors);
    return;
  }

  const corpo = await resposta.json().catch(() => null);
  if (!resposta.ok) {
    const [status, erro] = traduzirErroDoBanco(resposta.status, corpo);
    if (status === 503) console.error('Erro do banco ao gravar:', resposta.status, corpo);
    sendJson(response, status, erro, cors);
    return;
  }

  // 4. Só depois de salvo devolve o número para a tela de confirmação.
  const registro = Array.isArray(corpo) ? corpo[0] : null;
  if (!registro?.numero) {
    // o identificador já foi usado num registro que esta conta não enxerga
    sendJson(response, 409, { error: 'conflito', mensagem: 'Gere um novo envio e tente de novo.' }, cors);
    return;
  }
  sendJson(response, registro.ja_existia ? 200 : 201, { numero: registro.numero, ja_existia: registro.ja_existia }, cors);
}

const server = createServer(async (request, response) => {
  const path = request.url?.split('?', 1)[0];
  const cors = cabecalhosCors(request);

  if (path === '/health') {
    if (request.method !== 'GET') {
      sendJson(response, 405, { error: 'method_not_allowed' }, { Allow: 'GET' });
      return;
    }
    sendJson(response, 200, { status: 'ok', service: 'aciona-api', revision });
    return;
  }

  if (path === '/ocorrencias') {
    if (request.method === 'OPTIONS') {
      // "pré-voo" do navegador antes do POST vindo de outro endereço
      response.writeHead(204, {
        ...cors,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
        'Access-Control-Max-Age': '600',
      });
      response.end();
      return;
    }
    if (request.method === 'POST') {
      try {
        await registrarOcorrencia(request, response, cors);
      } catch (erro) {
        console.error('Erro inesperado:', erro);
        if (!response.headersSent) {
          sendJson(response, 500, { error: 'erro_interno', recuperavel: true }, cors);
        }
      }
      return;
    }
    sendJson(response, 405, { error: 'method_not_allowed' }, { Allow: 'POST, OPTIONS', ...cors });
    return;
  }

  sendJson(response, 404, { error: 'not_found' });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Aciona API listening on port ${port}`);
});