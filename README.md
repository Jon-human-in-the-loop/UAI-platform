# UAI PLATFORM

> **Motor de Orquestación de Agentes IA Autónomos** — Potenciado por LangGraph, Claude 3.7 y una capa cognitiva de memoria persistente.

---

## ¿Qué es UAI?

UAI Platform es un **motor agentic SOTA (State of the Art)** que permite crear, orquestar y desplegar ecosistemas de agentes de IA que piensan, ejecutan y aprenden de forma autónoma. A diferencia de los chatbots tradicionales, UAI construye flujos de trabajo multi-agente con memoria persistente, auto-sanación y razonamiento de alto nivel.

## Stack Tecnológico

| Capa | Tecnología |
|:---|:---|
| **Frontend** | Next.js (canary), React (rc), Framer Motion, TailwindCSS v4, ReactFlow |
| **Orquestación** | LangGraph (grafo de estados), LangChain |
| **Modelos IA** | Claude 3.7 (Anthropic), OpenAI, Google Gemini |
| **Base de Datos** | PostgreSQL (LangGraph Checkpointer) |
| **Autenticación** | NextAuth v5 (Auth.js) |
| **Memoria Vectorial** | Pinecone |
| **Iconografía** | Lucide React |

## Estructura del Proyecto

```
uai-platform/
├── src/
│   ├── app/
│   │   ├── page.tsx                  # Landing Page (pública)
│   │   ├── layout.tsx                # Layout raíz
│   │   ├── login/page.tsx            # Página de inicio de sesión
│   │   ├── registro/page.tsx         # Registro + selección de plan (2 pasos)
│   │   ├── dashboard/page.tsx        # Dashboard de orquestación (protegido)
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── [...nextauth]/route.ts  # NextAuth handler
│   │       │   └── register/route.ts       # API de registro de usuarios
│   │       └── agent/run/route.ts          # API de ejecución del motor (streaming)
│   ├── auth.ts                       # Configuración de NextAuth v5
│   ├── middleware.ts                 # Guardia de rutas (protege /dashboard)
│   ├── components/
│   │   ├── providers.tsx             # SessionProvider
│   │   └── flow-editor/             # Editor visual de grafos (ReactFlow)
│   └── lib/
│       ├── database.ts              # Cliente PostgreSQL
│       ├── memory.ts                # Integración con Pinecone
│       ├── orchestrator/
│       │   ├── graph.ts             # Definición del grafo LangGraph
│       │   ├── nodes.ts             # Nodos del grafo (analizador, ejecutor, reflexión)
│       │   ├── agents.ts            # Definiciones de agentes
│       │   └── memory.ts            # Memoria del orquestador
│       └── skills/
│           └── index.ts             # Habilidades: búsqueda web, análisis SEO
├── data/
│   └── users.json                   # Almacenamiento de usuarios (temporal)
├── tailwind.config.ts
├── next.config.ts
├── package.json
└── tsconfig.json
```

## Modelo de Negocio

| Plan | Precio | Características |
|:---|:---|:---|
| **UAI Free** | $0/siempre | 1 agente, 5 consultas/hora, modelos ultra-rápidos |
| **Básico (Essentials)** | $9/mes | 2 agentes, memoria persistente, 50 consultas/hora, tokens a coste directo |
| **Advanced** | $29/mes | Hasta 5 agentes coordinados, soporte multi-canal, analítica ROI |
| **Pro (Professional)** | $79/mes | Agentes ilimitados, auto-sanación, memoria infinita, soporte 24/7 |

## Sistema de Gamificación (UAI Hub)

| Rango | Nivel | Recompensa |
|:---|:---|:---|
| Aprendiz Arcano | 1-10 | Plan Free |
| Forjador de Nexos | 11-30 | 50% descuento |
| Oráculo Estelar | 31-70 | Plan Essentials gratis |
| Arquitecto Celestial | 71-99 | Plan Pro de por vida |
| 🐉 Dragón Primordial | 100+ | Acceso vitalicio total + Consejo Fundador |

## Instalación

```bash
# Clonar el repositorio
git clone <repo-url>
cd uai-platform

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus API keys

# Ejecutar en desarrollo
npm run dev
```

## Variables de Entorno Requeridas

```env
ANTHROPIC_API_KEY=         # Claude 3.7
OPENAI_API_KEY=            # OpenAI (opcional)
GOOGLE_API_KEY=            # Google Gemini (opcional)
PINECONE_API_KEY=          # Memoria vectorial
PINECONE_INDEX=            # Nombre del índice Pinecone
DATABASE_URL=              # PostgreSQL (directa)
DATABASE_URL_SESSION=      # PostgreSQL (pooler)
AUTH_SECRET=               # Secreto para NextAuth
```

## Rutas

| Ruta | Acceso | Descripción |
|:---|:---|:---|
| `/` | Pública | Landing page con propuesta de valor y pricing |
| `/login` | Pública | Inicio de sesión |
| `/registro` | Pública | Registro con selección de plan |
| `/dashboard` | Protegida | Panel de orquestación de agentes |
| `/api/agent/run` | Protegida | API de ejecución del motor IA |
| `/api/auth/register` | Pública | API de registro de usuarios |

---

*UAI Platform v1.0 — Deja de Chatear, Empieza a Orquestar.*
