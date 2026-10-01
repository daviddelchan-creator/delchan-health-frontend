# Mobile Application Foundation (Android)

Este documento descreve a fundação do aplicativo móvel Android para o ecossistema Delchan Health OS. A etapa atual concentra-se apenas em estabelecer as estruturas básicas de integração de autorização.

---

## 1. IMPLEMENTADO

- **Camada Móvel Isolada:** O aplicativo é desenvolvido em React Native usando Expo (`mobile/`). Dependências e código estão estritamente contidos nesta pasta, preservando o compilador SWC do repositório web (sem inserções de `react-native` ou `.babelrc` no root). Ponto de entrada via Expo Router (`expo-router/entry`).
- **Isolamento de Secrets:** Nenhuma credencial de administração (`MEDPLUM_CLIENT_SECRET`) ou de servidor está no bundle móvel.
- **Configuração de API Estrita:** O app obriga a injeção da URL de API via variável `process.env.EXPO_PUBLIC_API_URL`. Se não fornecida, o app bloqueia a requisição de login por exceção (sem fallbacks inseguros para `localhost`).
- **Isolamento e Segurança de Tokens:**
  - `access_token` e `refresh_token` são armazenados exclusivamente via `expo-secure-store`.
  - Dados como perfil (identidade) e branding são passivamente armazenados em `AsyncStorage` como mero cache visual (o backend permanece como única autoridade de identidade e sessão verdadeira).
  - O fluxo de `logout` limpa sistematicamente o SecureStore.
- **Isolamento de Identidade (Identidade Sever-side):** O cliente Android não controla ou transmite qual ID deseja logar. Ele fornece apenas email/senha, e a identidade (Profile e Access Token) é injetada obrigatoriamente pelo token de resposta processado na ponte do servidor `/api/auth/mobile-login`.
- **Configuração de Namespace:** Identificador do aplicativo configurado para `com.delchan.healthos` no `app.json`.
- **Testes Backend Base:** O teste (`route.test.ts`) valida explicitamente o fluxo onde a presença do membro não pertecencendo ao ProjectID específico da requisição acarreta rejeição `401`/`403`.

---

## 2. PARCIAL / EXTERNO

- **Isolamento de Tenant (Criptográfico):** O backend realiza a avaliação de permissões cruzando a presença do usuário nos `memberships` do projeto atrelado ao `tenantId`. Contudo, o mapeamento "Qual Tenant aponta para qual Medplum Project" (`medplumProjectId`) depende da configuração provida externamente.
- **Testes Mobile:** Os testes mobile via Jest existem apenas como um `sanity check` estrutural (`tsc` e inicialização de script). Problemas de compatibilidade conhecidos entre Babel e a library de renderização em React 19 / Expo Jest não permitem validações complexas de UI no momento.
- **Validação de Dependências Expo:** O comando `npx expo-doctor` finaliza com sucesso de compatibilidade nativa, porém acusa um alerta de duplicação do pacote `react@19.2.0` derivado da estrutura de monorepo raiz. Isso não impede a compilação.

---

## 3. SIMULADO / DEMONSTRATIVO

- **Mapeamento de Tenant (`INITIAL_TENANTS`):** Como não há integração real de banco de dados SQL extraindo os mapeamentos dinâmicos de organização, o sistema atualmente baseia-se na constante `INITIAL_TENANTS` como stub no Next.js, com `medplumProjectId` fixados, para simular o mapeamento que o Administrador de TI injetará nos ambientes produção.
- **Build Nativo Android:**
  - **✅ VALIDADO:** O scaffolding nativo (`npx expo prebuild -p android`) gerou o diretório `/android` livre de segredos. O Bundle JS (`npx expo export -p android`) concluiu a minificação (HBC) com sucesso.
  - **⚠️ SIMULADO (Falta de Ambiente):** A compilação *nativa de fato* dos artefatos finais (APK/AAB) utilizando `./gradlew assembleDebug` acarreta tempo-limite (timeout) em nosso ambiente sandbox local (recursos insuficientes), logo, a prova de Build Nativo final se dá de forma assumida apenas pelos steps JS+Scaffolding e não por um binário final executado.

---

## 4. NÃO IMPLEMENTADO

- **Integração Health Connect / Google Fit:** O ecossistema de APIs nativas de telemetria não foi configurado ou programado nesta etapa (Fase B).
- **Apple HealthKit:** Fora de escopo atual.
- **Sincronização de Histórico Clínico Nativo:** Interfaces dedicadas de consumo de Observações ou impressões de receituário dentro do app não foram criadas.
- **Upload / OCR de Documentos Externos:** Não construído.
- **Samsung Health Direto:** Fora de escopo.
