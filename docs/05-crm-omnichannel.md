# 5. CRM e automação omnichannel

## Modelo
O CRM usa recursos FHIR para representar lead/paciente, tarefa/oportunidade e comunicação.

### Patient
O lead pode ser pré-registrado como recurso FHIR Patient, com telefone e tags de tenant/canal.

### Task
Oportunidades/leads são representados por Task, com prioridade, estágio e identificador baseado no telefone.

### Communication
O histórico de comunicação é registrado como Communication.

## Antigravity Agent
O módulo `lib/crm/antigravity-agent.ts` transforma uma mensagem recebida em uma intenção estruturada, incluindo nome, telefone, procedimento/assunto, urgência, sentimento e resposta sugerida.

## ZernFlow
`lib/crm/zernflow-engine.ts` implementa um pipeline:
1. trigger omnichannel;
2. detecção de pedido de humano;
3. detecção de urgência;
4. qualificação do lead;
5. envio de link de intake quando aplicável;
6. resposta automática.

## Handoff humano
Palavras-chave relacionadas a atendente/humano podem causar transferência para a recepção. Situações classificadas como emergência também seguem para atendimento humano prioritário.

## Segurança clínica
A automação deve ser tratada como roteamento/assistência e não como substituição do julgamento clínico. Regras de triagem precisam de revisão e testes antes de produção.
