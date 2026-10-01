# Checklist de Go-Live — Delchan Health OS

Este documento transforma a auditoria do código em uma lista de validação operacional. Um item só deve ser marcado como concluído depois de ser testado no ambiente de implantação.

## 1. Aplicação

- [ ] Node.js compatível: `^22.18.0 || >=24.2.0`.
- [ ] npm 10.9.4.
- [ ] `npm install` sem dependências inesperadas.
- [ ] `npm run build`.
- [ ] `npm start`.
- [ ] domínio HTTPS configurado.
- [ ] logs de aplicação disponíveis.
- [ ] política de backup definida.

## 2. Medplum / FHIR

- [ ] `MEDPLUM_BASE_URL` definido.
- [ ] `MEDPLUM_CLIENT_ID` definido.
- [ ] `MEDPLUM_CLIENT_SECRET` definido.
- [ ] login validado.
- [ ] Patient criado/editado.
- [ ] Practitioner criado/editado.
- [ ] Organization validada.
- [ ] Appointment criado/alterado/cancelado.
- [ ] Observation de sinais vitais persistida.
- [ ] AllergyIntolerance persistida.
- [ ] Condition persistida.
- [ ] Coverage persistida.
- [ ] CarePlan persistido.
- [ ] DiagnosticReport/SOAP persistido.
- [ ] DocumentReference + Binary persistidos.

## 3. Tenant e autorização

- [ ] tenant ativo identificado no backend.
- [ ] usuário não consegue ler outro tenant apenas alterando IDs.
- [ ] criação/edição/exclusão respeitam tenant.
- [ ] AccessPolicy/RBAC testado no servidor.
- [ ] funções administrativas protegidas.
- [ ] exigência de 2FA, se utilizada, realmente aplicada no mecanismo de autenticação.

> O `TenantContext` do frontend não deve ser tratado como mecanismo de isolamento de segurança.

## 4. CRM e WhatsApp/Meta

- [ ] `META_VERIFY_TOKEN`.
- [ ] `WHATSAPP_VERIFY_TOKEN`.
- [ ] webhook Meta validado.
- [ ] POST real recebido.
- [ ] Patient/Task/Communication criado ou atualizado.
- [ ] handoff humano testado.
- [ ] classificação de urgência validada com casos fictícios.
- [ ] mensagens automáticas revisadas por responsável clínico.
- [ ] nenhum segredo real em código ou documentação.

## 5. Pré-anamnese

- [ ] `INTAKE_SECRET_KEY` forte e exclusivo.
- [ ] `NEXT_PUBLIC_APP_URL` correto.
- [ ] token expira.
- [ ] token de paciente A não funciona para paciente B.
- [ ] Consent criado.
- [ ] AllergyIntolerance criada quando aplicável.
- [ ] Condition criada quando aplicável.
- [ ] Task atualizada.
- [ ] dados de teste removidos antes do uso real.

## 6. Documentos, QR e scanner

- [ ] PDF A4 gerado.
- [ ] tracking code gerado.
- [ ] QR legível.
- [ ] DocumentReference criado.
- [ ] Binary criado.
- [ ] scanner detecta QR.
- [ ] scanner aceita tracking code.
- [ ] tenant do documento validado.
- [ ] Patient associado corretamente.
- [ ] fluxo de documento avulso testado.
- [ ] impressão validada.

## 7. Google Calendar

- [ ] client ID.
- [ ] client secret.
- [ ] redirect URI.
- [ ] consentimento OAuth.
- [ ] callback.
- [ ] access token.
- [ ] refresh token armazenado de forma segura.
- [ ] revogação/reautorização testada.

> O repositório atual implementa o callback OAuth, mas não deve ser anunciado como sincronização contínua completa sem validar a persistência/renovação do refresh token.

## 8. Assinatura digital

- [ ] definir fornecedor/middleware de assinatura.
- [ ] definir certificado A1/A3, quando aplicável.
- [ ] armazenar chaves em infraestrutura segura.
- [ ] assinar documento real.
- [ ] validar assinatura.
- [ ] registrar evidência/auditoria.
- [ ] validar requisitos legais aplicáveis.

> O componente atual de assinatura não constitui, sozinho, prova de assinatura ICP-Brasil.

## 9. Pagamentos

- [ ] escolher gateway.
- [ ] credenciais.
- [ ] ambiente sandbox.
- [ ] cobrança real.
- [ ] webhook.
- [ ] conciliação.
- [ ] estorno.
- [ ] tratamento de falhas.

> O PaymentPOS atual não deve ser apresentado como gateway de produção sem essa validação.

## 10. Mayan EDMS

- [ ] servidor Mayan disponível.
- [ ] `MAYAN_URL`.
- [ ] `MAYAN_TOKEN`.
- [ ] autenticação.
- [ ] cabinet/estrutura por tenant e paciente.
- [ ] upload real.
- [ ] confirmação de persistência.
- [ ] recuperação de documento.
- [ ] tratamento de indisponibilidade.

> O bridge atual possui modo preparado/fallback. É necessário confirmar o upload real antes de declarar integração concluída.

## 11. VoIP/SIP

- [ ] fornecedor VoIP definido.
- [ ] arquitetura WebRTC/SIP/PBX/SBC definida.
- [ ] registrar/proxy.
- [ ] ramais.
- [ ] autenticação.
- [ ] TLS/SRTP.
- [ ] STUN/TURN quando necessário.
- [ ] RTP/ICE.
- [ ] gravação e consentimento.
- [ ] vínculo chamada → Patient/Task/Communication.

> Nenhuma implementação SIP/VoIP concreta foi confirmada na árvore auditada.

## 12. White-Label

- [ ] nome da clínica.
- [ ] logotipo.
- [ ] cor primária.
- [ ] fundo de login.
- [ ] subdomínio.
- [ ] domínio personalizado.
- [ ] DNS/CNAME.
- [ ] persistência server-side.
- [ ] isolamento entre tenants.
- [ ] cache/CDN invalidado corretamente.

## 13. Segurança

- [ ] remover fallbacks secretos.
- [ ] rotacionar qualquer credencial que tenha sido usada em desenvolvimento.
- [ ] secret manager.
- [ ] HTTPS.
- [ ] política de sessão.
- [ ] logs sem dados sensíveis.
- [ ] controle de acesso.
- [ ] backup.
- [ ] retenção.
- [ ] plano de incidente.
- [ ] revisão LGPD com responsável competente.

## 14. Critério de publicação

O sistema só deve ser descrito no manual como **produção operacional** para uma integração quando o respectivo item tiver sido validado no ambiente real.

A documentação do código deve continuar distinguindo:

- Implementado;
- Integração parcial;
- Demonstrativo;
- Requer infraestrutura/configuração;
- Não identificado no código.
