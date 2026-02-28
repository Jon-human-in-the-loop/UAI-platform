# Auditoría de Estado vs Roadmap (UAI Platform)

> Fecha de revisión técnica: 28 de febrero de 2026  
> Alcance: validación por evidencia en repositorio (`/workspace/uai-platform`), sin acceso a entornos productivos externos.

## Resumen Ejecutivo

- **Fase 4.1 (Pagos)**: **Verificada como implementada** en código (Stripe + Mercado Pago, checkout, webhooks, billing portal, selección por región/proveedor).
- **Fase 4.2 (Observabilidad)**: **Parcialmente verificada** (Sentry sí está inicializado en client/server/edge; LangSmith no aparece implementado explícitamente en código de app).
- **Fase 4.3 (Producción)**: **Parcialmente verificable** desde repo (PostgreSQL y despliegue Railway documentado; dominio personalizado y gestión de secretos siguen pendientes en roadmap).
- **Fase 4.4 (UX/Engagement)**: **Más avanzada de lo que refleja el roadmap** (Mission Control, onboarding y sinergias existen; dashboard de uso/costos parece presente pero con señales de mock/hardcode en UI).
- **Fase 5 (Escala/Ecosistema)**: **Mayormente pendiente** (hay piezas base, pero no implementación completa de marketplace público, API pública third-party y conectores nativos end-to-end).

---

## Matriz de Estado Detallada

### Fase 4.0 — Inyección de Inteligencia (Skills Hub)

| Ítem | Estado auditado | Nota |
|---|---|---|
| Instalación de skills externos y Challenger Node | ⚠️ No verificable 100% desde este repo | Se observan documentos y librerías de skills, pero no trazabilidad completa de instalación de repos externos en este código fuente. |

### Fase 4.1 — Integración de Pagos (Stripe + Mercado Pago)

| Ítem roadmap | Estado auditado | Evidencia técnica |
|---|---|---|
| Stripe con productos/precios | ✅ Verificado | Configuración de planes + `stripePriceId`. |
| Mercado Pago LATAM | ✅ Verificado | Cliente MP + flujo de suscripción. |
| Checkout session por plan | ✅ Verificado | API `/api/checkout`. |
| Webhook para activar plan en DB | ✅ Verificado | Webhooks Stripe y MP actualizan plan en DB. |
| Portal de suscripción | ✅ Verificado | API `/api/user/billing-portal`. |
| Detección de región/pasarela | ✅ Verificado | Selección de proveedor en config de pagos/flujo de checkout. |

### Fase 4.2 — Observabilidad y Monitoreo

| Ítem roadmap | Estado auditado | Evidencia técnica |
|---|---|---|
| LangSmith | ⚠️ Parcial / no concluyente | No se detecta módulo activo de integración en `src/`; sí hay mención documental/env esperadas. |
| Sentry FE/BE/Edge | ✅ Verificado | Inicialización en `sentry.client`, `sentry.server`, `sentry.edge`. |
| Dashboard técnico Vercel/Railway | ⚠️ No verificable desde repo | Requiere validar en plataforma externa. |

### Fase 4.3 — Despliegue a Producción

| Ítem roadmap | Estado auditado | Evidencia técnica |
|---|---|---|
| Migración PostgreSQL | ✅ Verificado | `pg` + pool + creación de esquema SQL. |
| Dockerización parcial (Buildpack Railway) | ⚠️ Parcial/no concluyente | No hay `Dockerfile`, pero roadmap/documentación declara buildpack en Railway. |
| Despliegue en Railway | ⚠️ Documentado, no comprobable runtime | URLs y guía de despliegue apuntan a Railway. |
| Dominio personalizado | ⏳ Pendiente (sin evidencia de cierre) | Sigue sin marcar en roadmap. |
| Gestor de secretos/env vars | ⏳ Pendiente formalmente | Sigue abierto en roadmap (aunque existe `.env.example`). |

### Fase 4.4 — UX y Engagement

| Ítem roadmap | Estado auditado | Evidencia técnica |
|---|---|---|
| Refinar Mission Control | ✅ Verificado (implementación presente) | Componente dedicado + APIs de misiones/sinergias. |
| Onboarding interactivo | ✅ Verificado | Modal/tutorial post-registro en layout dashboard. |
| Dashboard de uso (costos/tokens) | ⚠️ Parcial | Vista de billing y métricas presentes; parte del contenido luce estático. |
| Notificaciones de sinergias | ✅ Verificado | Tabla + API + visualización de sinergias/misiones. |

### Fase 5 — Escala y Ecosistema

| Bloque | Estado auditado | Nota |
|---|---|---|
| 5.1 Marketplace de agentes | ⚠️ Parcial | Existen tablas/API base de marketplace, no se confirma ecosistema completo con ratings + revenue share productivo. |
| 5.2 Performance (Workers/Edge/Redis) | ⏳ Mayormente pendiente | No evidencia clara de Web Workers ni Redis activo en app. |
| 5.3 Integraciones (API pública, webhooks, conectores nativos) | ⚠️ Parcial | Hay rutas API y conectores simulados, pero no stack completo de integraciones nativas productivas. |

---

## Recomendación de Actualización del Roadmap

Para que el roadmap refleje el estado real actual del código:

1. **Mover 4.4 Onboarding y Notificaciones de sinergias a `[x]`**.
2. **Cambiar 4.4 Dashboard de métricas a “parcial”** hasta reemplazar datos mock por métricas reales por usuario.
3. **Mantener 4.3 dominio personalizado y secrets como pendientes** hasta validar en infraestructura.
4. **Separar observabilidad en dos checks**: “Sentry (completo)” y “LangSmith (pendiente de verificación/activación real)”.
5. **Desglosar Fase 5 en “fundaciones listas” vs “feature productiva”** para evitar sobreestimar avance.

---

## Dictamen

El proyecto está **fuerte en Fase 4 (especialmente pagos y UX)** y ya tiene varios cimientos de Fase 5, pero hay diferencias entre “implementado en código”, “documentado” y “operativo en producción”. La principal deuda ahora es **cerrar verificación operativa (infra + métricas reales + observabilidad completa LangSmith)** para que el roadmap sea 100% trazable.
