# Plan de Despliegue MVP: UAI Platform en Railway

**Objetivo:** Desplegar una versión MVP (Minimum Viable Product) funcional y estable de UAI Platform en producción utilizando Railway.

**Autor:** Manus AI
**Fecha:** 01 de marzo de 2026

---

## Resumen Estratégico

Este plan detalla los pasos necesarios para llevar el proyecto `uai-platform` a un entorno de producción de manera rápida y segura. Se asume que todos los cambios recomendados (fijación de dependencias, mejoras de código, creación de Dockerfile, etc.) están incluidos en el Pull Request que acompaña a este plan.

El despliegue se realizará en **Railway**, aprovechando su integración con GitHub, bases de datos gestionadas y gestión de variables de entorno.

---

## Fase 0: Prerrequisitos

Antes de comenzar, asegúrate de tener lo siguiente:

1.  **Cuenta de GitHub:** Con acceso de administrador al repositorio `Jon-human-in-the-loop/uai-platform`.
2.  **Cuenta de Railway:** [Regístrate o inicia sesión en Railway](https://railway.app/).
3.  **Merge del Pull Request:** Asegúrate de que el PR con todas las mejoras (generado por Manus AI) haya sido aprobado y fusionado en la rama `main`.
4.  **Credenciales de Servicios Externos:** Ten a mano todas las claves de API y secretos necesarios que se listan en el archivo `.env.production.example`.

---

## Fase 1: Configuración del Proyecto en Railway

En esta fase, crearemos el proyecto en Railway y provisionaremos la base de datos.

1.  **Crear Nuevo Proyecto:**
    *   En tu dashboard de Railway, haz clic en **New Project**.
    *   Selecciona **Deploy from GitHub repo**.
    *   Elige el repositorio `Jon-human-in-the-loop/uai-platform`.
    *   Railway creará un nuevo servicio para la aplicación. No te preocupes por el primer despliegue, probablemente fallará hasta que configuremos las variables.

2.  **Aprovisionar Base de Datos PostgreSQL:**
    *   Dentro del proyecto recién creado en Railway, haz clic en el botón **+ New**.
    *   Selecciona **Database** y luego **PostgreSQL**.
    *   Railway creará un nuevo servicio de base de datos y, lo más importante, **inyectará automáticamente la variable `DATABASE_URL`** en tu servicio de aplicación. No necesitas copiarla manualmente.

---

## Fase 2: Configuración de Variables de Entorno

Este es el paso más crítico. Debes añadir todos los secretos y configuraciones para que la aplicación funcione. Utiliza el archivo `.env.production.example` como guía.

1.  **Acceder a las Variables:**
    *   En Railway, selecciona el servicio de tu aplicación (no la base de datos).
    *   Ve a la pestaña **Variables**.

2.  **Añadir Variables:**
    *   Haz clic en **New Variable** o **Raw Editor** para añadir las siguientes claves y sus valores correspondientes. **NO uses los valores de ejemplo, reemplázalos con tus credenciales de producción.**

    ```env
    # --- AUTENTICACIÓN (NextAuth v5) ---
    AUTH_SECRET= # Genera uno nuevo con: openssl rand -base64 32
    AUTH_URL=   # Déjalo en blanco por ahora, lo actualizarás después del primer despliegue
    AUTH_TRUST_HOST=true

    # --- MODELOS DE IA ---
    OPENAI_API_KEY=sk-...
    ANTHROPIC_API_KEY=sk-ant-...
    GOOGLE_GENERATIVE_AI_API_KEY=AIza...

    # --- MEMORIA COGNITIVA (Pinecone) ---
    PINECONE_API_KEY=pcsk_...
    PINECONE_ENVIRONMENT=us-east-1-aws # O tu entorno de Pinecone
    PINECONE_INDEX_NAME=uai-memory

    # --- PAGOS: STRIPE ---
    STRIPE_SECRET_KEY=sk_live_...
    STRIPE_WEBHOOK_SECRET=whsec_... # Lo obtendrás de Stripe después de crear el endpoint
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

    # --- PAGOS: MERCADO PAGO (LATAM) ---
    MP_ACCESS_TOKEN=APP_USR-...

    # --- OBSERVABILIDAD ---
    SENTRY_AUTH_TOKEN=sntrys_... # Necesario para que el build envíe sourcemaps a Sentry
    SENTRY_DSN=https://...@sentry.io/...
    LANGCHAIN_TRACING_V2=true
    LANGCHAIN_API_KEY=lsv2_...
    LANGCHAIN_PROJECT=uai-platform-prod

    # --- CANALES DE MENSAJERÍA (Opcional para MVP) ---
    TWILIO_ACCOUNT_SID=
    TWILIO_AUTH_TOKEN=
    TWILIO_WHATSAPP_NUMBER=
    TELEGRAM_BOT_TOKEN=

    # --- SEGURIDAD Y ADMINISTRACIÓN ---
    ADMIN_EMAIL=admin@uai.ai
    ADMIN_PASSWORD= # Elige una contraseña segura
    SETUP_SECRET=   # Elige un secreto seguro para la inicialización de la DB
    REMOTE_EXECUTE_SECRET= # Elige un secreto seguro
    REMOTE_EXECUTE_WORKER_TOKEN= # Elige un token seguro
    ```

---

## Fase 3: Despliegue

Una vez que todas las variables de entorno estén configuradas, puedes lanzar el despliegue.

1.  **Redesplegar el Servicio:**
    *   Ve a la pestaña **Deployments** de tu servicio en Railway.
    *   Busca el último despliegue (probablemente fallido) y haz clic en el botón **Redeploy**.
    *   Railway ahora usará el `Dockerfile` y las variables de entorno para construir y desplegar la aplicación. Este proceso puede tardar varios minutos.

2.  **Monitorear el Despliegue:**
    *   Observa los logs de **Build** y **Deploy** en tiempo real para detectar cualquier error.
    *   Si el despliegue es exitoso, verás un estado "Active" y una URL pública generada por Railway (ej. `uai-platform-prod.up.railway.app`).

3.  **Actualizar la Variable `AUTH_URL`:**
    *   Copia la URL pública generada.
    *   Vuelve a la pestaña **Variables** y pega la URL en el valor de la variable `AUTH_URL`.
    *   Este cambio provocará un nuevo despliegue automático.

---

## Fase 4: Inicialización de la Base de Datos

La aplicación está en línea, pero la base de datos está vacía. Necesitamos crear las tablas iniciales y el usuario administrador.

1.  **Ejecutar el Script de Setup:**
    *   Abre tu navegador y ve a la siguiente URL, reemplazando `<tu-dominio-railway>` con tu URL real y `<tu-setup-secret>` con el secreto que definiste en las variables de entorno:

      `https://<tu-dominio-railway>.up.railway.app/api/admin/setup?secret=<tu-setup-secret>`

2.  **Verificar la Respuesta:**
    *   Deberías ver un mensaje JSON como: `{"success":true,"message":"Database initialized..."}`.
    *   Esto confirma que las tablas se han creado correctamente.

---

## Fase 5: Verificación Final y Pasos Post-Despliegue

1.  **Probar la Aplicación:**
    *   Ve a la URL principal de tu aplicación.
    *   Intenta registrar un nuevo usuario.
    *   Inicia sesión con las credenciales de administrador (`ADMIN_EMAIL` y `ADMIN_PASSWORD`).
    *   Navega por el dashboard y prueba crear y ejecutar un agente simple.

2.  **Configurar Webhooks de Pago:**
    *   **Stripe:** Ve a tu dashboard de Stripe > Developers > Webhooks. Crea un nuevo endpoint que apunte a `https://<tu-dominio-railway>.up.railway.app/api/webhooks/stripe`. Selecciona los eventos necesarios (ej. `checkout.session.completed`). Copia el "Signing secret" del webhook y pégalo en la variable `STRIPE_WEBHOOK_SECRET` en Railway.
    *   **Mercado Pago:** Configura de manera similar en tu dashboard de Mercado Pago, apuntando a `https://<tu-dominio-railway>.up.railway.app/api/webhooks/mercadopago`.

3.  **Configurar Dominio Personalizado (Opcional):**
    *   En Railway, ve a la pestaña **Settings** de tu servicio.
    *   En la sección **Domains**, puedes agregar tu propio dominio personalizado y seguir las instrucciones para configurar los registros DNS.

**¡Felicidades! Tu MVP de UAI Platform está ahora en producción.**
