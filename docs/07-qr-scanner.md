# 7. QR, scanner e ingestão documental

## Geração
`lib/qr-pdf-generator.ts` gera PDF A4 com:
- QR Code;
- tracking code;
- cabeçalho clínico;
- dados do paciente/profissional;
- seções SOAP;
- assinatura/carimbo;
- rodapé de rastreamento.

## Tracking code
Formato:
`FORM-{TENANT}-{TIMESTAMP}-{UUID6}`

O tenant é normalizado para caracteres alfanuméricos e limitado a 10 caracteres.

## Scanner
O repositório possui decoder QR e endpoints de ingestão/scanner. A ingestão deve ser testada com:
- imagem nítida;
- foto inclinada;
- baixa iluminação;
- múltiplos documentos;
- QR parcialmente degradado.

## Fluxo operacional
1. gerar formulário;
2. imprimir;
3. preencher;
4. digitalizar/fotografar;
5. detectar QR;
6. identificar tracking code;
7. associar ao contexto correto;
8. persistir/encaminhar o documento.
