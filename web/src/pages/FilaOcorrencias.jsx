import { useEffect, useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import CondominiumSelector from '../components/CondominiumSelector'
import OccurrenceItem from '../components/OccurrenceItem'
import Button from '../components/Button'
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

// Devolve { items, total, perPage } quando a página chega, ou só { status } quando a busca falha.
async function fetchPage(condominiumId, page) {
    const response = await buscarOcorrencias(await lerToken(), condominiumId, page)
    const items = response.dados?.ocorrencias
    const total = response.dados?.total
    const perPage = response.dados?.por_pagina
    if (
        !response.ok ||
        !Array.isArray(items) ||
        !Number.isInteger(total) ||
        !Number.isInteger(perPage)
    ) {
        return { status: response.status }
    }
    return { items: items.map(toOccurrence), total, perPage }
}

// Fila de um condomínio. Quem usa passa o id como key: ao trocar de condomínio, a fila
// recomeça da primeira página e as respostas do anterior são descartadas.
function CondominiumQueue({ condominium }) {
    const [queue, setQueue] = useState(null)
    const [failure, setFailure] = useState(null)
    const [loadingMore, setLoadingMore] = useState(false)

    useEffect(() => {
        let active = true
        fetchPage(condominium.id, 1).then((result) => {
            if (!active) return
            if (result.items) setQueue({ ...result, page: 1 })
            else setFailure(result)
        })
        return () => {
            active = false
        }
    }, [condominium.id])

    async function loadMore() {
        setLoadingMore(true)
        setFailure(null)
        const page = queue.page + 1
        const result = await fetchPage(condominium.id, page)
        setLoadingMore(false)
        if (!result.items) {
            setFailure(result)
            return
        }
        // Um relato novo empurra os antigos para a página seguinte: não repete os já carregados.
        const loadedIds = new Set(queue.items.map((occurrence) => occurrence.id))
        const newItems = result.items.filter((occurrence) => !loadedIds.has(occurrence.id))
        setQueue({ ...result, items: [...queue.items, ...newItems], page })
    }

    if (failure?.status === 401) {
        return <Navigate to="/login" replace />
    }

    function renderOccurrences() {
        if (!queue) return failure ? errorMessage : loadingMessage

        if (queue.items.length === 0) {
            return (
                <p className="occurrence-queue__empty">
                    Nenhuma ocorrência registrada
                    <br />
                    Os novos relatos deste condomínio vão aparecer aqui.
                </p>
            )
        }

        return queue.items.map((occurrence) => (
            <OccurrenceItem
                key={occurrence.id}
                occurrence={occurrence}
            />
        ))
    }

    return (
        <>
            <div className="occurrence-queue__active">
                <span>Condomínio ativo:</span>
                <strong>{condominium.name}</strong>
                <span className="occurrence-queue__count" role="status">
                    {queue && (queue.total === 1 ? '1 ocorrência' : `${queue.total} ocorrências`)}
                </span>
            </div>

            <div className="occurrence-queue__list">
                {renderOccurrences()}
            </div>

            {queue && failure && errorMessage}

            {queue && queue.page * queue.perPage < queue.total && (
                <Button variant="secondary" onClick={loadMore} disabled={loadingMore}>
                    {loadingMore ? 'Carregando…' : 'Mostrar mais ocorrências'}
                </Button>
            )}
        </>
    )
}

function FilaOcorrencias() {
    const [searchParams, setSearchParams] = useSearchParams()
    const [condominiumsResponse, setCondominiumsResponse] = useState(null)

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

    if (condominiumsResponse?.status === 401) {
        return <Navigate to="/login" replace />
    }
    if (condominiums?.length === 0) {
        return <Navigate to="/ocorrencias/nova" replace />
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

                            <CondominiumQueue
                                key={selectedId}
                                condominium={selectedCondominium}
                            />
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
