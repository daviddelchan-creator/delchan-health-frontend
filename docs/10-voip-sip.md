# 10. VoIP / SIP

## Estado identificado no repositório
Na análise do repositório `delchan-health-frontend`, **não foi localizada uma implementação explícita de SIP/VoIP** nem configuração comprovada de:
- SIP URI;
- servidor/registrar;
- proxy/outbound proxy;
- domínio SIP;
- usuário/ramal;
- senha SIP;
- TLS/SRTP;
- STUN/TURN;
- RTP/ICE;
- trunk;
- SBC;
- provedor VoIP.

Portanto, não é seguro inventar um procedimento de configuração como se esses recursos já estivessem implementados.

## O que a documentação futura deve cobrir
Quando houver integração VoIP, registrar:
1. provedor;
2. arquitetura (WebRTC, SIP.js, PBX, SBC ou API do provedor);
3. SIP domain/registrar;
4. outbound proxy;
5. ramais;
6. autenticação;
7. codecs;
8. portas SIP/RTP;
9. NAT/STUN/TURN;
10. TLS/SRTP;
11. gravação;
12. consentimento;
13. correlação entre chamada e Patient/Task/Communication FHIR;
14. tratamento de falhas;
15. monitoramento.

## Segurança
Nunca colocar senha SIP, token de provedor ou chave privada no código-fonte ou nesta documentação. Usar secret manager/variáveis protegidas.
