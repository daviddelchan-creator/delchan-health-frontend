# Auditoria e Guia de Configuração: Ambiente Medplum DEV Isolado (Windows/Docker)

Este documento estabelece o escopo, arquitetura recomendada e o guia prático para a configuração de um ambiente Medplum Self-Hosted de desenvolvimento local (Windows + Docker), para suportar as necessidades do projeto Delchan Health OS.

Ele é baseado no arquivo oficial `docker-compose.full-stack.yml` fornecido pelo Medplum e na análise das variáveis do repositório Delchan. Nenhuma configuração descrita aqui reflete produção ou staging atual.

## 1. Visão Geral da Arquitetura

O ambiente de desenvolvimento encapsula todo o back-end necessário para o Delchan via Docker, simulando um ambiente produtivo isolado. O repositório frontend/mobile do Delchan continuará rodando de forma nativa e será configurado para apontar para a infraestrutura Docker.

### Serviços Containerizados (Docker Compose)
- **Postgres (5432):** Banco de dados relacional principal.
- **Redis (6379):** Banco de dados em memória para cache, fila e Pub/Sub.
- **Medplum Server (8103):** Back-end principal em Node.js (API FHIR, auth, bots).
- **Medplum App (3000):** Painel administrativo/web UI oficial do Medplum.

### Serviços Nativos (Repositório Local)
- **Delchan Web App (Next.js - 3001 ou superior):** Aplicação principal rodando via `npm run dev`.
- **Delchan Mobile App (Expo - 8081):** Aplicativo móvel rodando via `npm run start` dentro de `/mobile`.

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

## 4. Variáveis de Ambiente do Delchan Health OS

Para que o Front-End do Delchan consiga se conectar ao Medplum recém-criado, algumas variáveis de ambiente nativas precisam ser ajustadas.

### Criando o `.env.local`

Crie um arquivo `.env.local` na raiz do projeto do Delchan Health OS com as seguintes configurações:

```env
# Apontamento base para o Medplum Server Docker
MEDPLUM_BASE_URL="http://localhost:8103/"
NEXT_PUBLIC_MEDPLUM_BASE_URL="http://localhost:8103/"

# Caso tenha criado chaves específicas de cliente no painel Medplum App (localhost:3000)
# MEDPLUM_CLIENT_ID="sua-client-id-local"
# MEDPLUM_CLIENT_SECRET="seu-client-secret-local"

# Configuração Next.js local
NEXT_PUBLIC_APP_URL="http://localhost:3001"
```

### Configurações Mobile

Para o aplicativo móvel, em `/mobile/.env.local`:

```env
EXPO_PUBLIC_API_URL="http://IP_DA_SUA_MAQUINA:8103/"
# Ou apontando para o servidor Next.js que faz o proxy:
# EXPO_PUBLIC_API_URL="http://IP_DA_SUA_MAQUINA:3001/api"
```
*(No mobile, não use `localhost` pois o emulador precisa do IP da máquina host).*

## 5. Autenticação e Próximos Passos (Dados de Teste)

### 5.1. O Primeiro Acesso (Super Admin)
O Medplum cria por padrão um projeto interno, e a única forma de acessá-lo logo que os containers sobem é usar a porta **3000** (Medplum App). Você fará o login como Super Admin (utilizando a funcionalidade "Sign in with Google" simulada que o Medplum fornece em dev, ou criando um usuário via console do Medplum se configurado de outra forma, geralmente admin@medplum.com / medplum_admin ou similar conforme documentação do próprio Medplum de seeding).

*(Nota técnica: o `docker-compose.full-stack.yml` tem as chaves do Google preenchidas em dev `MEDPLUM_GOOGLE_CLIENT_ID` permitindo o fluxo simulado de autenticação para ambiente local)*.

### 5.2. Criação do Projeto e Clientes (Bots)
No Medplum App (`http://localhost:3000`):
1. Crie um novo projeto "Delchan Health OS Local".
2. Acesse a aba **Project** -> **Client Applications** e crie um cliente para o seu Back-End do Next.js.
3. Copie o `Client ID` e o `Client Secret` gerados e cole no `.env.local` do projeto.

### 5.3. Seeding de Dados de Teste
Para o Delchan operar, ele exige que alguns dados básicos FHIR estejam no ambiente. Isso deve ser feito via POST pelo terminal, Insomnia/Postman ou usando scripts `.ts` providos na pasta `scripts/` (caso existam).

Exemplos de recursos FHIR necessários para o Delchan funcionar com base na auditoria:
- **Patient**: Criar pelo menos um paciente com ID, nome e `telecom`.
- **Practitioner**: Criar médicos.
- **Schedule / Slot**: Para que a interface de agendamentos (`/agenda`) não fique vazia.
- **Appointment**: Consultas agendadas.
- **Observation / DocumentReference**: Para o painel clínico e portal do paciente.

## 6. Conclusão

Esta arquitetura isolada via Docker Compose não apenas impede conflitos de portas com outras instâncias (por exemplo, bancos Postgres existentes em projetos passados), mas permite recriar instantaneamente um banco de dados limpo para testes destrutivos.

O repositório atual do Delchan (`next.config.mjs`, APIs) estava apontando as rotas de backend (Ex: `/api/medplum/:path*`) e a `MEDPLUM_BASE_URL` para o endereço remoto da easypanel. Com as configurações de ambiente do passo 4, essas chamadas serão perfeitamente roteadas para `localhost:8103`.
