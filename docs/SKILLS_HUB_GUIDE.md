# 🛠️ UAI Skills Hub: Manual Operativo

Este documento detalla el funcionamiento interno de cada "superpoder" (Skill) integrado en la UAI Platform. Estos skills no son simples prompts; son **herramientas procedimentales** que los agentes invocan para ejecutar tareas técnicas de alto nivel.

---

## 1. Estrategia y Negocio (Business Intelligence)

### 💰 Pricing Strategy
- **Función:** Analiza el mercado y diseña modelos de monetización.
- **Uso en la Web:** Cuando solicitas un plan de negocio, el agente invoca este skill para calcular tiers de precios, modelos SaaS o estrategias de "precios psicológicos".
- **Salida:** Modelos ARPU optimizados y recomendaciones de empaquetado.

### 🚀 Launch Strategy (GTM)
- **Función:** Crea planes de Go-To-Market para nuevos productos.
- **Uso en la Web:** El agente lo usa para definir fases de lanzamiento (Beta, Hype, Escala), eligiendo los canales (X, Product Hunt) con mayor ROI agéntico.

### 📈 Lead Gen Expert
- **Función:** Diseña embudos de captación de clientes de forma autónoma.
- **Uso en la Web:** Si la misión es "conseguir clientes", este skill define el flujo: desde el lead magnet hasta el cierre comercial usando datos del Nodo de Memoria.

---

## 2. Ingeniería de Datos y Sistemas

### 🏗️ Database Architect
- **Función:** Diseña esquemas de bases de datos escalables (SQL, NoSQL, Vectorial).
- **Uso en la Web:** Si pides ayuda técnica para un desarrollo, el agente genera diagramas y requerimientos de indexación específicos para tu stack.

### 🧠 RAG Optimizer
- **Función:** Optimiza la recuperación de datos en Pinecone.
- **Uso en la Web:** Actúa internamente para asegurar que la memoria a largo plazo de la plataforma sea precisa y libre de alucinaciones mediante técnicas de RRF.

### 🔗 MCP Builder
- **Función:** Crea la estructura de conectores MCP (Model Context Protocol).
- **Uso en la Web:** Diseña interfaces para que la IA se conecte a herramientas externas (Stripe, GitHub, etc.) de forma segura.

---

## 3. Auditoría y Optimización (Quality Assurance)

### 🔍 Audit Website
- **Función:** Realiza un escaneo técnico y de conversión de una URL.
- **Uso en la Web:** El agente "visita" virtualmente tu web, detecta cuellos de botella en el checkout y propone mejoras de UX inmediatas.

### 🔐 Security Audit
- **Función:** Identifica vectores de ataque y vulnerabilidades.
- **Uso en la Web:** Analiza cabeceras de seguridad y propone protocolos de hardening para proteger la infraestructura del cliente.

### 🎨 UX/UI Pro Max
- **Función:** Aplica patrones de diseño de alta gama (Glassmorphism, heurísticas).
- **Uso en la Web:** Transforma una interfaz básica en una experiencia premium mediante micro-interacciones y feedback reactivo.

---

## 4. Psicología y Contenido (Marketing Intelligence)

### 👁️ Marketing Psychology
- **Función:** Analiza disparadores psicológicos (Escasez, Autoridad, Social Proof).
- **Uso en la Web:** Refina cualquier texto o propuesta de valor para que sea más persuasiva basándose en sesgos cognitivos documentados.

### ✍️ Copywriting Master
- **Función:** Refactoriza textos técnicos en copys de ventas usando marcos como PAS o AIDA.
- **Uso en la Web:** Convierte descripciones aburridas en argumentos de venta que conectan emocionalmente con el usuario.

---


---

## 5. Ingeniería Avanzada (Deep Tech Skills) [NUEVO]

### Ingeniería Avanzada (Deep Tech)
- **`critical` (jbrukh/think-critically):** Auditoría lógica y detección de sesgos.
- **`nextjs` (wsimmonds/nextjs-skills):** Arquitectura App Router y Server Actions.
- **`n8n` (czlonkowski/n8n-skills):** Automatización de flujos y orquestación de nodos.
- **`security` (clerk/skills):** Hardening de autenticación y sesiones.
- **`antigravity` (vudovn/kit):** Orquestación multi-agente de alto nivel.

### 🧠 Critical Thinking Protocol (jbrukh)
- **Función:** Auditoría lógica adversaria. Detecta falacias (hombre de paja, costo hundido) y sesgos cognitivos en planes de negocio o código.
- **Uso:** El "Challenger Node" lo invoca para destruir ideas débiles antes de que lleguen a producción.

### ⚛️ Next.js Expert (wsimmonds)
- **Función:** Patrones de arquitectura para App Router, Server Actions y Suspense.
- **Uso:** Garantiza que el código generado siga las *best practices* de Vercel (evitando useEffect en cascada, optimizando LCP).

### 🛡️ Auth & Security Auditor (Clerk/Supabase)
- **Función:** Hardening de sistemas de autenticación y gestión de sesiones.
- **Uso:** Revisa implementaciones de Middleware y RLS (Row Level Security) para prevenir fugas de datos.

### ⚙️ n8n Automation Expert (czlonkowski)
- **Función:** Diseño de flujos de trabajo en n8n, sintaxis de expresiones y configuración de nodos.
- **Uso:** Automatiza procesos de agencia, desde la captura de leads hasta la entrega de reportes complejos.

### 🌌 Antigravity Kit (vudovn)
- **Función:** Suite de herramientas de alto rendimiento para sistemas agénticos complejos.
- **Uso:** Despliega patrones de orquestación multi-agente y memoria compartida avanzada.

---

## 💡 Cómo los invoca el Agente
Cada vez que lanzas una **Misión**, el **Analizador (Claude 3.7)** identifica qué skills son necesarios del catálogo. El **Ejecutor** recibe estas herramientas, las "llama" con parámetros reales, y utiliza el resultado para construir su informe final. 

**Este es el fin de la complacencia algorítmica: ejecución real basada en herramientas de élite.**
