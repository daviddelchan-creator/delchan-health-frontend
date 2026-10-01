# Rotas de perfil, cadastro e impressão do prontuário

## Cadastro de paciente

### /doctor/pacientes/novo

Usa `DynamicIntakeForm` com cliente Medplum.

Após sucesso, retorna para:

`/doctor/pacientes`

O objetivo funcional é cadastrar o paciente diretamente no modelo FHIR.

## Impressão

### /patient/[id]/print

A página de impressão consulta:

- Patient;
- Coverage;
- AllergyIntolerance;
- Condition;
- Observation;
- DocumentReference;
- Binary;
- ClinicalImpression.

### Dados apresentados

A impressão pode incluir:

- identificação do paciente;
- convênios;
- alergias;
- problemas/condições;
- sinais vitais;
- evolução histórica;
- documento/snapshot;
- tenant;
- responsável pela impressão.

### Snapshot histórico

Quando recebe:

`?docRefId={id}`

a página carrega o DocumentReference indicado e tenta recuperar o Binary associado.

Sem `docRefId`, procura a última ClinicalImpression disponível.

### Impressão automática

Com:

`?autoPrint=true`

a página executa `window.print()` depois do carregamento.

## Perfil

### /profile/[type]/[id]

Aceita:

- `practitioner`;
- `patient`.

Para practitioner, lê:

`Practitioner/{id}`

Para patient, lê:

`Patient/{id}`

A resposta é transformada em dados de apresentação para `ProfileLayout`.

## Observação sobre rotas

O roteamento usa App Router do Next.js e segmentos dinâmicos.

A documentação não deve assumir que toda URL visual possui API própria: grande parte do sistema consulta o Medplum diretamente no cliente através dos hooks.

## Fluxo resumido

`/doctor/pacientes/novo → DynamicIntakeForm → Medplum → Patient`

`/patient/{id}/print → Patient + recursos clínicos + documentos → ProntuarioPrintView → window.print()`

`/profile/{type}/{id} → Practitioner/Patient → ProfileLayout`
