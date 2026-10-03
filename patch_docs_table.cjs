const fs = require('fs');
const file = 'docs/32-app-android-health-connect-e-historico-clinico.md';
let data = fs.readFileSync(file, 'utf8');

const table = `
### Status Report Fase E

| Item | Status |
|---|---|
| PaddleOCR provider | IMPLEMENTED |
| Real OCR execution | YES (Local CPU Python Worker) |
| Mock OCR tests | YES (Jest tests mocked for API speed) |
| Extraction | IMPLEMENTED |
| Human review | IMPLEMENTED |
| Medplum real integration | NO (Mocked in tests, but code uses real \`medplum.createBinary\` etc) |
| Original preservation | VERIFIED (Original Binary is untouched) |
| Cross-patient security | VERIFIED (Enforced in all endpoints) |
| APK/AAB | NOT VALIDATED |
| Real device | NOT VALIDATED |

**Idempotência e Concorrência**: O endpoint /process busca uma \`Task\` pré-existente (não-rejeitada) para o documento. Caso exista e esteja em andamento (\`in-progress\`) ou concluída (\`completed\`/\`accepted\`), ele retorna \`200\` imediatamente com a task existente. Ele não reprocessa simultaneamente gerando duplicatas. Para reprocessar forçadamente, a Task original precisaria ser deletada ou ter status alterado.

**Estados de Processamento**:
- \`OCR_PENDING\`: Documento enviado, task não existente (reflete antes de chamar o worker).
- \`OCR_PROCESSING\`: Worker Python em execução (\`Task.status = in-progress\`).
- \`REVIEW_PENDING\`: OCR/Extração finalizados via pipeline assíncrono determinístico (\`Task.status = completed\`).
- \`REVIEWED\`: Um \`Practitioner\` autorizou as correções salvando um novo log com \`AuditEvent\` (\`Task.status = accepted\`).
- \`OCR_FAILED\`: Erro ou timeout na chamada subprocess (\`Task.status = failed\`).
`;

data = data.split('### Status Report Fase E')[0] + table;
fs.writeFileSync(file, data);
