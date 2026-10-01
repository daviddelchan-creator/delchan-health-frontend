# Matriz final de cobertura técnica — Delchan Health OS

> Atualizada em 2026-10-01 após a segunda varredura semântica da árvore identificada na branch `main`.
>
> Objetivo: distinguir o que foi efetivamente confirmado no código do que depende de infraestrutura externa ou ainda precisa de validação operacional.

## 1. Critério de auditoria

- **A — auditado:** conteúdo lido e comportamento relevante extraído.
- **B — inventariado/inspeção parcial:** arquivo identificado, mas não é seguro afirmar que toda relação interna foi exaurida.
- **C — externo:** depende de serviço, credencial, infraestrutura ou configuração fora do repositório.
- **D — demonstrativo:** a UI existe, mas o código mostra simulação, estado local, `alert`, `setTimeout` ou dados hard-coded em vez de integração operacional.

A classificação é deliberadamente conservadora: presença de uma tela ou nome de integração **não** é tratada como prova de integração de produção.

## 2. Cobertura por área

| Área | Unidade | Status | Evidência / conclusão |
|---|---|---:|---|
| App | `app/layout.tsx` | A | Mantine, tema, Root/Medplum e TenantProvider. |
| App | `app/page.tsx` | A | Login Medplum; seleção de perfil; atalhos para Doctor/Admin/Patient. |
| App | `app/patient/[id]/anamnese` | A | Pré-anamnese + POST para intake; consentimentos são UI; persistência no backend. |
| App | `app/patient/page.tsx` | D | Portal visual/mobile com dados e estado locais; assinatura exibida como fluxo de demonstração. |
| App | `app/root.tsx` | A | Inicialização do contexto Medplum/Root. |
| Admin | `admin/*` | A | Administração, equipe, CRM, construtor, modelos e recursos foram auditados. |
| Doctor | `doctor/*` | A | Agenda, CRM, pacientes, configuração, dashboard, clinical e entrada profissional auditados. |
| Patient | `patient/[id]/print` | A | Impressão A4, FHIR, histórico e Binary/DocumentReference. |
| Profile | `profile/[type]/[id]` | A | Leitura de Patient/Practitioner e composição do perfil. |
| Setup | `setup/page.tsx` | A/D | Branding/domínio/configuração existem; persistência SaaS server-side não comprovada. |
| APIs | Calendar auth/callback | A/C | OAuth Google implementado; refresh token não persistido no código. |
| APIs | CRM webhook/intake | A | Meta/WhatsApp/CRM e intake HMAC/FHIR documentados. |
| APIs | Forms generate | A | PDF/QR + Binary/DocumentReference. |
| APIs | Scan ingest/scanner webhook | A | QR/tracking + Binary/DocumentReference; fluxos diferem em rigor de tenant. |
| APIs | Mayan sync | A/C/D | Bridge existe, mas o script testado não comprova upload efetivo no Mayan. |
| APIs | WhatsApp webhook | A/D | Compatibilidade de formatos; rota não persiste CRM sozinha. |
| APIs | Signature webhook | A/D | Validação de QuestionnaireResponse; notificação OneSignal está comentada. |
| APIs | `api/hello.ts` | A/D | Endpoint de template/demo, sem função de negócio. |
| Clinical | PatientWorkspace | A | Encounter, Task, MedicationRequest, DiagnosticReport, timeline e CarePlan. |
| Clinical | PatientSidebar/Vitals | A | Coverage, AllergyIntolerance, Condition e Observation/vitais. |
| Clinical | SOAP | A | SOAP armazenado em DiagnosticReport.conclusion; assinatura criptográfica não é provada pelo formulário. |
| Clinical | Exams | A | DiagnosticReport/DocumentReference/Binary e visualização. |
| Clinical | Anamnese modular | A/D | QuestionnaireResponse implementado; OCR é simulado. |
| Clinical | DynamicClinicalForm | A | Renderização de Questionnaire; persistência depende do consumidor. |
| Clinical | CarePlanList | A | CRUD CarePlan via Medplum. |
| Clinical | ClinicalEditor | A | TipTap, SOAP/anamnese e integração com impressão/QR. |
| Clinical | PhotographicModule | A/D | Binary + Media implementados; “visão computacional” é apenas grade visual. |
| Clinical | PrintableFicha/PrintView | A | Impressão e códigos QR/barcode; textos de “criptografia” não comprovam criptografia local. |
| Clinical | PatientHeader/DynamicIntake | A | Dados demográficos, CPF/CNS, mãe, contato e edição FHIR. |
| Clinical | Signatures | D | MasterSignature é canvas; DigitalSignaturePad gera identificador simulado e não prova ICP-Brasil real. |
| Scheduling | AppointmentCalendar/ModernCalendar | A/D | Appointment FHIR real; Google/Teams/telemedicina na UI usam simulação/preparação. |
| CRM | Antigravity | A/D | Classificação local por heurísticas; não há chamada Gemini efetiva demonstrada no arquivo auditado. |
| CRM | ZernFlow | A | Pipeline de trigger, humano, urgência, qualificação e intake. |
| CRM | Channels | A/D | Persistência de config de Practitioner existe; tokens/exemplos iniciais são dados de demonstração. |
| CRM | Intake link | A | HMAC-SHA256, expiração padrão de 72h e vínculo com paciente. |
| Admin | StaffManager/PractitionerForm | A/D | Practitioner FHIR criado; convite/auth/RBAC de backend não comprovados. |
| Admin | Construtor | A | Questionnaire ativo criado pelo Medplum; versionamento/aprovação não comprovados. |
| Admin | Plantillas | D | Estado local e mensagens de sincronização; persistência FHIR não comprovada. |
| Admin | Recursos | D | Location/Device são exemplos locais; persistência não comprovada. |
| Billing | PaymentPOS | D | PaymentNotice é criado no Medplum, mas gateway Pix/Asaas/Cielo/Stone é simulado. |
| Tenant | contexts/TenantContext | A/D | Multi-tenant e módulos persistem em localStorage; isso não equivale a isolamento server-side. |
| Tenant | core/hooks/TenantContext | D | Segundo contexto simplificado com módulos em memória. |
| Infra | next.config | A/C | Rewrite Medplum fixo; builds ignoram erros de ESLint/TypeScript. |
| Infra | tsconfig | A | TypeScript strict, bundler, aliases e Next plugin. |
| Infra | vercel.json | A/C | Build npm; rewrite genérico; não configura cron/workers. |
| Infra | postcss/.npmrc/gitignore/gitattributes | A | Configuração de suporte; `.npmrc` usa legacy-peer-deps. |
| Docs | README/README_QR/LICENSE | A | Documentação e licença existentes; README raiz ainda tem material de template/Medplum. |
| Script | mayan-sync.py | A/C/D | Consulta Medplum e testa Mayan; fallback/mock e ausência de upload efetivo exigem confirmação operacional. |
| Assets | favicon/public e log | B | Inventariados; não representam lógica funcional. |

## 3. Recursos FHIR confirmados

### Recursos principais

- Patient
- Practitioner
- Organization
- Task
- Appointment
- Questionnaire
- QuestionnaireResponse
- CarePlan
- Observation
- Communication
- DocumentReference
- Binary
- Encounter
- MedicationRequest
- DiagnosticReport
- Coverage
- AllergyIntolerance
- Condition
- ClinicalImpression
- Consent
- Media
- PaymentNotice

### Observação

Alguns recursos aparecem em UI/conceitos administrativos sem persistência comprovada no arquivo correspondente. A documentação final deve separar “recurso suportado no domínio” de “fluxo de CRUD efetivamente implementado”.

## 4. Variáveis de ambiente identificadas

- `MEDPLUM_BASE_URL`
- `MEDPLUM_CLIENT_ID`
- `MEDPLUM_CLIENT_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `META_VERIFY_TOKEN`
- `WHATSAPP_VERIFY_TOKEN`
- `INTAKE_SECRET_KEY`
- `NEXT_PUBLIC_APP_URL`
- `MAYAN_URL`
- `MAYAN_TOKEN`

Também foi detectada referência conceitual a `GEMINI_API_KEY` no comentário do agente, mas o arquivo auditado não demonstrou uma chamada Gemini efetiva.

## 5. Riscos/gaps que continuam abertos

### 5.1 Multi-tenant real

O `TenantContext` troca tenant, cor, módulos e dados locais. Isso **não prova isolamento de dados no servidor**. O isolamento deve ser aplicado e testado no Medplum/backend por autorização, escopo e/ou políticas equivalentes.

### 5.2 RBAC

A UI exibe papéis e módulos, mas não foi encontrada prova suficiente de enforcement server-side para todas as operações. Não documentar “RBAC completo” como funcionalidade concluída sem validar AccessPolicy/auth.

### 5.3 White-Label

Há configuração de nome, cor, logo, fundo, subdomínio/domínio e DNS na experiência de setup. A persistência server-side de todas essas configurações ainda precisa ser confirmada.

### 5.4 Assinatura digital

Há componentes de assinatura e linguagem de ICP-Brasil/e-CPF. O código auditado não demonstra cadeia criptográfica real, certificado A1/A3, middleware, autoridade certificadora ou validação jurídica. Classificação: **demonstrativo/preparado**, salvo prova externa de infraestrutura.

### 5.5 Pagamentos

O `PaymentPOS` cria um `PaymentNotice`, mas a cobrança é simulada. Não documentar Asaas, Cielo ou Stone como adquirência efetivamente integrada sem endpoints/credenciais/webhooks reais.

### 5.6 Google Calendar

OAuth existe. O callback explicita TODO relacionado à persistência de `refresh_token`; portanto não afirmar sincronização automática contínua como concluída.

### 5.7 Mayan EDMS

O bridge Python existe e valida conectividade básica. O código atual pode criar um PDF mock em fallback e retorna estado preparado/queued; não há evidência suficiente de upload definitivo de documento para o Mayan.

### 5.8 VoIP/SIP

Não foi localizada uma implementação SIP/VoIP concreta na árvore auditada. A documentação deve manter uma seção de “infraestrutura externa necessária / não identificada no código” em vez de inventar um provedor.

### 5.9 LGPD/criptografia

A aplicação contém textos de conformidade e fluxos de consentimento. Isso não equivale, por si só, a uma auditoria jurídica ou prova de criptografia ponta a ponta. Documentar exatamente quais mecanismos são demonstrados pelo código.

## 6. Resultado da varredura

A documentação agora pode ser considerada **cobertura técnica ampla e rastreável do repositório**, mas “100% funcional em produção” não deve ser afirmado.

O conjunto de evidências permite separar:

1. **Implementado no código:** FHIR, CRUD clínico, agenda, CRM, intake HMAC, QR/PDF, documentos, fotos, formulários e várias rotas HTTP.
2. **Parcial/integrado a infraestrutura:** Google Calendar, Mayan, webhooks externos, tenant server-side, RBAC e domínio/White-Label.
3. **Demonstrativo/simulado:** pagamentos, OCR, algumas integrações de calendário/telemedicina, assinatura ICP-Brasil, métricas financeiras e parte do portal/perfis.
4. **Não identificado:** arquitetura SIP/VoIP concreta e alguns serviços operacionais que a UI menciona.

## 7. Regra para as próximas páginas do manual

Sempre que uma página mencionar uma capacidade operacional, usar uma destas etiquetas:

- **Implementado**
- **Integração parcial**
- **Demonstrativo**
- **Requer infraestrutura/configuração externa**
- **Não identificado no código**

Isso evita que o manual prometa ao administrador ou ao usuário uma capacidade que o repositório ainda não comprova.
