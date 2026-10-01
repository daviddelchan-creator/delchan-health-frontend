# 1. Visão geral

## O que é
O repositório `delchan-health-frontend` implementa a interface web do Delchan Health OS. A base utiliza Next.js 15.5.6, React 19.2.0, TypeScript 5.9.3, Mantine e Medplum.

## Áreas identificadas
- Dashboard e navegação por perfil.
- Pacientes e prontuário.
- Agenda.
- CRM e leads.
- Administração de tenants/clínicas.
- White-label e identidade visual.
- RBAC/equipe.
- Construtor de formulários/módulos.
- Modelos de evolução clínica.
- Assinatura e certificados A1/A3 (interface de cofre).
- QR Code, PDFs e rastreamento documental.
- Integrações de calendário Google.
- Sincronização Mayan.
- APIs de intake, webhook, formulários e scanner.
- Automação CRM com classificação de intenção e handoff humano.

## Tecnologias
`package.json` declara Next.js, React, Mantine, Medplum/FHIR, TipTap, QRCode, jsQR, pdf-lib, Google APIs, Recharts e ferramentas de impressão.

## Princípio desta documentação
Cada procedimento deve indicar onde a configuração existe: interface, código, variável de ambiente ou serviço externo. Segredos nunca devem ser colocados nesta documentação.
