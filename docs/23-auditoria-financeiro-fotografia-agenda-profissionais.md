# 23 — Auditoria adicional: financeiro, fotografia, profissionais, planos e agenda

## Pagamentos / PDV

`components/PaymentPOS.tsx` apresenta uma interface de PDV com Pix, crédito, débito e dinheiro e lista gateways como Asaas, Cielo e Stone.

### Estado real observado

O processamento é simulado:

- cria um ID `DH-PIX-...`;
- monta um payload Pix artificial;
- aguarda `setTimeout`;
- cria um `PaymentNotice` no Medplum;
- não foi encontrada chamada HTTP para Asaas, Cielo ou Stone;
- o payload “Pix copia e cola” não deve ser tratado como cobrança bancária real.

**Classificação:** Demo/Simulado.

O manual deve descrever este módulo como **interface/protótipo de registro financeiro**, até existir integração com um adquirente/gateway real.

## Registro fotográfico

`components/PhotographicModule.tsx` permite:

- selecionar foto pré-procedimento;
- selecionar foto pós-procedimento;
- visualizar ambas;
- aplicar grade visual de simetria;
- salvar Binary no Medplum;
- criar recursos `Media` vinculados ao Patient.

O código usa `medplum.createBinary()` e cria `Media.status = completed`.

**Classificação:** Implementado no armazenamento FHIR/Medplum.

> A grade de simetria é uma sobreposição visual; não há algoritmo de visão computacional/análise biométrica real demonstrado nesse componente.

## Cadastro de profissional

`components/PractitionerForm.tsx` cria:

- Practitioner.name;
- Practitioner.telecom;
- Practitioner.identifier;
- Practitioner.qualification;
- Practitioner.active.

O identificador profissional usa um sistema genérico `http://conselho-regional.gov.br`.

A mensagem de “convite” é apresentada ao usuário, mas não há nesse componente uma chamada a serviço de autenticação para efetivamente enviar convite.

**Classificação:** Cadastro FHIR implementado; convite de acesso não confirmado.

## Plano de tratamento

`components/CarePlanList.tsx` implementa CRUD de CarePlan:

- pesquisa por paciente;
- cria plano;
- atualiza status;
- exclui plano;
- registra título;
- descrição;
- categoria;
- meta;
- atividade/protocolo;
- número de sessões.

Recursos principais:

- `CarePlan.status`
- `CarePlan.intent = plan`
- `CarePlan.subject`
- `CarePlan.category`
- `CarePlan.goal`
- `CarePlan.activity`

**Classificação:** Implementado via Medplum.

## Agenda

`components/AppointmentCalendar.tsx` pesquisa `Appointment` no Medplum e apresenta os agendamentos.

### Google Calendar

A UI deste componente usa `setTimeout` e mensagem de sucesso simulada. Portanto, esta camada não prova sincronização real.

A sincronização real deve ser documentada exclusivamente com base nas rotas `/api/calendar/auth` e `/api/calendar/callback`, já auditadas separadamente.

### Microsoft Teams / salas

O botão de vinculação de sala também usa `setTimeout` e não demonstra integração real com Microsoft Teams ou hardware de sala.

**Classificação:** Consulta FHIR de Appointment implementada; integrações externas desta UI são simuladas/preparatórias.

## Consequência para o manual

As funcionalidades abaixo precisam de etiqueta explícita de protótipo/preparação quando apresentadas ao usuário:

- PDV/gateway;
- Pix dinâmico;
- assinatura ICP-Brasil;
- OCR;
- convite automático;
- AccessPolicy/RBAC;
- sincronização de salas/Teams;
- qualquer “visão computacional” que seja apenas overlay visual.

Já podem ser descritas como fluxos funcionais de código:

- Patient;
- Practitioner;
- Coverage;
- AllergyIntolerance;
- Condition;
- Observation;
- CarePlan;
- Media;
- DocumentReference/Binary;
- QuestionnaireResponse;
- geração e rastreamento de ficha física.
