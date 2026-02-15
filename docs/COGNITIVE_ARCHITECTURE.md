# Arquitectura Cognitiva de UAI Platform (Niveles de Inteligencia)

Este documento detalla la jerarquía de modelos de IA y cómo interactúan los sistemas de control (hardcoded) con los agentes configurables por el usuario.

---

## 🧠 1. El Sistema Operativo Cognitivo (The Brain)
Estos son los nodos de control de la plataforma. **Son invisibles para el usuario final** y actúan como "gerentes" o "supervisores". Su modelo está **fijado en el código base** para garantizar la máxima capacidad de razonamiento, planificación y validación.

| Nodo | Función | Modelo (Hardcoded) | Razón de Elección |
| :--- | :--- | :--- | :--- |
| **Analizador (Planner)** | Desglosa la petición del usuario en pasos lógicos, asigna roles y consulta la memoria. | **Claude 3.5 Sonnet** | Requiere la máxima capacidad de contexto y razonamiento estructurado para no alucinar planes. |
| **Validador (Critique)** | Revisa el trabajo entregado por los agentes, detecta errores y decide si se necesita re-trabajo. | **Claude 3.5 Sonnet** | Necesita ser "más inteligente" o igual que el ejecutor para poder corregirlo. |
| **Reflexión (Memory)** | Sintetiza el aprendizaje final y lo guarda en la base de datos vectorial (Pinecone) para el futuro. | **Claude 3.5 Sonnet** | Capacidad de resumen precisa para no guardar basura en la memoria a largo plazo. |

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

## 🔑 Por qué esta separación es vital

1.  **Estabilidad:** Si dejáramos que un modelo "pequeño" o "rápido" (como un modelo local o una versión flash) hiciera la planificación (Analizador), el agente podría perder el rumbo o entrar en bucles infinitos.
2.  **Especialización:** Tú eliges el modelo del agente por sus fortalezas (ej. Gemini para contexto largo, GPT para código, Claude para escritura), pero la UAI asegura que la **gestión** del proceso siempre sea de primer nivel.
3.  **Costos vs. Calidad:** Usamos modelos "caros/inteligentes" solo donde es crítico (gestión), permitiéndote usar modelos más económicos o rápidos para la ejecución masiva.
