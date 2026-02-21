# Arquitectura de Memoria Colectiva (Swarm Intelligence) para UAI Platform

## 1. Introducción

La Memoria Colectiva, o Swarm Intelligence, es un componente fundamental de la Fase 4 de UAI Platform, diseñada para permitir que los agentes de IA compartan conocimientos y aprendizajes entre misiones. Este sistema busca optimizar el rendimiento general de la flota de agentes, evitar la repetición de errores y acelerar la resolución de problemas complejos al aprovechar la experiencia acumulada.

## 2. Componentes Clave de la Arquitectura

La arquitectura de Memoria Colectiva se basará en los siguientes componentes:

### 2.1. Base de Datos de Conocimiento (Knowledge Base)

*   **Propósito:** Almacenar y gestionar los "aprendizajes" o "reflexiones" de los agentes de forma persistente y recuperable.
*   **Tecnología:** Se utilizará la base de datos vectorial existente, **Pinecone**, junto con **PostgreSQL** para metadatos estructurados. Pinecone almacenará los embeddings de las reflexiones, permitiendo búsquedas semánticas eficientes, mientras que PostgreSQL gestionará la información contextual y de atribución.
*   **Estructura de Datos (Ejemplo en PostgreSQL):**

    ```sql
    CREATE TABLE IF NOT EXISTS agent_learnings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        agent_id UUID REFERENCES agents(id) ON DELETE CASCADE, -- Agente que generó el aprendizaje
        mission_id UUID, -- Misión asociada al aprendizaje (si aplica)
        learning_type VARCHAR(50) NOT NULL, -- Ej: 'error_resolution', 'best_practice', 'optimization'
        summary TEXT NOT NULL, -- Resumen del aprendizaje
        details JSONB, -- Detalles estructurados del aprendizaje (ej: pasos para resolver un error)
        keywords TEXT[], -- Palabras clave para búsqueda
        embedding_id VARCHAR(255), -- ID del embedding en Pinecone
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    ```

### 2.2. Módulo de Reflexión y Abstracción (Reflection & Abstraction Module)

*   **Propósito:** Procesar las experiencias de los agentes al finalizar una misión (o en puntos clave durante la misma) para extraer aprendizajes significativos y generalizables.
*   **Funcionamiento:** Un agente especializado, o una función dentro del orquestador, analizará los logs de la misión, los resultados y los errores. Utilizará un LLM para sintetizar estos datos en "reflexiones" concisas y estructuradas, que luego serán guardadas en la Base de Datos de Conocimiento.
*   **Integración:** Se extenderá la funcionalidad de `src/lib/memory.ts` para incluir la lógica de abstracción y guardado de estos aprendizajes.

### 2.3. Módulo de Recuperación de Conocimiento (Knowledge Retrieval Module)

*   **Propósito:** Permitir que los agentes consulten la Base de Datos de Conocimiento para obtener información relevante antes o durante la ejecución de una misión.
*   **Funcionamiento:** Cuando un agente se enfrenta a una nueva tarea o un problema, puede formular una consulta a este módulo. El módulo utilizará la búsqueda semántica de Pinecone (basada en embeddings) para encontrar los aprendizajes más relevantes y los presentará al agente como contexto adicional.
*   **Integración:** Se mejorará la función `queryMemory` en `src/lib/memory.ts` para permitir consultas más contextuales y filtrar por tipo de aprendizaje o agente.

### 2.4. Orquestador de Agentes (Agent Orchestrator)

*   **Propósito:** Coordinar la interacción entre los agentes y los módulos de Memoria Colectiva, asegurando que los aprendizajes se compartan y se utilicen de manera efectiva.
*   **Funcionamiento:** El orquestador (definido en `src/lib/orchestrator/graph.ts`) será modificado para:
    *   Invocar el Módulo de Reflexión y Abstracción al finalizar misiones o detectar eventos clave.
    *   Proporcionar a los agentes acceso al Módulo de Recuperación de Conocimiento al inicio de una misión o cuando se encuentren con un problema.
    *   Actualizar el `AgentState` con el contexto recuperado de la memoria colectiva.

## 3. Flujo de Datos y Operación

1.  **Inicio de Misión:** Un agente recibe una nueva misión. El orquestador consulta el Módulo de Recuperación de Conocimiento con el objetivo de la misión y el rol del agente para buscar aprendizajes relevantes.
2.  **Contextualización:** Los aprendizajes recuperados se inyectan en el `system_prompt` o `context_memory` del agente, proporcionando orientación basada en experiencias pasadas.
3.  **Ejecución de Misión:** El agente ejecuta la misión, interactuando con sus herramientas y modelos.
4.  **Detección de Eventos:** Durante la ejecución, el orquestador monitorea eventos clave (ej. errores, soluciones exitosas, optimizaciones inesperadas).
5.  **Finalización/Punto de Control:** Al finalizar la misión o en un punto de control predefinido, el orquestador invoca el Módulo de Reflexión y Abstracción.
6.  **Generación de Aprendizaje:** El módulo analiza la experiencia del agente y genera una o varias "reflexiones" estructuradas.
7.  **Almacenamiento:** Estas reflexiones se guardan en la Base de Datos de Conocimiento (Pinecone + PostgreSQL), enriqueciendo la memoria colectiva.
8.  **Optimización Continua:** En futuras misiones, otros agentes (o el mismo agente) podrán acceder a estos nuevos aprendizajes, cerrando el ciclo de retroalimentación y promoviendo la mejora continua.

## 4. Modificaciones en el Código Existente

*   **`src/lib/memory.ts`:**
    *   Extender `saveReflection` para aceptar `learning_type`, `mission_id`, `agent_id`, `summary`, `details`, y `keywords` para PostgreSQL.
    *   Modificar `queryMemory` para permitir filtrar por `learning_type` o `agent_id` y devolver la estructura completa del aprendizaje (no solo el texto).
*   **`src/lib/orchestrator/graph.ts`:**
    *   Añadir nodos o funciones para interactuar con los módulos de Reflexión y Recuperación.
    *   Actualizar la `AgentState` para manejar el contexto de memoria colectiva de forma más explícita.
*   **`src/lib/database.ts`:**
    *   Añadir la tabla `agent_learnings` (como se definió en la sección 2.1).
*   **`src/app/api/agent/run/route.ts`:**
    *   Integrar las llamadas al orquestador para el uso de la memoria colectiva al inicio y fin de la ejecución del agente.

## 5. Consideraciones Futuras

*   **Mecanismos de Ponderación:** Implementar un sistema para ponderar la relevancia de los aprendizajes (ej. basándose en el éxito de la misión, la antigüedad o la frecuencia de uso).
*   **Privacidad y Seguridad:** Asegurar que los aprendizajes compartidos respeten la privacidad de los usuarios y no expongan información sensible.
*   **Interfaz de Usuario:** Desarrollar una interfaz en el panel de control para visualizar los aprendizajes colectivos y el rendimiento del sistema de Memoria Colectiva.
