# 13. Matriz de cobertura da documentação

| Área | Evidência no código | Documentada |
|---|---|---|
| Dashboard/profissional | Sim | Sim |
| Pacientes/prontuário | Sim | Sim |
| Agenda | Sim | Sim |
| CRM | Sim | Sim |
| White-label | Sim | Sim |
| Cor/branding | Sim | Sim |
| Logo | Sim | Sim |
| Background de login | Sim na UI de setup | Sim, com ressalva de persistência |
| Domínio/CNAME | Sim na UI | Sim, com ressalva de infraestrutura |
| RBAC | UI e componentes | Sim, validar enforcement |
| Certificado A1 | UI | Sim, implementação de cofre deve ser validada |
| FHIR/Medplum | Sim | Sim |
| QR/PDF | Sim | Sim |
| Scanner/ingestão | Sim | Sim |
| Google Calendar | Sim | Sim |
| Mayan | Sim | Sim |
| Webhooks CRM | Sim | Sim |
| Automação/IA CRM | Sim | Sim |
| SIP/VoIP | Não localizado | Sim como lacuna |
| Infraestrutura externa | Parcial | Sim, com itens a preencher |
| Segredos/credenciais reais | Não devem estar no manual | Sim, por política |

## Critério de “100%”
“100% do projeto” deve significar cobertura de todos os diretórios, rotas, componentes, integrações e configurações relevantes do commit documentado. Como o projeto evolui, esta matriz deve ser regenerada a cada release.

## Próxima etapa recomendada
Executar uma segunda passada automatizada sobre todos os arquivos da árvore para gerar páginas individuais por rota/componente e detectar variáveis de ambiente, endpoints externos, permissões e dependências. Isso transforma este índice em uma documentação navegável no estilo de um portal de documentação.
