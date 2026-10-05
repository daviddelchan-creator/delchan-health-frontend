# Delchan Health OS - Design System

Bem-vindo à fundação do sistema de design oficial do Delchan Health OS.

Esta documentação descreve onde os tokens visuais estão armazenados e como utilizá-los no projeto.

## Tema e Tokens

O tema central do projeto utiliza o **Mantine 8** e está implementado através do utilitário `createTheme`.

- **Tokens e Tema Central:** `app/theme.ts`
  - Neste arquivo, você encontrará o objeto exportado `designTokens` contendo a identidade visual oficial bruta (cores, espaçamentos, tipografia, breakpoints, radius, etc.).
  - Encontrará também o objeto `theme` configurado e exportado com base nestes tokens.

## Como consumir novos componentes

Para o desenvolvimento de novos componentes, sempre utilize os valores definidos no Design System integrado via Mantine.

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

## Limitações Conhecidas (Fase UI-2.1)

Durante a fase UI-2.1, nosso foco principal é **estabelecer a fundação e a infraestrutura visual** definindo a central de tokens (`designTokens`) como a única fonte de verdade. A aplicação completa e migração destes tokens aos componentes e telas ocorrerá nas ondas seguintes (UI-2.2+), portanto, não realizamos um redesign maciço das telas nesta fase inicial.

- **Auditoria de Hardcoded Hex:** A duplicação de provedores e o uso de abstrações paralelas (como `MantineProvider` locais e `mergeMantineTheme` no `app/patient/page.tsx`) foram eliminados nesta etapa para garantir a unicidade do layout root. No entanto, os componentes internos das telas (como backgrounds em hexadecimal `#f8fafc`, margin pixels fixos, etc) continuarão ostentando hardcodes visuais herdados. Estes valores foram registrados e serão limpos e migrados nas ondas subsequentes para assegurar conformidade total com o novo design sem quebrar a estabilidade estrutural atual.

**Sempre siga as regras baseadas neste Design System para todas as novas construções e atualizações!**

## Component Library (UI-2.2.1)

A core component library foi implementada mantendo o princípio **Mantine-first**:

1. **Native Components via Theme**: Componentes padrão como `Button`, `TextInput`, `Select`, `Card` e `Badge` NÃO possuem wrappers personalizados como `<Button2>`. Eles são configurados nativamente através das APIs `defaultProps` e `styles` do `createTheme` no arquivo `app/theme.ts`. Isso assegura acessibilidade, comportamentos padrão unificados e uma única fonte de verdade.
2. **Semantic Colors**: Foram implementadas cores semânticas explícitas (`success`, `warning`, `error`, `info`) no objeto `designTokens`. Para utilizá-las no Mantine, use o prefixo `delchan` (ex: `color="delchanSuccess"`).
3. **Core UI Patterns (`components/ui/`)**: Foram criados componentes específicos que representam padrões compostos do Delchan Health OS:
   - `StatusBadge`: Usado para exibir estados semânticos (ex: Ativo, Pendente, Erro). Aceita a prop `status` do tipo `StatusSemanticType`. Diferente de `Badge` genérico usado para categorias e tags.
   - `EmptyState`: Padrão centralizado com ícone, título, descrição e ação opcional, renderizado quando não há dados a exibir.
   - `ErrorState`: Padrão centralizado seguro para falhas (sem vazar credenciais ou stack traces), com ação de tentativa (`onRetry`).
   - `Skeleton`: Placeholder estrutural diretamente exportado do Mantine para conveniência nas importações compostas.

Todas essas alterações estão cobertas por testes na pasta `__tests__/theme/` garantindo renderização e manipulação correta de estados sem ferir a integridade do Mantine.

### UI-2.2.1 Correction

- **Shadows e Borders**: Foram centralizados em `designTokens.shadows` e `designTokens.borders`. Todos os `Card`s agora consomem esses tokens nativamente, eliminando o uso de strings hardcoded de `box-shadow` em cada tela.
- **Button Variants**: O componente `Button` suporta as variantes `primary`, `secondary`, `tertiary`, `danger` e `link` nativamente via `styles` no tema (`app/theme.ts`). A variante `danger` utiliza a semântica `error`.
- **Loading vs Skeleton**:
  - `Loading`: Componente focado em estados transacionais (processamento, espera).
  - `Skeleton`: Re-exportado do Mantine para placeholders visuais/estruturais no carregamento de páginas.
- **StatusBadge vs Badge**:
  - `StatusBadge`: Semântico, usado para (success, error, warning, info, neutral, pending). *Nota: O estado `pending` mapeia intencionalmente para a escala `warning` nesta etapa.*
  - `Badge` (Mantine nativo): Usado para categorias informativas estáticas.
- **Deferred Components**: O componente `DatePicker` foi adiado (deferred) e não implementado nesta task, pois o pacote `@mantine/dates` não está instalado e a regra proíbe instalar dependências desnecessárias neste momento.
