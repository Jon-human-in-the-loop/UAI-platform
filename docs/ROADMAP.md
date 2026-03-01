# Hoja de Ruta: UAI Platform — Estado Actual y Próximos Pasos
> Última actualización: 01 de marzo de 2026

## Estado General
| Fase | Estado | Descripción |
|:---|:---|:---|
| **Fase 1** | ✅ Completada | Motor en tiempo real, streaming, habilidades funcionales |
| **Fase 2** | ✅ Completada | Persistencia PostgreSQL, NextAuth, hilos de ejecución |
| **Fase 3** | ✅ Completada | Landing page, comunidad gamificada, registro con planes |
| **Fase 4** | 🟡 En progreso | Monetización y UX completadas. Despliegue y observabilidad pendientes de cierre. |
| **Fase 5** | ⏳ Pendiente | Fundaciones implementadas, pero las características productivas no son parte del MVP inicial. |

---

## Fase 4: Monetización y Producción (Foco MVP)

### 4.1 Integración de Pagos (Stripe + Mercado Pago)
- [x] Configurar Stripe con productos y precios para cada plan
- [x] Configurar Mercado Pago para pagos en LATAM
- [x] Crear checkout session al seleccionar plan pagado
- [x] Webhook para confirmar suscripciones y activar plan en la DB
- [x] Portal de gestión de suscripción para el usuario
- [x] Detección automática de región para seleccionar pasarela

### 4.2 Observabilidad y Monitoreo
- [x] Integrar **Sentry** para monitoreo de errores (Frontend + Backend + Edge)
- [ ] Integrar **LangSmith** para trazas de agentes y costos por ejecución (Pendiente de verificación en producción)
- [ ] Dashboard de métricas técnicas (Pendiente de configuración en Railway Analytics)

### 4.3 Despliegue a Producción
- [x] Migración a PostgreSQL (Persistencia de datos)
- [x] Dockerización completa para despliegue en **Railway**
- [ ] Despliegue final en **Railway** (Pendiente de ejecución)
- [ ] Configuración de dominio personalizado (Post-despliegue)
- [ ] Configuración de gestor de secretos en Railway (Pendiente de ejecución)

### 4.4 Mejoras de UX y Engagement
- [x] Refinar sección Mission Control (estilo gamificado)
- [x] Onboarding interactivo post-registro (Tour guiado)
- [x] Dashboard de métricas de uso del usuario (Costos, Tokens) - *Funcional, con mejoras pendientes en la precisión de datos en vivo.*
- [x] Notificaciones de sinergias entre agentes

---

## Fase 5: Escala y Ecosistema (Post-MVP)

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

## Métricas de Éxito (MVP Q1 2026)

| Métrica | Objetivo |
|:---|:---|
| Usuarios registrados | 250+ |
| Conversión Free → Paid | 10% |
| Tiempo medio por sesión | > 5 min |
| Churn Mensual | < 10% |
