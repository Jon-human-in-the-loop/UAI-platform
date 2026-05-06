# UAI PLATFORM

> **Motor de Orquestación de Agentes IA Autónomos** — Potenciado por LangGraph, GPT-4o y una capa cognitiva de memoria persistente.

---

## ¿Qué es UAI?

UAI Platform es un **motor agentic SOTA (State of the Art)** que permite crear, orquestar y desplegar ecosistemas de agentes de IA que piensan, ejecutan y aprenden de forma autónoma. A diferencia de los chatbots tradicionales, UAI construye flujos de trabajo multi-agente con memoria persistente, auto-sanación y razonamiento de alto nivel.

## Características Principales

- **Orquestación Cognitiva:** Basado en LangGraph, permite a los agentes razonar, planificar y ejecutar tareas complejas en múltiples pasos.
- **Marketplace de Agentes:** Un ecosistema para adquirir plantillas de agentes (roles) pre-entrenadas con *System Prompts* de grado profesional.
- **Personalización Segura (Contexto de Marca):** Separa estrictamente el Prompt del experto (intocable) del contexto específico del usuario (empresa, tono, producto), evitando la degradación del comportamiento original.
- **Optimizador de Prompts Mágico ✨:** Integración de Claude Haiku (Meta-prompting) para transformar descripciones simples de usuarios en *System Prompts* avanzados.
- **Memoria Colectiva Vectorial:** El sistema aprende de las interacciones, extrayendo abstracciones clave (Abstract Learning) y almacenándolas en PostgreSQL (pgvector) para consultas futuras.

## Stack Tecnológico

| Capa | Tecnología |
|:---|:---|
| **Frontend / Fullstack** | Next.js 15 (App Router), React, Framer Motion, TailwindCSS |
| **Orquestación Agentic** | LangGraph, LangChain |
| **Modelos IA** | Claude 3.7 Sonnet / Haiku (Anthropic), OpenAI, Google Gemini |
| **Base de Datos & Memoria** | Neon PostgreSQL (Neon Serverless), pgvector |
| **Autenticación** | NextAuth v5 (Auth.js) |
| **Diseño & UI** | Lucide React |

## Estructura del Proyecto

```
uai-platform/
├── src/
│   ├── app/
│   │   ├── page.tsx                  # Landing Page
│   │   ├── dashboard/
│   │   │   ├── page.tsx              # Agent Studio (Chat/Orquestación)
│   │   │   ├── agents/               # Gestión de Agentes (Crear/Editar)
│   │   │   └── marketplace/          # Marketplace de Agentes
│   │   └── api/
│   │       ├── agents/               # CRUD de Agentes
│   │       ├── agent/run/            # Ejecución del motor LangGraph (Streaming)
│   │       ├── marketplace/          # Lógica de adquisición de agentes
│   │       └── admin/setup/          # Migraciones y Seed inicial (Marketplace)
│   ├── components/
│   │   ├── agents/                   # Tarjetas, Modales (Create/Edit)
│   │   ├── chat/                     # Interfaz de mensajería
│   │   └── dashboard/                # Layout y navegación
│   └── lib/
│       ├── database.ts              # Pooler de PostgreSQL y utilidades
│       ├── run-tracing.ts           # Trazabilidad de ejecuciones (Runs)
│       ├── collective-memory.ts     # Ingesta/Recuperación vectorial (pgvector)
│       └── orchestrator/
│           └── nodes.ts             # Definición del grafo y nodos (LangGraph)
├── tailwind.config.ts
├── next.config.ts
├── package.json
└── tsconfig.json
```

## Sistema de Progresión y Gamificación (XP)

Los agentes de la plataforma evolucionan a medida que interactúan. Cada "Run" exitoso otorga puntos de experiencia (XP) que aumentan el **Nivel** del agente. Futuras actualizaciones desbloquearán nuevas habilidades y mayor autonomía según el nivel del agente.

## Instalación y Configuración

```bash
# Clonar el repositorio
git clone <repo-url>
cd uai-platform

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
```

### Variables de Entorno Requeridas (.env)

```env
ANTHROPIC_API_KEY=         # (Opcional) Claude 3.7 Haiku (Para el Optimizador de Prompts)
OPENAI_API_KEY=            # GPT-4o (Motor principal de Orquestación y Embeddings)
GOOGLE_API_KEY=            # (Opcional) Gemini Flash
DATABASE_URL=              # PostgreSQL (Conexión Transactional)
DATABASE_URL_SESSION=      # PostgreSQL (Conexión Pooled para Edge/Serverless)
AUTH_SECRET=               # Hash para NextAuth (generar con `openssl rand -base64 32`)
```

### Inicialización de la Base de Datos

El sistema se encarga de crear las tablas automáticamente (`users`, `agents`, `run_summaries`, `memory_vectors`) mediante `lib/database.ts`.

Para poblar el Marketplace inicial con los agentes por defecto:
1. Navega a `http://localhost:3000/api/admin/setup` (Esto ejecutará el seeder).

---

*UAI Platform v1.1 — Deja de Chatear, Empieza a Orquestar.*
