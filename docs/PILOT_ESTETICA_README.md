# Delchan Health OS — Resumen de Versión Piloto (Estética y Cosmetología)

## 1. Resumen de Archivos Modificados
* `mobile/eas.json`: Archivo creado para habilitar la compilación del APK (Android) de forma local utilizando Expo Application Services (EAS). Este archivo define los perfiles de construcción (`preview` y `development`) orientados a generar un artefacto `.apk` instalable en lugar de un bundle de tienda.

*Nota: No se realizaron modificaciones en el código fuente de la aplicación web o móvil, ya que el recorrido básico solicitado (Login -> Gestión -> Clientes -> Servicios -> Agenda) ya está implementado y funcional con datos simulados/FHIR.*

## 2. Resultados de Compilación Web
La compilación web (Next.js) ha sido ejecutada y validada con éxito en el entorno de trabajo:
* Comando: `npm run build`
* Resultado: `Compiled successfully`
* Todas las rutas críticas (como `/doctor/agenda` y `/doctor/pacientes`) se generaron correctamente.

## 3. Estado de la Compilación Android
* **Estado Exacto:** La configuración de Expo (en `mobile/app.json` y `mobile/eas.json`) está **lista**. El identificador es correcto (`com.delchan.healthos`) y las dependencias son compatibles.
* **APK Generado:** *Pendiente de ejecución local.* En este entorno automatizado no se dispone del SDK de Android ni de las herramientas de Gradle necesarias para compilar el archivo `.apk` final, pero toda la infraestructura está preparada.
* **Instrucciones para generar el APK (Ejecutar en tu máquina):**
  1. Abre una terminal y navega a la carpeta mobile: `cd mobile`
  2. Instala la herramienta de EAS: `npm install -g eas-cli`
  3. Ejecuta la compilación local: `npx eas build -p android --profile preview --local` (o sin `--local` si prefieres que los servidores de Expo compilen el archivo por ti, lo cual te dará un enlace de descarga).
  *Nota: Recuerda configurar tu archivo `.env` en la carpeta `mobile/` con `EXPO_PUBLIC_API_URL=https://[URL-DE-TU-BACKEND]` antes de compilar.*

## 4. Instrucciones para probar el Recorrido Piloto
1. **Acceso (Web):** Entra a la pantalla inicial. Usa un correo ficticio (ej. `medico@delchan.com`) y cualquier contraseña.
2. **Selección de Negocio (Móvil):** En la app móvil (una vez compilada), verás opciones en la pantalla de Login. Selecciona `Centro de Estética & Longevidade`.
3. **Área de Gestión:** Al iniciar sesión como médico/profesional, accederás al panel principal (`/doctor`).
4. **Clientes (Pacientes):** Ve a la sección de "Pacientes". Aquí puedes ver pacientes de prueba. Haz clic en "Novo Paciente" para probar el formulario de registro.
5. **Agenda y Servicios:** Ve a la sección "Agenda". Al agendar, podrás seleccionar servicios preconfigurados (ej. "Cabine de Estética Facial"). Guarda la cita y verifica que aparece en el calendario.

## 5. Capacidades Demostrables vs. No Operativas

**✅ Lo que podemos demostrar honestamente:**
* Inicio de sesión estructurado y redireccionamiento por rol.
* Interfaz de usuario responsiva (Mantine) que simula el entorno de gestión.
* Lista de pacientes/clientes y formulario de alta de paciente.
* Módulo de agenda, selección de recursos (ej. Cabine de Estética) y creación de citas utilizando el formato internacional de salud (FHIR).
* Conexión entre la App Móvil (Login) y la API del Backend (suponiendo que configures la URL correctamente al compilar).

**❌ Lo que NO debemos ofrecer aún como operativo (Limitaciones del Piloto):**
* **Aislamiento de Datos (Multi-Tenant Real):** Aunque en la UI se puede elegir el "Tenant" (clínica), la base de datos subyacente de Medplum aún no está completamente aislada por identificadores de proyecto de forma nativa para todos los recursos. Los datos pueden cruzarse en el backend.
* **Cumplimiento LGPD Estricto:** Faltan auditorías de seguridad, trazabilidad de accesos (logs) reales y encriptación de datos en reposo demostrable.
* **Facturación / CRM Avanzado:** Las funciones de cobro y automatizaciones avanzadas son actualmente simuladas o están en desarrollo.

## 6. Bloqueo / Decisión requerida del propietario
**Decisión requerida:** Necesito saber qué URL pública de backend usaremos para la demostración móvil (la variable `EXPO_PUBLIC_API_URL`). ¿Utilizamos un entorno de "staging" alojado en EasyPanel, o ejecutarás la demo conectando el móvil a un servidor corriendo en tu computadora local (localhost/IP local)? Sin esto, el APK compilado no sabrá a dónde conectarse.
