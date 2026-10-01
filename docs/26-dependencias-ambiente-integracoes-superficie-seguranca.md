# 26 — Dependências, ambiente, integrações externas e superfície de segurança

## 1. Runtime e dependências

O projeto utiliza:

- Next.js 15.5.6;
- React 19.2.0;
- React DOM 19.2.0;
- TypeScript 5.9.3;
- Node `^22.18.0 || >=24.2.0`;
- npm 10.9.4;
- Medplum 5.0.4;
- Mantine 8.3.x;
- TipTap 3.30.x;
- Google APIs;
- pdf-lib;
- QRCode / qrcode.react;
- jsQR;
- Recharts;
- react-to-print;
- date-fns;
- rfc6902.

O `package.json` deve ser considerado a fonte de verdade para versões instaladas.

---

## 2. Variáveis de ambiente identificadas

### Medplum

- `MEDPLUM_BASE_URL`
- `MEDPLUM_CLIENT_ID`
- `MEDPLUM_CLIENT_SECRET`

Usadas em rotas server-side que precisam acessar o servidor FHIR.

### Google Calendar

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`

Usadas no fluxo OAuth do Google Calendar.

### Meta/WhatsApp

- `META_VERIFY_TOKEN`
- `WHATSAPP_VERIFY_TOKEN`

Usadas na validação dos webhooks.

### Intake seguro

- `INTAKE_SECRET_KEY`

Usada para validação HMAC do link de pré-anamnese.

### Aplicação

- `NEXT_PUBLIC_APP_URL`

Usada para montar URLs públicas do sistema em fluxos de CRM/intake.

### Mayan EDMS

- `MAYAN_URL`
- `MAYAN_TOKEN`

Usadas pelo sincronizador Mayan.

---

## 3. Valores padrão e risco operacional

A auditoria identificou valores de fallback no código, incluindo URL de Medplum, tenant de demonstração, chaves de demonstração e URLs localhost.

Esses valores são úteis para desenvolvimento, mas não devem ser tratados como configuração de produção.

### Regra para produção

Nunca colocar em Git:

- tokens;
- senhas;
- certificados PFX/P12;
- PINs;
- chaves HMAC reais;
- tokens Meta;
- tokens Mayan;
- credenciais Medplum;
- dados reais de pacientes.

O ambiente de produção deve fornecer essas informações através de variáveis protegidas/secret manager.

---

## 4. Integrações externas

### Medplum

É a principal infraestrutura de dados clínicos.

O frontend e as APIs trabalham com recursos FHIR R4.

### Google Calendar

O sistema inicia OAuth com escopo de eventos de calendário.

A auditoria confirmou o endpoint de autenticação e callback.

**Não confirmado:** sincronização bidirecional permanente com refresh token armazenado.

### Meta / WhatsApp

Há validação e processamento de webhook no CRM.

O endpoint `/api/crm/webhook` possui fluxo mais completo de ingestão para FHIR.

O endpoint `/api/webhooks/whatsapp` também aceita formatos compatíveis com diferentes gateways, mas sua implementação atual deve ser diferenciada do pipeline persistente do CRM.

### Mayan EDMS

A integração existe como camada opcional.

O endpoint Next.js executa:

`scripts/mayan-sync.py`

O script:

1. recebe DocumentReference;
2. tenta obter o documento no Medplum;
3. determina tenant/paciente;
4. verifica conectividade Mayan;
5. prepara resultado de sincronização.

### OneSignal

Existe referência a endpoint de notificações no código de assinatura, mas a implementação efetiva está condicionada ao fluxo existente e não deve ser documentada como sistema de notificações plenamente configurado sem credenciais/configuração operacional.

---

## 5. Superfície FHIR observada

Entre os recursos encontrados na implementação:

- Patient;
- Practitioner;
- Organization;
- Appointment;
- Task;
- Communication;
- Encounter;
- Observation;
- DiagnosticReport;
- ClinicalImpression;
- MedicationRequest;
- CarePlan;
- Questionnaire;
- QuestionnaireResponse;
- DocumentReference;
- Binary;
- Consent;
- AllergyIntolerance;
- Condition;
- Coverage;
- Media;
- PaymentNotice.

A presença de um recurso na aplicação não significa que todos os seus campos ou todos os fluxos CRUD estejam implementados.

---

## 6. Isolamento multi-tenant

O frontend possui `TenantContext` e utiliza tags FHIR em diversas operações.

Isso fornece contexto de tenant na aplicação, mas **não substitui autorização server-side**.

Para uma implantação multi-tenant segura, o servidor FHIR/API deve impedir que um usuário de Tenant A:

- leia Patient de Tenant B;
- leia DocumentReference de Tenant B;
- altere Appointment de Tenant B;
- leia Binary de Tenant B;
- altere Organization de Tenant B.

Tags no frontend não devem ser consideradas mecanismo suficiente de controle de acesso.

---

## 7. RBAC

Existem papéis e módulos representados na interface administrativa, como:

- Super Admin;
- Especialista;
- Recepcionista.

Também existe configuração de módulos e referência a `AccessPolicy`/autorização futura em partes do código.

A auditoria não encontrou evidência suficiente para afirmar que todos esses papéis possuem enforcement server-side completo.

### Regra documental

A documentação deve separar:

**papel exibido na UI** de **permissão efetivamente aplicada pelo backend**.

---

## 8. Assinatura digital

Há três camadas diferentes no projeto:

### Assinatura visual

Componentes como `MasterSignature` permitem desenhar uma assinatura no canvas.

### Metadados de assinatura

`DigitalSignaturePad` cria identificadores e metadados apresentados como ICP-Brasil.

### Assinatura criptográfica real

A auditoria não encontrou, nos componentes analisados, uma chamada comprovada a:

- certificado A1/A3;
- middleware criptográfico;
- autoridade certificadora;
- serviço de assinatura ICP-Brasil;
- HSM/KMS real.

Portanto, a documentação deve usar **“assinatura eletrônica/fluxo preparado”** quando apropriado e não prometer assinatura ICP-Brasil juridicamente válida sem infraestrutura adicional comprovada.

---

## 9. Pagamentos

A interface possui métodos como:

- Pix;
- crédito;
- débito;
- dinheiro.

Também aparecem referências a adquirentes/gateways.

Entretanto, a auditoria anterior identificou comportamento simulado no componente de POS, incluindo identificadores artificiais e `PaymentNotice`.

Logo:

**PaymentNotice FHIR não equivale a cobrança bancária efetivamente processada.**

---

## 10. Operação Mayan

O endpoint `/api/mayan/sync` executa o Python localmente através de `spawn('python', ...)`.

Isso possui implicações de infraestrutura:

- o runtime precisa ter Python disponível;
- o processo precisa permitir subprocessos;
- serverless environments podem não suportar esse padrão da mesma forma;
- o comportamento de fallback pode retornar “queued” sem existir uma fila real.

O script também pode criar um PDF de marcação quando não consegue obter o documento remoto. Portanto, o resultado `synchronized_or_queued` não deve ser interpretado automaticamente como confirmação de armazenamento definitivo no Mayan.

---

## 11. Configuração Next.js

A configuração atual contém:

- React Strict Mode;
- transpile de `qrcode.react`;
- rewrite para Medplum;
- `eslint.ignoreDuringBuilds=true`;
- `typescript.ignoreBuildErrors=true`.

Os dois últimos pontos significam que o build pode prosseguir apesar de erros de lint ou TypeScript.

Para produção, recomenda-se separar:

- validação CI;
- build;
- deploy.

O pipeline de CI deve falhar quando houver erros reais de TypeScript/lint.

---

## 12. Vercel

O `vercel.json` define o processo básico de instalação/build e rewrite.

A auditoria não encontrou nesse arquivo:

- worker dedicado;
- fila;
- cron;
- observabilidade;
- configuração explícita de jobs de longa duração.

Integrações que dependem de subprocessos, processamento documental ou sincronização assíncrona devem ser validadas contra o runtime real de implantação.

---

## 13. Política de documentação

A documentação oficial deve adotar os seguintes rótulos:

### Implementado

Código demonstra execução/persistência.

### Parcial

Existe endpoint, componente ou integração, mas o ciclo operacional completo não está comprovado.

### Demonstrativo

Interface ou fluxo simulado, sem integração externa comprovada.

### Requer infraestrutura

Funcionalidade depende de serviço, credencial, certificado, servidor ou configuração externa.

Essa taxonomia deve ser usada nos próximos capítulos para evitar confundir protótipo de UI com capacidade operacional de produção.
