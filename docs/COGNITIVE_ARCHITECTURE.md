# Arquitectura Cognitiva de UAI Platform (Niveles de Inteligencia)

Este documento detalla la jerarquía de modelos de IA y cómo interactúan los sistemas de control (hardcoded) con los agentes configurables por el usuario.

---

## 🧠 1. El Sistema Operativo Cognitivo (The Brain)
Estos son los nodos de control de la plataforma. **Son invisibles para el usuario final** y actúan como "gerentes" o "supervisores". Su modelo está **fijado en el código base** para garantizar la máxima capacidad de razonamiento, planificación y validación.

| Nodo | Función | Modelo (Vanguardia) | Razón de Elección |
| :--- | :--- | :--- | :--- |
| **Analizador (Planner)** | Orquestador maestro. Implementa el **Protocolo de Razonamiento Avanzado** (Ramificación A/B/C). | **Claude 3.7 Sonnet / o1** | Máxima capacidad de contexto y planificación estratégica sin alucinaciones. |
| **Validador (Critique)** | Control de calidad. Detecta fallos y activa el protocolo de **Auto-sanación**. | **Claude 3.7 / GPT-5 (o3)** | Necesita ser "más inteligente" o igual que el ejecutor para poder corregirlo. |
| **Reflexión (Memory)** | Sintetiza el aprendizaje y lo inyecta en el **Nodo de Memoria Cognitiva (Pinecone)**. | **Claude 3.7 / Gemini 1.5 Pro** | Capacidad de resumen precisa para no guardar basura en la memoria de largo plazo. |

> **Nota:** Estos modelos NO son configurables por el usuario. Son la infraestructura de inteligencia de la UAI.

---

## 👷 2. La Pasarela de Ejecución (The Workforce)
Aquí es donde **tu elección de modelo** entra en juego. Los "Agentes" que creas en la plataforma son los trabajadores especializados que ejecutan las tareas definidas por el Analizador.

| Entidad | Función | Modelo (Dinámico/Usuario) | Comportamiento |
| :--- | :--- | :--- | :--- |
| **Agente (Executor)** | Realiza la tarea específica (escribir, programar, investigar, diseñar). | **Gemini Pro / GPT-4o / Claude** | Se instancia dinámicamente según la configuración que el usuario eligió al crear el agente. |

### Flujo de Ejecución (Ejemplo Práctico)

Imagina que creas un agente llamado **"Marketer Pro"** y le asignas **Gemini 1.5 Pro**.

1.  **Usuario:** "Crea una campaña de emails para navidad".
2.  **Analizador (Claude 3.5):**
    *   *Pensamiento:* "Necesito una estrategia de 3 correos. Asignaré esto al agente 'Marketer Pro' que tiene las habilidades de redacción".
    *   *Output:* Plan de Acción JSON.
3.  **Ejecutor (Gemini 1.5 Pro - Tu Agente):**
    *   *Acción:* Recibe el plan y redacta los 3 correos usando su creatividad y velocidad (características de Gemini).
    *   *Output:* Texto de los correos.
4.  **Validador (Claude 3.5):**
    *   *Pensamiento:* "Revisando los correos de Gemini... El tono es correcto, pero falta el asunto en el segundo correo. Rechazo y pido corrección".
    *   *Acción:* Devuelve el trabajo al Ejecutor.
5.  **Ejecutor (Gemini 1.5 Pro - Tu Agente):**
    *   *Acción:* Corrige el asunto.
    *   *Output:* Correos corregidos.
6.  **Reflexión (Claude 3.5):**
    *   *Pensamiento:* "Aprendimos que para campañas navideñas, este usuario prefiere un tono emotivo. Guardo esto en memoria".

---

## 🛡️ 3. El Protocolo de Razonamiento Avanzado (UAI-ARP)

Para eliminar la **"Complacencia Algorítmica"**, la UAI no responde linealmente. Cada misión activa un proceso de **Ramificación Estratégica**:

- **Ruta A (Operativa):** Basada en ejecución inmediata y búsqueda web intensiva.
- **Ruta B (Cognitiva):** Basada en el entrenamiento del Nodo de Memoria con datos del sector.
- **Ruta C (Agéntica):** Creación de micro-agentes autónomos de persistencia.

## ⚡ 4. Hub de Skills Pro (Integración Real)

La plataforma cuenta con un **Arsenal de 17+ Skills Profesionales** que los agentes invocan según la necesidad:
- **Estrategia:** Pricing, Launch (GTM), Lead Gen, Content Strategy.
- **Ingeniería:** Database Architect, Security Audit, MCP Builder, Systematic Debugging.
- **Inteligencia:** RAG Optimizer, Marketing Psychology, Competitor Intelligence, UX/UI Pro Max.
