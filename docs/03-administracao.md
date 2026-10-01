# 3. Administração e White-Label

## Tenant Setup / God Mode
A tela `/setup` apresenta três grupos:

### White-Label & Domínio
- Nome da organização.
- Upload de logotipo PNG/SVG.
- Imagem de fundo da tela de login.
- Cor primária.
- Subdomínio.
- Domínio personalizado/CNAME.
- Verificação de DNS.

**Importante:** a presença de um campo na interface não significa que sua persistência esteja concluída. Validar o fluxo de gravação no backend antes de tratar uma opção como operacional em produção.

### Colaboradores & RBAC
A interface contempla funções como Super Admin, Especialista e Recepcionista, com permissões distintas. O controle efetivo deve ser validado no servidor/Medplum.

### Cofre de certificados
A interface contempla:
- profissional vinculado;
- arquivo PFX/P12;
- senha/PIN;
- armazenamento criptografado;
- status do certificado.

Não registrar senhas ou certificados na documentação.

## Administração da clínica
A área administrativa trabalha com Organization/FHIR e dados como CNPJ, telefone, e-mail e logo.

## Tenants
A administração possui conceitos de tenant, plano, cidade e cor interna, além de troca de tenant e ativação/desativação de módulos.

## Construtor
Há interface para construção de formulários/módulos e modelos de evolução.

## Branding
O layout atual contém branding padrão Delchan Health OS e cores hard-coded em algumas áreas. Para uma operação white-label completa, diferenciar:
1. tema global;
2. identidade do tenant;
3. assets de login;
4. favicon;
5. PDFs/impressos;
6. e-mails/mensagens;
7. domínio.
