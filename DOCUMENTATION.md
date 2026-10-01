# Manual Técnico y Funcional del SaaS Medplum & Next.js

Bienvenido a la documentación técnica y arquitectónica del sistema EHR (Electronic Health Record) y EMPI (Enterprise Master Patient Index). Este manual está diseñado para proporcionar a los desarrolladores e ingenieros de integración una comprensión profunda y rigurosa del flujo de la aplicación.

---

## 1. Ficha Técnica y Arquitectura del Sistema

*   **Nombre del Sistema:** SaaS Multi-Tenant (EHR & EMPI) basado en estándares internacionales de salud.
*   **Frontend Framework:** Next.js 15 (App Router) y React 18.
*   **Capa Visual UI/UX:** Mantine v7, Mantine Charts y Tabler Icons.
*   **Backend & Base de Datos:** Medplum Server (FHIR R4) sobre PostgreSQL, alojado en Easypanel (IP: 201.54.18.220).
*   **Gestión de Estado Central:** React Context API utilizando `TenantContext` para inyección de configuraciones de clínicas y marcas blancas (White-Labeling).

---

## 2. Topología de Componentes y Enrutamiento Condicional

El sistema emplea un enrutamiento condicional basado en la autorización de los roles extraídos del backend Medplum. El flujo principal se rige de la siguiente manera:

*   **`/admin` (God Mode):** Panel de control omnipotente para el Super Administrador. Habilita la gestión de módulos granulares del SaaS, configuraciones de facturación, RBAC (Role-Based Access Control) y configuraciones de marca blanca por Tenant.
*   **`/doctor` (Practitioner):** Centro de comando clínico. Incluye paneles de métricas (Charts), la agenda del día sincronizada, y proporciona accesos rápidos a las historias clínicas electrónicas.
*   **`/patient`:** Portal de acceso para los pacientes que les permite revisar su historial de atenciones y solicitar agendamiento.
*   **`ClinicalEditor` / `PatientWorkspace`:** El entorno de redacción clínica principal. Proporciona soporte para la redacción bajo la estructura SOAP, aprovecha plantillas de Tiptap, y mantiene una línea de tiempo longitudinal del paciente a través de un motor de recursos FHIR, el cual se inyecta condicionalmente en el layout principal.

---

## 3. Registro Histórico de Errores y Soluciones Implementadas

Para preservar el conocimiento institucional y evitar regresiones, se listan a continuación los bloqueos técnicos experimentados durante el ciclo de vida y sus respectivas resoluciones:

1.  **Conflicto de Dependencias NPM (ERESOLVE):**
    *   **Problema:** Incompatibilidad en las dependencias pares entre Mantine v7 y la versión actual de `@medplum/react`.
    *   **Solución:** Instalación forzada mediante `npm install --legacy-peer-deps`.
2.  **Carga Incompleta de Hooks (`@medplum/react-hooks`):**
    *   **Problema:** Error de *módulo no encontrado* derivado de cambios estructurales y deprecaciones en la versión 5.0 del ecosistema Medplum.
    *   **Solución:** Se refactorizaron y actualizaron todas las importaciones de `useMedplum` y ganchos derivados hacia la nueva librería unificada de hooks.
3.  **Bloqueo CORS (Error 405 / Failed to fetch):**
    *   **Problema:** Las peticiones desde el navegador local de desarrollo hacia la instancia en Easypanel eran bloqueadas por políticas de origen cruzado.
    *   **Solución:** Implementación de un Proxy inverso en `next.config.mjs` que actúa como túnel enrutando el tráfico directamente hacia el contenedor local `ubuntu-medplum-1`.
4.  **Colapso de Interfaz de Login (MEDPLUM_LOGO_URL):**
    *   **Problema:** Defecto nativo de renderización del componente `<SignInForm>` del SDK cuando la URL del logotipo fallaba.
    *   **Solución:** Deprecación del componente SDK por defecto. Se construyó un formulario de inicio de sesión personalizado 100% en Mantine, orquestando directamente la API de bajo nivel mediante `medplum.startLogin()`.
5.  **Expulsión Automática Post-Login (Profile not found):**
    *   **Problema:** Tras autenticarse exitosamente, el sistema devolvía al usuario al login por fallos al ubicar el perfil.
    *   **Solución:** Ajuste en la capa de autenticación, mapeando la respuesta para inyectar explícitamente el ID de membresía (`.memberships[0].id`) en lugar de depender de la referencia de perfil nativa hacia la API de Medplum.

---

## 4. Guía Funcional del Módulo de Inventario ITAM RFID

El submódulo ITAM RFID brinda control logístico y prevención física antirobo integrando la infraestructura clínica directamente con agendas médicas.

### Habilitación Dinámica
El administrador central puede encender o apagar el módulo por cada clínica a través de la interfaz **`ModuleFeatureToggle`**. Cuando está apagado, las peticiones y cálculos de trazabilidad quedan suspendidos para optimizar recursos del sistema.

### Rastreo en el Plano 3D
Al activar el módulo, la clínica obtiene acceso al mapa de telemetría física en 3D (`FloorPlan3D`).
*   **Funcionamiento:** Las antenas UHF instaladas en puertas y pasillos transmiten lecturas de los dispositivos etiquetados.
*   **Validación Cruzada:** El servicio backend valida la proximidad del dispositivo contra las tarjetas de identificación (credenciales del personal). Si un dispositivo sale de una zona permitida o se mueve de manera errática, el sistema revisa la agenda activa (Eventos `Encounter` en Medplum) del profesional asignado.
*   **Alertas Instantáneas (SSE):** Si el movimiento carece de justificación clínica o presencial, el backend dispara una alerta crítica a través de Server-Sent Events (SSE). El estado reactivo (`useSecurityStream`) del navegador intercepta esta orden, y en fracciones de segundo, el ítem en el plano 3D comenzará a parpadear agresivamente en color rojo, notificando a seguridad.