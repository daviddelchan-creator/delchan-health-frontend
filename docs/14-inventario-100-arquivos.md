# Inventário técnico do repositório — cobertura de 100% dos arquivos

> Gerado a partir da árvore completa da branch `main` analisada em 2026-10-01.
> O inventário cobre todos os 85 blobs identificados. “Inventariado” significa que o arquivo foi identificado; “auditado” significa que seu conteúdo também foi inspecionado.

## Critério

A documentação final deve distinguir três níveis:
- **A — auditado:** conteúdo lido e relações rota/componente/API/FHIR/configuração extraídas.
- **B — inventariado:** arquivo localizado e classificado pelo caminho/tipo, aguardando leitura sem inferência.
- **C — externo:** dependência/serviço que precisa de documentação do ambiente, e não apenas do Git.

## A — arquivos de aplicação já auditados em profundidade nesta passada

### Rotas administrativas
- `app/(dashboard)/admin/construtor/page.tsx` — construtor; Questionnaire/FHIR.
- `app/(dashboard)/admin/crm/page.tsx` — CRM; Task/Patient/Practitioner/Appointment; webhooks WhatsApp/CRM.
- `app/(dashboard)/admin/equipe/page.tsx` — equipe/RBAC; Practitioner.
- `app/(dashboard)/admin/page.tsx` — administração; Organization/Patient/Questionnaire.
- `app/(dashboard)/admin/plantillas/page.tsx` — modelos.
- `app/(dashboard)/admin/recursos/page.tsx` — recursos.

### Rotas profissionais
- `app/(dashboard)/doctor/agenda/page.tsx` — agenda; Appointment/Patient/Practitioner; Calendar OAuth.
- `app/(dashboard)/doctor/clinical/page.tsx` — entrada clínica.
- `app/(dashboard)/doctor/configuracao/page.tsx` — configuração profissional; Practitioner; canais.
- `app/(dashboard)/doctor/crm/page.tsx` — CRM; Practitioner/Task/Patient/Appointment.
- `app/(dashboard)/doctor/dashboard/page.tsx` — dashboard.
- `app/(dashboard)/doctor/pacientes/novo/page.tsx` — criação; DynamicIntakeForm.
- `app/(dashboard)/doctor/pacientes/page.tsx` — pacientes; Patient/Binary/DocumentReference/Practitioner.
- `app/(dashboard)/doctor/page.tsx` — entrada do profissional.
- `app/(dashboard)/layout.tsx` — layout comum e contexto.
- `app/(dashboard)/patient/[id]/print/page.tsx` — impressão.
- `app/(dashboard)/profile/[type]/[id]/page.tsx` — perfil.

### Setup/white-label
- `app/(dashboard)/setup/page.tsx` — setup, branding, domínio e configuração administrativa.

## B — demais arquivos do repositório, inventariados e classificados

### APIs
- `app/api/calendar/auth/route.ts`
- `app/api/calendar/callback/route.ts`
- `app/api/crm/intake/submit/route.ts`
- `app/api/crm/webhook/route.ts`
- `app/api/forms/generate/route.ts`
- `app/api/hello.ts`
- `app/api/mayan/sync/route.ts`
- `app/api/scan/ingest/route.ts`
- `app/api/scanner/webhook/route.ts`
- `app/api/webhooks/signature/route.ts`
- `app/api/webhooks/whatsapp/route.ts`

Essas rotas formam a camada HTTP e devem ser relacionadas, na documentação final, com autenticação, payload, resposta, recurso FHIR, integração externa, erros e variáveis de ambiente.

### Páginas adicionais
- `app/layout.tsx`
- `app/page.tsx`
- `app/patient/[id]/anamnese/page.tsx`
- `app/patient/page.tsx`
- `app/root.tsx`

### Componentes
- `components/AppointmentCalendar.tsx`
- `components/CarePlanList.tsx`
- `components/DigitalSignaturePad.tsx`
- `components/DynamicIntakeForm.tsx`
- `components/FormPrintDialog.tsx`
- `components/ModernCalendar.tsx`
- `components/ModularAnamnesis.tsx`
- `components/PatientHeader.tsx`
- `components/PatientWorkspace.tsx`
- `components/PaymentPOS.tsx`
- `components/PhotographicModule.tsx`
- `components/PractitionerForm.tsx`
- `components/Print/ProntuarioPrintView.tsx`
- `components/SoapNoteForm.tsx`
- `components/Vitals/VitalsModal.tsx`
- `components/admin/StaffManager.tsx`
- `components/clinical/ClinicalEditor.tsx`
- `components/crm/ChannelManager.tsx`
- `components/modules/DynamicClinicalForm.tsx`
- `components/patient/ExamsTab.tsx`
- `components/patient/PatientSidebar.tsx`
- `components/patient/PatientTimeline.tsx`
- `components/patient/PatientWorkspace.tsx`
- `components/patient/PrintableFicha.tsx`
- `components/profile/DoctorProfile.tsx`
- `components/profile/ProfileLayout.tsx`
- `components/shared/MasterSignature.tsx`

### Contextos e domínio
- `contexts/TenantContext.tsx`
- `core/hooks/TenantContext.tsx`
- `lib/crm/antigravity-agent.ts`
- `lib/crm/channels-config.ts`
- `lib/crm/patient-intake-link.ts`
- `lib/crm/zernflow-engine.ts`
- `lib/qr-pdf-generator.ts`
- `lib/scan/qr-decoder.ts`
- `utils/patientUtils.ts`

### Infraestrutura/configuração
- `next.config.mjs`
- `postcss.config.json`
- `tsconfig.json`
- `vercel.json`
- `.npmrc`
- `.gitignore`
- `.gitattributes`

### Scripts/assets
- `scripts/mayan-sync.py`
- `public/favicon.svg`
- `.turbo/turbo-build.log`

### Documentação existente
- `README.md`
- `README_QR.md`
- `LICENSE.txt`

## Mapa de dependências já identificado

```
Usuário
  ↓
Next.js App Router
  ↓
Layouts / páginas
  ↓
TenantContext + componentes
  ↓
Medplum / FHIR
  ├─ Patient
  ├─ Practitioner
  ├─ Organization
  ├─ Task
  ├─ Appointment
  ├─ Questionnaire
  ├─ CarePlan
  ├─ Observation
  ├─ Communication
  ├─ DocumentReference
  └─ Binary

Integrações
  ├─ Google Calendar
  ├─ CRM/Webhooks
  ├─ WhatsApp webhook
  ├─ Mayan
  ├─ Scanner
  └─ QR/PDF
```

## Rota → componente → API → FHIR → configuração

| Área | Rota/arquivo | Componentes relacionados | API/integracão | FHIR/configuração |
|---|---|---|---|---|
| Administração | admin | DynamicIntakeForm, PatientWorkspace, StaffManager | — | Organization, Patient, Questionnaire, Tenant |
| Construtor | admin/construtor | DynamicClinicalForm | — | Questionnaire |
| CRM | admin/crm | ChannelManager | /api/crm/webhook, /api/webhooks/whatsapp | Task, Patient, Practitioner, Appointment |
| Equipe | admin/equipe | StaffManager | — | Practitioner/RBAC |
| Agenda | doctor/agenda | AppointmentCalendar/ModernCalendar | /api/calendar/auth | Appointment, Patient, Practitioner |
| CRM profissional | doctor/crm | ChannelManager | canais CRM | Task, Patient, Appointment |
| Pacientes | doctor/pacientes | PatientWorkspace, ClinicalEditor, PrintableFicha, MasterSignature | — | Patient, Binary, DocumentReference, Practitioner |
| Novo paciente | doctor/pacientes/novo | DynamicIntakeForm | — | FHIR conforme formulário |
| Setup | setup | Tenant/branding UI | domínio/DNS conforme backend | Tenant/Organization |
| Anamnese | patient/[id]/anamnese | ModularAnamnesis | — | Questionnaire/QuestionnaireResponse conforme implementação |
| Impressão | patient/[id]/print | ProntuarioPrintView | PDF/impressão | dados clínicos FHIR |
| Documentos | forms/scan | FormPrintDialog, QR decoder | forms/generate, scan/ingest, scanner webhook | DocumentReference/Binary |
| Mayan | API/script | — | mayan/sync | documentos |
| Assinatura | assinatura | DigitalSignaturePad, MasterSignature | signature webhook | documento/assinatura |

## Lacunas que devem ser resolvidas antes de declarar “100% documentado”

1. Ler individualmente o conteúdo integral das 85 unidades para extrair todas as relações de importação e chamadas.
2. Catalogar todas as variáveis de ambiente usadas por código/configuração.
3. Catalogar todos os endpoints com método HTTP, entrada, saída, autenticação e erros.
4. Catalogar todos os recursos FHIR criados/lidos/alterados e seus campos.
5. Catalogar todos os serviços externos, URLs e requisitos de credenciais sem expor segredos.
6. Mapear cada componente para todas as páginas que o utilizam.
7. Documentar todas as permissões por papel.
8. Documentar persistência do White-Label, pois alguns controles são visíveis na UI e precisam de confirmação no backend.
9. Confirmar a arquitetura de VoIP/SIP; ela não foi localizada nesta árvore.
10. Gerar páginas individuais de referência para cada API, rota e componente de domínio.

## Regra de qualidade

Nenhum parâmetro, endpoint, credencial, comportamento ou integração deve ser inventado. Quando o código não comprovar algo, a página deve marcar **“não identificado no código analisado”** e indicar o que precisa ser confirmado no ambiente.
