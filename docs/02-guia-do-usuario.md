# 2. Guia do usuário

## Acesso e navegação
O layout principal diferencia áreas de médico e administrador.

### Área do profissional
Rotas principais:
- `/doctor` — início/dashboard.
- `/doctor/pacientes` — lista de pacientes.
- `/doctor/pacientes/novo` — novo registro.
- `/doctor/agenda` — agenda.
- `/doctor/crm` — CRM.
- `/doctor/configuracao` — configuração do profissional.

### Área administrativa
A navegação inclui Dashboard, Clínicas/Tenants, Módulos SaaS, White-Label, CRM & Leads, dados da clínica, segurança/acesso, layout do prontuário, construtor de módulos e modelos de evolução.

### Paciente
O workspace reúne dados clínicos, timeline, exames, anamnese, sinais vitais, evolução e impressão, conforme os componentes existentes.

## Criar paciente
1. Acesse **Pacientes**.
2. Escolha **Novo Registro**.
3. Preencha os dados solicitados.
4. Salve o recurso.
5. Abra o workspace do paciente para continuar o atendimento.

## Agenda
Use **Agenda** para consultar e operar compromissos disponíveis na implementação. A integração com Google Calendar é descrita na seção de integrações.

## CRM
O CRM recebe leads/canais, registra o histórico e pode executar automações. Quando a regra detectar solicitação de atendimento humano ou uma situação marcada como urgente, o fluxo prevê transferência para a equipe.

## Documentos
Formulários podem gerar PDFs com código de rastreamento e QR Code. O código segue o formato `FORM-{TENANT}-{TIMESTAMP}-{UUID6}`.

## Impressão
O sistema possui visualizações de impressão para prontuário e formulários. Antes de imprimir, confirme paciente, profissional e conteúdo.

## Observação
Os nomes de telas acima refletem as rotas presentes no código; labels podem mudar sem alterar a URL.
