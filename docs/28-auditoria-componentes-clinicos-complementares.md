# Componentes clínicos complementares — auditoria

## PatientWorkspace

`components/patient/PatientWorkspace.tsx` integra o prontuário em abas e consulta diretamente o Medplum.

Recursos consultados:

- `Encounter`;
- `Task`;
- `MedicationRequest`;
- `DiagnosticReport`.

Os filtros usam o paciente como referência e ordenação por data/última atualização.

A criação de atendimento usa `Encounter` com status `finished` e classe ambulatorial. O fluxo de tarefas usa `Task`, e medicamentos usam `MedicationRequest`.

**Classificação: Implementado/Integrado.**

## PatientTimeline

`PatientTimeline` consulta:

- `DocumentReference`;
- `ClinicalImpression`;
- `Communication`.

Para documentos, procura o identificador de rastreio `urn:med-sistema:doc-tracker` e pode resolver o `Binary` associado para visualização do conteúdo.

Isso cria uma linha do tempo que combina documentação clínica, evolução e comunicações do CRM.

**Classificação: Integrado FHIR.**

## ExamsTab

`ExamsTab` consulta `DiagnosticReport` e `DocumentReference` e trabalha com anexos/Binary, visualização, QR e impressão.

O componente também possui fluxo de upload com seleção de arquivo, pré-visualização, classificação entre exame de imagem/laboratorial e metadados como título, conclusão e data.

A documentação operacional deve tratar a associação FHIR e os anexos como implementados, mas validar em ambiente de implantação os limites de tamanho/tipos de arquivo e o fluxo completo de armazenamento.

**Classificação: Integrado, sujeito a validação operacional de upload.**

## PrintableFicha

`PrintableFicha` gera uma ficha de impressão contendo:

- nome da clínica;
- identificação do paciente;
- nome da mãe;
- CPF;
- CNS;
- nascimento;
- sexo;
- QR de acesso rápido;
- identificação de impressão.

A existência de texto referente a LGPD/consentimento na impressão não significa, por si só, que exista uma assinatura jurídica ou mecanismo criptográfico associado.

**Classificação: Implementado como documento de impressão.**

## ModernCalendar

O componente cria `Appointment` no Medplum para consultas presenciais ou de telemedicina.

A conexão visual com Google Calendar/Microsoft é simulada por `setTimeout`; o componente não comprova, sozinho, sincronização bidirecional real.

O texto de telemedicina também informa envio de link por WhatsApp/Google Meet/Jitsi, mas isso não é comprovado por uma chamada externa nesse componente.

**Classificação: Appointment FHIR implementado; sincronização externa demonstrativa/preparada.**

## Limite importante sobre assinaturas

O projeto contém componentes de assinatura visual e telas de certificado, porém a auditoria não encontrou prova suficiente para declarar:

- assinatura ICP-Brasil criptograficamente válida;
- uso efetivo de certificado A1/A3;
- integração com autoridade certificadora;
- carimbo do tempo;
- cadeia de validação jurídica.

Portanto, o manual deve separar claramente assinatura visual, metadados de assinatura e assinatura digital qualificada.

## Regra de operação

Para qualquer implantação clínica, a documentação deve considerar Medplum/FHIR como fonte de dados quando o componente realmente consulta ou grava recursos. Dados hard-coded, `setTimeout`, `alert()`, estado React local e identificadores gerados localmente devem ser tratados como demonstração ou camada de interface até que exista integração persistente comprovada.
