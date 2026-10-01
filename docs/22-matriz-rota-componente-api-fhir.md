# 22 — Matriz de rotas, componentes, FHIR e estado de implementação

> Auditoria documental do branch `docs/manual-completo-pt-br`, baseada no código-fonte disponível no repositório.
>
> **Legenda:** Implementado = há fluxo funcional no código; Preparado = UI/estrutura existe, mas falta persistência, integração ou enforcement; Simulado/Demo = o código explicitamente simula ou usa dados de exemplo; Não confirmado = não foi possível provar a implementação apenas pelo arquivo auditado.

## 1. Cadastro e identidade do paciente

| Área | Evidência | FHIR / integração | Estado |
|---|---|---|---|
| Cadastro de paciente | `components/DynamicIntakeForm.tsx` | Patient, Binary para foto | Implementado |
| Nome, nascimento e sexo | DynamicIntakeForm | Patient.name, birthDate, gender | Implementado |
| CPF / passaporte | DynamicIntakeForm | Patient.identifier | Implementado |
| CNS | DynamicIntakeForm | Patient.identifier com sistema Datasus | Implementado |
| Nome da mãe | DynamicIntakeForm | extensions + Patient.contact/MTH | Implementado |
| Nacionalidade | DynamicIntakeForm | extension Delchan | Implementado |
| Pronomes / identidade | DynamicIntakeForm | extensions Delchan | Implementado |
| Telefone / e-mail | DynamicIntakeForm | Patient.telecom | Implementado |
| Endereço | DynamicIntakeForm | Patient.address | Implementado |
| Foto | DynamicIntakeForm | Medplum createBinary + Patient.photo | Implementado |

### Observação de documentação

O formulário aceita CPF, CNS e dados demográficos diretamente no recurso FHIR `Patient`. O código usa extensões proprietárias Delchan para nacionalidade, nome da mãe, pronomes e identidade/orientação.

## 2. Sidebar clínico do paciente

`components/patient/PatientSidebar.tsx` consulta dinamicamente:

- Observation — sinais vitais
- Coverage — convênios
- AllergyIntolerance — alergias
- Condition — problemas clínicos

Também cria esses recursos diretamente no Medplum.

### Regras observadas

- Convênio: `Coverage.status = active`
- Alergia: `AllergyIntolerance.clinicalStatus = active`
- Problema: `Condition.clinicalStatus = active`
- Sinais vitais: busca por categoria `vital-signs`
- Visibilidade dos módulos depende de `tenantConfig.sidebarModules`

**Estado:** Implementado no frontend + persistência FHIR para os recursos mostrados.

## 3. Editor clínico

`components/clinical/ClinicalEditor.tsx` utiliza TipTap + Mantine RichTextEditor.

Modelos disponíveis:

1. SOAP
2. Anamnese Geral
3. Ficha Estética / Dermato

O editor produz JSON TipTap e HTML e envia ambos para o callback `onSave`.

Também integra impressão da tela, `FormPrintDialog` e geração de ficha física com QR.

**Estado:** Implementado como editor; a persistência clínica final depende do callback da página consumidora.

## 4. Ficha física com QR

`components/FormPrintDialog.tsx`:

1. consulta até 50 pacientes no Medplum;
2. permite selecionar paciente;
3. permite ficha avulsa/órfã;
4. envia POST para `/api/forms/generate`;
5. recebe `X-Tracking-Code`;
6. recebe PDF;
7. abre janela/iframe para impressão.

O formulário avulso pode ser associado posteriormente durante o escaneamento.

**Estado:** Implementado no frontend e integrado à API de geração.

## 5. Prontuário para impressão

`components/Print/ProntuarioPrintView.tsx` monta uma impressão A4 com:

- identificação da clínica;
- paciente;
- nome da mãe;
- CPF;
- CNS;
- data de nascimento;
- sexo;
- convênios;
- alergias;
- condições;
- sinais vitais;
- evolução clínica;
- QR Code;
- código de barras;
- responsável pela impressão.

A visão aceita também um snapshot histórico via `historicalHtml` e `historicalDate`.

**Estado:** Implementado como renderização/impressão.

> A presença de textos como “Criptografia LGPD” ou “Assinatura Digital” na apresentação não deve ser interpretada como prova de uma implementação criptográfica independente nesse componente.

## 6. Assinatura desenhada em tela

`components/shared/MasterSignature.tsx` implementa um canvas para desenhar assinatura com mouse/touch, limpar, confirmar ou cancelar.

Porém, o componente recebe `onSign()` como callback e **não grava a imagem da assinatura nem cria um recurso FHIR por conta própria**.

**Estado:** Interface de captura implementada; persistência/validade jurídica dependem do fluxo consumidor.

## 7. Assinatura ICP-Brasil / e-CPF

`components/DigitalSignaturePad.tsx` apresenta UI para atestado, receita, laudo e encaminhamento.

Entretanto, o código gera um identificador aleatório de demonstração no formato `ICP-BR-...` e grava esse valor no DocumentReference. Não há chamada demonstrada a autoridade certificadora, middleware de assinatura, certificado A1/A3, API da ICP-Brasil ou operação criptográfica real nesse componente.

**Estado:** Simulado/Demo. Não documentar como assinatura ICP-Brasil efetivamente validada até existir integração criptográfica real e teste operacional.

## 8. Anamnese modular estética

`components/ModularAnamnesis.tsx` contém avaliação de biotipo, fototipo, gestação/amamentação, queloide, autoimunidade, diabetes/cicatrização, alergia a níquel, uso de Roacutan e TCLE.

O salvamento cria `QuestionnaireResponse` com `status = completed`.

### Limitação importante

O botão “Escanear Ficha Física (OCR)” atualmente usa `setTimeout` e preenche respostas de exemplo. Não foi encontrada integração OCR real nesse componente.

**Estado:** Formulário FHIR implementado; OCR demonstrado/simulado.

## 9. Formulário clínico dinâmico

`components/modules/DynamicClinicalForm.tsx` lê FHIR Questionnaire e renderiza string, text, boolean, choice, decimal e date.

O componente dispara `onRequestSignature`, mas não cria diretamente o QuestionnaireResponse.

**Estado:** Renderização dinâmica implementada; persistência/assinatura dependem do fluxo consumidor.

## 10. Exames

`components/patient/ExamsTab.tsx` trabalha com DiagnosticReport, DocumentReference e Attachment, além de visualização, QR Code e impressão de laudo.

**Estado:** Integração FHIR no frontend implementada; a auditoria completa do upload e de cada subfluxo de anexo deve continuar nas páginas/APIs consumidoras.

## 11. Equipe e controle de acesso

`components/admin/StaffManager.tsx` lista e cria Practitioner e apresenta papéis/módulos.

O próprio código comenta que a conexão com `auth/register` e AccessPolicy ainda seria feita.

Portanto:

- criação de Practitioner: implementada;
- convite de autenticação: não confirmado;
- AccessPolicy por módulo: não confirmado;
- enforcement real de RBAC: não confirmado nesse componente.

**Estado:** Preparado/parcial.

## 12. CRM omnichannel

`components/crm/ChannelManager.tsx` configura WhatsApp, Instagram, Facebook, Telegram e Web, com configuração por clínica/profissional e opções de resposta automática, Antigravity e ZernFlow.

A configuração do profissional é relacionada ao recurso Practitioner.

**Estado:** Configuração de UI + persistência FHIR do Practitioner já identificada no módulo CRM.

> Tokens, IDs de Meta/WhatsApp e credenciais reais devem ser fornecidos exclusivamente por variáveis seguras; valores de exemplo do código não são credenciais de produção.

## 13. Perfil

`components/profile/ProfileLayout.tsx` é majoritariamente uma camada visual. Há conteúdo demonstrativo embutido no componente, incluindo nomes, métricas, avaliações, convênios, agendamentos e procedimentos.

Esses números e listas não devem ser documentados como dados reais do sistema sem uma camada de consulta FHIR/serviço correspondente.

**Estado:** UI demonstrativa / parcialmente conectada.

## 14. Modelo de maturidade

### A — Operacional
Existe código de ponta a ponta verificável e integração funcional.

### B — Funcional no frontend
A interface e parte da lógica existem, mas a persistência, autenticação ou integração externa depende de outro fluxo.

### C — Preparado
Há estrutura visual, configuração ou intenção arquitetural, mas a implementação backend/serviço ainda não está demonstrada.

### D — Demo/Simulado
O próprio código contém mocks, fallback ou simulação explícita.

## 15. Pontos que devem permanecer como “não confirmado” no manual

1. Assinatura ICP-Brasil real.
2. OCR real no módulo de anamnese estética.
3. Convite/autenticação de novos colaboradores.
4. AccessPolicy/RBAC efetivamente aplicado no backend.
5. Persistência server-side completa do White-Label.
6. Upload final garantido no Mayan EDMS.
7. Sincronização automática duradoura do Google Calendar, pois o callback ainda possui TODO de persistência do refresh token.
8. Arquitetura VoIP/SIP, pois não foi encontrada implementação SIP/telefonia no código auditado.
9. Criptografia específica prometida por textos da UI sem implementação técnica correspondente.
10. Qualquer dado estatístico hard-coded exibido por componentes de perfil.

## 16. Próxima etapa da auditoria

Ainda falta concluir a leitura semântica dos demais arquivos do inventário de 85 unidades e consolidar todas as rotas, componentes, APIs, variáveis de ambiente, integrações externas, recursos FHIR, permissões, fluxos de impressão/scan e diferenças entre demo e produção.

Este documento é uma atualização da auditoria, não uma declaração de que os 85 arquivos já foram semanticamente auditados 100%.
