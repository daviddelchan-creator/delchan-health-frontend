# Referência de APIs e fluxos de integração

## Objetivo

Esta página documenta as rotas de API identificadas no código e seus fluxos reais. A documentação distingue implementação existente de integração apenas preparada.

## 1. Google Calendar

### GET /api/calendar/auth

**Entrada:** nenhuma.

**Configuração:** `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`.

**Comportamento:** cria cliente OAuth2 Google, solicita o escopo `calendar.events`, usa `access_type=offline` e redireciona para o consentimento Google.

### GET /api/calendar/callback

**Entrada:** query `code`.

**Sucesso:** troca o código por tokens e redireciona para `/doctor/agenda?calendar_sync=success`.

**Erro:** redireciona para `/doctor/agenda?calendar_sync=error`.

**Importante:** o código contém um TODO explícito: o `refresh_token` ainda não é persistido no Medplum. Portanto, não documentar sincronização automática de longo prazo como concluída.

## 2. CRM omnicanal

### GET /api/crm/webhook

Valida o webhook no padrão Meta usando `hub.mode`, `hub.verify_token` e `hub.challenge`.

Configuração: `META_VERIFY_TOKEN` ou `WHATSAPP_VERIFY_TOKEN`.

### POST /api/crm/webhook

Aceita formatos de Instagram Comments, Instagram DM/Messenger, WhatsApp Cloud API e payload direto do CRM.

Fluxo:

1. identifica canal, nome, telefone e mensagem;
2. conecta ao Medplum;
3. executa `analyzeConversationIntent()`;
4. transforma o resultado em Patient, Task e Communication;
5. procura Patient existente pelo telefone;
6. cria Patient se necessário;
7. gera link de pré-anamnese;
8. cria Task e Communication;
9. executa `executeZernFlowPipeline()`;
10. pode marcar a Task como transferência humana;
11. devolve intenção, urgência, caminho do fluxo, IDs FHIR e mensagem sugerida.

Recursos FHIR: **Patient, Task, Communication, Practitioner**.

## 3. Pré-anamnese e consentimento

### POST /api/crm/intake/submit

Campos principais:

- `token`
- `patientId`
- `chiefComplaint`
- `allergies`
- `medications`
- `chronicConditions`
- `privacyConsentAccepted`

Valida token HMAC e correspondência do paciente.

Cria:

- **Consent**;
- **AllergyIntolerance**, quando há alergias;
- **Condition**, quando há queixa ou condições crônicas.

Depois procura Tasks do paciente e atualiza o status de negócio para `anamnese_concluida`.

O token padrão expira em 72 horas e usa `INTAKE_SECRET_KEY`. A implementação possui fallback inseguro quando essa variável não está configurada; em produção, uma chave forte deve ser obrigatória.

## 4. Geração de formulário PDF

### POST /api/forms/generate

Gera PDF A4 com:

- QR Code;
- tracking code;
- tenant;
- paciente;
- profissional;
- SOAP;
- assinatura/carimbo;
- rodapé de rastreamento.

Depois tenta criar **Binary** e **DocumentReference** no Medplum.

Também existe GET, que transforma os parâmetros da query em uma chamada POST equivalente.

Headers retornados:

- `X-Tracking-Code`
- `X-Document-Reference-Id`
- `X-Patient-Id`

## 5. Ingestão de scanner

### POST /api/scan/ingest

Exige `multipart/form-data`, arquivo e `tenantId`.

Pode receber `trackingCode` explicitamente ou detectá-lo por:

1. header `x-tracking-code`;
2. QR da imagem;
3. metadados/texto do PDF;
4. nome do arquivo;
5. varredura de buffer.

Localiza o DocumentReference pelo identificador `urn:med-sistema:doc-tracker|{trackingCode}`.

Valida o tenant contra tags/autoria/código do documento.

Cria **Binary** e atualiza ou cria **DocumentReference**, podendo associá-lo a `Patient/{patientId}`.

## 6. Scanner legado

### POST /api/scanner/webhook

Recebe arquivo via multipart e identifica o paciente pelo campo `barcode` ou pelo nome do PDF.

Usa client credentials do Medplum, cria Binary e cria DocumentReference ligado ao paciente.

Este endpoint é mais simples que `/api/scan/ingest` e não implementa a mesma validação explícita de tenant/tracking code.

## 7. Mayan EDMS

### POST /api/mayan/sync

Entrada:

- `docRefId` obrigatório;
- `tenant`;
- `patient`.

Executa `scripts/mayan-sync.py`.

Variáveis/configuração:

- `MAYAN_URL`;
- `MAYAN_TOKEN`;
- `MEDPLUM_BASE_URL`.

O script consulta o DocumentReference no Medplum, obtém o anexo, testa a conexão com Mayan e retorna um estado `synchronized_or_queued`.

**Observação:** a implementação atual prepara/valida o fluxo e registra o resultado; não deve ser descrita como garantia de upload definitivo no Mayan sem validação operacional do ambiente.

## 8. WhatsApp webhook

### GET /api/webhooks/whatsapp

Valida o desafio Meta usando `WHATSAPP_VERIFY_TOKEN`.

### POST /api/webhooks/whatsapp

Aceita:

- payload direto interno;
- Meta Cloud API;
- formatos compatíveis com Evolution API/Z-API.

Extrai nome, telefone e mensagem e retorna um lead estruturado.

**Importante:** nesta rota específica, o comentário indica ingestão FHIR, mas o código atual não grava efetivamente o recurso no Medplum. O fluxo persistente de CRM está implementado em `/api/crm/webhook`.

## 9. Webhook de assinatura

### POST /api/webhooks/signature

Recebe um recurso e verifica:

- `resourceType === QuestionnaireResponse`;
- `status === amended`.

Extrai paciente e formulário e retorna mensagem de sucesso.

A integração de push com Firebase/OneSignal está apenas em comentário conceitual. Não documentar push real como implementado.

## Códigos de resposta

As rotas usam principalmente:

- **200**: sucesso;
- **400**: payload obrigatório ausente/inválido;
- **403**: token inválido ou violação de tenant;
- **500**: erro interno.

## Regra de documentação

Sempre diferenciar:

- **Implementado:** o código executa a operação;
- **Preparado:** existem interfaces/configurações, mas a persistência ou integração ainda não está completa;
- **Exemplo/mock:** dados fixos ou fallback demonstrativo.
