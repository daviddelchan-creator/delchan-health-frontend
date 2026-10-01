# Multi-tenant, White-Label, RBAC e Construtor de Módulos

## Multi-tenant

O `TenantContext` mantém:

- tenant ativo;
- nome;
- CNPJ;
- cidade;
- cor;
- plano;
- status;
- quantidade de médicos.

Existem tenants iniciais demonstrativos.

### Persistência atual

A configuração do tenant e a lista de tenants são persistidas em **localStorage**:

- `delchan_tenant_config`;
- `delchan_tenants_list`.

Portanto, esta camada de contexto não deve ser confundida com um cadastro SaaS server-side definitivo.

## Módulos ativáveis

A configuração contém:

- agenda;
- prontuário;
- faturamento;
- CRM.

Também há módulos de sidebar:

- convênio;
- alergias;
- problemas;
- sinais vitais.

## Terminologia por tipo de clínica

O contexto troca rótulos conforme `clinicType`:

- medical → Paciente / Prontuário / Médico / Receituário / Consultório;
- outros tipos → Cliente / Ficha / Profissional / Recomendação / Cabine.

## White-Label

A tela `/setup` apresenta:

- nome da organização;
- logo PNG/SVG;
- imagem de fundo da tela de login;
- cor primária;
- subdomínio;
- domínio personalizado/CNAME;
- verificação DNS.

### Estado atual

A tela possui interface de configuração, mas o código analisado não demonstra persistência backend desses campos. O botão “Salvar Configuração Global” não possui fluxo de persistência implementado nesse arquivo.

**Conclusão:** documentar White-Label como capacidade de interface/provisionamento preparada, e não como serviço DNS/branding server-side comprovadamente concluído.

## RBAC e equipe

A tela `/admin/equipe` consulta `Practitioner` diretamente pelo Medplum.

Exibe:

- profissional;
- especialidade;
- registro;
- indicação de assinatura;
- ações.

O `TenantContext` possui `require2FA`, mas a tela de equipe não implementa por si só autorização server-side.

### Regra

O modelo visual de roles não deve ser tratado como mecanismo de segurança por si só. Permissões efetivas devem ser verificadas no backend/Medplum antes de qualquer operação sensível.

## Cofre de certificados

A tela de setup apresenta conceito de:

- certificado A1 PFX/P12;
- PIN/senha;
- armazenamento criptografado;
- assinatura server-side.

Entretanto, no arquivo auditado, esses controles são UI e não há chamada de persistência demonstrando um KMS/cofre real.

**Não armazenar certificados reais nesta documentação ou no Git.**

## Construtor de módulos

A rota `/admin/construtor` implementa um editor visual para FHIR Questionnaire.

Tipos disponíveis:

- string;
- text;
- integer;
- date;
- boolean.

Cada item possui:

- `linkId`;
- `text`;
- `type`;
- `required`.

Ao publicar, o sistema executa `medplum.createResource()` criando um:

**Questionnaire/status=active**

## Fluxo do construtor

`Paleta → campo → edição de label/linkId → obrigatório → Publicar → Medplum Questionnaire`

## Limitações identificadas

No código auditado:

- não há edição/reordenação persistida por drag-and-drop;
- o ícone de arraste é visual;
- não há versionamento de Questionnaire;
- não há controle de permissões explícito no arquivo;
- não há workflow de aprovação clínica.

Esses pontos devem ser tratados como oportunidades/itens de validação, não como funcionalidades existentes.
