const API_URL = import.meta.env.VITE_API_URL

// Chama a API do Aciona com o token da pessoa.
// Nunca lança erro: devolve { ok, status, dados }, e status 0 quando nem chegou no servidor.
export async function chamarApi(caminho, token, opcoes = {}) {
  let resposta
  try {
    resposta = await fetch(`${API_URL}${caminho}`, {
      ...opcoes,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(opcoes.body ? { 'Content-Type': 'application/json' } : {}),
      },
    })
  } catch {
    return { ok: false, status: 0, dados: null }
  }
  const dados = await resposta.json().catch(() => null)
  return { ok: resposta.ok, status: resposta.status, dados }
}

// GET /meus-condominios: os condomínios da pessoa e o papel dela em cada um.
export function buscarMeusCondominios(token) {
  return chamarApi('/meus-condominios', token)
}

// POST /ocorrencias: grava uma nova ocorrência.
// Em repetição com o mesmo id_solicitacao, a API devolve 200 com { numero, ja_existia: true }.
export function criarOcorrencia(token, { condominio_id, local, descricao, id_solicitacao }) {
  return chamarApi('/ocorrencias', token, {
    method: 'POST',
    body: JSON.stringify({
      condominio_id: Number(condominio_id),
      local,
      descricao,
      id_solicitacao,
    }),
  })
}

// GET /ocorrencias: a fila de um condomínio, das mais recentes para as mais antigas.
// Cada página traz até 20.
export function buscarOcorrencias(token, condominioId, pagina = 1) {
  return chamarApi(`/ocorrencias?condominio_id=${condominioId}&pagina=${pagina}`, token)
}
