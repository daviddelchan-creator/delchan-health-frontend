# 25 — Auditoria das rotas clínicas, CRM, agenda e configuração

## Objetivo

Este documento fecha mais uma camada da auditoria semântica das páginas do Delchan Health OS, distinguindo:

- operação efetivamente persistida no Medplum/FHIR;
- integração externa efetivamente acionada;
- interface demonstrativa;
- comportamento simulado no frontend.

> Esta classificação é baseada no código encontrado na branch `docs/manual-completo-pt-br`. Uma tela pode combinar funcionalidades reais e demonstrativas.

---

## 1. Dashboard do profissional — `/doctor/dashboard`

### Classificação

**Interface analítica demonstrativa / não conectada diretamente a consultas FHIR nesta página.**

A página apresenta indicadores como:

- receita líquida;
- total de consultas;
- taxa de retorno;
- novos pacientes;
- procedimentos mais realizados;
- ocupação dos consultórios.

Os valores são definidos diretamente no componente. Não há consulta a `Patient`, `Appointment`, `PaymentNotice` ou outro recurso FHIR para calcular esses indicadores nesta página.

### Consequência para a documentação

Os números exibidos devem ser tratados como **dados demonstrativos** até existir uma camada de agregação persistente que os calcule a partir dos dados reais.

---

## 2. Gestão de pacientes — `/doctor/pacientes`

### Operações reais

A página usa Medplum diretamente e pesquisa:

`Patient`

com ordenação por última atualização e limite de 50 registros.

A interface oferece:

- pesquisa;
- filtro por sexo;
- filtro por faixa etária;
- criação de paciente;
- edição;
- abertura do workspace clínico;
- impressão;
- evolução clínica;
- TCLE;
- assinatura/interação com componentes clínicos.

### Evolução clínica

Ao salvar uma evolução, o código cria:

1. `Binary` contendo o snapshot HTML;
2. `DocumentReference` com:
   - status `current`;
   - `docStatus=final`;
   - identificador `urn:med-sistema:doc-tracker`;
   - LOINC `11506-3`;
   - referência ao paciente;
   - autor Practitioner;
3. `ClinicalImpression` com:
   - status `completed`;
   - paciente;
   - assessor;
   - data;
   - resumo HTML;
   - representação JSON no campo `note`;
   - tag de tenant.

Isso constitui uma persistência FHIR real.

### Atenção sobre assinatura

A mensagem visual informa que a evolução foi “assinada digitalmente”, mas o código dessa página não demonstra uma assinatura criptográfica ICP-Brasil. O snapshot e os recursos FHIR são persistidos; a validade jurídica/criptográfica da assinatura precisa ser tratada separadamente.

### TCLE

O fluxo cria `DocumentReference`, porém o “hash” usado na interface é gerado por `Math.random()`. Isso não deve ser documentado como assinatura criptográfica ou hash de integridade juridicamente verificável.

---

## 3. CRM do profissional — `/doctor/crm`

### Persistência FHIR real

A página trabalha diretamente com:

- `Task`;
- `Patient`;
- `Appointment`.

O fluxo permite:

1. listar tarefas/leads;
2. criar lead como Task;
3. alterar status;
4. atribuir lead;
5. converter lead em paciente;
6. criar Appointment após conversão.

### Automação

Há integração com o pipeline de CRM e componentes de canais.

Entretanto, alguns controles são explicitamente demonstrativos:

- envio de mensagem de teste usa `alert()`;
- campanhas são confirmadas visualmente;
- há comportamento com `setTimeout()`;
- parte das respostas automáticas é simulada.

Portanto, **CRM FHIR e automação de interface não devem ser apresentados como equivalentes a uma integração omnichannel completa**.

---

## 4. CRM administrativo — `/admin/crm`

Esta página possui uma camada mais ampla de operação.

### Recursos FHIR consultados

- `Practitioner`;
- `Task`.

### Recursos FHIR criados/atualizados

- `Task`;
- `Patient`;
- `Appointment`.

### APIs efetivamente chamadas

A página chama:

- `/api/webhooks/whatsapp`;
- `/api/crm/webhook`.

### Simuladores presentes

O próprio código contém simuladores de:

- webhook de WhatsApp;
- Comment-to-DM;
- ZernFlow/handoff.

Os nomes e mensagens usados nesses simuladores são gerados localmente. Portanto, os botões de demonstração não constituem prova de que um provedor externo esteja conectado.

---

## 5. Agenda — `/doctor/agenda`

### Persistência real

A página consulta:

- `Appointment`;
- `Patient`.

Também cria e atualiza `Appointment` no Medplum.

O agendamento contém informações de paciente, profissional, data/horário e estado do compromisso conforme o modelo FHIR usado pelo componente.

### Google Calendar

Existe um link para:

`/api/calendar/auth`

Esse endpoint inicia OAuth do Google Calendar.

A documentação deve diferenciar:

- **OAuth iniciado pelo sistema:** implementado;
- **sincronização bidirecional permanente:** não comprovada;
- **persistência de refresh token:** anteriormente identificada como pendência.

### Cancelamento

O componente também atualiza o recurso FHIR correspondente ao cancelar um compromisso.

---

## 6. Configuração profissional — `/doctor/configuracao`

### Persistência real

A página lê o perfil Practitioner e permite atualizar dados através de:

`medplum.updateResource()`

Também há upload de foto via:

`medplum.createBinary()`

e atualização do Practitioner para apontar para o recurso binário.

### CRM/canais

A página incorpora o `ChannelManager`, responsável pela configuração visual de canais como WhatsApp, Instagram, Facebook, Telegram e Web.

A existência do formulário de configuração **não significa que cada canal esteja operacional**; a operação externa depende das APIs/webhooks correspondentes.

### Certificado A1

Existe uma interface para:

- PFX/P12;
- senha/PIN;
- profissional;
- armazenamento em “KMS”.

Porém, o fluxo auditado contém `setTimeout()` e mensagem de sucesso simulada.

Portanto:

**Interface de cofre A1/KMS: presente.  
Criptografia/KMS real e assinatura server-side: não comprovadas neste componente.**

---

## 7. Configuração global — `/setup`

A tela oferece elementos de White-Label:

- nome da organização;
- logo;
- cor primária;
- fundo da tela de login;
- subdomínio;
- domínio customizado;
- CNAME/DNS;
- verificação de DNS.

Esses elementos documentam a **intenção funcional de White-Label**, mas não demonstram, isoladamente, persistência SaaS completa.

A auditoria continua tratando essa camada como:

**frontend/provisionamento preparado — backend de persistência e isolamento ainda precisa de confirmação.**

---

## 8. Regras para o manual operacional

Para evitar promessas incorretas, a documentação deve usar três classificações:

### Implementado

Usar quando o código demonstra persistência ou chamada efetiva, por exemplo:

- Patient no Medplum;
- Appointment no Medplum;
- Questionnaire publicado;
- Binary/DocumentReference;
- ClinicalImpression;
- Observation;
- CarePlan.

### Integrado/parcial

Usar quando existe o endpoint ou mecanismo de integração, mas o ciclo completo ainda depende de infraestrutura externa ou persistência adicional.

Exemplos:

- Google Calendar;
- Mayan EDMS;
- webhooks Meta/WhatsApp;
- White-Label;
- certificado A1.

### Demonstrativo/simulado

Usar quando o comportamento é local, usa `setTimeout`, `alert`, números fixos, arrays locais ou identificadores aleatórios.

Exemplos:

- métricas executivas;
- parte dos dashboards financeiros;
- simuladores de webhook;
- teste de envio;
- KMS/certificado no componente auditado;
- assinatura “ICP-Brasil” simulada.

---

## 9. Estado atual da auditoria

Ainda não é correto afirmar que os 85 arquivos tiveram auditoria semântica integral concluída.

Permanece necessário consolidar:

1. inventário definitivo de todas as variables de ambiente;
2. todas as URLs externas;
3. todas as chamadas `fetch`;
4. todos os recursos FHIR criados/lidos/atualizados/excluídos;
5. matriz final rota → componente → API → FHIR;
6. autenticação e autorização efetivas;
7. resolução dos caminhos dinâmicos de paciente que não puderam ser recuperados diretamente pela API de conteúdo na branch auditada;
8. revisão final de documentação e índice.

---

## 10. Conclusão operacional

O Delchan Health OS já contém um núcleo FHIR funcional considerável, principalmente em pacientes, prontuário, agenda, CRM, documentos, QR e formulários.

Ao mesmo tempo, várias áreas de produto apresentam **UI de produto avançada sobre infraestrutura ainda parcial ou simulada**.

A documentação oficial deve preservar essa diferença para que:

- administradores saibam o que realmente está persistido;
- desenvolvedores saibam onde completar integrações;
- usuários não interpretem demonstrações como serviços externos já contratados/conectados;
- o roadmap de produção possa ser derivado diretamente da auditoria.
