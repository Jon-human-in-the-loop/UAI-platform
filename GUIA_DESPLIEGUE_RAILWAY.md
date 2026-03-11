# 🚀 Guía de Despliegue en Producción — UAI Platform

> **Para presentar a inversores hoy mismo.** Tiempo estimado de despliegue: 15-20 minutos.

---

## ✅ Estado Actual de la App

| Componente | Estado |
|:---|:---|
| **Build** | ✅ Compila sin errores |
| **Landing Page** | ✅ Funcional |
| **Login / Registro** | ✅ Funcional |
| **Checkout (Stripe + MercadoPago)** | ✅ Funcional |
| **Dashboard completo** | ✅ Funcional |
| **Base de datos PostgreSQL** | ✅ Configurada |
| **Sistema de gamificación XP** | ✅ Corregido |
| **Ranking / Leaderboard** | ✅ Funcional |
| **Analítica ROI** | ✅ Funcional |
| **Créditos y Facturación** | ✅ Funcional |

---

## 🌐 Opción 1: Railway (Recomendado — más rápido)

### Paso 1: Crear cuenta en Railway
1. Ir a [railway.app](https://railway.app) y crear cuenta con GitHub
2. Conectar el repositorio `Jon-human-in-the-loop/uai-platform`

### Paso 2: Crear el proyecto en Railway
1. Click en **"New Project"**
2. Seleccionar **"Deploy from GitHub repo"**
3. Elegir `Jon-human-in-the-loop/uai-platform`
4. Railway detectará automáticamente el `railway.json` y el `Dockerfile`

### Paso 3: Agregar PostgreSQL
1. En el proyecto, click en **"+ New Service"**
2. Seleccionar **"Database" → "PostgreSQL"**
3. Railway inyectará `DATABASE_URL` automáticamente

### Paso 4: Configurar Variables de Entorno
En **Settings → Variables**, agregar:

```env
# OBLIGATORIAS
AUTH_SECRET=<genera con: openssl rand -base64 32>
AUTH_URL=https://tu-app.up.railway.app
AUTH_TRUST_HOST=true
NEXTAUTH_URL=https://tu-app.up.railway.app
NEXTAUTH_SECRET=<mismo valor que AUTH_SECRET>

# ADMIN
ADMIN_EMAIL=admin@uai.ai
ADMIN_PASSWORD=UAI_Admin_2026!
SETUP_SECRET=uai-setup-secret-2026

# IA (al menos uno)
OPENAI_API_KEY=sk-...

# PAGOS (modo test para demo)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
MERCADOPAGO_ACCESS_TOKEN=TEST-...
```

### Paso 5: Inicializar la Base de Datos
Una vez desplegado, visitar:
```
https://tu-app.up.railway.app/api/admin/setup?secret=uai-setup-secret-2026
```

### Paso 6: Verificar el despliegue
- Landing: `https://tu-app.up.railway.app`
- Login admin: `admin@uai.ai` / `UAI_Admin_2026!`

---

## 🌐 Opción 2: Vercel (Alternativa)

### Paso 1
```bash
npm install -g vercel
vercel login
```

### Paso 2
```bash
cd uai-platform
vercel --prod
```

### Paso 3
Agregar las mismas variables de entorno en el dashboard de Vercel.

> **Nota:** Vercel requiere una base de datos PostgreSQL externa (Neon, Supabase o Railway DB).

---

## 🔑 Credenciales de Demo para Inversores

| Rol | Email | Contraseña |
|:---|:---|:---|
| **Admin** | admin@uai.ai | UAI_Admin_2026! |
| **Demo** | demo@inversores.com | Demo2026! |

---

## 💳 Configuración de Pagos para Producción

### Stripe (Global)
1. Crear cuenta en [stripe.com](https://stripe.com)
2. Obtener claves en Dashboard → Developers → API Keys
3. Para producción usar `sk_live_...` y `pk_live_...`
4. Configurar webhook en: `https://tu-app.up.railway.app/api/webhooks/stripe`

### MercadoPago (LATAM)
1. Crear cuenta en [mercadopago.com](https://mercadopago.com)
2. Obtener `ACCESS_TOKEN` en Developers → Credentials
3. Para producción usar `APP_USR-...`

---

## 📊 Planes y Precios

| Plan | Precio | Créditos |
|:---|:---|:---|
| **Free** | $0/siempre | 100 CR |
| **Básico (Essentials)** | $9/mes | 1,000 CR |
| **Advanced** | $29/mes | 2,500 CR |
| **Pro (Professional)** | $79/mes | 5,000 CR |

---

## 🎯 Flujo de Inscripción (Demo para Inversores)

1. **Landing** → Click "ACCESO INMEDIATO" o "COMENZAR AHORA"
2. **Registro** → Seleccionar plan → Ingresar datos
3. **Checkout** → Seleccionar método de pago (Stripe o MercadoPago)
4. **Dashboard** → Acceso completo a la plataforma

---

*UAI Platform v1.0 — Deja de Chatear, Empieza a Orquestar.*
