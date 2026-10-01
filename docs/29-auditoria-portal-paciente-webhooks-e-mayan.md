# Portal de pré-atendimento — auditoria

## Rota `/patient/[id]/anamnese`

Esta rota existe em `app/patient/[id]/anamnese/page.tsx` e recebe o identificador do paciente e um token pela URL.

O formulário coleta:

- queixa principal;
- alergias;
- medicamentos;
- condições crônicas;
- consentimento de privacidade;
- consentimento de marketing.

No envio, faz `POST /api/crm/intake/submit` com o token, o ID do paciente e os dados clínicos.

O backend de intake é responsável pela validação HMAC/token e pela criação/atualização dos recursos FHIR descritos na documentação de APIs.

### Segurança observada

A rota não deve ser documentada como “portal criptografado” simplesmente porque o texto da interface utiliza essa expressão. O código da página não implementa criptografia própria.

A segurança efetiva do fluxo depende principalmente de:

1. token de intake;
2. validação no endpoint server-side;
3. HTTPS da implantação;
4. configuração correta de `INTAKE_SECRET_KEY`;
5. políticas de acesso do Medplum;
6. expiração e não reutilização indevida dos links.

Também existe um checkbox de marketing, enviado como `marketingConsentAccepted`, mas a auditoria do endpoint deve determinar se esse campo é realmente persistido e em qual recurso.

## Rota principal `/patient/[id]`

A localização exata de uma página principal `patient/[id]/page.tsx` não foi confirmada no snapshot acessível durante esta etapa. Portanto, não se deve inventar sua implementação.

O fluxo de paciente que foi comprovado é o subcaminho de anamnese e os componentes reutilizados no painel do profissional.

## `/api/hello`

O arquivo encontrado é `app/api/hello.ts` e retorna simplesmente:

```json
{"name":"John Doe"}
```

É uma rota de exemplo/template e não deve ser apresentada no manual como API clínica ou integração funcional.

## Webhook de assinatura

`/api/webhooks/signature` reconhece `QuestionnaireResponse` com status `amended` e extrai paciente/formulário.

O envio real para OneSignal está dentro de um bloco comentado. Portanto:

- o endpoint existe;
- a lógica de reconhecimento do evento existe;
- a notificação OneSignal real não está comprovada como ativa.

## Mayan EDMS

O script `scripts/mayan-sync.py`:

1. recebe `DocumentReference`;
2. tenta localizar o documento no Medplum;
3. baixa o Binary;
4. monta o gabinete `tenant/patient`;
5. testa a conexão com Mayan;
6. retorna estado `synchronized_or_queued`.

Há um comportamento de fallback que cria um PDF de marcação quando o documento remoto não pode ser obtido e outro fallback quando o Mayan não responde.

Isso significa que o retorno de sucesso do script **não deve ser interpretado automaticamente como prova de que o documento foi efetivamente persistido no Mayan EDMS**.

## Classificação

| Área | Estado |
|---|---|
| Pré-atendimento FHIR | Integrado |
| Token/HMAC | Implementado no endpoint |
| Criptografia própria da página | Não identificada |
| Assinatura jurídica pelo checkbox | Não comprovada |
| OneSignal efetivo | Não comprovado; código de envio comentado |
| Mayan EDMS | Ponte/fallback implementados; persistência efetiva requer validação operacional |
| `/api/hello` | Exemplo/template |
