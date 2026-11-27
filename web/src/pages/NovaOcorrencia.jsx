import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Button from '../components/Button'
import CondominiumCard from '../components/CondominiumCard'
import FeedbackMessage from '../components/FeedbackMessage'
import Input from '../components/Input'
import PageHeader from '../components/PageHeader'
import Textarea from '../components/Textarea'
import { lerToken, supabase } from '../lib/supabase'
import { buscarMeusCondominios, criarOcorrencia } from '../services/api'
import './NovaOcorrencia.css'

const LIMITE_LOCAL = 120
const LIMITE_DESCRICAO = 2000

function lerCondominioIdDaUrl(valor) {
    if (typeof valor !== 'string' || !/^[1-9][0-9]{0,8}$/.test(valor)) {
        return null
    }
    return Number(valor)
}

function gerarIdSolicitacao() {
    if (typeof globalThis.crypto?.randomUUID === 'function') {
        return globalThis.crypto.randomUUID()
    }

    const bytes = new Uint8Array(16)
    globalThis.crypto.getRandomValues(bytes)
    bytes[6] = (bytes[6] & 0x0f) | 0x40
    bytes[8] = (bytes[8] & 0x3f) | 0x80
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

function validarCampos(local, descricao) {
    const localLimpo = local.trim()
    const descricaoLimpa = descricao.trim()
    const erros = {}

    if (!localLimpo) {
        erros.local = 'Informe o local da ocorrência.'
    } else if (localLimpo.length > LIMITE_LOCAL) {
        erros.local = `Use no máximo ${LIMITE_LOCAL} caracteres.`
    }

    if (!descricaoLimpa) {
        erros.descricao = 'Informe a descrição da ocorrência.'
    } else if (descricaoLimpa.length > LIMITE_DESCRICAO) {
        erros.descricao = `Use no máximo ${LIMITE_DESCRICAO} caracteres.`
    }

    return { erros, localLimpo, descricaoLimpa }
}

function focarPrimeiroCampoInvalido(form, erros) {
    const primeiroCampo = erros.local ? 'local' : erros.descricao ? 'descricao' : null
    if (primeiroCampo) {
        form?.elements?.[primeiroCampo]?.focus()
    }
}

function NovaOcorrencia() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const condominioParam = searchParams.get('condominio')
    const condominioIdUrl = lerCondominioIdDaUrl(condominioParam)

    const [tentativaCondominio, setTentativaCondominio] = useState(0)
    const [estadoCondominio, setEstadoCondominio] = useState(() => ({
        param: condominioParam,
        carregando: true,
        condominio: null,
        erro: '',
        podeTentarNovamente: false,
    }))

    const [local, setLocal] = useState('')
    const [descricao, setDescricao] = useState('')
    const [errors, setErrors] = useState({})
    const [enviando, setEnviando] = useState(false)
    const [erroEnvio, setErroEnvio] = useState(null)
    const [numeroConfirmado, setNumeroConfirmado] = useState('')

    const enviandoRef = useRef(false)
    const idSolicitacaoRef = useRef(null)
    const montadoRef = useRef(true)

    useEffect(() => {
        montadoRef.current = true
        return () => {
            montadoRef.current = false
        }
    }, [])

    useEffect(() => {
        let ativo = true

        async function carregarCondominio() {
            const token = await lerToken()
            if (!ativo) return

            if (!token) {
                navigate('/login', { replace: true })
                return
            }

            const resposta = await buscarMeusCondominios(token)
            if (!ativo) return

            if (resposta.status === 401) {
                await supabase.auth.signOut({ scope: 'local' })
                if (!ativo) return
                navigate('/login', { replace: true })
                return
            }

            const condominios = resposta.dados?.condominios
            if (!resposta.ok || !Array.isArray(condominios)) {
                setEstadoCondominio({
                    param: condominioParam,
                    carregando: false,
                    condominio: null,
                    erro: 'Não foi possível carregar o seu condomínio. Tente novamente.',
                    podeTentarNovamente: true,
                })
                return
            }

            if (condominios.length === 0) {
                setEstadoCondominio({
                    param: condominioParam,
                    carregando: false,
                    condominio: null,
                    erro: 'Sua conta ainda não está ligada a nenhum condomínio. Fale com o síndico.',
                    podeTentarNovamente: false,
                })
                return
            }

            let escolhido = condominios[0]
            if (condominioParam !== null) {
                escolhido = condominioIdUrl !== null
                    ? condominios.find((item) => item.id === condominioIdUrl) ?? null
                    : null

                if (!escolhido) {
                    setEstadoCondominio({
                        param: condominioParam,
                        carregando: false,
                        condominio: null,
                        erro: 'Sua conta não tem acesso a este condomínio.',
                        podeTentarNovamente: false,
                    })
                    return
                }
            }

            idSolicitacaoRef.current = null
            setEstadoCondominio({
                param: condominioParam,
                carregando: false,
                condominio: escolhido,
                erro: '',
                podeTentarNovamente: false,
            })
        }

        carregarCondominio()

        return () => {
            ativo = false
        }
    }, [condominioIdUrl, condominioParam, navigate, tentativaCondominio])

    const carregandoCondominio = estadoCondominio.carregando || estadoCondominio.param !== condominioParam
    const condominioAtivo = carregandoCondominio ? null : estadoCondominio.condominio
    const erroCondominio = carregandoCondominio ? '' : estadoCondominio.erro
    const podeTentarNovamenteCondominio = carregandoCondominio ? false : estadoCondominio.podeTentarNovamente
    const userRole = condominioAtivo?.papel === 'sindico' ? 'Síndico' : 'Morador'

    function recarregarCondominio() {
        setEstadoCondominio({
            param: condominioParam,
            carregando: true,
            condominio: null,
            erro: '',
            podeTentarNovamente: false,
        })
        setTentativaCondominio((atual) => atual + 1)
    }

    async function irParaLogin() {
        await supabase.auth.signOut({ scope: 'local' })
        navigate('/login', { replace: true })
    }

    function iniciarNovoRegistro() {
        idSolicitacaoRef.current = null
        setLocal('')
        setDescricao('')
        setErrors({})
        setErroEnvio(null)
        setNumeroConfirmado('')
    }

    const handleSubmit = async (event) => {
        event.preventDefault()
        const form = event.currentTarget

        if (enviandoRef.current || !condominioAtivo) {
            return
        }

        const { erros, localLimpo, descricaoLimpa } = validarCampos(local, descricao)
        setErrors(erros)

        if (Object.keys(erros).length > 0) {
            setErroEnvio(null)
            focarPrimeiroCampoInvalido(form, erros)
            return
        }

        if (!idSolicitacaoRef.current) {
            idSolicitacaoRef.current = gerarIdSolicitacao()
        }

        enviandoRef.current = true
        setEnviando(true)
        setErroEnvio(null)

        try {
            const token = await lerToken()
            if (!montadoRef.current) return

            if (!token) {
                setErroEnvio({
                    mensagem: 'Sua sessão expirou. Entre de novo para concluir o envio; seu relato foi mantido.',
                    recuperavel: false,
                    sessaoExpirada: true,
                })
                return
            }

            const resposta = await criarOcorrencia(token, {
                condominio_id: condominioAtivo.id,
                local: localLimpo,
                descricao: descricaoLimpa,
                id_solicitacao: idSolicitacaoRef.current,
            })
            if (!montadoRef.current) return

            const numero = typeof resposta.dados?.numero === 'string'
                ? resposta.dados.numero.trim()
                : ''

            if (resposta.ok && numero) {
                idSolicitacaoRef.current = null
                setNumeroConfirmado(numero)
                setErroEnvio(null)
                setErrors({})
                return
            }

            if (resposta.status === 400) {
                const campos = resposta.dados?.campos
                if (campos && typeof campos === 'object') {
                    const errosCampos = {}
                    if (campos.local) errosCampos.local = campos.local
                    if (campos.descricao) errosCampos.descricao = campos.descricao

                    setErrors(errosCampos)

                    if (campos.id_solicitacao) {
                        idSolicitacaoRef.current = null
                    }

                    if (Object.keys(errosCampos).length > 0) {
                        focarPrimeiroCampoInvalido(form, errosCampos)
                    }

                    const mensagemGeral = campos.condominio_id || campos.categoria || campos.id_solicitacao || (
                        Object.keys(errosCampos).length === 0 ? resposta.dados?.mensagem : ''
                    )
                    if (mensagemGeral) {
                        setErroEnvio({
                            mensagem: mensagemGeral,
                            recuperavel: false,
                            sessaoExpirada: false,
                        })
                    }
                    return
                }

                setErroEnvio({
                    mensagem: resposta.dados?.mensagem || 'Confira os dados informados e tente novamente.',
                    recuperavel: false,
                    sessaoExpirada: false,
                })
                return
            }

            if (resposta.status === 401) {
                setErroEnvio({
                    mensagem: resposta.dados?.mensagem
                        ? `${resposta.dados.mensagem} Seu relato foi mantido.`
                        : 'Sua sessão expirou. Entre de novo; seu relato foi mantido.',
                    recuperavel: false,
                    sessaoExpirada: true,
                })
                return
            }

            if (resposta.status === 403) {
                setErroEnvio({
                    mensagem: resposta.dados?.mensagem || 'Sua conta não tem acesso a este condomínio.',
                    recuperavel: false,
                    sessaoExpirada: false,
                })
                return
            }

            if (resposta.status === 409) {
                idSolicitacaoRef.current = null
                setErroEnvio({
                    mensagem: resposta.dados?.mensagem || 'Este identificador de envio já foi utilizado. Tente enviar novamente.',
                    recuperavel: true,
                    sessaoExpirada: false,
                })
                return
            }

            setErroEnvio({
                mensagem: resposta.dados?.mensagem || 'Não foi possível salvar agora. Seu relato foi mantido para você tentar novamente.',
                recuperavel: true,
                sessaoExpirada: false,
            })
        } finally {
            enviandoRef.current = false
            if (montadoRef.current) {
                setEnviando(false)
            }
        }
    }

    return (
        <main className="occurrence-page">
            <PageHeader userRole={userRole} />

            <section className="occurrence-content">
                <h2>Registrar ocorrência</h2>

                <p>
                    Conte o que aconteceu para a administração
                    do condomínio.
                </p>

                {carregandoCondominio ? (
                    <div
                        className="occurrence-status"
                        role="status"
                        aria-live="polite"
                    >
                        Carregando seu condomínio…
                    </div>
                ) : erroCondominio ? (
                    <FeedbackMessage
                        variant="error"
                        title="Não foi possível abrir o formulário"
                    >
                        <p>{erroCondominio}</p>

                        {podeTentarNovamenteCondominio && (
                            <div className="occurrence-feedback-actions">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={recarregarCondominio}
                                >
                                    Tentar novamente
                                </Button>
                            </div>
                        )}
                    </FeedbackMessage>
                ) : numeroConfirmado ? (
                    <FeedbackMessage
                        variant="success"
                        title="Ocorrência registrada"
                    >
                        <p>
                            Seu relato para o Condomínio{' '}
                            <strong>{condominioAtivo.nome}</strong> foi recebido.
                        </p>

                        <p className="occurrence-number">
                            Número do registro: <strong>{numeroConfirmado}</strong>
                        </p>

                        <div className="occurrence-feedback-actions">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={iniciarNovoRegistro}
                            >
                                Registrar outra ocorrência
                            </Button>
                        </div>
                    </FeedbackMessage>
                ) : (
                    <form
                        className="occurrence-form"
                        onSubmit={handleSubmit}
                        aria-busy={enviando}
                        noValidate
                    >
                        <CondominiumCard name={condominioAtivo.nome} />

                        <Input
                            label="Local"
                            id="local"
                            name="local"
                            placeholder="Ex.: hall do bloco A"
                            value={local}
                            onChange={(event) => {
                                setLocal(event.target.value)
                                if (errors.local) {
                                    setErrors((atuais) => ({ ...atuais, local: '' }))
                                }
                            }}
                            maxLength={LIMITE_LOCAL}
                            readOnly={enviando}
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
                            onChange={(event) => {
                                setDescricao(event.target.value)
                                if (errors.descricao) {
                                    setErrors((atuais) => ({ ...atuais, descricao: '' }))
                                }
                            }}
                            maxLength={LIMITE_DESCRICAO}
                            readOnly={enviando}
                            required
                            error={errors.descricao}
                        />

                        {erroEnvio && (
                            <FeedbackMessage
                                variant="error"
                                title="Não foi possível enviar a ocorrência"
                            >
                                <p>{erroEnvio.mensagem}</p>

                                {erroEnvio.sessaoExpirada && (
                                    <div className="occurrence-feedback-actions">
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={irParaLogin}
                                        >
                                            Ir para o login
                                        </Button>
                                    </div>
                                )}
                            </FeedbackMessage>
                        )}

                        <Button type="submit" disabled={enviando}>
                            {enviando
                                ? 'Enviando…'
                                : erroEnvio?.recuperavel
                                    ? 'Tentar novamente'
                                    : 'Enviar ocorrência'}
                        </Button>
                    </form>
                )}
            </section>
        </main>
    )
}

export default NovaOcorrencia
