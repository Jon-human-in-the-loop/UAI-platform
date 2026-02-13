# Guía de Despliegue en Railway 🚂

Sigue estos pasos para poner UAI Platform en producción.

## 1. Preparación del Proyecto
1.  Asegúrate de que todo el código esté subido a tu repositorio de GitHub.
2.  Ve a [Railway.app](https://railway.app/) y crea un **New Project**.
3.  Selecciona **"Deploy from GitHub repo"** y elige `uai-platform`.

## 2. Base de Datos (PostgreSQL)
1.  En el proyecto de Railway, haz clic en **New** -> **Database** -> **PostgreSQL**.
2.  Esto añadirá automáticamente la variable `DATABASE_URL` a tu proyecto. **No necesitas hacer nada más aquí.**

## 3. Variables de Entorno
Ve a la pestaña **Variables** de tu servicio `uai-platform` y añade las siguientes claves (copia los valores de tu `.env` local):

### 🔐 Auth & Config
*   `AUTH_SECRET`: (Genera uno nuevo con `openssl rand -base64 32` o usa el local)
*   `AUTH_URL`: `https://<tu-dominio-railway>.up.railway.app` (Lo obtendrás después de generar el dominio)
*   `AUTH_TRUST_HOST`: `true`

### 🧠 Modelos AI
*   `OPENAI_API_KEY`: `sk-...`
*   `ANTHROPIC_API_KEY`: `sk-ant-...`
*   `TAVILY_API_KEY`: `tvly-...`

### 💳 Pagos (Stripe & Mercado Pago)
*   `STRIPE_SECRET_KEY`: `sk_test_...`
*   `STRIPE_WEBHOOK_SECRET`: `whsec_...` (Ojo: Tendrás que actualizar esto con el endpoint de producción)
*   `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: `pk_test_...`
*   `MP_ACCESS_TOKEN`: `TEST-...`

### 🛠️ Observabilidad
*   `LANGCHAIN_TRACING_V2`: `true`
*   `LANGCHAIN_API_KEY`: `lsv2_...`
*   `SENTRY_AUTH_TOKEN`: (Si usas Sentry en build)

## 4. Configuración de Build
Railway debería detectar automáticamente que es un proyecto Next.js.
*   **Build Command:** `npm run build`
*   **Start Command:** `npm run start`

## 5. Inicialización de la Base de Datos ⚠️
Una vez desplegado, la aplicación arrancará pero la base de datos estará vacía (sin tablas).

1.  Abre tu navegador y ve a:
    `https://<tu-dominio-railway>.up.railway.app/api/admin/setup?secret=uai2026`
2.  Deberías ver un mensaje JSON: `{"success":true,"message":"Database initialized..."}`
3.  ¡Listo! La tabla `users` ha sido creada y el admin por defecto configurado.

## 6. Verificación Final
1.  Entra a la URL principal.
2.  Intenta registrarte o iniciar sesión con `admin@uai.ai` / `uai2026`.
3.  Ve al Dashboard y verifica que carga.

---
**Nota:** Para producción real, recuerda cambiar `STRIPE_SECRET_KEY` y `MP_ACCESS_TOKEN` a sus versiones "Live" (no test).
