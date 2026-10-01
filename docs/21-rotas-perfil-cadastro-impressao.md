# 21 — Rotas de perfil, cadastro e impressão

## Rotas

### `/profile/[type]/[id]`

Carrega perfil de paciente ou profissional e adapta os dados ao layout de perfil. Há fallback visual quando a leitura falha.

### `/patient/[id]/print`

Gera uma visão imprimível do prontuário.

A rota consulta, conforme o fluxo:

- Patient;
- Coverage;
- AllergyIntolerance;
- Condition;
- Observation;
- DocumentReference;
- Binary;
- ClinicalImpression.

Com `docRefId`, pode carregar um snapshot documental específico. Sem ele, utiliza a evolução clínica mais recente encontrada.

`autoPrint=true` aciona a impressão.

## PrintableFicha

A ficha inclui dados do paciente, identificadores, dados clínicos disponíveis, QR e informações de impressão.

O QR utiliza o formato:

`delchan://patient/{patientId}`.

A presença de textos como LGPD, criptografia ou assinatura na interface não comprova, por si só, uma operação criptográfica ou certificação jurídica.

## MasterSignature

`MasterSignature` é um componente de captura de assinatura por mouse/toque. Ele expõe um callback para o desenho capturado.

O componente, isoladamente, não comprova persistência criptográfica, certificado ICP-Brasil ou assinatura digital qualificada.

## DigitalSignaturePad

O componente apresenta fluxo de assinatura para atestado, receita, laudo e encaminhamento.

O identificador `ICP-BR-...` é gerado localmente e os dados podem ser associados a DocumentReference. O código auditado não mostrou chamada real a uma autoridade certificadora, middleware A1/A3 ou serviço criptográfico ICP-Brasil.

**Classificação:** demonstrativo/simulado.

## PractitionerForm

Cria `Practitioner` com nome, telecom, identificador, qualificação e estado ativo. O identificador de conselho utiliza o sistema `http://conselho-regional.gov.br`.

A interface de convite não comprova, sozinha, uma API completa de provisionamento de conta/autenticação.

## StaffManager

Lista e cria profissionais e apresenta papéis/módulos. Comentários do código indicam integração futura ou pendente com autenticação, registro e `AccessPolicy`.

## Conclusão

As rotas de perfil, cadastro e impressão possuem implementação frontend/FHIR identificável. Autenticação, assinatura qualificada e autorização server-side devem ser validadas separadamente antes de tratar esses fluxos como controles de produção.
