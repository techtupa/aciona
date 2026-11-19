import Button from '../components/Button'
import './NovaOcorrencia.css'
import Input from '../components/Input'
import Textarea from '../components/Textarea'
import PageHeader from '../components/PageHeader'
import CondominiumCard from '../components/CondominiumCard'

function NovaOcorrencia() {
    return (
        <main className="occurrence-page">
            <PageHeader userRole="Morador" />

            <section className="occurrence-content">
                <h2>Registrar ocorrência</h2>

                <p>
                    Conte o que aconteceu para a administração
                    do condomínio.
                </p>

                <form className="occurrence-form">
                    <CondominiumCard name="Vista" />

                    <Input
                        label="Local"
                        id="local"
                        name="local"
                        placeholder="Ex.: hall do bloco A"
                        required
                    />

                    <Textarea
                        label="Descrição"
                        id="descricao"
                        name="descricao"
                        placeholder="Descreva o que aconteceu..."
                        rows={4}
                        required
                    />

                    <Button type="submit">
                        Enviar ocorrência
                    </Button>
                </form>
            </section>
        </main>
    )
}

export default NovaOcorrencia
