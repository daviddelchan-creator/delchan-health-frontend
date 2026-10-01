# Prontuário clínico — componentes e recursos FHIR

## PatientWorkspace

O workspace principal do paciente consulta diretamente o Medplum e organiza:

- Linha do Tempo;
- Consultas;
- Tarefas;
- Prescrições;
- Exames/Labs;
- Plano de Cuidado.

### Recursos consultados

- `Encounter`;
- `Task`;
- `MedicationRequest`;
- `DiagnosticReport`.

Todos são filtrados por referência ao paciente.

### Criação de atendimento

O usuário pode registrar um `Encounter` com:

- status `finished`;
- classe ambulatorial;
- paciente;
- data;
- motivo;
- tipo do atendimento.

### Criação de tarefa

Cria `Task` com:

- status `requested`;
- intent `order`;
- descrição;
- paciente;
- data de execução opcional.

### Prescrição

Cria `MedicationRequest` com:

- status `active`;
- intent `order`;
- paciente;
- medicamento textual;
- posologia/instruções.

**Importante:** a implementação usa `medicationCodeableConcept.text`, não uma codificação farmacológica estruturada obrigatória.

## PatientTimeline

A linha do tempo pesquisa:

- `DocumentReference`;
- `ClinicalImpression`;
- `Communication`.

DocumentReference pode apontar para um Binary e o componente tenta carregar seu conteúdo para visualização.

A linha do tempo também reconhece tracking code no identificador:

`urn:med-sistema:doc-tracker`

## SOAP

`components/SoapNoteForm.tsx` registra evolução clínica como:

**DiagnosticReport/status=final**

O conteúdo SOAP é armazenado em `conclusion`, com:

- S — Subjetivo;
- O — Objetivo;
- A — Avaliação;
- P — Plano.

O profissional autenticado é usado como performer quando disponível.

### Observação importante

O botão da UI diz “Assinar e Salvar”, mas o código deste componente grava o DiagnosticReport e não demonstra, sozinho, uma assinatura digital criptográfica. A assinatura real deve ser documentada a partir do componente/fluxo de assinatura específico.

## Sinais vitais

`components/Vitals/VitalsModal.tsx` cria recursos **Observation**.

Campos implementados:

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

As observações usam categoria `vital-signs`, referência ao paciente e timestamp.

Também recebem a tag:

`https://delchan.com/fhir/tenant`

com o tenant ativo.

## PatientHeader

Apresenta:

- nome;
- idade;
- identificadores;
- CPF;
- CNS;
- telefone;
- e-mail;
- endereço;
- sexo;
- nacionalidade;
- nome da mãe.

Possui:

- modal de detalhes;
- edição via `DynamicIntakeForm`;
- impressão da ficha.

## Relação técnica

`PatientWorkspace → Medplum → Encounter/Task/MedicationRequest/DiagnosticReport`

`VitalsModal → Medplum → Observation`

`SoapNoteForm → Medplum → DiagnosticReport`

`PatientTimeline → Medplum → DocumentReference/ClinicalImpression/Communication/Binary`

`PatientHeader → DynamicIntakeForm + PrintableFicha`
