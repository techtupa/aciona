# Aciona

Plataforma de triagem e encaminhamento de ocorrências condominiais. Projeto desenvolvido pelo time Órbita no Orion Bootcamp.

## Tecnologias

- **React 19** — biblioteca para construção da interface.
- **Vite 8** — ferramenta de desenvolvimento e build.
- **React Router 7** — gerenciamento de rotas.
- **CSS** — estilização da interface.
- **Inter** — tipografia do projeto.
- **ESLint 10** — análise estática e padronização do código.

## Pré-requisitos

Antes de começar, instale:

- [Node.js](https://nodejs.org/) — versão 20.19.0 ou superior na linha 20, ou 22.12.0 ou superior na linha 22.
- npm — instalado junto com o Node.js.
- Git — para clonar o repositório.

## Como executar localmente

### 1. Clonar o repositório

```bash
git clone https://github.com/techtupa/aciona.git
```

### 2. Entrar na pasta do frontend

```bash
cd aciona/web
```

### 3. Instalar as dependências

```bash
npm ci
```

O comando utiliza o `package-lock.json` para instalar as versões registradas das dependências.

### 4. Iniciar o servidor de desenvolvimento

```bash
npm run dev
```

O Vite exibirá no terminal o endereço local da aplicação. Por padrão:

```text
http://localhost:5173/
```

Abra esse endereço no navegador para visualizar a página inicial.

Para encerrar o servidor, pressione `Ctrl + C` no terminal.

## Rotas disponíveis

| Rota | Página |
|---|---|
| `/` | Home |
| `/login` | Login |
| `/ocorrencias/nova` | Registro de ocorrência |

Exemplo de acesso à tela de registro:

```text
http://localhost:5173/ocorrencias/nova
```

## Validação do projeto

Execute os comandos dentro da pasta `web`.

### Verificar o código com ESLint

```bash
npm run lint
```

### Gerar a versão de produção

```bash
npm run build
```

Os arquivos compilados serão gerados na pasta `dist`.

### Visualizar a versão de produção localmente

Depois de executar o build:

```bash
npm run preview
```

O Vite disponibilizará um endereço local para visualizar a versão compilada.

## Estrutura do projeto

```text
aciona/
├── README.md
└── web/
    ├── public/
    ├── src/
    │   ├── assets/
    │   ├── components/
    │   ├── pages/
    │   ├── styles/
    │   ├── App.jsx
    │   ├── App.css
    │   ├── index.css
    │   └── main.jsx
    ├── .gitignore
    ├── eslint.config.js
    ├── index.html
    ├── package.json
    ├── package-lock.json
    └── vite.config.js
```

### Organização do código

- `components/`: componentes reutilizáveis da interface.
- `pages/`: páginas e telas da aplicação.
- `assets/`: recursos visuais.
- `styles/`: variáveis e estilos globais.
- `App.jsx`: configuração das rotas.
- `main.jsx`: ponto de entrada da aplicação.
- `index.css`: estilos globais e carregamento da tipografia.

## Desenvolvimento

Contribuições devem seguir o fluxo de branches e pull requests definido pelo time no repositório.

Antes de abrir um pull request, execute:

```bash
npm run lint
npm run build
```

---

**Time Órbita — Orion Bootcamp**