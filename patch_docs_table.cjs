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
`;

if (!data.includes('Status Report Fase E')) {
    data = data + '\n' + table;
    fs.writeFileSync(file, data);
}
