---
name: taiga-ticket-docs
description: Reglas y plantillas para crear o documentar tickets de Taiga (épicas, historias de usuario, issues/bugs, tareas) usando el MCP de Taiga ya configurado. Use when creating, writing, documenting, or editing Taiga tickets — epics, user stories, issues, bugs, tasks — via mcp__taiga__* tools. Triggers: "crear historia de usuario", "documentar ticket de Taiga", "reportar bug en Taiga", "redactar épica/task en Taiga".
---

# Documentación de tickets de Taiga

Taiga lo leen perfiles **técnicos y no técnicos** (PO, QA, negocio, diseño). Un ticket bien escrito
se entiende sin explicación adicional y se escanea en segundos.

## Principios

1. **Jerga mínima**: lenguaje simple. Si un término técnico es imprescindible, explícalo en una
   frase o dilo en español dejando el término en inglés entre paréntesis la primera vez que aparece.
   Detalle: [references/redaccion.md](references/redaccion.md).
2. **Claridad visual**: usa el markdown que Taiga soporta (encabezados, listas, checklists, tablas,
   negritas) para que el ticket se escanee de un vistazo, no se lea como un párrafo continuo.
   Subset seguro: [references/taiga-markdown.md](references/taiga-markdown.md).
3. **Idioma adaptado**: no asumas español por defecto. Detecta el idioma predominante del proyecto/
   ticket y escribe en ese idioma (base español + término técnico en inglés entre paréntesis si el
   proyecto es hispanohablante; si el proyecto es en inglés, escribe en inglés).
4. **Aprobación obligatoria de comentarios**: `mcp__taiga__add_comment` NUNCA se llama en automático.
   Todo comentario se muestra primero al usuario en texto plano y se envía solo tras su aprobación
   explícita. Esto aplica a cualquier comentario (seguimiento, aclaración, cierre, etc.), no solo a
   la creación/edición de tickets.

## Workflow

1. **Detectar idioma predominante** del proyecto antes de escribir nada:
   - Revisa 2-3 tickets existentes con `mcp__taiga__list_userstories`, `list_issues` o `list_epics`
     (o `search`) sobre el `project_id` en cuestión.
   - Si predomina español → español + término EN entre paréntesis. Si predomina inglés → inglés.
   - Sin tickets previos o proyecto nuevo → usa el idioma en que el usuario te pidió la tarea; ante
     duda, español.
2. **Identificar el tipo de ticket** (epic / user story / issue / task) y tomar la plantilla
   correspondiente de [references/templates.md](references/templates.md).
3. **Redactar el `subject`**: conciso, orientado a valor/resultado, verbo en infinitivo o sustantivo
   claro. Evita IDs internos o jerga de implementación en el título.
4. **Redactar la `description`** siguiendo la plantilla, usando solo el subset de markdown de
   [references/taiga-markdown.md](references/taiga-markdown.md).
5. **Crear o actualizar vía MCP**:
   - Crear: `mcp__taiga__create_userstory` / `create_issue` / `create_epic` / `create_task`.
   - Editar: `update_userstory` / `update_issue` / `update_epic` / `update_task` — requieren
     `version` actual (obtenla primero con el `get_*` correspondiente para evitar conflicto de
     locking optimista).
6. **Verificar**: relee con `get_userstory` / `get_issue` / `get_epic` (según tipo) y confirma que
   encabezados, checklist y negritas quedaron como se esperaba. Si algo no calza, ajusta el markdown
   antes de darlo por terminado.
7. **Si el ticket requiere un comentario** (`add_comment`): redacta el texto, muéstralo íntegro al
   usuario, y espera su aprobación explícita antes de llamar a `mcp__taiga__add_comment`. Nunca lo
   envíes como parte de un flujo automático o "por si acaso".

## Reglas rápidas

- Un ticket = una unidad de valor entendible sola, sin depender de contexto externo.
- Criterios de aceptación en user stories: checklist `- [ ]` en lenguaje natural (no Gherkin salvo
  que el usuario lo pida explícitamente).
- Issues (bugs) siempre llevan pasos de reproducción numerados y resultado esperado vs. actual.
- No inventes datos (entorno, IDs, links) que el usuario no dio — pregunta o deja el placeholder
  explícito (`_pendiente_`).
- Antes de crear, confirma `project_id` correcto con `mcp__taiga__list_projects` si hay ambigüedad.
- **Comentarios (`add_comment`) son siempre mandatoriamente aprobados por el usuario antes de
  enviarse. Cero excepciones, cero automatismo.**
