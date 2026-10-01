# Auditoria final de rotas, administração e integrações

## Objetivo

Esta seção registra o estado observado no código-fonte da branch `main), com foco nas rotas que ainda precisavam de inspeção detalhada. A classificação abaixo evita tratar interfaces demonstrativas como integrações de produção.

## 1. Painel do profissional — `/doctor`

A página principal usa Medplum para carregar dados de pacientes, agendamentos e tarefas/leads, mas mantém uma lista inicial de pacientes de fallback no código.

### Classificação

- **Integrado:** leitura de Patient, Appointment e Task via Medplum.
- **Fallback/demo:** pacientes iniciais codificados diretamente na página.
- **Atenção:** números financeiros e indicadores exibidos na interface devem ser tratados como demonstrativos quando não houver consulta FHIR/financeira correspondente.

## 2. Dashboard executivo — `/doctor/dashboard`

A página apresenta indicadores como receita líquida, quantidade de consultas e presença. Os valores exibidos no código são valores fixos de apresentação.

### Classificação

**Demonstrativo/Frontend.** Não documentar os números apresentados como métricas calculadas em tempo real.

## 3. Gestão de pacientes — `/doctor/pacientes`

A rota integra:

- `useMedplum`;
- busca de Patient;
- edição através de `DynamicIntakeForm`;
- `PatientWorkspace`;
- evolução clínica via `ClinicalEditor`;
- assinatura/TCLE através de `MasterSignature`;
- impressão com `PrintableFicha`;
- filtros de sexo, idade e condição.

O fluxo de evolução cria/atualiza artefatos FHIR e documentos conforme os componentes utilizados.

### Classificação

**Implementado/Integrado parcialmente.** A persistência FHIR está comprovada em partes do fluxo; a validade jurídica de assinaturas não deve ser inferida apenas pela existência da UI.

## 4. Novo paciente — `/doctor/pacientes/novo`

A página usa `DynamicIntakeForm` com Medplum e redireciona para a lista de pacientes após sucesso.

### Classificação

**Implementado.** O cadastro FHIR é realizado pelo componente de formulário.

## 5. Gestão da equipe — `/admin/equipe`

A rota consulta `Practitioner` diretamente no Medplum e apresenta:

- nome;
- especialidade/cargo;
- registro;
- indicação visual de assinatura;
- ações administrativas.

A existência de um botão de novo colaborador não comprova, nesta página, um fluxo completo de convite/autenticação.

### Classificação

**Integrado para leitura FHIR; RBAC/autenticação de colaboradores ainda não comprovados nesta rota.**

## 6. Construtor de formulários — `/admin/construtor`

O construtor permite montar itens de `Questionnaire` com:

- texto curto;
- texto longo;
- número;
- data;
- booleano;
- `linkId`;
- texto do campo;
- obrigatoriedade.

Ao publicar, a página chama `medplum.createResource()` e grava um `Questionnaire` ativo.

### Classificação

**Implementado para criação de Questionnaire.**

Não foi comprovado nesta página:

- workflow de aprovação;
- versionamento robusto;
- drag-and-drop funcional;
- controle granular de permissões;
- ambientes draft/staging/produção.

## 7. Modelos clínicos — `/admin/plantillas`

A página fornece modelos SOAP, anamnese geral e protocolo estético, com edição, criação e exclusão no estado React local.

O botão de salvar exibe uma confirmação de sincronização, mas o arquivo auditado não demonstra persistência FHIR ou API externa para esses modelos.

### Classificação

**Demonstrativo/estado local.** Não documentar como catálogo clínico persistente multiusuário sem implementação adicional.

## 8. Recursos físicos — `/admin/recursos`

A interface apresenta exemplos de:

- unidades e salas;
- telemedicina;
- totens;
- equipamentos de videoconferência;
- scanner;
- leitor SmartCard.

Os objetos `Location` e `Device` usados na tela são dados mock mantidos no estado local.

### Classificação

**Demonstrativo.** A presença dos conceitos FHIR `Location`/`Device` na interface não comprova persistência desses recursos no servidor.

## 9. Perfil — `/profile/[type]/[id]`

A rota aceita:

- `practitioner`;
- `patient`.

Para profissional, lê `Practitioner`; para paciente, lê `Patient`. A resposta é transformada em dados de apresentação para `ProfileLayout`.

Se a leitura falhar, existe fallback visual.

### Classificação

**Implementado para leitura FHIR, com fallback de apresentação.**

Os dados complementares exibidos por `ProfileLayout` devem ser considerados demonstrativos quando não tiverem fonte FHIR/API explícita.

## 10. White-Label e setup

A área de setup permanece documentada como capacidade de interface/provisionamento preparada. O código auditado não comprova, por si só, persistência server-side de todos os campos de:

- logo;
- imagem de fundo;
- cor primária;
- subdomínio;
- domínio personalizado;
- CNAME/DNS.

A documentação deve distinguir configuração visual/local de provisionamento SaaS efetivamente persistido.

## 11. Administração e RBAC

O projeto possui conceitos de tenant, módulos, clínica, equipe e requisito de 2FA no contexto de tenant. Isso não equivale automaticamente a autorização de servidor.

Para produção, a fronteira de segurança deve ser o backend/Medplum e suas políticas de acesso, não apenas:

- `TenantContext`;
- `localStorage`;
- ocultação de menus;
- guards exclusivamente client-side.

## 12. Estado de integrações externas

| Integração | Estado documentado |
|---|---|
| Medplum/FHIR | Integrado em várias rotas/componentes |
| Google Calendar | OAuth iniciado; persistência de refresh token não comprovada |
| Meta/WhatsApp | Webhooks e ingestão CRM implementados em parte |
| Instagram/Facebook | Recepção de eventos prevista no pipeline CRM; configuração operacional depende das credenciais Meta |
| Mayan EDMS | Ponte via script Python/subprocesso; infraestrutura necessária |
| OneSignal | Referência de chamada presente, integração operacional completa não comprovada |
| Pagamentos Asaas/Cielo/Stone | UI e PaymentNotice demonstrativos; processamento financeiro real não comprovado |
| Google Meet/Teams | Elementos de UI presentes; integração externa real não comprovada em `AppointmentCalendar` |
| ICP-Brasil | UI de assinatura/certificado existe; criptografia/certificação ICP-Brasil real não comprovada |

## 13. Regra de documentação

Ao transformar o código em manual operacional:

1. **Implementado** — pode ser descrito como funcionalidade existente quando o fluxo é comprovado no código.
2. **Integrado parcialmente** — descrever o que realmente está conectado e declarar as etapas ausentes.
3. **Demonstrativo** — documentar como protótipo/interface, não como serviço de produção.
4. **Requer infraestrutura** — registrar credenciais, serviços, runtime ou configuração externa necessária.
5. **Não identificado** — não preencher lacunas com suposições.

Essa classificação é especialmente importante para segurança, assinatura digital, pagamentos, RBAC, White-Label e integrações de comunicação.
