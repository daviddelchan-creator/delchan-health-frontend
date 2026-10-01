# Configuração de ambiente, dependências e secrets

## Runtime

O projeto usa:

- Node.js `^22.18.0 || >=24.2.0`;
- npm `10.9.4`;
- Next.js `15.5.6`;
- React `19.2.0`;
- TypeScript `5.9.3`.

## Dependências funcionais principais

### FHIR / prontuário

- `@medplum/core`
- `@medplum/react`
- `@medplum/react-hooks`
- `@medplum/fhirtypes`

### UI

- Mantine;
- Tabler Icons;
- TipTap.

### Documentos e QR

- `pdf-lib`;
- `qrcode`;
- `qrcode.react`;
- `jsqr`;
- `sharp`.

### Calendário

- `googleapis`.

### Visualização/dados

- Recharts;
- date-fns.

## Variáveis identificadas no código

### Medplum

`MEDPLUM_BASE_URL`

URL do servidor FHIR/Medplum.

`MEDPLUM_CLIENT_ID`

Client ID para login de aplicação/robô.

`MEDPLUM_CLIENT_SECRET`

Secret do cliente.

### Google Calendar

`GOOGLE_CLIENT_ID`

`GOOGLE_CLIENT_SECRET`

`GOOGLE_REDIRECT_URI`

### CRM / webhooks

`META_VERIFY_TOKEN`

Token de verificação Meta.

`WHATSAPP_VERIFY_TOKEN`

Token de verificação WhatsApp.

`INTAKE_SECRET_KEY`

Chave HMAC dos links de pré-anamnese.

`NEXT_PUBLIC_APP_URL`

URL pública usada para montar links de pré-anamnese.

### Mayan

`MAYAN_URL`

URL base do Mayan EDMS.

`MAYAN_TOKEN`

Token REST do Mayan.

## Defaults encontrados

O código possui fallbacks como:

- URL pública do Medplum;
- `tenant-1`;
- tokens de webhook demonstrativos;
- chave HMAC demonstrativa;
- localhost para URL da aplicação.

Esses defaults são convenientes para desenvolvimento, mas **não são adequados para produção clínica**.

## Regra para produção

Todas as credenciais reais devem ser fornecidas por secret manager ou variáveis de ambiente protegidas.

Nunca colocar no:

- Git;
- README;
- documentação pública;
- screenshots;
- exemplos com credenciais reais;
- payloads de teste com dados de pacientes.

## Instalação

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
npm start
```

## Verificação operacional

Antes de produção, validar:

1. login Medplum;
2. isolamento de tenant;
3. geração de PDF;
4. ingestão de scanner;
5. Google OAuth;
6. webhooks Meta/WhatsApp;
7. persistência de canais;
8. Mayan;
9. assinatura;
10. logs e recuperação de erros.

## Observação importante

O inventário do repositório foi feito sobre 85 blobs identificados na árvore. A documentação técnica deve continuar sendo refinada à medida que arquivos ainda não inspecionados semanticamente forem auditados.
