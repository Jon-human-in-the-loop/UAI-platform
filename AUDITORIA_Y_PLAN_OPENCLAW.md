# Auditoría Funcional y Plan de Integración con OpenClaw

> **Fecha:** 02 de marzo de 2026
> **Autor:** Manus AI

## 1. Auditoría Funcional: Realidad vs. Roadmap

Tras un análisis exhaustivo del código fuente y los documentos del proyecto, se presenta un resumen del estado funcional real de `uai-platform`.

### 1.1. Funcionalidades 100% Operativas

| Módulo | Estado | Descripción |
|:---|:---|:---|
| **Core de Agentes** | ✅ Real | El motor de agentes, la ejecución de misiones y el streaming de respuestas están completamente operativos y conectados a la base de datos. |
| **Autenticación** | ✅ Real | El registro, login y gestión de sesiones con NextAuth funcionan correctamente. |
| **Pagos** | ✅ Real | La integración con Stripe y Mercado Pago para suscripciones y gestión de planes está completa y funcional. |
| **Mission Control** | ✅ Real | El nuevo grafo orbital es 100% funcional y está conectado a APIs reales para visualizar agentes, sinergias y métricas. |
| **Canales** | ✅ Real | La configuración de canales (Telegram, WhatsApp, etc.) se guarda y recupera de la base de datos. Los webhooks están implementados. |
| **Marketplace** | ✅ Real | La visualización de templates y la lógica de compra/créditos están conectadas a la base de datos y operativas. |
| **Gamificación** | ✅ Real | El ranking de usuarios y la galería de personajes se basan en datos reales de la base de datos (XP, nivel, etc.). |

### 1.2. Funcionalidades Parciales o Mock

| Módulo | Estado | Descripción |
|:---|:---|:---|
| **Memoria Colectiva** | 🟡 Mock | La visualización del grafo de red neuronal (`NeuralNetworkVisualization.tsx`) utiliza datos *hardcodeados*. La API para obtener la memoria real no está implementada. |
| **Auto-Sanación** | 🟡 Parcial | La lógica de diagnóstico de errores está implementada, pero la aplicación de las estrategias (reintentar, cambiar modelo) no está conectada al flujo de ejecución del agente. |
| **Analítica ROI** | 🔴 UI Vacía | La página `/dashboard/analytics` es un placeholder sin ninguna funcionalidad conectada. |
| **Scheduler** | 🟡 Parcial | La UI para crear tareas programadas funciona y se conecta a la API, pero el *worker* que ejecuta esas tareas no está implementado. |

### 1.3. Conclusión de la Auditoría

El proyecto tiene una base **muy sólida y mayormente funcional**. Las características *core* (agentes, pagos, usuarios, Mission Control) están completas. Las áreas pendientes son funcionalidades secundarias o de "Fase 5" que no impactan el MVP actual, pero que son cruciales para cumplir la visión completa del roadmap.

## 2. Plan de Integración con OpenClaw

El objetivo es que OpenClaw actúe como el **cerebro central**, y `uai-platform` sea su **cuerpo y centro de comando visual**. `uai-platform` no ejecutará agentes directamente, sino que enviará las instrucciones al Gateway de OpenClaw, que es el que realmente ejecuta todo.

### 2.1. Arquitectura de Integración

1.  **OpenClaw Gateway como Cerebro:** Se debe instalar y ejecutar una instancia del [Gateway de OpenClaw](https://docs.openclaw.ai/gateway/protocol) en un servidor (puede ser en el mismo Railway o en otro lugar). Este Gateway será el único que se comunique con las APIs de OpenAI, Anthropic, etc.

2.  **`uai-platform` como Cliente Operador:** `uai-platform` se conectará al Gateway de OpenClaw a través de su API WebSocket (`ws://` o `wss://`). Se autenticará usando un `CLAWDBOT_GATEWAY_TOKEN`.

3.  **Flujo de Ejecución:**
    *   El usuario escribe una misión en el Mission Control de `uai-platform`.
    *   `uai-platform` **no** llama a su propia API `/api/agent/run`.
    *   En su lugar, envía un mensaje `exec` a través del WebSocket al Gateway de OpenClaw.
    *   El Gateway de OpenClaw ejecuta la misión, gestiona los modelos, el historial, etc.
    *   El Gateway envía eventos de vuelta a `uai-platform` a través del WebSocket (tokens, progreso, respuesta final).
    *   `uai-platform` actualiza su UI (el grafo orbital, el log, etc.) en tiempo real basándose en los eventos del Gateway.

### 2.2. Pasos Técnicos para la Integración

| Paso | Tarea | Archivos a Modificar |
|:---|:---|:---|
| **1. Instalar OpenClaw** | Instalar y configurar el Gateway de OpenClaw en un servidor accesible. Obtener la URL del WebSocket y el token de autenticación. | N/A (Infraestructura) |
| **2. Conectar WebSocket** | Crear un cliente WebSocket en el backend de `uai-platform` que se conecte al Gateway de OpenClaw al iniciar la aplicación. | `src/lib/openclaw-client.ts` (nuevo) |
| **3. Refactorizar Ejecución** | Modificar la API `/api/agent/run` para que, en lugar de ejecutar la lógica del agente, envíe la instrucción al Gateway de OpenClaw a través del WebSocket. | `src/app/api/agent/run/route.ts` |
| **4. Escuchar Eventos** | Implementar listeners en el cliente WebSocket para recibir eventos del Gateway (progreso, tokens, errores, etc.) y publicarlos en un canal de `pusher` o similar. | `src/lib/openclaw-client.ts` |
| **5. Actualizar UI** | Modificar el `MissionControlDashboard` para que se suscriba al canal de eventos y actualice la UI en tiempo real con los datos que llegan desde OpenClaw. | `src/components/mission-control/MissionControlDashboard.tsx` |
| **6. Variables de Entorno** | Agregar `OPENCLAW_GATEWAY_URL` y `OPENCLAW_GATEWAY_TOKEN` a las variables de entorno del proyecto en Railway. | `.env.production.example`, Railway Dashboard |

### 2.3. Cronograma Estimado

| Fase | Duración Estimada |
|:---|:---|
| **Paso 1 (Infra)** | 1-2 horas |
| **Pasos 2-6 (Desarrollo)** | 1-2 días |
| **Pruebas y Despliegue** | 1 día |
| **Total** | **~3 días** |

Este plan transformará a `uai-platform` de una aplicación monolítica a un centro de control desacoplado y mucho más potente, aprovechando toda la infraestructura y el ecosistema de OpenClaw.
