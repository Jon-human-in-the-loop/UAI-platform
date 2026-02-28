# Hoja de Ruta: UAI Platform — Estado Actual y Próximos Pasos

> Última actualización: 28 de febrero de 2026

## Estado General

| Fase | Estado | Descripción |
|:---|:---|:---|
| **Fase 1** | ✅ Completada | Motor en tiempo real, streaming, habilidades funcionales |
| **Fase 2** | ✅ Completada | Persistencia PostgreSQL, NextAuth, hilos de ejecución |
| **Fase 3** | ✅ Completada | Landing page, comunidad gamificada, registro con planes |
| **Fase 4** | ✅ Completada | Monetización + operación productiva + UX engagement |
| **Fase 5** | 🟡 En progreso | Fundaciones implementadas, cierre productivo pendiente |

---

## Fase 4: Monetización y Producción

### 4.1 Integración de Pagos (Stripe + Mercado Pago)
- [x] Configurar Stripe con productos y precios para cada plan
- [x] Configurar Mercado Pago para pagos en LATAM
- [x] Crear checkout session al seleccionar plan pagado
- [x] Webhook para confirmar suscripciones y activar plan en la DB
- [x] Portal de gestión de suscripción para el usuario
- [x] Detección automática de región para seleccionar pasarela

### 4.2 Observabilidad y Monitoreo
- [x] Integrar **Sentry** para monitoreo de errores (Frontend + Backend + Edge)
- [x] Integrar **LangSmith** para trazas de agentes y costos por ejecución (vía configuración de entorno)
- [x] Dashboard de métricas técnicas (Vercel/Railway Analytics)

### 4.3 Despliegue a Producción
- [x] Migración a PostgreSQL (Persistencia de datos)
- [x] Dockerización parcial (via Railway Buildpack)
- [x] Despliegue final en **Railway**
- [ ] Configuración de dominio personalizado (requiere ejecución en infraestructura)
- [ ] Configuración de gestor de secretos (Environment Variables) en proveedor final

### 4.4 Mejoras de UX y Engagement
- [x] Refinar sección Mission Control (estilo gamificado)
- [x] Onboarding interactivo post-registro (Tour guiado)
- [x] Dashboard de métricas de uso del usuario (Costos, Tokens)
- [x] Notificaciones de sinergias entre agentes

---

## Fase 5: Escala y Ecosistema

### 5.1 Marketplace de Agentes
- [x] Publicar y compartir agentes configurados (base API + templates)
- [ ] Sistema de valoración y reviews de agentes
- [ ] Monetización para creadores (Revenue Share)

### 5.2 Optimizaciones de Rendimiento
- [ ] Web Workers para procesamiento pesado en cliente
- [ ] Edge Runtime para reducir latencia global
- [ ] Caché inteligente de respuestas de agentes (Redis)

### 5.3 Integraciones
- [ ] API pública para que terceros ejecuten agentes
- [x] Webhooks para integración con herramientas externas (base implementada)
- [ ] Conectores nativos (Slack, Discord, Notion, n8n)

---

## Métricas de Éxito

| Métrica | Objetivo (Q2 2026) |
|:---|:---|
| Usuarios registrados | 1,000+ |
| Conversión Free → Paid | 15% |
| Tiempo medio por sesión | > 8 min |
| Churn Mensual | < 5% |
