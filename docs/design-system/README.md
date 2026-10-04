# Delchan Health OS - Design System

Bem-vindo à fundação do sistema de design oficial do Delchan Health OS.

Esta documentação descreve onde os tokens visuais estão armazenados e como utilizá-los no projeto.

## Tema e Tokens

O tema central do projeto utiliza o **Mantine 8** e está implementado através do utilitário `createTheme`.

- **Tokens e Tema Central:** `app/theme.ts`
  - Neste arquivo, você encontrará o objeto exportado `designTokens` contendo a identidade visual oficial bruta (cores, espaçamentos, tipografia, breakpoints, radius, etc.).
  - Encontrará também o objeto `theme` configurado e exportado com base nestes tokens.

## Arquitetura de Componentes UI-2.2.1+

A regra primária do Delchan Design System é: **Não criar abstrações/wrappers inúteis**.

- Use **Mantine Nativo** para primitivas UI: `<Button>`, `<TextInput>`, `<Card>`, `<Badge>`, etc. Nunca crie wrappers redundantes (como `<DelchanButton>`).
- Use **Componentes Delchan Específicos** apenas para padrões de negócio e domínios complexos: `<PatientHeader>`, `<DocumentViewer>`, `<CRMPipeline>`, etc.

### Tamanhos Oficiais (Sizing)

Componentes de ação (como Button e ActionIcon) utilizam um sistema mapeado e restrito (injetado via `app/theme.ts`):
- `size="small"` -> 32px de altura
- `size="default"` -> 40px de altura
- `size="large"` -> 48px de altura

### Cores Semânticas

A paleta de design system implementa paletas semânticas disponíveis diretamente no contexto do Mantine:
- `primary`: Ação principal (Base: Teal)
- `success`: Para feedbacks positivos
- `error`: Destrutivos ou alertas críticos
- `warning`: Alertas lógicos que pedem atenção
- `info`: Mensagens neutras/informativas

## Como consumir tokens no desenvolvimento

Para o desenvolvimento de fluxos, utilize sempre os valores definidos no Design System integrado via Mantine.

**NUNCA invente cores, `spacing`, `radius` ou `shadows` fora deste sistema.**

### Acessando os tokens

Você pode consumir os tokens visualmente injetados nas propriedades dos componentes Mantine, ou por meio dos hooks oficiais do framework (ex: `useMantineTheme()`).

```tsx
import { Button, Text, useMantineTheme } from '@mantine/core';

export function Example() {
  const theme = useMantineTheme();

  return (
    <div>
      <Text c="delchanPrimary.7">Cor primária oficial!</Text>
      <Button mt="md" radius="xl">Botão integrado</Button>
    </div>
  );
}
```

## Evolução e Componentes Customizados (UI-2.2.1 e UI-2.2.2)

Para cenários onde o Mantine não provê componentes nativos com semânticas exatas exigidas pela aplicação, foram criados wrappers estritos no diretório `components/ui`:

- `<EmptyState>`: Espaço vazio com ícone e ação opcional.
- `<ErrorState>`: Erro com ícone de alerta e botão de retry.
- `<StatusBadge>`: Badges semânticos baseados no tipo do recurso.
- `<SearchInput>`: Input padronizado para pesquisas.

### Interaction Grammar (UI-2.2.2 - Overlays)

A plataforma utiliza um fluxo oficial e consolidado para interações pesadas:
**Lista -> Quick View (Drawer) -> Ação (Modal) -> Full Workspace (Página)**

Para assegurar essa gramática de overlays, adicionamos dois padrões:
- `<QuickViewDrawer>`: O Drawer oficial para leitura/contexto. Ele contém Header, Body scrollável, Actions no Footer e captura automaticamente fechamentos acidentais caso a prop `isDirty={true}`.
- `<ConfirmationDialog>`: Componente padrão para exibir modais decisivos e alertas rápidos destrutivos (dispensando a re-construção local de `<Modal>` com actions todas as vezes).

**Regras de Overlays Primitivos:**
A aplicação deve usar nativamente `<Popover>`, `<Tooltip>` e `<Menu>` para micro-interações sem wraps customizados. Seus estados visuais já foram formatados globalmente no `app/theme.ts`.

### Configuração Estrita de Botões (Button / ActionIcon)
Os botões seguem rigidamente os tamanhos injetados: small (32px), default (40px) e large (48px), e expõe as seguintes variantes customizadas na prop `variant`:
- `primary` (Mantine nativo - delchanPrimary)
- `secondary`
- `tertiary`
- `danger`

## Navegação e AppShell (UI-2.3)

O layout global de operação do Delchan usa uma abstração oficial `<DelchanAppShell>` estruturada para suportar as complexidades de módulos médicos e administrativos simultaneamente.

**Arquitetura de Navegação:**
O fluxo de links da aplicação e permissões é configurado estritamente em `lib/navigation.tsx`. O inventário das rotas reais foi classificado para não injetar páginas inexistentes. O estado das rotas é rastreado ativamente por Next.js Hooks prevendo path boundaries rigorosas para evitar colisões (ex: `/doctor/pacientes/` não colide com `/doctor/pacientes-old`).

*Classificação do Mapa de Navegação Atual:*
- **Clínico/Operação (`/doctor`):**
  - Início (`/doctor`) — *EXISTENTE (rota independente)*
  - Pacientes (`/doctor/pacientes`) — *EXISTENTE (rota independente)*
  - Agenda (`/doctor/agenda`) — *EXISTENTE (rota independente)*
  - CRM (`/doctor/crm`) — *EXISTENTE (rota independente)*
- **Plataforma/SaaS (`/admin`):**
  - Dashboard (`/admin?tab=overview`) — *EXISTENTE (tab dentro de rota existente)*
  - Clínicas / Tenants (`/admin?tab=tenants`) — *EXISTENTE (tab dentro de rota existente)*
  - Módulos SaaS (`/admin?tab=modules`) — *EXISTENTE (tab dentro de rota existente)*
  - White-Label (`/admin?tab=whitelabel`) — *EXISTENTE (tab dentro de rota existente)*
  - CRM & Leads (`/admin/crm`) — *EXISTENTE (rota independente)*
  - Dados da Clínica (`/admin?tab=clinic`) — *EXISTENTE (tab dentro de rota existente)*
  - Segurança & Acesso (`/admin?tab=security`) — *EXISTENTE (tab dentro de rota existente)*
  - Layout Prontuário (`/admin?tab=layout`) — *EXISTENTE (tab dentro de rota existente)*
  - Construtor de Módulos (`/admin?tab=builder`) — *EXISTENTE (tab dentro de rota existente)*
  - Modelos de Evolução (`/admin?tab=templates`) — *EXISTENTE (tab dentro de rota existente)*

**Responsividade da Sidebar:**
- **Desktop:** Navbar persistente ocupando 260px na esquerda (expansível e com estado `collapsed` retrátil para 80px a fim de maximizar espaço).
- **Tablet/Mobile:** A barra da esquerda cede espaço e se comporta responsivamente, ocultando os textos e adaptando-se. No mobile, a navegação se recolhe sob o `<Burger>` do header principal (`/doctor` possui o header clínico unificado).

## Limitações Conhecidas (Fase UI-2.x)

Nosso foco é estabelecer o uso correto do **Mantine 8** e abstrações cirúrgicas sem realizar redesign das telas antigas (Admin, Clínico e Paciente).

- **Organization/Tenant Context:** Organization/Tenant context real ainda não está conectado à identidade autenticada no Header. O valor atual ("Delchan OS") é apenas branding/placeholder visual. Não representa tenant real e não acopla novo sistema de Tenant.
- **Patient Portal:** Patient Portal permanece isolado nesta fase (`app/patient/page.tsx`) para evitar redesign fora do escopo. A integração/experiência visual será tratada na futura onda UI-2.4 Patient Experience.
- A migração progressiva das telas baseadas em hardcoded values ocorrerá gradativamente nas próximas ondas.
- O playground de UI não faz parte do escopo inicial e será adicionado futuramente ao admin.

**Sempre siga as regras baseadas neste Design System para todas as novas construções e atualizações!**