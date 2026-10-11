# Next.js Security Audit Report

## Resumen de Vulnerabilidades
Durante la auditoría del proyecto, la ejecución de `npm audit` detectó que la versión actual de Next.js (`15.5.6`) se encuentra expuesta a múltiples vulnerabilidades de seguridad (CVEs) clasificadas en su mayoría como **Altas** y **Críticas**.

Las principales amenazas incluyen:
1.  **Ataques de Denegación de Servicio (DoS)** a través del Image Optimizer y el enrutador (`next/image`, Server Components).
2.  **Ejecución Remota de Código (RCE)**.
3.  **Cross-Site Scripting (XSS)** en el uso de nonces CSP y componentes.
4.  **Envenenamiento de Caché (Cache Poisoning)** en el Middleware y React Server Components.

## Acción Recomendada
**No se recomienda ejecutar `npm audit fix --force`**, ya que Next.js sugiere instalar la versión parcheada `15.5.27` que queda fuera del rango de dependencias esperado por el proyecto y podría introducir regresiones graves (breaking changes) en el App Router y Server Actions, rompiendo el portal web y el SaaS de producción.

El camino seguro recomendado es:
1. Ejecutar las pruebas E2E actuales.
2. Hacer un upgrade menor manual y probado a un parche de seguridad de la rama 15.5.x (p.ej. `npm i next@15.5.x`) en lugar del default que tira la herramienta audit.
3. Verificar a nivel de red (WAF / EasyPanel) la limitación de peticiones para mitigar el DoS del Image Optimizer.