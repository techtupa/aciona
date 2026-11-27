import { useEffect, useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import CondominiumSelector from '../components/CondominiumSelector'
import OccurrenceItem from '../components/OccurrenceItem'
import { lerToken } from '../lib/supabase'
import { buscarMeusCondominios, buscarOcorrencias } from '../services/api'
import './FilaOcorrencias.css'

// Situação como a API devolve → situação como o OccurrenceItem espera.
const STATUS_BY_API = {
    registrada: 'registered',
    em_andamento: 'progress',
    resolvida: 'resolved',
}

function toOccurrence(item) {
    return {
        id: item.numero,
        number: item.numero,
        summary: item.resumo,
        location: item.local,
        status: STATUS_BY_API[item.status],
        createdAt: item.criado_em,
    }
}

const loadingMessage = (
    <p className="occurrence-queue__empty" role="status">
        Carregando a fila…
    </p>
)

const errorMessage = (
    <p className="occurrence-queue__empty" role="alert">
        Não foi possível carregar a fila. Tente de novo.
    </p>
)

function FilaOcorrencias() {
    const [searchParams, setSearchParams] = useSearchParams()
    const [condominiumsResponse, setCondominiumsResponse] = useState(null)
    const [queueResult, setQueueResult] = useState(null)

    useEffect(() => {
        let active = true
        lerToken()
            .then(buscarMeusCondominios)
            .then((response) => {
                if (active) setCondominiumsResponse(response)
            })
        return () => {
            active = false
        }
    }, [])

    const list = condominiumsResponse?.dados?.condominios
    const condominiums =
        condominiumsResponse?.ok && Array.isArray(list)
            ? list
                .filter((condominium) => condominium.papel === 'sindico')
                .map((condominium) => ({
                    id: String(condominium.id),
                    name: condominium.nome,
                }))
            : null

    // O condomínio ativo é o da URL. Se ela não indicar um da lista, vale o primeiro.
    const requestedId = searchParams.get('condominio')
    const selectedCondominium =
        condominiums?.find((condominium) => condominium.id === requestedId) ??
        condominiums?.[0]
    const selectedId = selectedCondominium?.id

    useEffect(() => {
        if (selectedId && selectedId !== requestedId) {
            setSearchParams({ condominio: selectedId }, { replace: true })
        }
    }, [selectedId, requestedId, setSearchParams])

    useEffect(() => {
        if (!selectedId) return undefined
        let active = true
        lerToken()
            .then((token) => buscarOcorrencias(token, selectedId))
            .then((response) => {
                if (active) setQueueResult({ condominiumId: selectedId, response })
            })
        return () => {
            active = false
        }
    }, [selectedId])

    // Uma resposta de outro condomínio não vale para o que está ativo agora.
    const queueResponse =
        queueResult?.condominiumId === selectedId ? queueResult?.response : null

    if (condominiumsResponse?.status === 401 || queueResponse?.status === 401) {
        return <Navigate to="/login" replace />
    }
    if (condominiums?.length === 0) {
        return <Navigate to="/ocorrencias/nova" replace />
    }

    function renderOccurrences() {
        if (!queueResponse) return loadingMessage

        const items = queueResponse.dados?.ocorrencias
        if (!queueResponse.ok || !Array.isArray(items)) return errorMessage

        if (items.length === 0) {
            return (
                <p className="occurrence-queue__empty">
                    Nenhuma ocorrência registrada
                    <br />
                    Os novos relatos deste condomínio vão aparecer aqui.
                </p>
            )
        }

        return items.map(toOccurrence).map((occurrence) => (
            <OccurrenceItem
                key={occurrence.id}
                occurrence={occurrence}
            />
        ))
    }

    return (
        <div className="occurrence-queue">
            <PageHeader userRole="Síndico" />

            <main className="occurrence-queue__main">
                <header className="occurrence-queue__heading">
                    <h1>Fila de ocorrências</h1>
                    <p>
                        Acompanhe as ocorrências dos seus condomínios.
                    </p>
                </header>

                <section className="occurrence-queue__section">
                    {condominiums ? (
                        <>
                            <CondominiumSelector
                                condominiums={condominiums}
                                selectedCondominiumId={selectedId}
                                onChange={(id) => setSearchParams({ condominio: id })}
                            />

                            <div className="occurrence-queue__active">
                                <span>Condomínio ativo:</span>
                                <strong>{selectedCondominium.name}</strong>
                            </div>

                            <div className="occurrence-queue__list">
                                {renderOccurrences()}
                            </div>
                        </>
                    ) : (
                        condominiumsResponse ? errorMessage : loadingMessage
                    )}
                </section>
            </main>
        </div>
    )
}

export default FilaOcorrencias
