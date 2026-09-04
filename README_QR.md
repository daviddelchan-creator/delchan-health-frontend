# 📄 Sistema de Rastreamento de Documentos com QR Code (QR Document Tracker)
### Delchan Health OS • Next.js 15 App Router • Mantine v7 • Medplum FHIR R4

Este módulo implementa o rastreamento físico-digital de prontuários em papel e fichas clínicas SOAP. Cada folha impressa recebe um **QR Code único de rastreamento** no padrão `FORM-{TENANT}-{TIMESTAMP}-{UUID6}`. Após o preenchimento manual e assinatura física pelo profissional de saúde, a folha é digitalizada por qualquer scanner físico ou aplicativo móvel e anexada **automaticamente** ao prontuário eletrônico do paciente correto no servidor Medplum FHIR.

---

## 🏗️ Arquitetura do Sistema

```
+-----------------------------------------------------------------------------------+
| 1. IMPRESSÃO DA FICHA COM QR CODE                                                 |
| [ClinicalEditor Toolbar] ➡️ [FormPrintDialog] ➡️ [POST /api/forms/generate]       |
|                                                     |                             |
|                                                     ├──> Cria Binary no Medplum   |
|                                                     └──> Cria DocumentReference   |
|                                                          (status: preliminary)    |
+-----------------------------------------------------------------------------------+
                                        ⬇️
+-----------------------------------------------------------------------------------+
| 2. CONSULTA FÍSICA                                                                |
| Médico preenche à mão os campos SOAP (Subjetivo, Objetivo, Avaliação, Plano)      |
| e assina / carimba na folha A4 com o QR Code no topo direito.                     |
+-----------------------------------------------------------------------------------+
                                        ⬇️
+-----------------------------------------------------------------------------------+
| 3. DIGITALIZAÇÃO E INGESTÃO AUTOMÁTICA                                            |
| [Scanner Físico / NAPS2 / Celular] ➡️ [POST /api/scan/ingest]                     |
|                                              |                                    |
|  - Extrai trackingCode do QR / metadados     ├──> Salva Binary escaneado          |
|  - Localiza DocumentReference preliminar     └──> Atualiza status para 'current'  |
|  - Vincula paciente se era formulário órfão                                       |
+-----------------------------------------------------------------------------------+
                                        ⬇️ (Opcional)
+-----------------------------------------------------------------------------------+
| 4. ARQUIVAMENTO LONGO PRAZO MAYAN EDMS                                            |
| [POST /api/mayan/sync] ou [scripts/mayan-sync.py]                                 |
|  - Organiza no Gabinete (Cabinet): {tenant}/{patient}                             |
+-----------------------------------------------------------------------------------+
```

---

## 📋 Especificação do Código de Rastreamento (Tracking Code)

Formato:
```text
FORM-{TENANT}-{TIMESTAMP}-{UUID6}
```

Exemplo real:
```text
FORM-DELCHAN-1725412890123-A7B8C9
```

- **`FORM`**: Prefixo identificador de formulário clínico rastreável.
- **`{TENANT}`**: Identificador limpo do Tenant / Clínica (ex: `DELCHAN`, `ALPHA`).
- **`{TIMESTAMP}`**: Carimbo milissegundo de geração (ex: `1725412890123`).
- **`{UUID6}`**: Entropia aleatória de 6 caracteres alfanuméricos em caixa alta.

---

## 🚀 Como Testar o Fluxo com um Scanner Físico

### Cenário A: Teste com o Software NAPS2 (Not Another PDF Scanner 2)
O **NAPS2** é o software gratuito mais utilizado em clínicas e hospitais no Windows/Linux para scanners de mesa (Fujitsu, Brother, Epson, HP, Canon).

1. Abra o **NAPS2** no computador onde o scanner físico está conectado via USB ou Rede.
2. Crie um perfil de digitalização:
   - Resolução recomendada: **200 ou 300 DPI** (Preto e Branco ou Tons de Cinza/Cor).
   - Formato de saída: **PDF** ou **PNG/JPEG**.
3. No NAPS2, acesse **Opções de Perfil** ➡️ **Pós-Processamento / Executar Comando**:
   - Marque para executar script pós-digitalização:
   ```cmd
   curl -X POST http://localhost:3000/api/scan/ingest -F "file=@$(FilePath)"
   ```
4. Digitalize a folha física com o QR Code.
5. O NAPS2 digitalizará o documento e enviará diretamente para a API. O sistema identificará o `trackingCode`, atualizará o `DocumentReference` correspondente para `current` e anexará o PDF escaneado ao prontuário do paciente.

---

### Cenário B: Teste Rápido via Linha de Comando (cURL / PowerShell)

#### 1. Gerar uma Ficha com QR Code:
```bash
# Gerar ficha pré-vinculada ao paciente pat-1:
curl -X POST http://localhost:3000/api/forms/generate \
  -H "Content-Type: application/json" \
  -d '{"tenantId": "tenant-1", "tenantName": "Delchan Health", "patientId": "pat-1", "patientName": "Ana Beatriz Albuquerque"}' \
  --output ficha_teste.pdf
```
*Abra o arquivo `ficha_teste.pdf` gerado para ver o QR Code no topo direito, o trackingCode e os campos pautados do SOAP.*

#### 2. Simular o Escaneamento Físico (Ingestão):
```bash
# Enviar a folha digitalizada de volta para o sistema:
curl -X POST http://localhost:3000/api/scan/ingest \
  -F "file=@ficha_teste.pdf" \
  -F "trackingCode=FORM-DELCHAN-..."
```

**Resposta esperada (JSON):**
```json
{
  "success": true,
  "message": "Documento escaneado ingerido e vinculado com sucesso ao prontuário eletrônico.",
  "trackingCode": "FORM-DELCHAN-...",
  "documentReferenceId": "docref-12345",
  "status": "current",
  "subject": "Patient/pat-1",
  "binaryUrl": "https://delchan-health-portal-medplum.../Binary/..."
}
```

---

### Cenário C: Ficha Órfã / Avulsa (Bloco Impresso na Recepção)
Se a clínica mantém blocos de fichas pré-impressas na recepção sem saber antecipadamente qual paciente será atendido:
1. Abra o editor de evolução clínica ou acesse o diálogo de impressão.
2. Deixe o campo **"¿A qué usuario / paciente pertenece?"** em branco.
3. Imprima a ficha. Ela será registrada no Medplum como um `DocumentReference` com `status: preliminary` e sem `subject`.
4. No momento do escaneamento após a consulta, basta enviar o `patientId` na requisição:
```bash
curl -X POST http://localhost:3000/api/scan/ingest \
  -F "file=@ficha_avulsa_preenchida.pdf" \
  -F "trackingCode=FORM-DELCHAN-..." \
  -F "patientId=pat-3"
```
*O sistema vinculará o documento órfão automaticamente ao paciente `Patient/pat-3`!*

---

## 🏛️ Sincronização Opcional com Mayan EDMS (GED / ECM)

Para clínicas com compliance arquivístico que exigem armazenamento de prontuários em um sistema de Gestão Eletrônica de Documentos (Mayan EDMS):

### Variáveis de Ambiente Suportadas:
```env
MAYAN_URL=http://localhost:8000
MAYAN_TOKEN=seu_token_de_api_mayan
```

### Executar via Script Python:
```bash
python scripts/mayan-sync.py --doc-ref-id <ID_DO_DOCUMENT_REFERENCE> --tenant tenant-1 --patient pat-1
```

### Acionar via API REST do Next.js:
```bash
curl -X POST http://localhost:3000/api/mayan/sync \
  -H "Content-Type: application/json" \
  -d '{"docRefId": "docref-12345", "tenant": "tenant-1", "patientId": "pat-1"}'
```

O documento será arquivado no gabinete hierárquico:
```text
Gabinete: {tenant}/{patient}
Exemplo: tenant-1/pat-1
```

---

## 🔒 Conformidade FHIR R4
- **Recurso Principal**: `DocumentReference`
- **Identifier**: `urn:med-sistema:doc-tracker` (armazena o `trackingCode`)
- **Type**: LOINC `11506-3` (*Progress note*)
- **Ciclo de Vida**:
  - `preliminary`: Quando a folha é gerada e impressa.
  - `current`: Quando o arquivo digitalizado com a assinatura física é ingerido.

