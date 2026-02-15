# Hoja de Ruta: UAI Platform — Estado Actual y Próximos Pasos

> Última actualización: 13 de febrero de 2026

## Estado General

| Fase | Estado | Descripción |
|:---|:---|:---|
| **Fase 1** | ✅ Completada | Motor en tiempo real, streaming, habilidades funcionales |
| **Fase 2** | ✅ Completada | Persistencia PostgreSQL, NextAuth, hilos de ejecución |
| **Fase 3** | ✅ Completada | Landing page, comunidad gamificada, registro con planes |
| **Fase 4** | ✅ Completada | Monetización e Integración de **UAI Skills Hub** (17+ Skills) |

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
- [x] Integrar **LangSmith** para trazas de agentes y costos por ejecución
- [x] Integrar **Sentry** para monitoreo de errores (Frontend + Backend + Edge)
- [x] Dashboard de métricas técnicas (Vercel/Railway Analytics)

### 4.3 Despliegue a Producción
- [x] Migración a PostgreSQL (Persistencia de datos)
- [x] Dockerización parcial (via Railway Buildpack)
- [x] Despliegue final en **Railway**
- [ ] Configuración de dominio personalizado
- [ ] Configuración de gestor de secretos (Environment Variables)

### 4.4 Mejoras de UX y Engagement
- [ ] Refinar sección Mission Control (estilo video de referencia gamificado)
- [ ] Onboarding interactivo post-registro (Tour guiado)
- [ ] Dashboard de métricas de uso del usuario (Costos, Tokens)
- [ ] Notificaciones de sinergias entre agentes

---

## Fase 5: Escala y Ecosistema (Futuro)

### 5.1 Marketplace de Agentes
- [ ] Publicar y compartir agentes configurados
- [ ] Sistema de valoración y reviews de agentes
- [ ] Monetización para creadores (Revenue Share)

### 5.2 Optimizaciones de Rendimiento
- [ ] Web Workers para procesamiento pesado en cliente
- [ ] Edge Runtime para reducir latencia global
- [ ] Caché inteligente de respuestas de agentes (Redis)

### 5.3 Integraciones
- [ ] API pública para que terceros ejecuten agentes
- [ ] Webhooks para integración con herramientas externas
- [ ] Conectores nativos (Slack, Discord, Notion, n8n)

---

## Métricas de Éxito

| Métrica | Objetivo (Q2 2026) |
|:---|:---|
| Usuarios registrados | 1,000+ |
| Conversión Free → Essentials | 15% |
| Tiempo medio por sesión | > 8 min |
| Churn Mensual | < 5% |
