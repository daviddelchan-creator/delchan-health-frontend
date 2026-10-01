# 8. Integrações

## Google Calendar
Existem rotas `/api/calendar/auth` e `/api/calendar/callback`, além do uso do pacote `googleapis`. A configuração requer credenciais OAuth e URL de callback correspondentes ao ambiente.

Não publicar client secret, refresh token ou outros segredos.

## Mayan
Existe endpoint `/api/mayan/sync` e o script `scripts/mayan-sync.py`. A sincronização deve ser configurada conforme o ambiente Mayan utilizado.

## CRM/Webhooks
Existe endpoint `/api/crm/webhook` e fluxo de intake público em `/api/crm/intake/submit`. Validar autenticação, assinatura do webhook, rate limiting e proteção contra replay antes de exposição pública.

## QR/Scanner
A aplicação usa QRCode e jsQR para geração/decodificação.

## Medplum
Medplum é parte central da camada FHIR. A configuração real de endpoint/projeto/cliente deve ser obtida das configurações de ambiente e do código de inicialização; nunca colocar valores secretos neste manual.
