# Documentos, QR Code, scanner e Mayan EDMS

## Arquitetura

O sistema possui um ciclo documental:

**geração → identificação → impressão → escaneamento → ingestão → DocumentReference → armazenamento externo opcional.**

## 1. Geração

`/api/forms/generate` chama `lib/qr-pdf-generator.ts`.

O código de rastreamento segue:

`FORM-{TENANT}-{TIMESTAMP}-{UUID6}`

O PDF é A4 e contém:

- QR no canto superior direito;
- código legível;
- marcas de alinhamento;
- identificação da clínica;
- paciente;
- profissional;
- data;
- SOAP;
- assinatura/carimbo;
- tracking code no rodapé.

## 2. Persistência inicial

O PDF é enviado como **Binary** ao Medplum.

Um **DocumentReference** preliminar é criado com:

- identifier do tracking;
- tenant tag;
- tipo LOINC 11506-3;
- subject Patient quando disponível;
- author Organization quando tenant disponível;
- attachment para o Binary.

## 3. Decodificação

`lib/scan/qr-decoder.ts` suporta:

- PNG;
- JPEG;
- WEBP;
- TIFF;
- PDF.

### Imagem

Usa Sharp para pixels RGBA e jsQR para leitura.

Existe uma segunda tentativa otimizada na região superior direita.

### PDF

Procura tracking code em:

1. Title;
2. Subject;
3. Keywords;
4. buffer textual;
5. fallback de buffer.

### Regex

`FORM-[A-Z0-9]+-\\d+-[A-Z0-9]{6}`

## 4. Ingestão principal

`POST /api/scan/ingest`

A API:

1. exige multipart/form-data;
2. exige tenantId;
3. detecta tracking code;
4. busca DocumentReference;
5. verifica pertencimento do tenant;
6. cria Binary do documento escaneado;
7. adiciona tag de tenant;
8. atualiza ou cria DocumentReference;
9. pode vincular o documento a um Patient.

Na atualização, o status passa para:

- `current`;
- `docStatus: final`.

## 5. Scanner webhook

Existe também `POST /api/scanner/webhook`, pensado para softwares de scanner como NAPS2.

Ele recebe PDF e barcode, usa credenciais de sistema do Medplum e cria Binary + DocumentReference.

## 6. Mayan EDMS

`POST /api/mayan/sync` executa Python.

O script:

1. recebe DocumentReference;
2. busca documento no Medplum quando necessário;
3. obtém attachment;
4. monta gabinete `tenant/patient`;
5. conecta ao Mayan;
6. verifica tipos de documento;
7. retorna estado de sincronização/fila.

Variáveis:

- `MAYAN_URL`;
- `MAYAN_TOKEN`;
- `MEDPLUM_BASE_URL`.

## 7. Operação segura

Nunca publicar:

- token Mayan;
- credenciais Medplum;
- tokens de webhook;
- dados clínicos reais.

Para produção, recomenda-se validar o fluxo de upload real no Mayan e adicionar autenticação/assinatura do endpoint de sincronização.

## 8. Rastreabilidade

O tracking code é o elo entre:

**PDF → QR → scanner → Binary → DocumentReference → Patient → gabinete Mayan.**
