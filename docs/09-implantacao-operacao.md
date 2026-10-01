# 9. Implantação e operação

## Ambiente local
Requisitos declarados:
- Node compatível com `^22.18.0 || >=24.2.0`;
- npm 10.9.4.

Comandos:
```bash
npm install
npm run dev
```

## Produção
```bash
npm run build
npm start
```

O repositório possui `vercel.json`, indicando configuração relacionada à Vercel.

## Checklist de implantação
- [ ] domínio configurado;
- [ ] DNS/CNAME validado;
- [ ] variáveis de ambiente configuradas;
- [ ] Medplum conectado;
- [ ] OAuth Google configurado, se usado;
- [ ] Mayan configurado, se usado;
- [ ] webhooks protegidos;
- [ ] RBAC validado;
- [ ] backup/política de retenção definida;
- [ ] logs e monitoramento;
- [ ] testes de PDF/QR;
- [ ] testes de impressão;
- [ ] testes de integração;
- [ ] política de dados e LGPD.

## Atualização
Antes de atualizar dependências:
1. criar branch;
2. executar build;
3. testar fluxos clínicos;
4. testar integrações;
5. validar migrações FHIR;
6. promover para produção.

## Rollback
Manter uma versão anterior implantável e registrar o commit/versão de cada release.
