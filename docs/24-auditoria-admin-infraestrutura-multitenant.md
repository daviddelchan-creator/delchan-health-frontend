# 24 — Auditoria do núcleo administrativo e infraestrutura

## 1. TenantContext: dois níveis diferentes

O projeto possui dois contextos relacionados a tenant:

### `contexts/TenantContext.tsx`

É o contexto mais completo e utilizado pela interface administrativa.

Ele mantém:

- tenant ativo;
- nome;
- CNPJ;
- cidade;
- cor;
- plano;
- status;
- quantidade de profissionais;
- módulos ativos;
- módulos da sidebar;
- exigência de 2FA;
- tipo de clínica;
- dicionário de terminologia.

### Persistência atual

As configurações são gravadas no navegador usando:

- `delchan_tenant_config`
- `delchan_tenants_list`

Portanto, essa persistência é **client-side/localStorage**, não um mecanismo SaaS centralizado.

### `core/hooks/TenantContext.tsx`

É um contexto menor, independente, que mantém apenas módulos:

- agenda;
- clínica;
- faturamento;
- CRM.

Também inicia com módulos de demonstração.

**Conclusão:** o manual deve tratar o tenant como uma camada de configuração de frontend atualmente. Isso não equivale, por si só, a isolamento de dados multi-tenant no backend.

---

## 2. Multi-tenant real versus seleção visual

O código permite:

- selecionar tenant;
- criar tenant;
- mudar cor;
- ativar/desativar módulos;
- alterar terminologia;
- salvar a configuração no localStorage.

Porém, a troca do tenant não demonstra automaticamente uma troca de banco, namespace de autenticação ou política de acesso no servidor.

A proteção real dos dados precisa ocorrer também no Medplum/backend.

**Classificação:** Multi-tenant de interface/configuração; isolamento server-side não comprovado.

---

## 3. Organização FHIR da clínica

A página administrativa `/admin` possui um fluxo real para Organization.

Ela pode:

- pesquisar Organization;
- ler CNPJ;
- ler telefone;
- ler e-mail;
- ler extensão de logo;
- fazer upload do logo via `createBinary`;
- salvar/atualizar Organization;
- associar o logo por extensão:
  `https://delchan.com/fhir/logo`.

**Classificação:** Implementado.

Isso é diferente do cadastro completo de White-Label, que possui outras configurações ainda mantidas no frontend.

---

## 4. Super Admin: dados realmente conectados

A página `/admin` consulta diretamente:

- Patient;
- Organization;
- Questionnaire.

Também utiliza:

- DynamicIntakeForm;
- PatientWorkspace;
- StaffManager;
- TenantContext.

Portanto, a visão administrativa possui uma parte operacional real.

---

## 5. Super Admin: indicadores demonstrativos

A mesma página contém valores locais/hard-coded para:

- faturamento bruto;
- repasses;
- despesas;
- transações;
- MRR;
- crescimento mensal;
- percentual de conformidade.

Por exemplo, existem valores como:

- R$ 94.800 de MRR;
- R$ 142.500 de bruto;
- R$ 45.000 de repasses;
- R$ 13.200 de despesas;
- “100%” de conformidade.

Esses valores não devem ser documentados como métricas reais da plataforma.

### Financeiro da página

Ao criar uma receita/despesa pela interface, o estado é atualizado somente no React:

`setTransacoes(...)`

e

`setFinancials(...)`.

Não foi encontrada nessa página uma gravação de uma transação financeira real no backend.

**Classificação:** Demo/Simulado.

---

## 6. “Sincronizar Cloud”

O botão “Sincronizar Cloud” da página administrativa executa apenas uma mensagem de sucesso via `alert`.

Não há nesse handler uma operação efetiva de sincronização.

**Classificação:** Demo/Simulado.

---

## 7. Construtor de módulos clínicos

A página `/admin/construtor` é diferente do editor de modelos.

Ela trabalha diretamente com FHIR Questionnaire.

O fluxo inclui:

1. definir título;
2. adicionar campos;
3. escolher tipo;
4. editar texto;
5. configurar `linkId`;
6. marcar campo obrigatório;
7. gerar preview JSON;
8. publicar.

A publicação cria um recurso:

`Questionnaire`

com:

- `status = active`;
- `title`;
- `name`;
- `date`;
- `item[]`.

Também existe exclusão de Questionnaire.

**Classificação:** Implementado.

### Limitações

A presença do ícone de “drag” não significa necessariamente drag-and-drop funcional.

Também não foi comprovado:

- versionamento de Questionnaire;
- workflow de aprovação;
- histórico de versões;
- publicação por ambiente;
- permissões granulares por papel.

---

## 8. Modelos clínicos / Plantillas

`/admin/plantillas` possui modelos de:

- SOAP;
- Anamnese Geral;
- protocolo estético.

É possível:

- adicionar;
- editar;
- excluir;
- selecionar modelo.

Porém, os modelos ficam em estado local React.

O botão “Salvar e Sincronizar” apenas exibe uma mensagem de sucesso.

Não há persistência FHIR demonstrada nesse arquivo.

**Classificação:** Demo/Frontend local.

Isso deve ser corrigido antes de o manual prometer “modelos sincronizados para todos os médicos”.

---

## 9. Recursos e infraestrutura

`/admin/recursos` apresenta recursos conceituais:

### Location

Exemplos:

- unidade;
- consultório/cabine;
- sala de espera;
- sala de procedimentos;
- sala de telemedicina.

### Device

Exemplos:

- totem;
- hardware de videoconferência;
- scanner;
- leitor SmartCard.

Mas os arrays de Locations e Devices são dados locais de demonstração.

Os botões:

- Novo Equipamento;
- Novo Espaço;
- Salvar Localização;
- Configurar API;
- Editar;
- Excluir;

não demonstram persistência FHIR nessa página.

**Classificação:** UI/Mock.

Não documentar essa tela como inventário FHIR operacional ainda.

---

## 10. Configuração TypeScript/Next.js

### TypeScript

O projeto usa:

- `strict: true`;
- `moduleResolution: bundler`;
- alias `@/*`;
- `noEmit`;
- plugin Next.js.

### Next.js

`next.config.mjs`:

- ativa React Strict Mode;
- ignora erros ESLint durante build;
- ignora erros TypeScript durante build;
- transpila `qrcode.react`;
- cria rewrite para `/api/medplum/*`.

### Ponto de atenção

`typescript.ignoreBuildErrors = true` significa que erros TypeScript podem não impedir o build.

Isso deve ser tratado como decisão de CI/CD, não como evidência de que o código está sem erros.

### Rewrite do Medplum

Existe um destino backend fixo no arquivo:

`https://delchan-health-portal-medplum.6jpght.easypanel.host`

Isso cria dependência operacional de uma instância específica.

Para produção multiambiente, recomenda-se parametrizar o endpoint.

---

## 11. Vercel

`vercel.json` define:

- instalação via npm;
- build via `npm run build`;
- rewrite geral para a aplicação.

Não há nesse arquivo configuração suficiente para documentar:

- domínio personalizado;
- secret manager;
- cron;
- workers;
- filas;
- observabilidade;
- ambientes separados.

Esses itens precisam ser configurados fora desse arquivo ou adicionados explicitamente.

---

## 12. Utilitário de nome da mãe

`utils/patientUtils.ts` possui estratégia de compatibilidade interessante:

1. extensão HL7:
   `patient-mothersMaidenName`;
2. extensão Delchan:
   `https://delchan.com/fhir/nomeMae`;
3. contato com relacionamento `MTH`;
4. fallback legado `nomeMae`;
5. fallback legado `mothersName`.

**Classificação:** Implementado.

Isso permite interoperabilidade entre diferentes representações do mesmo dado.

---

## 13. .npmrc

O projeto define:

`legacy-peer-deps=true`

Isso permite instalar dependências mesmo quando existem conflitos de peer dependencies.

Para produção, a documentação deve recomendar:

- npm lockfile versionado;
- instalação determinística;
- revisão periódica dos conflitos;
- não depender indefinidamente de `legacy-peer-deps`.

---

## 14. README atual

O `README.md` da raiz ainda é essencialmente o template inicial Medplum + Next.js.

O manual novo em `docs/` deve ser considerado a documentação funcional principal até que o README raiz seja substituído por uma apresentação específica do Delchan Health OS.

---

## 15. Conclusão desta camada

### Confirmado como funcional

- leitura/escrita de Organization;
- upload de logo como Binary;
- leitura/escrita de Patient em partes administrativas;
- publicação de Questionnaire;
- exclusão de Questionnaire;
- TenantContext client-side;
- seleção de tenant;
- módulos e terminologia configuráveis;
- utilitário de compatibilidade FHIR para nome da mãe.

### Confirmado como local/demo

- indicadores financeiros;
- MRR;
- transações da central administrativa;
- “Sincronizar Cloud”;
- modelos de evolução da página Plantillas;
- inventário de Locations;
- inventário de Devices;
- vários indicadores de conformidade.

### Ainda não comprovado

- isolamento multi-tenant server-side;
- RBAC/AccessPolicy;
- 2FA efetivamente aplicado;
- sincronização financeira real;
- inventário FHIR de infraestrutura;
- persistência centralizada de modelos clínicos;
- workflow de aprovação/versionamento de Questionnaires.
