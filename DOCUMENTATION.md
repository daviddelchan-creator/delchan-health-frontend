# Documentación Técnica y Funcional (Producción)

## 1. Ficha Técnica e Infraestructura Real
- **Backend & Base de Datos:** Servidor Medplum (FHIR R4) montado de forma nativa sobre PostgreSQL, alojado y gestionado dentro de Easypanel (IP: 201.54.18.220). Conexiones HTTPS a través del túnel/proxy interno definido en `next.config.mjs` apuntando a `ubuntu-medplum-1`.
- **Frontend Architecture:** Next.js 15 (App Router), React 18, TypeScript con tipado estricto, inyección estética híbrida de Mantine v7, Mantine Charts, Tabler Icons y Tailwind CSS.

## 2. Mapeo del 100% de Módulos y Funcionalidades del Sistema
- **Módulo 1: Omni-channel Chatter (Estilo Odoo):** Integración completa del sistema multicanal de mensajería para comunicación interna, vinculando el ChatterView y el AuditLogger inmutable para el rastreo y auditoría de eventos clínicos.
- **Módulo 2: CRM & Integración de WhatsApp API:** Arquitectura de gestión de relaciones con clientes/pacientes y pasarela de mensajería automatizada integrada.
- **Módulo 3: Salud Digital y Portabilidad (Saúde Connect / Wallet):** Soporte multiidioma nativo. Generación y distribución programática de SMART Health Links (SHL) con encriptación nativa para la compilación y exportación de la "carteirinha" de datos básicos en Apple Wallet (.pkpass) y Google Wallet.
- **Módulo 4: Enrutamiento de Email Multi-Tenant y Línea de Tiempo:** Lógica del backend encargada de mapear dominios personalizados y proveedores de correo independientes por clínica (Brevo, Zoho, etc.) y estructurar la línea de tiempo histórica del paciente.
- **Módulo 5: Autenticación Dinámica por Tenant:** Estrategia basada en el React Context API (`TenantContext`) que valida e inicia sesión inyectando el ID de membresía de Medplum (`.memberships[0].id`) en lugar de referencias de perfil genéricas, protegiendo las marcas blancas de cada clínica.
- **Módulo 6: Inventario Avanzado ITAM y Rastreo RFID Físico:** Sistema de telemetría que procesa payloads Zod provenientes de antenas UHF (Zebra/Impinj), lee credenciales MIFARE DESFire/Biometría y cruza ubicaciones con los recursos `Encounter` y `Schedule` de Medplum para disparar alertas de robo en tiempo real vía Server-Sent Events (SSE).

## 3. Registro Histórico de Errores Resueltos (Evitar Regresiones)
- Resolución del conflicto de dependencias mediante `--legacy-peer-deps`.
- Migración de hooks hacia la nueva librería modular unificada `@medplum/react-hooks` (Medplum v5).
- Solución al bloqueo de CORS mediante el proxy de `next.config.mjs`.
- Reemplazo del formulario nativo roto por el formulario personalizado con `medplum.startLogin()`.
