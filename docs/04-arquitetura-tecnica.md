# 4. Arquitetura técnica

## Stack
- Next.js 15.5.6
- React 19.2.0
- TypeScript 5.9.3
- Node.js: `^22.18.0 || >=24.2.0`
- npm 10.9.4
- Mantine 8.x/9.x conforme pacote
- Medplum 5.0.4
- FHIR R4
- TipTap
- pdf-lib
- QRCode/jsQR
- Google APIs

## Estrutura
```
app/              rotas Next.js e APIs
components/       componentes de interface
contexts/         estado/contexto
core/             hooks/core
lib/              regras e integrações
public/           assets públicos
scripts/          scripts operacionais
utils/            utilitários
```

## Rotas API identificadas
- `/api/calendar/auth`
- `/api/calendar/callback`
- `/api/crm/intake/submit`
- `/api/crm/webhook`
- `/api/forms/generate`
- `/api/mayan/sync`
- `/api/scan/ingest`
- outras rotas auxiliares presentes no diretório `app/api`.

## Desenvolvimento
```bash
npm install
npm run dev
```

Build:
```bash
npm run build
npm start
```

Limpeza:
```bash
npm run clean
```

## Configuração
A configuração de produção deve ser mantida por variáveis de ambiente/secret manager. Não usar este manual para armazenar valores reais de tokens, senhas, chaves ou certificados.
