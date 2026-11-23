import Button from '../components/Button'
import './NovaOcorrencia.css'
import Input from '../components/Input'
import Textarea from '../components/Textarea'
import PageHeader from '../components/PageHeader'
import CondominiumCard from '../components/CondominiumCard'

import { useState } from 'react'

function NovaOcorrencia() {

    const [local, setLocal] = useState('')
    const [descricao, setDescricao] = useState('')
    const [errors, setErrors] = useState({})
    const [showSuccess, setShowSuccess] = useState(false)
    const handleSubmit = (event) => {
        event.preventDefault()

        const newErrors = {}

        if (!local.trim()) {
            newErrors.local = 'Informe o local da ocorrência.'
        }

        if (!descricao.trim()) {
            newErrors.descricao = 'Informe a descrição da ocorrência.'
        }

        setErrors(newErrors)

        if (Object.keys(newErrors).length > 0) {
            return
        }

        setShowSuccess(true)
    }

    return (
        <main className="occurrence-page">
            <PageHeader userRole="Morador" />

            <section className="occurrence-content">
                <h2>Registrar ocorrência</h2>

                <p>
                    Conte o que aconteceu para a administração
                    do condomínio.
                </p>

                {showSuccess ? (
                    <div className="success-message">
                        <h3>Ocorrência registrada!</h3>

                        <p>
                            Seu relato foi recebido com sucesso.
                        </p>

                        <p>
                            Número da ocorrência: DEMO-001
                        </p>

                        <small>
                            Confirmação demonstrativa — ainda sem gravação na API.
                        </small>
                    </div>
                ) : (
                    <form
                        className="occurrence-form"
                        onSubmit={handleSubmit}
                        noValidate
                    >
                        <CondominiumCard name="Vista" />

                        <Input
                            label="Local"
                            id="local"
                            name="local"
                            placeholder="Ex.: hall do bloco A"
                            value={local}
                            onChange={(event) => setLocal(event.target.value)}
                            required
                            error={errors.local}
                        />

                        <Textarea
                            label="Descrição"
                            id="descricao"
                            name="descricao"
                            placeholder="Descreva o que aconteceu..."
                            rows={4}
                            value={descricao}
                            onChange={(event) => setDescricao(event.target.value)}
                            required
                            error={errors.descricao}
                        />
                        <Button type="submit">
                            Enviar ocorrência
                        </Button>
                    </form>
                )}
            </section>
        </main>
    )
}

export default NovaOcorrencia
