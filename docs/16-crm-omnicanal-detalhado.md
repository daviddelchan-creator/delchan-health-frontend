# CRM Omnicanal — documentação funcional e técnica

## Visão geral

O CRM possui dois motores locais no código:

- **Antigravity Agent:** análise de intenção e construção de recursos FHIR;
- **ZernFlow Engine:** execução de nós condicionais e encaminhamento.

## Canais reconhecidos

O tipo de canal aceita:

- WhatsApp;
- Instagram;
- Facebook;
- Telegram;
- Web.

O webhook principal interpreta explicitamente Instagram Comments, Instagram DM/Messenger, WhatsApp e payload direto.

## Antigravity Agent

### Entrada

Mensagem textual + contexto do canal, tenant, usuário e telefone.

### Classificação

Tipos de intenção:

- `appointment_booking`;
- `pricing_inquiry`;
- `clinical_question`;
- `emergency_urgent`;
- `general_faq`.

A implementação atual utiliza heurística local por palavras-chave. Apesar do comentário mencionar Gemini, não existe chamada efetiva à API Gemini neste arquivo.

### Detecção de urgência

Palavras-chave incluem exemplos como sangramento, hemorragia, dor insuportável, falta de ar, febre alta e desmaio.

Isso é uma regra de automação e **não substitui triagem clínica profissional**.

### Dados extraídos

- nome;
- telefone;
- procedimento/assunto;
- urgência;
- sentimento;
- resposta sugerida;
- score de confiança.

## Recursos FHIR gerados

### Patient

Pré-cadastro do lead, com nome, telefone e tags:

- tenant;
- canal de origem.

### Task

Representa oportunidade/lead no Kanban.

Inclui:

- status;
- prioridade;
- descrição;
- canal;
- estágio de CRM;
- telefone como identifier;
- tenant.

### Communication

Registra a mensagem recebida e a intenção identificada.

## ZernFlow

Pipeline atual:

1. trigger omnicanal;
2. pedido explícito por humano;
3. triagem de urgência;
4. qualificação por nome + telefone;
5. envio de link de pré-anamnese;
6. resposta automática.

### Handoff humano

Palavras-chave como “atendente”, “humano”, “recepção” e “secretária” levam a transferência.

A Task pode ser atualizada para:

- status `in-progress`;
- prioridade urgente quando aplicável;
- businessStatus `transferido_humano`.

## Link de pré-anamnese

Formato:

`/patient/{patientId}/anamnese?token={token}`

O token contém:

- patientId;
- tenantId;
- expiração.

É assinado com HMAC-SHA256.

Expiração padrão: **72 horas**.

## Configuração de canais

`lib/crm/channels-config.ts` define canais de clínica e de profissional.

Uma conta pode ter:

- tipo;
- proprietário;
- telefone;
- Instagram;
- Meta Phone Number ID;
- token;
- token de webhook;
- auto reply;
- ZernFlow;
- status.

Para profissionais, a configuração é persistida em uma extensão do recurso **Practitioner**:

`https://delchan.com/fhir/channels-config`

O telefone principal do Practitioner também pode ser atualizado a partir do WhatsApp configurado.

## Atenção à segurança

Os arquivos contêm valores de exemplo/fallback para tokens e telefones. Esses valores devem ser tratados como configuração demonstrativa e substituídos por secrets reais em produção.

Tokens de Meta, Telegram, WhatsApp e outros provedores nunca devem ser versionados.

## Fluxo completo

`Canal → Webhook → Antigravity → Patient/Task/Communication → ZernFlow → resposta ou handoff → pré-anamnese → Consent/Condition/AllergyIntolerance`
