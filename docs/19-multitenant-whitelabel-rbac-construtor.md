# 19 — Multi-tenant, White-Label, RBAC e Construtor

## Escopo

Este documento descreve o que o código auditado comprova sobre isolamento por tenant, personalização visual, módulos, permissões e construção de formulários.

## Multi-tenant

O `TenantContext` mantém configuração ativa da clínica, incluindo nome, CNPJ, cidade, cor, plano, status e quantidade de profissionais. Também há configuração de módulos como agenda, prontuário, faturamento e CRM.

O estado local utiliza chaves como `delchan_tenant_config` e `delchan_tenants_list`.

Existe também um contexto menor em `core/hooks/TenantContext.tsx`, com estado de módulos e dados demonstrativos.

**Classificação:** parcialmente implementado. O frontend demonstra a seleção/configuração de tenant, mas o código auditado não comprova isolamento server-side completo para todos os recursos FHIR.

## White-Label

A rota `/setup` expõe configuração de:

- nome da organização;
- logo PNG/SVG;
- imagem de fundo do login;
- cor primária;
- subdomínio;
- domínio customizado/CNAME;
- verificação de DNS.

**Limitação:** não foi comprovada, nessa implementação, a persistência backend completa de toda a configuração nem o provisionamento SaaS automático de domínio.

## RBAC

A interface de equipe trabalha com `Practitioner`, especialidade, registro, módulos e papéis. Há referências a autorização e `AccessPolicy`, mas não foi comprovada uma camada server-side completa de RBAC aplicada a todas as APIs.

**Conclusão:** RBAC está preparado/demonstrado no frontend; autorização de produção deve ser validada no backend.

## Construtor de formulários

`/admin/construtor` permite criar Questionnaires FHIR com campos como:

- `linkId`;
- texto;
- tipo;
- obrigatório;
- tipos string, text, integer, date e boolean.

A publicação utiliza `medplum.createResource()` para criar um `Questionnaire` ativo.

Não foi comprovado um sistema completo de:

- versionamento;
- aprovação;
- workflow editorial;
- permissões granulares;
- drag-and-drop de ordenação;
- histórico de versões.

## Recomendações operacionais

Para produção, validar isolamento por tenant em cada API, autorização por papel no backend, persistência centralizada da configuração White-Label e política de domínio customizado.
