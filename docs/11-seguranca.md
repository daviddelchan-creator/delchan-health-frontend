# 11. Segurança e governança

## Princípios
- mínimo privilégio;
- separação de tenants;
- segredo fora do Git;
- autenticação no servidor;
- auditoria;
- proteção de webhooks;
- proteção de dados clínicos;
- backups e recuperação.

## LGPD
O sistema lida potencialmente com dados pessoais e dados de saúde. A implantação precisa definir:
- controlador/operador;
- finalidade;
- base legal;
- retenção;
- eliminação;
- controle de acesso;
- auditoria;
- resposta a incidentes;
- contratos com provedores.

## Certificados
Certificados A1 e senhas devem ser tratados como credenciais de alto impacto. O upload exibido pela UI não substitui uma implementação segura de KMS/secret vault.

## Multi-tenant
Tags FHIR com identificador de tenant aparecem nos fluxos de CRM. É necessário testar isolamento de leitura/escrita em cada endpoint e não depender somente da UI para segurança.
