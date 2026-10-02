# Mobile Application Foundation (Android)

Este documento descreve a fundação do aplicativo móvel Android para o ecossistema Delchan Health OS. A etapa atual concentra-se apenas em estabelecer as estruturas básicas de integração de autorização (Fase A) e Portal do Paciente Básico (Fase B).

---

## 1. IMPLEMENTADO

- **Camada Móvel Isolada:** O aplicativo é desenvolvido em React Native usando Expo (`mobile/`). Dependências e código estão estritamente contidos nesta pasta, preservando o compilador SWC do repositório web (sem inserções de `react-native` ou `.babelrc` no root). Ponto de entrada via Expo Router (`expo-router/entry`). Nenhuma URL de API está hardcoded; o app utiliza obrigatoriamente `EXPO_PUBLIC_API_URL`.
- **Isolamento de Secrets:** Nenhuma credencial de administração (`MEDPLUM_CLIENT_SECRET`) ou de servidor está no bundle móvel. Variáveis sensíveis do Next.js obrigatórias (`MEDPLUM_BASE_URL`) quebram a inicialização (Erro 500) se ausentes em prod, impedindo o bypass local.
- **Isolamento e Segurança de Tokens:**
  - `access_token` e `refresh_token` são armazenados exclusivamente via `expo-secure-store`.
  - Dados como perfil (identidade) e branding são armazenados em `AsyncStorage` apenas como cache visual. A interface **nunca** confia no cache para navegação autorizada.
  - O fluxo de `logout` limpa sistematicamente o SecureStore e encerra a sessão.
- **Identidade Autorizada pelo Servidor (Patient Identity):** Foi implementada a rota `/api/auth/mobile-me`. A tela `/patient` extrai o JWT do SecureStore, bate no servidor e aguarda a extração da identidade autoritativa retornada pelo Medplum através de auth/me. É **impossível** um usuário injetar um ID arbitrário no `AsyncStorage` local e forjar a identidade, pois a renderização da área protegida trava até a resposta real do servidor.
- **Isolamento de Tenant (Testado Backend):** O backend realiza a avaliação de permissões cruzando a presença do usuário nos `memberships` do projeto atrelado ao `medplumProjectId`. Os testes mockados (`route.test.ts`) validam rigorosamente esta **lógica de negócios** bloqueando a sessão quando um usuário de um Tenant tenta forjar logon em outro Tenant. A autenticação cross-tenant é rejeitada com HTTP 401 e nenhum access token é retornado.
- **Fluxo .code de Autenticação Estrito:** Se a autenticação fluir pelo caso onde um código é devolvido pelo OIDC (`loginResponse.code`), a API processa esse código internamente, consulta `/auth/me` **e compara se o projeto retornado bate com o solicitado**. Em caso de incompatibilidade, a API *interrompe* a requisição: a autenticação cross-tenant é rejeitada com HTTP 401 e nenhum access token é retornado ao cliente.
- **Consultas Diretas FHIR (Fase B):**
  - **Próximos Atendimentos:** Interface exibe instâncias de `Appointment` baseadas nativamente no PatientID autoritativo retornado.
  - **Registros Clínicos:** Interface lista objetos `DocumentReference` do paciente.
  - **Sinais Vitais Recentes:** Interface consulta e lista `Observation` classificados como `vital-signs`.
- **Configuração de Namespace:** Identificador do aplicativo configurado para `com.delchan.healthos` no `app.json`.

---

## 2. PARCIAL / EXTERNO

- **Validação de Dependências Expo:** O comando `npx expo-doctor` finaliza com sucesso de compatibilidade nativa, porém acusa um alerta de duplicação do pacote `react@19.2.0` derivado da estrutura de monorepo raiz. Isso não impede a compilação.
- **Seleção de Tenant UI:** A seleção visual por nome está implementada na tela, baseada estritamente na lista constante de configuração (`STAGING_TENANT_DIRECTORY`). O diretório dinâmico de organizações atrelado ao banco **não está implementado**. A lista constante funciona unicamente como staging/estática. O usuário não precisa mais digitar o UUID técnico (o respectivo `tenantId` nos bastidores viaja para o backend).

---

## 3. SIMULADO / DEMONSTRATIVO (Mocks para Staging/Config)

- **Mapeamento Criptográfico e de Organização (`INITIAL_TENANTS`):** Atualmente a listagem `INITIAL_TENANTS` no backend é tratada explicitamente como **Configuração/Staging**. O *Mapeamento Dinâmico* em BD real **ainda não está implementado**. Em produção real, este stub estático necessita substituição para a tabela principal do DB SaaS.
- **Build Nativo Android (Compilação Gradle):**
  - **✅ VALIDADO:** O scaffolding nativo (`npx expo prebuild -p android`) gerou o diretório `/android` seguro e limpo. O Export Bundle JS (`npx expo export -p android`) concluiu a compilação da lógica corretamente.
  - **⚠️ NÃO VALIDADO (AAB/APK):** O binário final `assembleDebug` causa **timeout** no ambiente local por restrições operacionais. O AAB/APK não está validado.
- **Testes Backend (Medplum Client Mock):** Os testes em `route.test.ts` e `mobile-me/route.test.ts` implementam mocks unitários rigorosos da classe `MedplumClient`. Eles validam a **lógica de autorização e de bloqueio cross-tenant**, e **não constituem integração real com uma instância Medplum**.
- **Testes UI Mobile:** Testes puramente comportamentais para checagem da lógica de roteamento usando instâncias `react-test-renderer` e mocks em Axios/SecureStore para a proteção de sessão. Testes de renderização gráfica profunda do UI sofrem incompatibilidade com os hooks do Expo Router + React 19 test-renderer no sandbox local.

---

## 4. NÃO IMPLEMENTADO

- **Integração Health Connect / Google Fit:** Pertence à Fase C, não implementada.
- **Apple HealthKit:** Fora de escopo.
- **Samsung Health Direto:** Fora de escopo.
- **Edição de Atendimentos:** Operações FHIR de criação ou reagendamento via mobile.
- **Seleção Dinâmica e Diretório Real de Tenant Mobile:** O backend SaaS de Tenants ainda não expõe APIs públicas dinâmicas.
- **Upload e OCR de Documentos Clínicos Históricos.**
