# Plan Maestro de Implementación: UAI Platform

> **Living Document**
> Este documento rastrea todas las tareas técnicas del proyecto, desde la concepción hasta el mantenimiento.
> Se actualiza automáticamente con cada sprint.

## Fase 1: Motor en Tiempo Real ✅
- [x] Analizar estado del proyecto e identificar siguiente pasos
- [x] Implementar streaming NDJSON en la API
- [x] Actualizar frontend para logs en tiempo real
- [x] Añadir habilidades funcionales (búsqueda web, SEO)
- [x] Refinar ejecutor con CrewAI

## Fase 2: Persistencia e Infraestructura ✅
- [x] Configurar PostgreSQL y checkpointer persistente en LangGraph
- [x] Implementar NextAuth v5 con protección de rutas
- [x] Crear panel de perfil de usuario

## Fase 3: Landing Page y Conversión ✅
- [x] Hero section con propuesta de valor irresistible
- [x] Copywriting persuasivo de ventas
- [x] Sección de planes y precios (Free, Essentials, Professional)
- [x] Sección UAI Hub (comunidad gamificada)
- [x] Sistema de premios e incentivos (Level up)
- [x] Sistema de progresión gamificada (niveles y personajes RPG)
- [x] Mission Control: comunidades de agentes colaborativos
- [x] Flujo de registro en 2 pasos con selección de plan
- [x] API de registro con almacenamiento de usuarios
- [x] Auth validando contra usuarios registrados
- [x] Refactorización de rutas (Landing vs Dashboard)

## Fase 4: App Funcional y Monetización (En Curso)
- [x] Dashboard funcional con input real
- [x] API de perfil de usuario
- [x] Sistema de gamificación (XP, niveles, rangos)
- [x] Sidebar con perfil real
- [x] XP post-ejecución
- [x] **Integración de Pagos (Stripe + Mercado Pago)**
    - [x] Checkout sessions combinadas
    - [x] Webhooks para activación de plan
    - [x] Portal de gestión de suscripción
    - [x] Detección inteligente de región (LATAM vs Global)
- [x] **Observabilidad**
    - [x] Sentry para errores de runtime
    - [x] LangSmith para trazas de agentes
- [ ] **Despliegue**
    - [x] Preparación para Railway (Migración a PostgreSQL)
        - [x] Schema SQL para usuarios y gamificación
        - [x] Adaptador de base de datos (`db-adapter.ts`)
        - [x] Migración de Auth y Webhooks
    - [ ] Despliegue en Railway (Backend + DB)
    - [ ] Despliegue en Vercel (Frontend - Opcional)
    - [ ] Configuración de dominios y SSL
- [ ] **UX Avanzada**
    - [ ] Refinar Mission Control (Visualización de grafos)
    - [ ] Onboarding interactivo "Primer Agente"

## Fase 5: Escala y Ecosistema
- [ ] Implementar bcrypt para hashing (Seguridad mejorada)
- [ ] Marketplace de agentes (V1)
- [ ] API pública
- [ ] Conectores (Slack, Discord, Notion, n8n)

## Notas Técnicas y Deuda Técnica
- **Auth**: Actualmente usa `SHA-256` simple. Migrar a `bcrypt` o `argon2` para producción estricta.
- **Testing**: Implementar tests E2E con Playwright para flujos de pago.
- **Mobile**: Optimizar dashboard para pantallas móviles (Responsive design revisión).
