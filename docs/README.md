# Documentação Delchan Health OS

Manual técnico e funcional do **Delchan Health OS**, organizado em formato de portal e escrito em português do Brasil.

A documentação é derivada do código-fonte auditado do repositório. Quando uma capacidade aparece apenas na interface, depende de infraestrutura externa ou não foi comprovada pela implementação disponível, isso é indicado explicitamente.

## Como usar esta documentação

- **Começando agora:** leia a visão geral e o guia do usuário.
- **Administradores:** siga administração, configuração, multi-tenant/White-Label e checklist de Go-Live.
- **Equipe clínica:** consulte prontuário/FHIR, componentes clínicos, CRM, agenda e documentos.
- **Desenvolvedores:** comece pela arquitetura, ambiente/secrets, APIs, matriz rota/componente/API/FHIR e referências técnicas.
- **Integrações:** consulte a seção de integrações; Google Calendar, WhatsApp/Meta, scanner, Mayan e assinatura digital têm níveis diferentes de implementação.
- **VoIP/SIP:** consulte o documento específico; não foi identificada uma arquitetura SIP/VoIP concreta no código auditado.

## Legenda de cobertura

| Status | Significado |
|---|---|
| **Implementado** | Há código funcional identificável no repositório para a capacidade descrita. |
| **Parcial / externo** | Há integração, preparação ou fluxo dependente de serviço/infraestrutura externa que precisa de configuração ou validação operacional. |
| **Demonstrativo / simulado** | A UI ou fluxo existe, mas o código auditado não comprova uma integração real ou persistência de produção. |
| **Não identificado** | A capacidade não foi localizada de forma comprovável no código auditado. |

> **Importante:** esta documentação busca cobertura técnica rastreável, não declara que todas as funcionalidades estão prontas para produção. O checklist de Go-Live separa o que precisa ser validado no ambiente real.

---

# 1. Começar aqui

- [01 — Visão geral](01-visao-geral.md)
- [02 — Guia do usuário](02-guia-do-usuario.md)
- [03 — Administração](03-administracao.md)
- [09 — Implantação e operação](09-implantacao-operacao.md)
- [31 — Checklist de Go-Live](31-checklist-go-live.md)

# 2. Administração, configuração e SaaS

- [03 — Administração e White-Label](03-administracao.md)
- [18 — Configuração de ambiente, dependências e secrets](18-configuracao-ambiente-e-secrets.md)
- [19 — Multi-tenant, White-Label, RBAC e Construtor](19-multitenant-whitelabel-rbac-construtor.md)
- [24 — Auditoria de administração, infraestrutura e multi-tenant](24-auditoria-admin-infraestrutura-multitenant.md)
- [26 — Dependências, ambiente, integrações e superfície de segurança](26-dependencias-ambiente-integracoes-superficie-seguranca.md)
- [31 — Checklist de Go-Live](31-checklist-go-live.md)

# 3. Operação clínica e prontuário

- [06 — FHIR, prontuário e documentos](06-fhir-prontuario.md)
- [20 — Prontuário: componentes e recursos FHIR](20-prontuario-componentes-fhir.md)
- [21 — Rotas de perfil, cadastro e impressão](21-rotas-perfil-cadastro-impressao.md)
- [28 — Auditoria de componentes clínicos complementares](28-auditoria-componentes-clinicos-complementares.md)
- [23 — Auditoria de financeiro, fotografia, agenda e profissionais](23-auditoria-financeiro-fotografia-agenda-profissionais.md)
- [25 — Auditoria de rotas clínicas, CRM, agenda e configuração](25-auditoria-rotas-clinicas-crm-agenda-configuracao.md)

# 4. CRM e atendimento omnichannel

- [05 — CRM e automação omnichannel](05-crm-omnichannel.md)
- [16 — CRM omnichannel: detalhe funcional e técnico](16-crm-omnicanal-detalhado.md)
- [29 — Auditoria do portal do paciente, webhooks e Mayan](29-auditoria-portal-paciente-webhooks-e-mayan.md)

# 5. Documentos, formulários, QR e scanner

- [07 — QR, scanner e ingestão documental](07-qr-scanner.md)
- [17 — Documentos, QR, scanner e Mayan EDMS](17-documentos-qr-scanner-mayan.md)
- [22 — Matriz rota, componente, API e FHIR](22-matriz-rota-componente-api-fhir.md)

# 6. Integrações externas

- [08 — Integrações](08-integracoes.md)
- [10 — VoIP/SIP](10-voip-sip.md)
- [15 — Referência completa de APIs e fluxos](15-referencia-apis-e-fluxos.md)
- [27 — Auditoria final de rotas, administração e integrações](27-auditoria-final-rotas-administracao-integracoes.md)
- [29 — Auditoria do portal do paciente, webhooks e Mayan](29-auditoria-portal-paciente-webhooks-e-mayan.md)

# 7. Arquitetura e referência para desenvolvimento

- [04 — Arquitetura técnica](04-arquitetura-tecnica.md)
- [12 — Referência de rotas e componentes](12-referencia.md)
- [15 — Referência completa de APIs e fluxos](15-referencia-apis-e-fluxos.md)
- [22 — Matriz rota, componente, API e FHIR](22-matriz-rota-componente-api-fhir.md)
- [26 — Dependências, ambiente, integrações e superfície de segurança](26-dependencias-ambiente-integracoes-superficie-seguranca.md)

# 8. Segurança, governança e auditoria

- [11 — Segurança e governança](11-seguranca.md)
- [13 — Matriz de cobertura](13-matriz-cobertura.md)
- [14 — Inventário dos 85 arquivos e cobertura](14-inventario-100-arquivos.md)
- [30 — Matriz final de cobertura técnica](30-matriz-final-de-cobertura.md)

# 9. Auditorias detalhadas

- [23 — Auditoria de financeiro, fotografia, agenda e profissionais](23-auditoria-financeiro-fotografia-agenda-profissionais.md)
- [24 — Auditoria de administração, infraestrutura e multi-tenant](24-auditoria-admin-infraestrutura-multitenant.md)
- [25 — Auditoria de rotas clínicas, CRM, agenda e configuração](25-auditoria-rotas-clinicas-crm-agenda-configuracao.md)
- [26 — Dependências, ambiente, integrações e superfície de segurança](26-dependencias-ambiente-integracoes-superficie-seguranca.md)
- [27 — Auditoria final de rotas, administração e integrações](27-auditoria-final-rotas-administracao-integracoes.md)
- [28 — Auditoria de componentes clínicos complementares](28-auditoria-componentes-clinicos-complementares.md)
- [29 — Auditoria do portal do paciente, webhooks e Mayan](29-auditoria-portal-paciente-webhooks-e-mayan.md)
- [30 — Matriz final de cobertura técnica](30-matriz-final-de-cobertura.md)
- [31 — Checklist de Go-Live](31-checklist-go-live.md)

---

## Índice completo 01–31

| # | Documento | Foco |
|---:|---|---|
| 01 | [Visão geral](01-visao-geral.md) | Produto, módulos e escopo |
| 02 | [Guia do usuário](02-guia-do-usuario.md) | Operação diária |
| 03 | [Administração](03-administracao.md) | Administração, White-Label e gestão |
| 04 | [Arquitetura técnica](04-arquitetura-tecnica.md) | Stack e arquitetura |
| 05 | [CRM omnichannel](05-crm-omnichannel.md) | Leads, automação e canais |
| 06 | [FHIR/prontuário](06-fhir-prontuario.md) | Modelo clínico e FHIR |
| 07 | [QR/scanner](07-qr-scanner.md) | Documentos e ingestão |
| 08 | [Integrações](08-integracoes.md) | Serviços externos |
| 09 | [Implantação/operação](09-implantacao-operacao.md) | Deploy e operação |
| 10 | [VoIP/SIP](10-voip-sip.md) | Situação da integração VoIP |
| 11 | [Segurança/governança](11-seguranca.md) | Segurança e LGPD |
| 12 | [Referência](12-referencia.md) | Rotas e componentes |
| 13 | [Matriz de cobertura](13-matriz-cobertura.md) | Cobertura inicial |
| 14 | [Inventário de arquivos](14-inventario-100-arquivos.md) | Inventário e método de auditoria |
| 15 | [APIs e fluxos](15-referencia-apis-e-fluxos.md) | Endpoints e fluxos |
| 16 | [CRM detalhado](16-crm-omnicanal-detalhado.md) | CRM técnico |
| 17 | [Documentos/QR/Mayan](17-documentos-qr-scanner-mayan.md) | Fluxos documentais |
| 18 | [Ambiente e secrets](18-configuracao-ambiente-e-secrets.md) | Configuração técnica |
| 19 | [Multi-tenant/White-Label/RBAC](19-multitenant-whitelabel-rbac-construtor.md) | SaaS e permissões |
| 20 | [Prontuário/componentes FHIR](20-prontuario-componentes-fhir.md) | Componentes clínicos |
| 21 | [Perfil/cadastro/impressão](21-rotas-perfil-cadastro-impressao.md) | Rotas auxiliares |
| 22 | [Matriz rota/componente/API/FHIR](22-matriz-rota-componente-api-fhir.md) | Rastreabilidade |
| 23 | [Auditoria financeiro/foto/agenda/profissionais](23-auditoria-financeiro-fotografia-agenda-profissionais.md) | Auditoria funcional |
| 24 | [Auditoria admin/infra/multi-tenant](24-auditoria-admin-infraestrutura-multitenant.md) | Auditoria administrativa |
| 25 | [Auditoria rotas clínicas/CRM/agenda](25-auditoria-rotas-clinicas-crm-agenda-configuracao.md) | Auditoria de rotas |
| 26 | [Dependências/ambiente/segurança](26-dependencias-ambiente-integracoes-superficie-seguranca.md) | Superfície técnica |
| 27 | [Auditoria final](27-auditoria-final-rotas-administracao-integracoes.md) | Fechamento de rotas/integrações |
| 28 | [Auditoria componentes clínicos](28-auditoria-componentes-clinicos-complementares.md) | Complementos clínicos |
| 29 | [Auditoria portal/webhooks/Mayan](29-auditoria-portal-paciente-webhooks-e-mayan.md) | Portal e integrações |
| 30 | [Matriz final](30-matriz-final-de-cobertura.md) | Status consolidado |
| 31 | [Go-Live](31-checklist-go-live.md) | Validação antes da produção |

## Critério editorial

A documentação diferencia deliberadamente:

1. **o que o código realmente implementa**;
2. **o que depende de infraestrutura externa**;
3. **o que é apenas demonstrativo/simulado**;
4. **o que ainda não foi identificado no repositório**.

Isso é especialmente importante para assinatura ICP-Brasil, gateways de pagamento, Google Calendar, Microsoft/telemedicina, Mayan EDMS, White-Label server-side, RBAC server-side e VoIP/SIP.

> Regra: quando uma capacidade não estiver comprovada pelo código analisado, ela é marcada como **não identificada no repositório** ou **parcial/demonstrativa**, evitando transformar intenção de produto em instrução técnica falsa.
