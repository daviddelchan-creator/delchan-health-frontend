# 20 — Prontuário, componentes clínicos e FHIR

## Workspace do paciente

O `PatientWorkspace` consulta diretamente o Medplum e organiza:

- timeline;
- consultas;
- tarefas;
- prescrições;
- exames/laboratórios;
- plano de cuidado.

Recursos observados incluem `Encounter`, `Task`, `MedicationRequest` e `DiagnosticReport`.

## Timeline

`PatientTimeline` consulta `DocumentReference`, `ClinicalImpression` e `Communication`, podendo acompanhar `Binary` associado.

Documentos rastreados usam o identificador:

`urn:med-sistema:doc-tracker`.

## SOAP

`SoapNoteForm` grava uma evolução como `DiagnosticReport` em status final. O conteúdo SOAP é armazenado na conclusão com as seções subjetiva, objetiva, avaliação e plano.

O botão **Assinar e Salvar** não deve ser interpretado, sozinho, como prova de assinatura criptográfica ICP-Brasil.

## Sinais vitais

O módulo utiliza `Observation` na categoria `vital-signs`.

Códigos LOINC observados:

| Medição | LOINC |
|---|---|
| Pressão sistólica | 8480-6 |
| Pressão diastólica | 8462-4 |
| Frequência cardíaca | 8867-4 |
| Frequência respiratória | 9279-1 |
| Temperatura | 8310-5 |
| Saturação O2 | 2708-6 |
| Peso | 29463-7 |
| Altura | 8302-2 |

## Cadastro do paciente

`DynamicIntakeForm` trabalha com dados demográficos, identificadores, contatos, endereço, foto, nacionalidade e extensões FHIR.

`PatientHeader` apresenta informações como CPF, CNS, telefone, e-mail, sexo, nacionalidade e nome da mãe.

## Outros componentes

- `PatientSidebar`: Observation, Coverage, AllergyIntolerance e Condition.
- `CarePlanList`: CRUD de CarePlan.
- `ExamsTab`: DiagnosticReport, DocumentReference, Binary e visualização.
- `ClinicalEditor`: TipTap, SOAP e formulários clínicos.
- `ModularAnamnesis`: QuestionnaireResponse.
- `DynamicClinicalForm`: renderização de Questionnaire.

## Recursos FHIR identificados

Patient, Practitioner, Organization, Task, Appointment, Questionnaire, QuestionnaireResponse, CarePlan, Observation, Communication, DocumentReference, Binary, Encounter, MedicationRequest, DiagnosticReport, Coverage, AllergyIntolerance, Condition, ClinicalImpression, Consent, Media e PaymentNotice.

## Cuidados de interpretação

A existência de um recurso FHIR no frontend comprova o fluxo de integração usado pelo código, mas não substitui validação de permissões, auditoria, retenção, backup e governança no ambiente Medplum de produção.
