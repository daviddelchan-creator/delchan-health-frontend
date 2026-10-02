# Mobile Application Foundation (Android)

Este documento descreve a fundação do aplicativo móvel Android para o ecossistema Delchan Health OS. A etapa atual concentra-se apenas em estabelecer as estruturas básicas de integração de autorização.

---

## 1. IMPLEMENTADO

- **Camada Móvel Isolada:** O aplicativo é desenvolvido em React Native usando Expo (`mobile/`). Dependências e código estão estritamente contidos nesta pasta, preservando o compilador SWC do repositório web (sem inserções de `react-native` ou `.babelrc` no root). Ponto de entrada via Expo Router (`expo-router/entry`). Nenhuma URL de API está hardcoded (`localhost`); o app utiliza obrigatoriamente `EXPO_PUBLIC_API_URL`.
- **Isolamento de Secrets:** Nenhuma credencial de administração (`MEDPLUM_CLIENT_SECRET`) ou de servidor está no bundle móvel. Variáveis sensíveis do Next.js obrigatórias (`MEDPLUM_BASE_URL`) quebram a inicialização (Erro 500) se ausentes em prod, impedindo o bypass local.
- **Isolamento e Segurança de Tokens:**
  - `access_token` e `refresh_token` são armazenados exclusivamente via `expo-secure-store`.
  - Dados como perfil (identidade) e branding são armazenados em `AsyncStorage` apenas como cache visual. A interface **nunca** confia no cache para navegação autorizada.
  - O fluxo de `logout` limpa sistematicamente o SecureStore e encerra a sessão.
- **Identidade Autorizada pelo Servidor (Patient Identity):** Foi implementada a rota `/api/auth/mobile-me`. A tela `/patient` extrai o JWT do SecureStore, bate no servidor e aguarda a extração da verdadeira identidade assinada pelo OIDC. É **impossível** um usuário injetar um ID arbitrário no `AsyncStorage` local e forjar a identidade, pois a renderização da área protegida trava até a resposta real autoritativa do servidor OIDC/Medplum.
- **Isolamento de Tenant (Testado Backend):** O backend realiza a avaliação de permissões cruzando a presença do usuário nos `memberships` do projeto atrelado ao `medplumProjectId`. Os testes mockados (`route.test.ts`) validam rigorosamente esta **lógica de negócios** não liberando a sessão (401) quando um usuário de um Tenant tenta forjar logon em outro Tenant, comprovando que a camada de autorização opera como firewall de isolamento. A autenticação cross-tenant é rejeitada com HTTP 401 e nenhum access token é retornado.
- **Fluxo .code de Autenticação Estrito:** Se a autenticação fluir pelo caso onde um código é devolvido pelo OIDC (`loginResponse.code`), a API processa esse código internamente, consulta `/auth/me` **e compara se o projeto retornado bate com o solicitado**. Em caso de incompatibilidade, a API *interrompe* a requisição retornando 401 e **nenhum access token é retornado** para o cliente móvel.
- **Configuração de Namespace:** Identificador do aplicativo configurado para `com.delchan.healthos` no `app.json`.

---

## 2. PARCIAL / EXTERNO

- **Validação de Dependências Expo:** O comando `npx expo-doctor` finaliza com sucesso de compatibilidade nativa, porém acusa um alerta de duplicação do pacote `react@19.2.0` derivado da estrutura de monorepo raiz. Isso não impede a compilação.
- **Testes Mobile:** Os testes via Jest existem apenas como `sanity check` estrutural (`tsc` e inicialização de export/function) na camada React Native, visto que discrepâncias na suite `test-renderer` do React 19 impedem UI-tests profundos neste sandbox sem prejudicar a arquitetura nativa (Babel 8 incompatível com a árvore principal).

---

## 3. SIMULADO / DEMONSTRATIVO (Mocks para Staging/Config)

- **Mapeamento Criptográfico e de Organização (`INITIAL_TENANTS`):** Atualmente a listagem `INITIAL_TENANTS` é tratada apenas como **Configuração/Staging**. O *Mapeamento Dinâmico* (DB SQL listando qual TenantId corresponde a qual ProjectId Medplum) **ainda não está implementado**. Não inventamos tabelas nem APIs novas nesta PR. Em produção real, este stub estático necessita substituição para a tabela principal do DB SaaS.
- **Seleção de Tenant UI:** A seleção visual por nome está implementada, mas baseada unicamente na lista constante de staging (`STAGING_TENANT_DIRECTORY`). Não existe ainda diretório dinâmico de organizações e não criamos uma API para esconder isso. O usuário não precisa mais digitar o UUID técnico na tela; o identificador escolhido via UI é o que viaja como `tenantId` técnico para o backend.
- **Build Nativo Android (Compilação Gradle):**
  - **✅ VALIDADO:** O scaffolding nativo (`npx expo prebuild -p android`) gerou o diretório `/android` seguro e limpo. O Export Bundle JS (`npx expo export -p android`) concluiu a compilação da lógica corretamente.
  - **⚠️ SIMULADO (AAB/APK):** O binário final `assembleDebug` causa **timeout** no ambiente local por restrições operacionais. Não declaramos o AAB como validado.
- **Testes Backend (Medplum Client Mock):** Os testes em `route.test.ts` implementam **mocks rigorosos** (substituindo o `MedplumClient`) exclusivamente para atestar a lógica de autorização das validações de Tenant e Isolamento da ponte API do Next.js. **Não se trata de integração real com uma instância Medplum**.

---

## 4. NÃO IMPLEMENTADO

- **Integração Health Connect / Google Fit:** (Escopo da Fase C).
- **Apple HealthKit:** Fora de escopo.
- **Samsung Health Direto:** Fora de escopo.
- **Seleção Dinâmica e Diretório Real de Tenant Mobile:** (Uma API/SelectBox que retorne e pesquise dinamicamente logos públicos de Clinics na internet).
- **Upload e OCR de Documentos Clínicos Históricos.**
