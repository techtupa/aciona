
import { useState } from 'react'
import PageHeader from '../components/PageHeader'
import CondominiumSelector from '../components/CondominiumSelector'
import OccurrenceItem from '../components/OccurrenceItem'
import './FilaOcorrencias.css'

// Dados temporários para desenvolver a interface.
// Depois serão substituídos pelos dados da API.
const condominiums = [
    { id: 'vista', name: 'Vista' },
    { id: 'aurora', name: 'Aurora' },
]

const occurrences = [
    
    {
        id: '1',
        condominiumId: 'vista',
        number: 'AC-0001',
        summary: 'Vazamento no corredor do bloco A',
        location: 'Hall do bloco A',
        status: 'registered',
        createdAt: '2026-11-26T09:30:00',
    },
    {
        id: '2',
        condominiumId: 'vista',
        number: 'AC-0002',
        summary: 'Lâmpada queimada na garagem',
        location: 'Garagem · Subsolo 1',
        status: 'progress',
        createdAt: '2026-11-25T16:45:00',
    },
    {
        id: '3',
        condominiumId: 'vista',
        number: 'AC-0003',
        summary: 'Portão de entrada com defeito',
        location: 'Entrada principal',
        status: 'resolved',
        createdAt: '2026-11-24T11:20:00',
    },
    {
        id: '4',
        condominiumId: 'aurora',
        number: 'AC-0004',
        summary: 'Problema na iluminação da escada',
        location: 'Escada do bloco B',
        status: 'registered',
        createdAt: '2026-11-23T14:10:00',
    },
]

function FilaOcorrencias() {
    const [selectedCondominiumId, setSelectedCondominiumId] =
        useState('vista')

    const selectedCondominium = condominiums.find(
        (condominium) => condominium.id === selectedCondominiumId
    )

    const filteredOccurrences = occurrences
        .filter(
            (occurrence) =>
                occurrence.condominiumId === selectedCondominiumId
        )
        .sort(
            (a, b) =>
                new Date(b.createdAt) - new Date(a.createdAt)
        )

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
                    <CondominiumSelector
                        condominiums={condominiums}
                        selectedCondominiumId={selectedCondominiumId}
                        onChange={setSelectedCondominiumId}
                    />

                    <div className="occurrence-queue__active">
                        <span>Condomínio ativo:</span>
                        <strong>{selectedCondominium?.name}</strong>
                    </div>

                    <div className="occurrence-queue__list">
                        {filteredOccurrences.length > 0 ? (
                            filteredOccurrences.map((occurrence) => (
                                <OccurrenceItem
                                    key={occurrence.id}
                                    occurrence={occurrence}
                                />
                            ))
                        ) : (
                            <p className="occurrence-queue__empty">
                                Não há ocorrências registradas neste condomínio.
                            </p>
                        )}
                    </div>
                </section>
            </main>
        </div>
    )
}

export default FilaOcorrencias
