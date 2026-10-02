# Delchan Health OS

Delchan Health OS é uma plataforma unificada de gestão de saúde (SaaS/Multitenant) construída com Next.js 15, baseada no padrão Medplum FHIR R4. Ela engloba desde a agenda médica, prontuários clínicos interoperáveis e CRM, até um portal do paciente dedicado e um aplicativo móvel associado.

> **Importante:** Este repositório reflete uma arquitetura em andamento. Certas integrações e funcionalidades listadas podem depender de serviços externos (SaaS infra), configurações de staging ou serem implementações parciais.

Para navegação detalhada da arquitetura, funcionalidades, manuais do desenvolvedor e status dos módulos, acesse a [Documentação Oficial](./docs/README.md).

## Tecnologias Base
- **Frontend & App:** Next.js 15 (React 19), Mantine UI.
- **Backend / Interoperabilidade:** Node, Medplum SDK (FHIR R4).
- **Mobile (Fase A):** Expo / React Native (`/mobile`).
