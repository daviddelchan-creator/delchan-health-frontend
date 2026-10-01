# 32 — App Android, Health Connect e Histórico Clínico Documental

## Objetivo

Definir a primeira versão do aplicativo móvel do Delchan Health OS, inicialmente para Android, reutilizando o SaaS web e o Medplum como camada de dados clínicos.

A primeira versão deve permitir que um paciente:

1. selecione ou pesquise a organização contratante do Delchan;
2. veja o branding configurado pela organização;
3. autentique-se como usuário/paciente daquela organização;
4. veja no aplicativo os mesmos dados autorizados disponíveis no portal do paciente;
5. conceda explicitamente ao aplicativo permissões para ler dados do Android Health Connect;
6. sincronize dados de saúde e bem-estar para o Delchan;
7. permita que dados clínicos emitidos pelo Delchan sejam escritos no Health Connect quando o tipo de dado e a política da plataforma permitirem;
8. fotografe ou selecione documentos médicos históricos;
9. envie os documentos ao Delchan preservando sempre o arquivo original;
10. acompanhe o processamento de OCR/classificação sem tratar a extração automática como verdade clínica;
11. permita ao paciente e, conforme autorização, ao profissional abrir o documento original para conferência.

## Decisões arquiteturais

### 1. O aplicativo não substitui o SaaS web

O repositório atual é principalmente uma aplicação Next.js. O app Android deve ser uma camada móvel do mesmo produto, não uma segunda base de pacientes.

Arquitetura-alvo:

```
                    Delchan Health OS
                           |
             +-------------+-------------+
             |                           |
       Aplicação Web                Aplicativo Android
       Next.js atual                 nova camada móvel
             |                           |
             +-------------+-------------+
                           |
                    API / autenticação
                           |
                         Medplum
                           |
          +----------------+----------------+
          |                                 |
       FHIR clínico                  Binary/DocumentReference
          |                                 |
       Patient                         Histórico documental
       Observation
       Appointment
       CarePlan
       etc.
```

### 2. Android primeiro

A primeira implementação móvel será Android.

Para dados de saúde, a integração principal deve ser com **Android Health Connect**, e não com uma implementação separada para cada fabricante. Health Connect fornece uma camada padronizada para dados de saúde e fitness no Android e possui permissões específicas de leitura e escrita.

O Android Health Connect possui tipos como pressão arterial, frequência cardíaca, hidratação, peso, altura, sono, atividade, temperatura corporal e outros. citeturn0search0turn0search2turn0search9

Samsung Health deve ser tratada inicialmente como uma possível fonte de dados que pode alimentar o Health Connect. Uma integração direta com o Samsung Health Data SDK fica para uma fase posterior caso exista uma necessidade comprovada que não possa ser atendida pelo Health Connect.

### 3. Permissão é do usuário

O aplicativo nunca deve assumir acesso aos dados de saúde.

O fluxo deve ser:

```
Paciente entra no Delchan
        ↓
Escolhe "Conectar dados de saúde"
        ↓
Explicação clara do que será lido/escrito
        ↓
Android Health Connect
        ↓
Paciente concede ou recusa cada permissão
        ↓
Delchan sincroniza somente o que foi autorizado
```

A aplicação deve mostrar quais categorias estão conectadas e permitir revogar/desconectar a integração.

### 4. Sincronização incremental

Não devemos simplesmente baixar novamente todo o histórico em cada abertura.

A implementação deve possuir:

- sincronização inicial;
- sincronização incremental;
- controle de última sincronização;
- controle de mudanças;
- prevenção de duplicidades;
- tratamento de interrupção;
- registro da origem do dado;
- registro do horário da medição;
- registro da fonte/aplicativo quando disponível;
- tela de status da sincronização.

Health Connect possui mecanismos próprios de sincronização e tokens de mudança. Leituras em segundo plano exigem permissão adicional, e a leitura de dados históricos acima das restrições padrão também exige permissão específica. citeturn0search3turn0search5turn0search13

### 5. FHIR como modelo interno

Os dados provenientes do Health Connect devem ser normalizados antes de serem persistidos.

Exemplos iniciais:

| Health Connect | Delchan/FHIR |
|---|---|
| BloodPressureRecord | Observation |
| HeartRateRecord | Observation |
| OxygenSaturationRecord | Observation |
| BodyTemperatureRecord | Observation |
| WeightRecord | Observation |
| HeightRecord | Observation |
| HydrationRecord | Observation |
| StepsRecord | Observation |
| SleepSessionRecord | Observation/estrutura de sono definida pelo produto |
| ExerciseSessionRecord | Observation/estrutura de atividade definida pelo produto |

Cada registro deve manter metadados de origem suficientes para distinguir:

- dado informado manualmente;
- dado importado do Health Connect;
- dispositivo/origem quando disponível;
- data/hora da medição;
- data/hora da importação;
- aplicativo que originou o registro quando disponível.

**Não transformar automaticamente um dado de wearable em diagnóstico.** O sistema deve armazenar a medição e sua origem.

## Multi-tenant e experiência de login

O aplicativo deve funcionar como um SaaS multiempresa.

Fluxo desejado:

```
Abrir Delchan
   ↓
Pesquisar empresa / clínica / centro / consultório
   ↓
Selecionar organização
   ↓
Exibir logo, cores e identidade visual daquela organização
   ↓
Login do usuário
   ↓
Entrar no ambiente daquela organização
   ↓
Portal do paciente
```

### Tipos de organização

O produto não deve assumir que todo cliente é hospital ou clínica médica.

A organização pode ser, por exemplo:

- hospital;
- clínica;
- centro médico;
- consultório;
- odontologia;
- fisioterapia;
- podologia;
- estética;
- cosmetologia;
- salão de beleza;
- salão de unhas;
- outros serviços de bem-estar permitidos pela política do produto.

A interface deve usar terminologia configurável pela organização.

Isso não altera os requisitos de privacidade, segurança ou controle de acesso para dados pessoais e de saúde.

### Identidade visual

O aplicativo deve carregar a configuração da organização autenticada, incluindo quando disponível:

- nome;
- logotipo;
- cores;
- nome comercial;
- mensagens;
- módulos habilitados;
- URL/domínio;
- configurações de atendimento.

**Importante:** o branding não pode ser considerado um mecanismo de segurança. O isolamento entre organizações deve ser garantido pelo servidor e pelas permissões, não pelo tenant selecionado na interface.

## Histórico clínico documental

O aplicativo deve permitir ao paciente criar um histórico documental com documentos recebidos de outros profissionais ou instituições.

Exemplos:

- relatório médico;
- laudo;
- receita;
- resultado de exame;
- alta hospitalar;
- relatório odontológico;
- relatório fisioterapêutico;
- documento de outra clínica;
- documento de outra rede;
- documento fotografado em papel;
- PDF recebido por outro meio.

Fluxo:

```
Paciente
   ↓
Fotografar / selecionar PDF ou imagem
   ↓
Upload seguro
   ↓
Guardar arquivo original
   ↓
Criar DocumentReference
   ↓
Classificar documento
   ↓
OCR
   ↓
Extração estruturada opcional
   ↓
Revisão
   ↓
Exibir no histórico
```

O Medplum já possui suporte para `Binary` e `DocumentReference`. `Binary` representa o conteúdo bruto e `DocumentReference` fornece contexto e metadados pesquisáveis, incluindo paciente, autor, data, tipo e segurança. citeturn1search0turn1search1turn1search2

### Regra fundamental: preservar o original

Nunca substituir o documento original pelo resultado do OCR.

Para cada documento importado, manter:

1. arquivo original;
2. MIME type;
3. nome original;
4. tamanho;
5. data de envio;
6. paciente;
7. organização/tenant;
8. origem declarada;
9. OCR bruto, quando houver;
10. classificação automática, quando houver;
11. dados estruturados extraídos, quando houver;
12. confiança da extração, quando disponível;
13. estado de revisão;
14. usuário que revisou;
15. data da revisão.

O profissional deve poder abrir o original para comparar com a informação extraída.

### OCR não é diagnóstico

A IA/OCR pode:

- reconhecer texto;
- localizar datas;
- identificar possíveis nomes de exames;
- sugerir tipo de documento;
- sugerir entidades clínicas;
- estruturar informações para revisão.

A IA não deve:

- alterar silenciosamente o documento original;
- transformar uma sugestão em diagnóstico confirmado;
- substituir a avaliação profissional;
- apagar o texto que não conseguiu reconhecer;
- declarar que um documento é autêntico apenas porque foi lido.

## Dados enviados do Delchan para Health Connect

A arquitetura deve prever escrita no Health Connect, mas não deve gravar qualquer recurso clínico arbitrariamente.

Primeira fase:

- sinais vitais registrados no Delchan que possuam correspondência apropriada;
- peso;
- altura;
- outras categorias explicitamente suportadas pelo produto.

Antes de cada escrita:

1. verificar se o tipo é suportado;
2. verificar permissão de escrita;
3. mostrar ao usuário o que será compartilhado;
4. registrar origem como Delchan;
5. evitar duplicidade;
6. permitir desativar a sincronização.

Prescrições, diagnósticos, relatórios e documentos clínicos não devem ser automaticamente tratados como se fossem simples métricas de Health Connect.

## Dados que podem aparecer no Health Connect

A disponibilidade real depende das aplicações, dispositivos e permissões do usuário.

Por isso, o Delchan deve apresentar a integração como:

> "Dados disponíveis no Health Connect aos quais você autorizou acesso."

Não prometer que qualquer aparelho ou aplicativo fornecerá todos os dados.

Por exemplo, passos podem ser registrados por rastreamento do próprio dispositivo, enquanto pressão arterial ou hidratação dependem de uma fonte que registre esse tipo de informação. O próprio Health Connect documenta tipos de dados e suas permissões individualizadas. citeturn0search8turn0search12

## Qualidade do ar e dispositivos domésticos

Não assumir que "qualidade do ar" estará automaticamente disponível porque um ar-condicionado ou sensor existe.

A arquitetura deve permitir futuramente:

```
Dispositivo / fabricante
        ↓
API ou plataforma do fabricante
        ↓
Adaptador Delchan
        ↓
Modelo normalizado
        ↓
FHIR / Observation
```

Primeiro devemos implementar Health Connect com tipos comprovadamente disponíveis. Integrações de sensores domésticos serão adicionadas como conectores específicos quando a fonte e o contrato de dados forem conhecidos.

## Segurança e LGPD

Dados de saúde são dados pessoais sensíveis no contexto brasileiro. A arquitetura deve aplicar minimização e controle de acesso desde o início.

Requisitos mínimos:

- HTTPS;
- tokens nunca embutidos no aplicativo;
- nenhum segredo Medplum no APK;
- autenticação segura;
- sessão com expiração/renovação;
- logout;
- bloqueio de acesso entre tenants;
- autorização por usuário;
- consentimento/permissão explícita para Health Connect;
- possibilidade de desconectar;
- registro de auditoria das operações relevantes;
- criptografia em trânsito;
- proteção de dados locais do aparelho;
- não gravar prontuário completo em armazenamento local sem necessidade;
- logs sem dados clínicos desnecessários.

A implementação não deve declarar "conforme LGPD" apenas porque esses controles existem. A conformidade depende também de governança, contratos, retenção, direitos dos titulares, segurança operacional e revisão jurídica.

## Autenticação Medplum

O aplicativo é um cliente não confiável, como qualquer aplicação móvel. Não deve carregar credenciais de servidor.

A estratégia deve usar autenticação de usuário apropriada para cliente móvel, preferencialmente OAuth2 Authorization Code conforme os padrões suportados pelo Medplum.

O Medplum documenta autenticação cliente para aplicações web e nativas e recomenda OAuth2 Authorization Code quando o Medplum atua como provedor de identidade. citeturn1search3

### Nunca fazer

- colocar `MEDPLUM_CLIENT_SECRET` no aplicativo;
- colocar token administrativo no APK;
- usar credenciais de servidor como login do paciente;
- confiar no `tenantId` enviado pelo celular sem validação no servidor;
- considerar localStorage ou AsyncStorage uma fronteira de segurança.

## Estrutura proposta do repositório

A implementação móvel deve ser isolada do Next.js atual.

Proposta:

```
/
├── app/                         # Next.js existente
├── components/
├── lib/
├── pages/
├── docs/
│   └── 32-app-android-health-connect-e-historico-clinico.md
└── mobile/
    └── android/                 # primeira implementação móvel
```

A estrutura final pode mudar se a implementação demonstrar que um projeto Android separado ou um workspace compartilhado é mais seguro.

**Regra:** não reescrever o portal web existente para criar o aplicativo.

## Fases de implementação

### Fase A — Fundação Android

- criar projeto Android;
- configurar package/application ID;
- criar ambiente de desenvolvimento;
- conectar autenticação;
- criar tela de seleção de organização;
- criar login;
- criar sessão;
- carregar branding;
- criar tela inicial do paciente.

**Não integrar Health Connect ainda.**

### Fase B — Portal do paciente no Android

Reproduzir somente as capacidades que já existem no portal:

- perfil;
- dados básicos;
- agenda;
- documentos;
- resultados;
- plano de cuidado quando autorizado;
- comunicações quando autorizado.

A primeira versão não precisa copiar todas as telas administrativas.

### Fase C — Health Connect

Implementar:

- detecção de disponibilidade;
- tela de explicação;
- pedido granular de permissões;
- leitura;
- sincronização inicial;
- sincronização incremental;
- prevenção de duplicidade;
- status;
- desconexão;
- tratamento de erros.

Primeiros tipos:

1. passos;
2. pressão arterial;
3. frequência cardíaca;
4. saturação de oxigênio;
5. temperatura;
6. peso;
7. altura;
8. hidratação;
9. sono.

A lista deve ser validada contra a versão do SDK usada no projeto.

### Fase D — Escrita no Health Connect

Somente depois de a leitura estar estável:

- escrever dados selecionados;
- controlar permissões de escrita;
- prevenir duplicidade;
- registrar origem;
- oferecer configuração ao usuário.

### Fase E — Histórico documental

- câmera;
- seleção de PDF/imagem;
- compressão segura quando apropriada;
- upload;
- Binary;
- DocumentReference;
- associação ao paciente;
- classificação;
- OCR;
- revisão;
- visualização do original.

### Fase F — Apple

Somente depois que Android estiver validado com usuários reais.

A implementação Apple será separada, usando HealthKit e as permissões próprias do iOS.

## Critério de pronto

Uma funcionalidade somente será considerada concluída quando houver:

- código;
- teste;
- tratamento de erro;
- segurança;
- integração real quando aplicável;
- documentação atualizada;
- instruções de configuração;
- evidência de execução;
- status explícito: Implementado, Parcial/externo, Demonstrativo/simulado ou Não identificado.

## Regra para agentes de código

Todo pedido futuro ao agente de programação deve conter obrigatoriamente:

1. objetivo;
2. contexto do código existente;
3. arquivos que pode alterar;
4. arquivos que não deve quebrar;
5. modelo de dados;
6. segurança;
7. testes;
8. critérios de aceitação;
9. documentação que deve ser atualizada;
10. resumo final do que foi realmente implementado.

O agente **não deve afirmar que uma integração é real** se apenas criou a interface ou um mock.

## Próxima tarefa de implementação

A próxima tarefa de código deve ser **Fase A — Fundação Android**, sem Health Connect ainda.

Depois de a fundação compilar e autenticar, implementar a Fase B. Somente então iniciar a Fase C.

Isso reduz o risco de misturar problemas de autenticação, multi-tenant, navegação e Health Connect em uma única mudança grande.
