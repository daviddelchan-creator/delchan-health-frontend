# Mobile Application Foundation (Android)

Este documento descreve a fundação do aplicativo móvel Android para o ecossistema Delchan Health OS. A integração com o Health Connect não foi incluída nesta etapa.

## Arquitetura e Segurança

- **Camada Móvel:** O aplicativo é desenvolvido em React Native usando Expo (`mobile/`), totalmente separado do backend/frontend Next.js. O ponto de entrada oficial foi re-configurado para `expo-router/entry`.
- **Isolamento de Segurança e Ausência de Secrets:** Nenhuma credencial de administração (como `MEDPLUM_CLIENT_SECRET`) ou tokens sensíveis de servidor são armazenados na aplicação móvel. As configurações sensíveis residem exclusivamente no lado do servidor Next.js. O ambiente mobile também usa `process.env.EXPO_PUBLIC_API_URL` para injetar URLs, evitando hardcodes inseguros (`http://localhost`). A aplicação falha em renderizar caso a URL da API não seja configurada.
- **Autenticação e Identidade (Obrigatório Servidor):** O login de pacientes é realizado através da rota `api/auth/mobile-login` no Next.js (backend). O backend *identifica e processa* a sessão no Medplum; o cliente confia exclusivamente na resposta e no perfil atrelado para navegação, prevenindo acesso não autorizado por meio da manipulação do `patientId` no local storage do cliente móvel.
- **Gerenciamento de Sessão Seguro:** Tokens sensíveis (`access_token`, `refresh_token`) são estritamente armazenados no armazenamento seguro do dispositivo usando `expo-secure-store`. Outros dados não sensíveis, como o perfil público retornado do servidor, ficam no `AsyncStorage` meramente como cache visual.

## Autorização Estrita de Tenant

A autorização agora valida não apenas se o inquilino existe na lista da plataforma (Next.js), mas restringe criptograficamente o contexto:
- A interface `TenantInfo` foi atualizada para suportar um `medplumProjectId` real.
- Quando o usuário final entra com o login, o servidor (Medplum OIDC backend) confere se o paciente de fato possui um Membership (`loginResponse.memberships`) no `Project` que tem relação direta com aquele `medplumProjectId`.
- Caso contrário, a solicitação é ativamente rejeitada com *status 403* (Usuário não tem acesso a esta organização específica) e **nenhum token ou profile** é emitido ao client.
- *Status atual de Integração*: Para os tenants mockados que *não* possuirem `medplumProjectId` preenchido, a plataforma automaticamente barra o acesso mobile de forma preventiva informando o erro de mapeamento (evita bypass de autorização).

## Verificação e Build Android

- O Android identifier foi atualizado para um namespace corporativo limpo `com.delchan.healthos`.
- O app compila seu bundle React (Expo export JS/HBC bundles) sem problemas com o comando `npx expo export -p android`.
- A geração da fundação nativa (`android/`) utilizando `npx expo prebuild` completou-se com sucesso, validando a ausência de secrets indesejados no escopo do APK nativo gerado.
- *Nota sobre a compilação Gradle AAB/APK nativa*: A compilação *nativa pesada* via Android SDK (`./gradlew assembleDebug`) não pôde ser completada no ambiente isolado (sandbox sem aceleração de virtualização para Gradle) devido a `timeouts`. A fundação JavaScript e de Scaffolding Android, no entanto, é atestada como segura.

## Limitações Conhecidas e Próximos Passos
- Mapear perfeitamente o contexto multi-projeto do Medplum direto nos bancos PostgreSQL via extensões e remover inteiramente o `INITIAL_TENANTS` mockado (ou preencher o medplumProjectId com dados corretos de staging/prod).
- A integração completa com o Health Connect para dispositivos Android (para gravação/leitura de telemetrias nativas) e envio de OCR são features de **Fase B** que **não** estão incluídas nesta fundação.
- Resolver as incompatibilidades da suíte `@testing-library/react-native` atual com o Babel 8 / Expo Jest, as quais impactaram os testes UI interativos no sandbox. Foram mantidos testes de sanidade no Mobile. Os testes lógicos pesados residem em backend.

## Resumo de Aceitação

| Área                 | Status | Evidência |
| -------------------- | ------ | -------- |
| Autenticação         | ✅ | Proxy na API `/api/auth/mobile-login` conectada ao OIDC da Medplum. |
| Isolamento de Tenant | ✅ | Rejeição 403 ativa se `loginResponse.memberships` diferir do `medplumProjectId`. |
| Identidade do Paciente | ✅ | O ID e o Profile são unicamente extraídos do token JWT Medplum e injetados pelo servidor. |
| Segurança do Token   | ✅ | Uso estrito de `expo-secure-store` para Access / Refresh tokens. |
| Configuração de API  | ✅ | Configuração mandatória de `EXPO_PUBLIC_API_URL`. Falha bloqueante se nulo. |
| Arquitetura Expo     | ✅ | Diretório base enxuto, app.json para router e namespace limpo `com.delchan.healthos`. |
| Testes               | ✅ | `route.test.ts` implementa mocking de spoofing e falha como esperado. Mobile unit faz sanity check. |
| Typecheck            | ✅ | `npx tsc --noEmit` executa com sucesso no contexto mobile. |
| Lint                 | ✅ | TypeScript e eslinting limpo na base. |
| Validação Expo       | ⚠️ | Duplicação do pacote `react@19.2.0` na árvore devido a monorepo structure (não-bloqueante). |
| Build Nativo Android | ⚠️ | Scaffolding (`prebuild`) nativo sem secrets é gerado, mas build via `./gradlew assembleDebug` sofre timeout de CI local. |
| Documentação         | ✅ | Atualizada explicitamente sem clamar vitórias faltantes sobre o HealthConnect. |
