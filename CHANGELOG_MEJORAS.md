# Changelog de Mejoras — UAI Platform

> Registro detallado de todas las mejoras, correcciones y funcionalidades implementadas.
> Fecha: 11 de marzo de 2026

---

## 1. Correcciones de Build (TypeScript)

| Archivo | Problema | Solución |
|:---|:---|:---|
| `src/lib/orchestrator/graph.ts` | Error de tipo: faltaba campo `id` en `agent_config` | Agregado campo `id?: string` al tipo |
| `src/components/dashboard/Sidebar.tsx` | XP mostraba "undefined / undefined" | Corregido para usar `profile.xp` y `profile.progressToNextLevel` de la API |

---

## 2. Nueva API: Memoria Colectiva (`/api/memory/learnings`)

**Archivo:** `src/app/api/memory/learnings/route.ts` (nuevo)

La página de Memoria Colectiva usaba datos hardcodeados con `setTimeout`. Se creó una API REST completa que conecta a la tabla `agent_learnings` de la base de datos.

**Funcionalidad implementada:**
- Endpoint GET con parámetros `search` y `limit`
- JOIN con tabla `agents` para mostrar nombre del agente
- Estadísticas globales: total de aprendizajes, agentes contribuyendo, aprendizajes recientes
- Búsqueda por texto en summary, learning_type y keywords

---

## 3. Página de Memoria Colectiva — Conectada a BD Real

**Archivo:** `src/app/dashboard/memory/page.tsx` (reescrito)

Se reescribió completamente la página de Memoria Colectiva para conectarla a la API real.

**Cambios:**
- Eliminados datos mock/hardcodeados del `useEffect`
- Implementada llamada a `/api/memory/learnings` con manejo de errores
- Estadísticas dinámicas desde la BD (antes eran valores estáticos)
- Búsqueda funcional con debounce de 400ms
- Toggle entre Vista Lista y Vista Red Neural
- Botón de refrescar datos
- Estado vacío profesional cuando no hay aprendizajes
- Complejidad mapeada desde `learning_type` cuando no existe en la BD

---

## 4. Funcionalidad de Pausa/Reanudación de Tareas Programadas

**Archivos modificados:**
- `src/app/api/scheduled-tasks/route.ts` — Nuevo método PATCH
- `src/components/scheduler/ScheduledTasksView.tsx` — Botón funcional

El botón "Pausar" tenía un comentario `// TODO: Implementar pausa`. Se implementó completamente.

**Cambios:**
- Nuevo endpoint `PATCH /api/scheduled-tasks` que alterna el estado entre `ENABLED` y `PAUSED`
- El botón llama a la API y actualiza el estado local sin recargar
- Texto del botón cambia dinámicamente: "Pausar" / "Reanudar"
- Icono cambia entre Pause y Play según el estado
- Estilo visual diferente para estado pausado (verde) vs activo (neutro)

---

## 5. Página de Auto-Sanación — Completamente Mejorada

**Archivo:** `src/app/dashboard/healing/page.tsx` (reescrito)

La página original solo mostraba 3 estrategias estáticas. Se amplió significativamente.

**Nuevas secciones:**
- **5 estrategias de recuperación** con barras de efectividad animadas (Rate Limit Recovery, JSON Repair, Context Compression, Retry with Backoff, Graceful Degradation)
- **Historial de eventos recientes** con timeline visual mostrando error, estrategia aplicada y resultado
- **Indicador de sistema activo** con animación pulse
- Diseño responsive con grid adaptativo

---

## 6. Webhook de Stripe — Mejorado con Créditos y Más Eventos

**Archivo:** `src/app/api/webhooks/stripe/route.ts` (reescrito)

El webhook original solo manejaba `checkout.session.completed`. Se amplió para cubrir el ciclo de vida completo de suscripciones.

**Nuevos eventos manejados:**
- `checkout.session.completed` — Activación de plan + asignación de créditos
- `customer.subscription.updated` — Detección de cancelación pendiente
- `customer.subscription.deleted` — Downgrade automático a plan free
- `invoice.payment_failed` — Logging de pagos fallidos
- `invoice.payment_succeeded` — Renovación mensual con créditos

**Créditos por plan:** Essentials (500), Professional (5,000), Enterprise (50,000)

---

## 7. Webhook de MercadoPago — Mejorado con Créditos y Suscripciones

**Archivo:** `src/app/api/webhooks/mercadopago/route.ts` (reescrito)

**Mejoras:**
- Soporte para tipos `subscription_authorized` y `subscription_preapproval`
- Asignación automática de créditos según plan al confirmar pago
- Logging detallado de estados: approved, pending, rejected
- Uso de `PAYMENT_PLANS` para mapear créditos correctamente

---

## 8. Nueva Función `addCredits` en DB Adapter

**Archivo:** `src/lib/db-adapter.ts` (editado)

Se agregó la función `addCredits(userId, credits)` que incrementa los créditos del usuario en la base de datos. Es utilizada por ambos webhooks (Stripe y MercadoPago) para asignar créditos al activar o renovar suscripciones.

---

## 9. Página de Checkout Success (nueva)

**Archivo:** `src/app/checkout/success/page.tsx` (nuevo)

Página de confirmación de pago exitoso con:
- Animación de entrada con Framer Motion
- Ícono de check animado
- Countdown de 5 segundos con redirección automática al dashboard
- Botón manual "Ir al Dashboard"
- Efectos de fondo con gradientes

---

## 10. Seed Data Automático en Setup

**Archivo:** `src/app/api/admin/setup/route.ts` (reescrito)

Al ejecutar el setup (`/api/admin/setup?secret=...`), ahora se insertan automáticamente datos de demo. Esto asegura que cualquier despliegue nuevo tenga contenido visible inmediatamente.

**Datos insertados automáticamente:**
- 5 agentes demo con niveles y XP variados
- 8 templates del marketplace con ratings y downloads
- Estadísticas de sanación (47 errores, 44 sanados)
- 5 aprendizajes de memoria colectiva con keywords
- 7 ejecuciones de demo para analytics (últimos 7 días)

---

## 11. Modelos de IA Actualizados

**Archivo:** `src/components/agents/CreateAgentModal.tsx` (editado)

Los modelos disponibles al crear un agente estaban desactualizados (GPT-4 Turbo, GPT-3.5 Turbo).

**Antes:** GPT-4 Turbo, GPT-3.5 Turbo, Claude 3 Sonnet, Claude 3 Opus, Gemini Pro
**Después:** GPT-4.1 Mini, GPT-4.1 Nano, Gemini 2.5 Flash, Claude 3.5 Sonnet, Claude 3 Opus

---

## Resumen de Impacto

| Métrica | Antes | Después |
|:---|:---|:---|
| Errores de build TypeScript | 1 | 0 |
| Páginas con datos mock/hardcodeados | 1 (Memoria) | 0 |
| APIs faltantes | 1 (Memory Learnings) | 0 |
| Botones sin funcionalidad (TODO) | 1 (Pausar tarea) | 0 |
| Eventos de webhook Stripe | 1 | 5 |
| Eventos de webhook MercadoPago | 1 | 3 |
| Página de checkout success | No existía | Creada |
| Seed data automático en setup | No | Sí (5 agentes, 8 templates, 5 learnings, 7 runs) |
| Modelos de IA disponibles | Desactualizados | Actualizados a 2026 |
| Asignación de créditos post-pago | No implementada | Implementada en ambos webhooks |

---

**Total de archivos modificados/creados: 12**

| Tipo | Archivos |
|:---|:---|
| Nuevos | `api/memory/learnings/route.ts`, `checkout/success/page.tsx` |
| Reescritos | `dashboard/memory/page.tsx`, `dashboard/healing/page.tsx`, `api/admin/setup/route.ts`, `api/webhooks/stripe/route.ts`, `api/webhooks/mercadopago/route.ts` |
| Editados | `Sidebar.tsx`, `graph.ts`, `db-adapter.ts`, `scheduled-tasks/route.ts`, `ScheduledTasksView.tsx`, `CreateAgentModal.tsx` |
