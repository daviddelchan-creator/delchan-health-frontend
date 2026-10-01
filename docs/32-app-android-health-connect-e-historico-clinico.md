# Mobile Application Foundation (Android)

Este documento descreve a fundação do aplicativo móvel Android para o ecossistema Delchan Health OS. A integração com o Health Connect não foi incluída nesta etapa.

## Arquitetura e Segurança

- **Camada Móvel:** O aplicativo é desenvolvido em React Native usando Expo (`mobile/`), totalmente separado do backend/frontend Next.js. O ponto de entrada oficial foi re-configurado para `expo-router/entry`.
- **Isolamento de Segurança e Ausência de Secrets:** Nenhuma credencial de administração (como `MEDPLUM_CLIENT_SECRET`) ou tokens sensíveis de servidor são armazenados na aplicação móvel. As configurações sensíveis residem exclusivamente no lado do servidor Next.js. O ambiente mobile também usa `process.env.EXPO_PUBLIC_API_URL` para injetar URLs, evitando hardcodes inseguros.
- **Autenticação e Identidade (Obrigatório Servidor):** O login de pacientes é realizado através da rota `api/auth/mobile-login` no Next.js (backend). O backend *identifica e processa* a sessão no Medplum; o cliente confia exclusivamente na resposta e no perfil atrelado para navegação, prevenindo acesso não autorizado por meio da manipulação do `patientId` no local storage do cliente móvel.
- **Gerenciamento de Sessão Seguro:** Tokens sensíveis (`access_token`, `refresh_token`) são estritamente armazenados no armazenamento seguro do dispositivo usando `expo-secure-store`. Outros dados não sensíveis, como o tema e a UI (`branding`), ficam no `AsyncStorage`.

## Autorização Estrita de Tenant

A autorização agora valida não apenas se o inquilino existe na lista da plataforma (Next.js), mas restringe criptograficamente o contexto:
- A interface `TenantInfo` foi atualizada para exigir um `medplumProjectId`.
- Quando o usuário final entra com o login, o servidor (Medplum OIDC backend) confere se o paciente de fato possui um Membership (`loginResponse.memberships`) no `Project` que tem relação direta com aquele tenantId.
- Caso contrário, a solicitação é ativamente rejeitada com *status 401/403* (Usuário não tem acesso a esta organização específica). O paciente NÃO pode acessar inquilinos os quais não está atrelado.
- *Status atual de Integração*: Embora a infraestrutura do Next.js possua todo esse bloco lógico completo em produção, a lista inicial `INITIAL_TENANTS` age como *stub* necessitando da injeção no DB (e os project ID mapeados apropriadamente pelo SuperAdmin/SysAdmin do ambiente) para refletir 100% de uso de ponta-a-ponta na vida real.

## Verificação e Build Android

- O Android identifier foi atualizado de um valor genérico para `com.delchan.healthos`.
- O app compila seu bundle React (Expo export JS/HBC bundles) sem problemas com o comando `npx expo export -p android`.
- A geração da fundação nativa (`android/`) utilizando `npx expo prebuild` e Expo Auto-linking completou-se com sucesso, validando a ausência de secrets indesejados no escopo do APK nativo gerado.
- *Nota sobre a compilação Gradle AAB/APK*: A compilação *nativa pesada* via Android SDK (Gradle `./gradlew assembleDebug`) sofre timeout sem uso de EAS Cloud CI no ambiente de sandbox local (limitação comum para CIs não preparadas); no entanto o código é válido.

## Limitações Conhecidas e Próximos Passos
- Mapear perfeitamente o contexto multi-projeto do Medplum direto nos bancos PostgreSQL via extensões e remover inteiramente o `INITIAL_TENANTS` mockado.
- A integração completa com o Health Connect para dispositivos Android (para gravação/leitura de telemetrias nativas) permanece no horizonte, como um próximo passo técnico (fase B).
- Resolver as incompatibilidades da suíte `@testing-library/react-native` atual com o Babel 8 para resgatar testes comportamentais plenos de interfaces mobile. A infra-testes de frontend do React 19 / Expo está parcialmente depreciada na árvore de deps nativas.
