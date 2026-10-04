# Mobile Application Foundation (Android) - Fase A e Fase B

Este documento descreve a evolução funcional do aplicativo móvel Android integrado ao ecossistema Delchan Health OS, cobrindo autenticação inicial segura (Fase A) e o Portal do Paciente completo (Fase B).

---

## 1. IMPLEMENTADO (Fase A & Fase B)

- **Camada Móvel Isolada:** O aplicativo é desenvolvido em React Native usando Expo (`mobile/`). Dependências e código estão estritamente contidos nesta pasta, preservando o compilador SWC do repositório web. Nenhuma URL de API está hardcoded (`EXPO_PUBLIC_API_URL` é obrigatória).
- **Isolamento de Secrets:** Nenhuma credencial de administração (`MEDPLUM_CLIENT_SECRET`) está no bundle. Variáveis sensíveis de Next.js (`MEDPLUM_BASE_URL`) causam erro 500 no proxy, barrando contornos locais não-autorizados.
- **Isolamento de Tokens (Fase A):** `access_token` e `refresh_token` são armazenados exclusivamente via `expo-secure-store`. O cache `AsyncStorage` não fornece autoridade para navegação de acesso restrito. Logout elimina as chaves seguras.
- **Identidade e Autorização do Servidor:** Na Fase B, o frontend consulta `/api/patient/dashboard`. Em todos os fluxos, a extração do Bearer Token cruza a identidade autoritativa com o servidor via proxy e rejeita o acesso caso não seja um `Patient` genuíno. É impossível que um paciente forneça um `patientId` arbitrário e obtenha dados de outro paciente.
- **Dashboard Real do Paciente (Fase B):** O paciente possui uma tela funcional no Android (`mobile/app/patient/index.tsx`) com dados carregados via requisição restrita do servidor.
- **Mapeamento Clínico Simultâneo (Fase B):** Apenas se autorizado no contexto do Tenant e restrito estritamente a um `Patient` resource, a rota `/api/patient/dashboard` entrega os dados clínicos limitados ao paciente do token:
  - `Appointment` (Próximas Consultas).
  - `DocumentReference` (Documentos Clínicos / PDFs).
  - `DiagnosticReport` (Laudos de Exames).
  - `Observation` (Sinais vitais como peso, altura, PA, etc).
  - `MedicationRequest` (Prescrições e Medicamentos).
- **Acesso Seguro a Binários Clínicos (Fase B):** A rota `/api/patient/binary/[id]` verifica explicitamente se o ID do `Binary` solicitado faz parte do conteúdo (no array `.content.attachment.url`) de um `DocumentReference` que pertença estritamente ao paciente dono do token antes de liberar o download original. Não há exposição cega baseada em adivinhação de ID, tampouco risco de prefix collision na autorização.
- **Testes Comportamentais (Jest - Backend & Frontend):** Testes unitários/comportamentais *mockados* validam corretamente: ausência de token, bloqueios cross-tenant, rejeição a Practitioner, renderização correta de coleções vazias e cheias no Dashboard, e restrição expressa de download de binários a arquivos não referenciados pelo paciente em questão.

---

## 2. PARCIAL / EXTERNO

- **Validação de Dependências Expo:** O comando `npx expo-doctor` acusa alerta de duplicação do pacote `react@19.2.0` derivado da estrutura de monorepo raiz. Isso não impede a compilação.
- **Seleção de Tenant UI:** A seleção visual de Tenant é estática e estrita para staging, e sua interface ainda aguarda endpoints públicos dinâmicos (`GET /api/tenants/directory`).

---

## 3. SIMULADO / DEMONSTRATIVO (Mocks para Staging/Config)

- **Mapeamento Criptográfico e de Organização (`INITIAL_TENANTS`):** Atualmente tratado explicitamente como **Configuração/Staging**. Não utiliza um DB Saas dinâmico ainda.
- **Integração Real com Medplum (Mocks):** Os testes apresentados usam **MOCKS** na biblioteca `@medplum/core` no Next.js Backend. Embora provem rigorosamente a lógica de segurança de acesso cruzado (A -> B), ausência de token, bloqueios de Patient, etc., eles **não atestam integração real na rede com um banco local do Medplum R4**.
- **Build Nativo Android (Compilação Gradle):**
  - **✅ VALIDADO:** O scaffolding nativo (`npx expo prebuild -p android`) gerou o diretório e compilação lógica (`npx expo export -p android`).
  - **⚠️ NÃO VALIDADO (AAB/APK):** O binário final `assembleDebug` causa **timeout** por limitação do ambiente local/Docker; portanto, o arquivo binário direto (.apk) **não foi validado neste ambiente**.

---

## 4. PARCIAL / FASE C

- **Integração Health Connect:**
  - **Status:** Implementada/Testada com Mock.
  - **API/SDK:** `react-native-health-connect@4.1.3` instalada via Expo Plugin nativo.
  - **Configuração:** `minSdkVersion: 26` configurado via `expo-build-properties` para suportar o Android Health Connect adequadamente.
  - **Arquitetura:** Camada de serviço `HealthConnectService` isolada na pasta `services`. Tela independente em `/patient/health-connect`.
  - **Fluxo e Modelo (Provenance & FHIR):** O dado flui via `HealthConnect -> registros nativos -> modelo interno (HealthData) -> mapToFHIRObservation`. A UI consome dados com proveniência (`dataOrigin`, `recordId`, e `source: 'health_connect'`) mantidos.
  - **Mapeamento FHIR:** Foi introduzido um método estático `mapToFHIRObservation`. Este é estritamente um esqueleto estrutural/preparatório e **não** é um mapping clínico completo para todos os 7 tipos (e.g., modelos específicos de Blood Pressure ou códigos LOINC/SNOMED detalhados não estão implementados agora). Reitera-se que: **não existe write-back para o Medplum, nenhum dado é enviado ao backend nesta Fase C, nenhum endpoint foi criado e não são inferidos diagnósticos ou Conditions**.
  - **Permissões (Parciais e Gatilhos Internos):** `READ_STEPS`, `READ_HEART_RATE`, `READ_BLOOD_PRESSURE`, `READ_HYDRATION`, `READ_SLEEP`, `READ_OXYGEN_SATURATION`, `READ_WEIGHT`. As permissões são validadas de maneira estrita _internamente no Service_ antes de solicitar `readRecords` para evitar leitura não autorizada (independente da UI). O modelo e UI dão suporte a *permissões parciais* (concedidas x faltantes).
  - **Testes (Testes Diretos no Service & UI):** Adicionada suite intensiva no `HealthConnectService.test.ts` que valida mapeamentos dos 7 tipos de dados, falhas de permissão parciais, propagação real de erros da API nativa, tratamento de indisponibilidade e compilação de metadados. Testes da UI processam avisos de permissões parciais e erros independentes. Total: 25 testes validados.
  - **Limitações e Build:** Pré-build Android nativo gerado e compatibilidade com SDK validada (`android/gradle.properties` com `minSdkVersion=26`). No entanto, o AAB/APK não está validado (testes visuais de dispositivo real não foram emulados) devido a limitações deste ambiente. O fluxo baseia-se em mocks locais consistentes com o contrato original da biblioteca `react-native-health-connect`.

---

## 5. FASE D — HISTÓRICO DOCUMENTAL

- **Status:** Implementado e Testado com Mock.
- **Funcionalidade:** Permite ao paciente autenticado fazer o upload e visualizar documentos e exames originais diretamente pelo aplicativo móvel.
- **Arquitetura (Mobile):** Tela específica `mobile/app/patient/documents/index.tsx` que suporta visualização de lista e envio. A seleção de arquivos ocorre de forma segura localmente via `expo-document-picker`. A visualização do original é intermediada por `expo-file-system` que consome a rota restrita do backend com o Bearer Token, garantindo controle de acesso. O compartilhamento do arquivo é acionado por `expo-sharing`.
- **Arquitetura (Backend):**
  - Rota `app/api/patient/documents/route.ts` suportando GET (listagem) e POST (envio multiform).
  - O perfil do paciente é rigorosamente autenticado em ambos (ignorando dados forjados no client payload).
  - Para uploads, limites de tamanho estritos de 20MB são implementados.
  - **Validação de Conteúdo Real (Magic Bytes):** Em vez de confiar exclusivamente no MIME type (que pode ser falsificado), o servidor lê o ArrayBuffer e garante a correspondência através de assinaturas binárias: `%PDF` para PDF, `FF D8 FF` para JPEG e assinatura longa de 8-bytes para PNG. Arquivos falsificados são barrados com status 400.
  - O backend integra com o Medplum criando instâncias `Binary` e as referenciando como um anexo através do FHIR `DocumentReference`. O `patientId` de amarração não é obtido via payload, mas restrito ao extraído da autenticação servidor, barrando envenenamento de requisições.
  - **Transação e Rollback:** A criação ocorre de forma sequencial. Se o `Binary` for persistido, porém falhar a injeção do `DocumentReference` correspondente, a API reage disparando um request de deleção `medplum.deleteResource('Binary', binaryId)` no bloco `catch`, mitigando lixo de armazenamento ou registros órfãos.
- **Integração Real com Medplum (Mocks):** A suíte intensiva de testes baseia-se em mocks locais consistentes tanto nas rotas do servidor quanto nas telas mobile, provando rigorosamente todos os cenários. A bateria de testes executa com total estabilidade:
  - Backend API: 32 testes executados / 32 testes passando (inclui testes completos simulando falhas explícitas no `createBinary()`, `createResource()` e rollback com `deleteResource()`).
  - Frontend UI Mobile: 34 testes executados / 34 testes passando.
  - Total: 66 testes comissionados passando. Nenhuma regressão foi detectada nas Fases A, B ou C.
- **Integridade:** Nenhum OCR, extração de texto, resumos por IA ou inferência diagnóstica são processados nesta fase, garantindo a preservação absoluta e confiável do documento original. Nenhuma sub-classificação clínica, como Conditions ou Observations, foi associada aos arquivos. Os testes inspecionam o byte-buffer em memória para confirmar inalterabilidade dos originais no envio. O aplicativo Android pre-build nativo não testado em AAB/APK.

---

## 6. NÃO IMPLEMENTADO

- **Apple HealthKit:** Fora de escopo.
- **Samsung Health Direto:** Fora de escopo.
- **IA e Resumos Clínicos Avançados:** IA preditiva paga, sumarização inteligente ou diagnóstico autônomo (criação automática de Condition/DiagnosticReport) estão fora de escopo. O sistema mantém exclusividade total da decisão clínica para o médico no portal.

## 7. FASE E — OCR + EXTRAÇÃO + REVISÃO

- **Status:** IMPLEMENTED
- **Arquitetura:** O processamento ocorre via Worker Python SÍNCRONO dentro da requisição HTTP (`scripts/paddle_ocr_worker.py`) consumido pelo adapter Next.js `PaddleOCRProvider`. Não existe fila/worker assíncrono distribuído nesta fase.
- **Provider:** PaddleOCR open-source
- **Versão:** 3.7.0 (CPU para desenvolvimento, executando localmente via Python)
- **Instalação:** Foi instalado via `pip install paddlepaddle paddleocr pypdfium2 numpy Pillow` no worker. Em um ambiente limpo, requer a biblioteca Python correspondente.
- **Como executar localmente:** `python3 scripts/paddle_ocr_worker.py` processando json via STDIN. A API Next.js `/api/patient/documents/[id]/process` consome o script enviando um path.
- **Estados:** `OCR_PENDING`, `OCR_PROCESSING`, `REVIEW_PENDING`, `REVIEWED`, `OCR_FAILED`.
- **APIs:**
  - `POST /api/patient/documents/[id]/process`
  - `GET /api/patient/documents/[id]/processing`
  - `GET /api/patient/documents/[id]/ocr`
  - `GET /api/patient/documents/[id]/extraction`
  - `POST /api/patient/documents/[id]/review`
- **Modelo de Dados:** Utiliza Medplum `Task` com ligações para o `DocumentReference` via `focus`. Resultados são armazenados em `Binary` e associados como `output` da task, garantindo que o documento original NUNCA seja alterado.
- **Segurança:** O acesso a todos os endpoints valida o Patient do token contra o subject do `DocumentReference`. O endpoint de revisão exige o resourceType `Practitioner`. A proteção cross-patient é integral. Nenhum secret é exposto.
- **Testes:** Unitários garantem restrição de auth, validações cross-patient, e geração idempotente de `Task`.
- **Limitações:** A extração determinística funciona por regras simples (ex: nome, data, hemoglobina) na `ExtractionPipeline`. OCR com Paddle depende da imagem exportada, que está mapeada em 300DPI via pypdfium2 no provider local.
- **O que é real:** Integração completa do backend, worker script local testável, workflow UI web e UI React Native, e integração com instâncias FHIR via testes local.
- **O que é mock:** Nos testes automatizados (Jest), o `PaddleOCRProvider` e requisições externas ao banco Medplum são inteiramente mockados para isolamento e velocidade, de acordo com o padrão do projeto. Nenhum diagnóstico inferido dinamicamente por IA, apenas parse manual regex na Fase E.
- **O que ainda não está implementado:** IA pago e resumos clínicos preditivos, diagnósticos ou sub-modelos avançados (`Condition`, `MedicationRequest`).



### Status Report Fase E

| Item | Status |
|---|---|
| PaddleOCR provider | IMPLEMENTED |
| Real OCR execution | YES (Local CPU Python Worker) |
| Mock OCR tests | YES (Jest tests mocked for API speed) |
| Extraction | IMPLEMENTED |
| Human review | IMPLEMENTED |
| Medplum real integration | NÃO VALIDADO (Testes estritamente MOCKADOS) |
| Original preservation | VERIFIED (Original Binary is untouched via mocks) |
| Cross-patient security | LÓGICA E TESTES MOCKADOS (Não validação de produção real) |
| APK/AAB | NOT VALIDATED |
| Real device | NOT VALIDATED |

**Idempotência e Concorrência (LIMITE ESTRUTURAL V5)**: O endpoint /process busca uma `Task` pré-existente via `medplum.searchResources`. Caso exista, tenta evitar o reprocessamento retornando `200`. **Nota Técnica Importante:** Essa abordagem é estritamente síncrona e condicional (`Check-Then-Act`). Em um ambiente HTTP Serverless distribuído e sem lock externo (ex: Redis) ou garantias de atomicidade de banco, ainda pode existir a possibilidade teórica de *race conditions* caso duas threads simultâneas completem a query de busca antes do registro da nova Task. Não estamos resolvendo problemas complexos de lock distribuído nesta fase. Adicionalmente, o processamento de OCR segue como processo síncrono atrelado ao tempo de requisição Node, sujeito a limites de timeout HTTP.

**Estados de Processamento**:
- `OCR_PENDING`: Documento enviado, task não existente (reflete antes de chamar o worker).
- `OCR_PROCESSING`: Worker Python em execução (`Task.status = in-progress`).
- `REVIEW_PENDING`: OCR/Extração finalizados via pipeline síncrono determinístico (`Task.status = completed`).
- `REVIEWED`: Um `Practitioner` autorizou as correções salvando um novo log com `AuditEvent` (`Task.status = accepted`).
- `OCR_FAILED`: Erro ou timeout na chamada subprocess (`Task.status = failed`).
