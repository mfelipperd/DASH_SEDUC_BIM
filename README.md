# DASH SEDUC BIM – Dashboard de Acompanhamento Encibra

Este é um projeto **Next.js 16** desenvolvido para a **Encibra**, com o objetivo de centralizar e visualizar dados do contrato **SEDUC BIM**. O dashboard permite o acompanhamento de tarefas, entregáveis, progresso físico e status financeiro através de dados carregados via CSV (local ou via AWS S3).

---

## 🚀 Tecnologias Integradas

- **Modern Web Stack**: Next.js 16 (App Router), React 19 e TypeScript.
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) com CSS Variables para tematização dinâmica.
- **Visualização de Dados**: [Chart.js](https://www.chartjs.org/) e `react-chartjs-2` para gráficos interativos.
- **Manipulação de Dados**: `PapaParse` para processamento eficiente de arquivos CSV.
- **Cloud & Storage**: [AWS SDK v3](https://aws.amazon.com/sdk-for-javascript/) para integração com buckets S3.
- **UI & Icons**: [Lucide React](https://lucide.dev/) para iconografia e [Radix UI](https://www.radix-ui.com/) para componentes acessíveis.

---

## 🏛️ Arquitetura do Projeto

O projeto adota uma **Arquitetura Baseada em Componentes e Serviços (Service-Oriented Component Architecture)**, aproveitando os recursos modernos do Next.js App Router para garantir separação de responsabilidades e escalabilidade:

-   **Modularidade de Interface**: Os componentes são divididos entre componentes de base (em `ui/`) e componentes de funcionalidade (como tabelas e gráficos), facilitando a reutilização e manutenção.
-   **Separation of Concerns (SoC)**:
    -   **Camada de Visualização**: Focada em React e processamento de estado via hooks padrão.
    -   **Camada de Processamento (Utils)**: Lógica complexa de manipulação de CSV e cálculos financeiros isolada do ciclo de vida dos componentes.
    -   **Camada de Serviço (Backend/API)**: Abstração de chamadas à AWS S3 via API Routes, protegendo credenciais e simplificando o consumo pelo frontend.
-   **Design System Variável**: Arquitetura de estilos baseada em **Variáveis CSS** e **Tailwind 4**, permitindo a troca dinâmica de temas (como o tema Encibra) sem alteração na estrutura do código.

---

## 📋 Funcionalidades Principais

- **📊 Gestão de KPIs**: Visualização em tempo real do Valor Contratual Total, Valor Medido e Saldo a Receber.
- **🔄 Integração Híbrida de Dados**: 
  - Carregamento de arquivos CSV diretamente de buckets **AWS S3**.
  - Upload/Seleção de arquivos CSV locais.
  - Carregamento instantâneo de dados de exemplo.
- **🎨 Sistema de Temas**: Suporte a múltiplos temas, incluindo o tema oficial **Encibra** (Dark/Gold), com persistência via `localStorage`.
- **🔍 Filtros Avançados**: Filtragem por Categoria, Escola, Status e busca textual refinada.
- **📈 Gráficos de Desempenho**:
  - Progresso físico do contrato.
  - Distribuição de status (Pendente/Em Andamento/Concluído).
- **📋 Tabelas Detalhadas**: Visualização técnica de Tarefas e Entregáveis com status normalizado.

---

## ⚖️ Regras de Negócio e Cálculos

O dashboard aplica lógica de normalização para garantir a consistência dos dados provenientes de planilhas variadas:

1.  **Normalização de Status**:
    - `Tarefas pendentes` → **Pendente**
    - `Em andamento` ou `Em Análise (interna)` → **Em andamento**
    - `Concluído`, `Aprovado` ou `Em Análise (SEDUC)` → **Concluído**
2.  **Financeiro**: 
    - Os cálculos de soma contratual consideram apenas itens do tipo **Tarefa**. Subtarefas (itens filhos) são contabilizadas apenas para o cálculo de progresso físico.
3.  **Saldo a Receber**: Calculado como `Valor Contratual - Valor Medido` apenas para tarefas concluídas.

---

## 📂 Estrutura do Projeto

```text
src/
├── app/                  # Rotas do Next.js e Endpoints da API (S3/Upload)
├── components/           # Componentes modulares (Gráficos, Tabelas, Filtros)
│   ├── ui/               # Componentes de base (Radix/Shadcn)
│   └── ...               # Dashboard, KPIContainer, S3Selector, etc.
├── lib/                  # Configurações de serviços externos (S3 Client)
├── utils/                # Helpers de processamento, formatação e tipos
└── styles/               # globals.css com definição do Design System
```

---

## 🛠️ Instalação e Uso

### 1. Clonar o repositório
```bash
git clone https://github.com/seu-usuario/dash-seduc-bim.git
cd dash-seduc-bim
```

### 2. Configurar Variáveis de Ambiente
Crie um arquivo `.env.local` na raiz com base no `.env.local.example`:
```env
AWS_ACCESS_KEY_ID=seu_access_key
AWS_SECRET_ACCESS_KEY=seu_secret_key
AWS_REGION=us-east-1
AWS_BUCKET_NAME=nome-do-seu-bucket
```

### 3. Instalar dependências e rodar
```bash
npm install
npm run dev
```

---

## 💡 Propostas de Melhoria

Baseado na análise técnica do projeto, seguem sugestões para evolução da plataforma:

1.  **Gerenciamento de Estado**: Migrar de `useState/props` para uma Context API ou **Zustand** conforme a complexidade dos filtros e dados aumente.
2.  **Validação de Esquema**: Implementar **Zod** para validar a estrutura dos CSVs no momento do parse, evitando erros por colunas renomeadas ou ausentes.
3.  **Cache de Dados**: Utilizar **SWR** ou **React Query** para a listagem do S3 e fetch de conteúdos, melhorando a experiência de carregamento (loading states) e caching.
4.  **Testes Automatizados**: Criar testes unitários para a função `normalizeStatus` e os cálculos de conversão monetária (`toCents`), garantindo a integridade financeira.
5.  ** Virtualização de Tabelas**: Caso os arquivos CSV ultrapassem 1000 linhas, implementar `react-window` para manter a performance de scroll.
6.  **Exportação**: Adicionar botão para exportar a visão filtrada atual de volta para um novo CSV ou PDF.

---

Desenvolvido por **Encibra Dev Team**.
