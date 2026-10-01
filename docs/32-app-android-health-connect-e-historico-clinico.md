# Mobile Application Foundation (Android)

Este documento descreve a fundação do aplicativo móvel Android para o ecossistema Delchan Health OS. A integração com o Health Connect não foi incluída nesta etapa.

## Arquitetura e Segurança

- **Camada Móvel:** O aplicativo é desenvolvido em React Native usando Expo (`mobile/`), totalmente separado do backend/frontend Next.js.
- **Isolamento de Segurança e Ausência de Secrets:** Nenhuma credencial de administração (como `MEDPLUM_CLIENT_SECRET`) ou tokens sensíveis de servidor são armazenados na aplicação móvel. As configurações sensíveis residem exclusivamente no lado do servidor Next.js.
- **Autenticação:** O login de pacientes é realizado através da rota `api/auth/mobile-login` no Next.js (backend), que faz a ponte com o Medplum, garantindo que o tenant e as credenciais sejam validados do lado do servidor antes da devolução dos tokens (`access_token`, `refresh_token`) e do perfil do paciente.
- **Gerenciamento de Sessão Seguro:** Tokens sensíveis (`access_token`, `refresh_token`) são estritamente armazenados no armazenamento seguro do dispositivo usando `expo-secure-store`. Outros dados não sensíveis, como o tema e a UI (`branding`), ficam no `AsyncStorage`.
- **Validação de Tenant Real:** O servidor valida se as credenciais fornecidas coincidem com o tenant exigido. As políticas de OIDC e membership garantem que apenas pacientes autorizados daquele tenant possam acessar a plataforma.
- **Navegação:** Implementada através do Expo Router com rotas estritas baseadas em arquivos em `mobile/app/`.

## Telas Implementadas

1. **Home (`mobile/app/index.tsx`)**: Tela inicial do app com a marca Delchan Health OS e opção para ir ao login.
2. **Login (`mobile/app/login.tsx`)**: Permite que o paciente preencha seu e-mail, senha e o ID da sua organização (tenant). A validação real bate na API do Next.js.
3. **Área do Paciente (`mobile/app/patient.tsx`)**: Interface inicial de paciente logado. Ela consome o perfil validado e mantido em segurança para renderização. O `patientId` não pode ser forjado pelo cliente para acessar dados não autorizados, já que a sessão depende do perfil validado. Permite efetuar o logout da sessão de forma segura.

## Testes Iniciais e Verificação Android

- **Scaffolding e Build Nativo Android**: Foi executado o `npx expo prebuild -p android` confirmando a integridade da geração da base do Android (`android/`) e assegurando que nenhum secret contaminou a base do código nativa. A compilação do JavaScript também está limpa, verificada usando `npx expo export -p android`.
- **Testes Backend**: Foram implementados testes validando o fluxo de login via API (`api/auth/mobile-login/route.test.ts`). Isso garante cenários com tenants inválidos, sucesso, sem acessos, e falhas de senha, todos mantendo o cliente móvel protegido.
- **Isolamento NPM**: As dependências do projeto Mobile não interferem no Frontend (e vice-versa). O `package.json` principal está ileso em relação à `react-native`.
- O código providencia a fundação sem Health Connect.

## Limitações Conhecidas e Próximos Passos
- O Mapeamento do `tenantId` para os correspondentes `Projects` do Medplum ainda está feito usando um mock parcial na rota de api, até que as variáveis de produção no easypanel estejam alinhadas à rota `api/auth/mobile-login`.
- A integração completa com o Health Connect para dispositivos Android (para gravação/leitura de telemetrias nativas) ainda **não** está desenvolvida (ficará para uma etapa posterior).
