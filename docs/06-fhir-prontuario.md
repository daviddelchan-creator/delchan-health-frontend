# 6. FHIR, prontuário e documentos

## Medplum/FHIR
A aplicação usa Medplum e tipos FHIR. A persistência de entidades clínicas deve ser compreendida como recursos FHIR, e não apenas como estado local de React.

## Componentes clínicos
Foram identificados componentes para:
- SOAP;
- anamnese modular;
- sinais vitais;
- planos de cuidado;
- exames;
- timeline do paciente;
- assinatura digital;
- impressão do prontuário;
- formulários clínicos dinâmicos.

## SOAP
O formulário e o PDF estruturam:
- S — Subjetivo;
- O — Objetivo;
- A — Avaliação;
- P — Plano/Conduta.

## Assinatura
Existem componentes de assinatura digital e uma interface administrativa para certificados A1/P12/PFX. A documentação de produção deve distinguir assinatura desenhada, assinatura digital e assinatura baseada em certificado ICP-Brasil.

## Dados sensíveis
Dados clínicos, documentos, certificados e credenciais devem permanecer fora de commits, logs públicos e documentação.
