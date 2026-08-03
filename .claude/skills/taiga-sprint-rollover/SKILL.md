---
name: taiga-sprint-rollover
description: Cierra un sprint de Taiga que termina y traslada lo pendiente a un sprint nuevo. Crea el milestone siguiente, detecta qué user stories/tareas quedaron sin terminar, y las mueve (copiando la US con sufijo "- Fase N" cuando tiene tareas mixtas, o moviendo la US completa cuando no tiene tareas propias). Usa esta skill siempre que el usuario mencione cerrar/rotar/terminar un sprint en Taiga, "fin de sprint", "crear el siguiente sprint", "mover pendientes al próximo sprint", o pegue un link a un taskboard de Taiga pidiendo ayuda para el cierre — incluso si no dice explícitamente "rollover".
---

# Taiga Sprint Rollover

Automatiza el cierre de un sprint de Taiga: identifica qué quedó sin terminar y lo traslada a un
sprint nuevo, preservando el trabajo ya hecho en el sprint viejo para que el historial quede intacto.

## Por qué existe esta skill

Cerrar un sprint a mano implica leer todas las US y tareas, decidir caso por caso qué está realmente
terminado, y mover lo demás sin perder trazabilidad. Es un proceso que se repite cada ciclo de sprint
y es fácil saltarse un caso borde (una US sin tareas propias, o una US con tareas mezcladas
cerradas/pendientes). Esta skill fija el criterio una vez para no tener que re-decidirlo cada vez.

## Flujo

### 1. Identificar proyecto y sprint a cerrar

- Si el usuario da un link de taskboard (`.../project/<slug>/taskboard/<sprint-slug>`), extrae el
  slug del proyecto y el slug del sprint de ahí.
- Si no, pregunta o infiere el proyecto con `mcp__taiga__list_projects` (match por nombre/slug).
- Resuelve el `project_id` con `mcp__taiga__get_project` si solo tienes el slug.
- Encuentra el milestone a cerrar con `mcp__taiga__list_milestones(project_id, closed=false)`:
  el que coincide con el link, o si no se especificó, el de `estimated_finish` más próximo/vencido.
- Si hay más de un milestone abierto y no es obvio cuál cerrar, pregunta — no asumas.

### 2. Levantar el estado del sprint

- `mcp__taiga__list_userstories(project_id, milestone_id)` — todas las US del sprint.
- `mcp__taiga__list_tasks(project_id, milestone_id)` — todas las tareas del sprint, agrupadas por US.
- Para saber qué status cuenta como "cerrado" en este proyecto (los nombres varían: Closed, Done,
  Archived...), no asumas el string "Closed" — usa `mcp__taiga__list_task_statuses` y
  `mcp__taiga__list_userstory_statuses` y fíjate en el flag de cierre que traiga cada status.

### 2b. Tareas sueltas (sin US padre)

Algunos proyectos (ej. tableros tipo Kanban/administrativos) tienen tareas creadas directo en el
sprint, sin ninguna US asociada — en `list_tasks` se notan porque no traen el campo `userstory`.
El MCP no tiene una tool para reasignarle el `milestone` a una tarea suelta directamente
(`move_task` solo reasigna `userstory_id`, y `update_task` no toca milestone), así que no hay forma
de moverlas sin darles una US padre.

Convención por defecto: crea una US contenedora `Pendientes sueltos - Fase N` en el sprint nuevo
(mismo criterio de numeración del paso 4) y mueve ahí, con `move_task`, las tareas sueltas
pendientes. Las tareas sueltas ya cerradas no se tocan, quedan en el sprint viejo. Si el usuario ya
dijo cómo prefiere resolver este caso, usa esa preferencia sin volver a preguntar.

### 3. Clasificar cada US

Para cada US del sprint, mira sus tareas:

| Situación | Acción |
|---|---|
| Todas las tareas cerradas (o la US no tiene tareas y su propio status ya es de cierre) | **Ya terminada** — no tocar, queda en el sprint viejo tal cual. |
| Tiene tareas mezcladas (algunas cerradas, algunas no) | **Rollover parcial** — crear copia de la US, mover solo las tareas pendientes a la copia. |
| No tiene ninguna tarea y su status sigue abierto (la US misma es el pendiente) | **Rollover directo** — mover la US original entera al sprint nuevo, sin copiar. |

Esta distinción importa: cuando la US tiene trabajo cerrado, no lo saques del sprint donde se hizo
(eso rompe el historial/velocity de ese sprint). Cuando la US completa está sin tocar, no tiene
sentido dejar una copia vacía atrás — se mueve tal cual.

### 4. Nombrar la copia (rollover parcial)

- Sufijo por defecto: `- Fase N`. Antes de nombrar, revisa el `subject` actual: si ya trae un sufijo
  `- Fase X`, la copia usa `X + 1`. Si no trae ninguno, la copia es `- Fase 2` (el original es la
  fase 1 implícita).
- No preguntes el formato — es la convención fija de esta skill. Solo pregunta si el usuario pide
  explícitamente algo distinto para ese caso puntual.

### 5. Crear el sprint nuevo

- `mcp__taiga__create_milestone(project_id, name, estimated_start, estimated_finish)`.
- **Nombre**: sigue el patrón de nombres existentes en el proyecto (mira
  `mcp__taiga__list_milestones` sin filtro). Si el patrón es "Sprint N", usa el siguiente número. Si
  no hay patrón claro, pregunta.
- **Fechas por defecto**: ciclo lunes a sábado. `estimated_start` = el día después de que termina el
  sprint que se cierra (o hoy, si ya venció). `estimated_finish` = el sábado de esa misma semana
  (si el inicio cae en sábado o domingo, usa el sábado siguiente). Muestra las fechas calculadas al
  usuario en el resumen final aunque no se las preguntes — son visibles para el equipo y merece la
  pena que las vea antes de darlas por buenas.

### 6. Ejecutar los movimientos

Para cada US clasificada como rollover parcial:
1. `mcp__taiga__create_userstory(project_id, subject="<original> - Fase N", milestone_id=<nuevo>)`.
2. Si la US original tiene épica asociada (revisa el campo `epic`/`epics` del objeto que trae
   `list_userstories`/`get_userstory`), enlaza la copia a esa misma épica con
   `mcp__taiga__link_userstory_to_epic(epic_id, userstory_id=<nueva US>)`. Sin este paso la copia
   queda huérfana de épica aunque el original sí la tuviera.
3. Por cada tarea pendiente de esa US: `mcp__taiga__move_task(task_id, version, userstory_id=<nueva US>)`
   (usa la `version` que trae el objeto de `list_tasks`/`get_userstory`, no la inventes).
4. Marca la US **original** (la que se queda en el sprint viejo) como hecha: busca en
   `mcp__taiga__list_userstory_statuses` (paso 2) el status con `is_closed: true` y `is_archived: false`
   (normalmente "Done"/"Hecha" — no el "Archived"), y llama
   `mcp__taiga__update_userstory(userstory_id=<original>, version, status=<ese id>)`. Su trabajo para
   este sprint terminó al crearse la fase siguiente, aunque la US en sí siga viva para el historial —
   por eso se cierra, no se borra ni se mueve.

Para cada US clasificada como rollover directo:
1. `mcp__taiga__get_userstory(userstory_id)` si necesitas la `version` actual.
2. `mcp__taiga__update_userstory(userstory_id, version, milestone=<nuevo>)`.

### 7. Comentar cada tarea movida

Cada tarea que pasó por `move_task` (paso 6, rollover parcial) recibe un comentario dejando registro
del traslado — para quien la vea después le quede claro que no es que apareció ahí sola, que vino de
otro sprint. Texto fijo (plantilla pre-aprobada por el usuario, ver más abajo):

> Movida de **{sprint viejo}** a **{sprint nuevo}** como parte del cierre de sprint. Sigue asociada
> a *{subject de la US nueva}*.

**Esta plantilla exacta está pre-aprobada — envíala directo con `mcp__taiga__add_comment`, sin
pedir aprobación cada vez.** Esto es una excepción explícita a la regla general de `taiga-ticket-docs`
(que exige aprobación previa para todo comentario): el usuario la autorizó puntualmente para este
formato en esta skill. La excepción cubre *solo* este texto tal cual — si necesitas decir algo
distinto (otro motivo, contexto extra, texto libre), esa sí vuelve a requerir aprobación explícita
antes de enviarse, igual que cualquier otro `add_comment`.

Las US movidas en rollover directo (paso 6, sin copia) no llevan este comentario — solo las tareas
individuales que cambiaron de US/sprint.

### 8. Resumen final

Cierra con una tabla corta: qué US quedaron terminadas en el sprint viejo (sin tocar), qué US se
copiaron con qué tareas se movieron (y si sus comentarios ya se enviaron o quedaron pendientes de
aprobación), y qué US se movieron directo. Incluye las fechas del sprint nuevo y su nombre.

## Cosas a no hacer

- No cierres el milestone viejo (`closed: true`) a menos que el usuario lo pida explícitamente —
  puede que aún queden cosas por revisar ahí.
- No borres ni las US originales con trabajo cerrado ni las tareas ya cerradas — el objetivo es
  preservar el historial, no limpiarlo.
- No inventes `project_id`, fechas de sprint, o nombres de milestone que no puedas confirmar con las
  tools de Taiga o con el usuario.
