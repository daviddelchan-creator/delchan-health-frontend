// Ambiente de teste do Jest injeta uma URL dummy
// obrigatoriamente para satisfazer o bloqueio anti-falha de URL
// imposto no _layout.tsx e login.tsx.
// Jamais adicione localhost, 127.0.0.1 ou placeholder nestas configuracoes de testes.
process.env.EXPO_PUBLIC_API_URL = 'https://jest-mock.internal';
