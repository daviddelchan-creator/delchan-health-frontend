# Auditoria e Guia de Configuração: Ambiente Medplum DEV Isolado (Windows/Docker)

Este documento estabelece o escopo, arquitetura recomendada e o guia prático para a configuração de um ambiente Medplum Self-Hosted de desenvolvimento local (Windows + Docker), para suportar as necessidades do projeto Delchan Health OS.

Ele é baseado no arquivo oficial `docker-compose.full-stack.yml` fornecido pelo Medplum e na análise das variáveis do repositório Delchan. Nenhuma configuração descrita aqui reflete produção ou staging atual.

## 1. Visão Geral da Arquitetura

O ambiente de desenvolvimento encapsula todo o back-end necessário para o Delchan via Docker, simulando um ambiente produtivo isolado. O repositório frontend/mobile do Delchan continuará rodando de forma nativa e será configurado para apontar para a infraestrutura Docker.

### Serviços Containerizados (Docker Compose)
- **Postgres (5432):** Banco de dados relacional principal.
- **Redis (6379):** Banco de dados em memória para cache, fila e Pub/Sub.
- **Medplum Server (8103):** Back-end principal em Node.js (API FHIR, auth, bots).
- **Medplum App (3000):** Painel administrativo/web UI oficial do Medplum (externo ao repositório Delchan).

### Serviços Nativos (Repositório Local)
- **Delchan Web App (Next.js - 3001):** Aplicação principal rodando via `npm run dev -- -p 3001`. *Como a porta 3000 já está alocada para o Medplum App pelo Docker, o Next.js deve ser iniciado explicitamente na porta 3001.*
- **Delchan Mobile App (Expo - 8081):** Aplicativo móvel rodando via `npm run start` dentro de `/mobile`.

### Compatibilidade de Versões (NÃO VALIDADO)
A Issue #28 requer a validação do pacote `@medplum/core/react/fhirtypes@5.0.4` utilizado pelo Delchan contra a versão exata servida pelo Medplum Server Docker (`latest` ou `5.0.4`). Esta validação ainda precisa ser executada na prática para garantir que não existam regressões de quebras de API.

## 2. Pré-requisitos (Windows)

1. **Docker Desktop:** Deve estar instalado, configurado e utilizando o backend **WSL 2** (Windows Subsystem for Linux).
2. **Git:** Para versionamento.
3. **Node.js (LTS):** Compatível com as versões descritas no repositório do Delchan (e.g. Node 22).
4. **Portas Livres no Windows:** É crucial assegurar que as portas `5432`, `6379`, `8103` e `3000` não estejam em uso por outras aplicações (como o próprio Postgres nativo do Windows).

## 3. Comandos de Implementação

Os comandos abaixo realizam o download e a inicialização do ambiente oficial do Medplum via Docker Compose.

1. **Criar ou acessar um diretório para o Medplum Backend:**
Recomenda-se criar um diretório separado (por exemplo, ao lado do projeto Delchan, como `medplum-infra`), ou na raiz do repositório (ignorando-o no GIT).

```bash
mkdir medplum-dev-infra
cd medplum-dev-infra
```

2. **Baixar o Docker Compose oficial do Medplum:**
```bash
curl https://raw.githubusercontent.com/medplum/medplum/refs/heads/main/docker-compose.full-stack.yml > docker-compose.yml
```

3. **Subir a infraestrutura:**
```bash
docker compose up -d
```

> **Aviso:** A inicialização completa pode demorar alguns minutos, pois o Medplum Server realiza migrações no banco de dados. Você pode checar o status com `docker compose logs -f medplum-server`.

## 4. Variáveis de Ambiente e Configuração do Delchan Health OS

Para que o Front-End do Delchan consiga se conectar ao Medplum recém-criado, é necessário um ajuste crítico no código base, além das variáveis de ambiente.

### 4.1 CONFIGURAÇÃO NECESSÁRIA: `next.config.mjs` (Bloqueador)
Atualmente, o `next.config.mjs` possui um rewrite estático (hardcoded):
```javascript
source: '/api/medplum/:path*',
destination: 'https://delchan-health-portal-medplum.6jpght.easypanel.host/:path*'
```
**Ação:** Esta linha sobrescreve qualquer variável de ambiente no Next.js. Para que o ambiente DEV funcione, este arquivo **precisa** ser alterado numa implementação futura para consumir uma variável (ex: `destination: \`${process.env.NEXT_PUBLIC_MEDPLUM_BASE_URL}:path*\``), do contrário, as chamadas de API do cliente continuarão indo para a Easypanel de staging/produção e não para o `localhost:8103`.

### 4.2 Criando o `.env.local`
Após a correção do `next.config.mjs`, crie um arquivo `.env.local` na raiz do projeto do Delchan Health OS com as seguintes configurações:

```env
# Apontamento base para o Medplum Server Docker
MEDPLUM_BASE_URL="http://localhost:8103/"
NEXT_PUBLIC_MEDPLUM_BASE_URL="http://localhost:8103/"

# Configuração Next.js local (usando porta 3001 devido ao Medplum App)
NEXT_PUBLIC_APP_URL="http://localhost:3001"
```
*(A auditoria constatou que Client ID e Client Secret não são estritamente exigidos pelo código atual para os fluxos básicos de login web/mobile).*

### 4.3 Configurações Mobile
Para o aplicativo móvel, em `/mobile/.env.local`:

```env
# Apontando para o servidor Next.js na sua rede LAN, responsável por atuar como proxy das APIs
EXPO_PUBLIC_API_URL="http://IP_DA_SUA_MAQUINA:3001/api"
```
*(No mobile, não use `localhost` e **não aponte diretamente para a porta 8103**. O mobile deve se comunicar com o Next.js (3001) para os fluxos de autenticação nativos do Delchan).*

## 5. Autenticação e Próximos Passos (Dados de Teste)

### 5.1. O Primeiro Acesso e Super Admin (NÃO VALIDADO)
O login no Medplum App (Porta 3000) requer um Super Admin. A documentação do Compose não provê uma semente automática apenas por subir os containers.

A configuração oficial do Medplum cita o uso de variáveis de ambiente (`MEDPLUM_DEFAULT_SUPER_ADMIN_EMAIL` e `MEDPLUM_DEFAULT_SUPER_ADMIN_PASSWORD`) ou uso da CLI (`medplum create-superadmin`). Contudo, **o comportamento em runtime dessas variáveis ou da CLI contra a imagem Docker específica do Compose ainda não foi validado.**
Qualquer método escolhido para a criação determinística do Super Admin precisará ser testado na prática em uma próxima implementação antes de ser considerado oficial para o repositório.

### 5.2. Criação do Projeto
No Medplum App (`http://localhost:3000`):
1. Faça login como Super Admin.
2. Crie um novo projeto "Delchan Health OS Local".

### 5.3. Seeding de Dados Críticos
Para conseguir autenticar no sistema Delchan e visualizar a rota `/patient`, o banco de dados deve obrigatoriamente possuir um recurso mínimo:
- **Patient:** Criar o paciente e vinculá-lo ao Identity/Membership do Medplum para permitir login.

*Outros dados, como Practitioner, Schedule, Slot, Appointment e Observation, são secundários. Devem ser populados apenas para validar o painel clínico ou fluxo de agenda, não bloqueando o login ou o acesso base ao portal.*

## 6. Persistência e Limpeza (Tear Down)

A persistência do Docker é mantida em volumes nomeados (`medplum-postgres-data`).
- Para pausar e retomar os serviços **(Mantendo dados)**: `docker compose down` seguido de `docker compose up -d`.
- Para recriar o ambiente limpo **(Perda total dos dados de teste)**: `docker compose down -v`.

## 7. Resumo e Status da Auditoria (PR #29)

Esta arquitetura isolada resolve o requerimento do ambiente DEV no Windows de forma padronizada, porém a implementação prática exige ajustes no repositório.

- **O que foi corrigido na documentação:**
  - Identificação de portas exatas para DEV (Medplum=3000, Next.js=3001, Expo=8081).
  - Configuração de proxy Mobile apontando para o Next.js local na rede LAN.
  - Eliminação de suposições sobre Google Sign-in e credenciais default; focado apenas no determinismo (`MEDPLUM_DEFAULT_SUPER_ADMIN_EMAIL`).
  - Remoção do Client ID/Secret dos requisitos obrigatórios, pois não estão hardcoded.
  - Especificação clara de persistência e perda de dados em volumes Docker (`down` vs `down -v`).
- **O que continua bloqueado:**
  - O direcionamento de chamadas do Next.js para o Medplum local via `.env.local` não funcionará porque o `next.config.mjs` sobrescreve isso com um proxy estático (hardcoded).
- **O que precisa ser implementado em uma próxima tarefa:**
  - Alterar o `next.config.mjs` para consumir `process.env.NEXT_PUBLIC_MEDPLUM_BASE_URL`.
  - Scripts/comandos oficiais para subir o Next.js na porta 3001.
- **Quais pontos foram realmente verificados:**
  - O conteúdo e formato do `docker-compose.full-stack.yml` atual (Redis, Postgres, Medplum Server/App, portas padrão).
  - Onde o Delchan acessa essas rotas e qual variável (`EXPO_PUBLIC_API_URL`, `MEDPLUM_BASE_URL`) ele usa (grep do código local).
- **Quais continuam não validados:**
  - A compatibilidade rigorosa entre o `@medplum/core/react/fhirtypes@5.0.4` da web e a versão `latest` via imagem Docker.
  - O comportamento em run-time da variável `MEDPLUM_DEFAULT_SUPER_ADMIN_EMAIL` sobre a imagem Docker.
