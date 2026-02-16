# Arquitectura Cognitiva de UAI Platform (Niveles de Inteligencia)

Este documento detalla la jerarquía de modelos de IA y cómo interactúan los sistemas de control (hardcoded) con los agentes configurables por el usuario.

---

## 🧠 1. El Sistema Operativo Cognitivo (The Brain)
Estos son los nodos de control de la plataforma. **Son invisibles para el usuario final** y actúan como "gerentes" o "supervisores". Su modelo está **fijado en el código base** para garantizar la máxima capacidad de razonamiento, planificación y validación.

| Nodo | Función | Modelo (Vanguardia) | Protocolo / Skill |
| :--- | :--- | :--- | :--- |
| **Analizador (Planner)** | Orquestador maestro. Propone el plan inicial. | **Claude 3.7 Sonnet** | Ramificación Estratégica (A/B/C) |
| **Challenger (The Skeptic)** | **Auditor Adversario**. Intenta destruir el plan del Analizador antes de que se ejecute. | **Claude 3.7 / o1** | `jbrukh/think-critically` (Logic Protocol) |
| **Reflexión (Memory)** | Sintetiza el aprendizaje y lo inyecta en el **Nodo de Memoria Cognitiva (Pinecone)**. | **Gemini 1.5 Pro** | Compresión Semántica |

> **Nota:** Estos modelos NO son configurables por el usuario. Son la infraestructura de inteligencia de la UAI.

---

## 👷 2. La Pasarela de Ejecución (The Workforce)
Aquí es donde **tu elección de modelo** entra en juego. Los "Agentes" que creas en la plataforma son los trabajadores especializados que ejecutan las tareas definidas por el Analizador *solo si sobreviven al Challenger*.

| Entidad | Función | Modelo (Dinámico/Usuario) | Comportamiento |
| :--- | :--- | :--- | :--- |
| **Agente (Executor)** | Realiza la tarea específica (escribir, programar, investigar, diseñar). | **Gemini Pro / GPT-4o / Claude** | Se instancia dinámicamente según la configuración que el usuario eligió al crear el agente. |

### Flujo de Ejecución (Protocolo Hostil)

Imagina que pides: *"Quiero crear un competidor de Google Search rápido"*.

1.  **Analizador (Claude 3.7):**
    *   *Propuesta:* "Usaremos una API de Bing y un frontend en React..."
2.  **Challenger Node (The Skeptic):**
    *   *Acción:* Invoca skill `think-critically`.
    *   *Veredicto:* "🔴 **RECHAZADO**. Falacia de costo hundido. No tienes infraestructura de indexación. Competir con Google requiere mil millones en CapEx, no una API."
3.  **Analizador (Claude 3.7):**
    *   *Corrección:* "Entendido. Pivotamos a un *Buscador Vertical de Nicho* para abogados."
4.  **Challenger Node:**
    *   *Veredicto:* "🟢 **APROBADO**. Mercado viable, bajo CapEx."
5.  **Ejecutor (Tu Agente):**
    *   *Acción:* Genera el código del buscador vertical usando `wsimmonds/nextjs-skills` para asegurar arquitectura robusta.

---

## 🛡️ 3. El Protocolo de Razonamiento Avanzado (UAI-ARP)

Para eliminar la **"Complacencia Algorítmica"**, la UAI no responde linealmente. Cada misión activa un proceso de **Ramificación Estratégica** y **Filtrado Negativo**:

- **Ruta A (Operativa):** Basada en ejecución inmediata y búsqueda web intensiva.
- **Ruta B (Cognitiva):** Basada en el entrenamiento del Nodo de Memoria con datos del sector.
- **Ruta C (Agéntica):** Creación de micro-agentes autónomos de persistencia.

---

## ⚡ 4. Hub de Skills Pro (Integración Real)

La plataforma cuenta con un **Arsenal de 25+ Skills Profesionales** que los agentes invocan según la necesidad:

### Ingeniería Avanzada (Deep Tech)
- **`critical` (jbrukh/think-critically):** Auditoría lógica y detección de sesgos.
- **`nextjs` (wsimmonds/nextjs-skills):** Arquitectura App Router y Server Actions.
- **`n8n` (czlonkowski/n8n-skills):** Automatización de flujos y orquestación de nodos.
- **`security` (clerk/skills):** Hardening de autenticación y sesiones.
- **`antigravity` (vudovn/kit):** Orquestación multi-agente de alto nivel.

### Negocio y Estrategia
- **Estrategia:** Pricing, Launch (GTM), Lead Gen, Content Strategy.
- **Inteligencia:** RAG Optimizer, Marketing Psychology, Competitor Intelligence.
- **UX/UI:** UX/UI Pro Max, Audit Website.
