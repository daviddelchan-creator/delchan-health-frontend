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

Durante a fase UI-2.1, nosso foco principal é **estabelecer a fundação e a infraestrutura visual** sem realizar o redesign maciço das telas.

- **Auditoria de Hardcoded Hex:** Uma auditoria preliminar revelou que alguns componentes em `app/patient/page.tsx` ainda podem estar usando configurações via propriedades customizadas ou `mergeMantineTheme`. Os valores "hardcoded" nestes componentes foram registrados e serão iterados e limpos durante as ondas **UI-2.2+** para assegurar conformidade total sem quebrar a estabilidade atual.
- Nenhum redesign drástico foi efetuado na tela atual.

**Sempre siga as regras baseadas neste Design System para todas as novas construções e atualizações!**
