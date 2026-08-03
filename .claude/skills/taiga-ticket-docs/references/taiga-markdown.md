# Markdown soportado en Taiga (subset seguro)

Taiga renderiza un subset tipo GFM (GitHub Flavored Markdown) en `description` y comentarios. Usa
solo lo de esta lista; ante duda, prefiere la opción conservadora.

## Usar

| Elemento | Sintaxis | Nota |
|---|---|---|
| Encabezados | `##`, `###` | Reserva `#` (h1) para el título del ticket, no lo repitas en el body |
| Negrita | `**texto**` | |
| Cursiva | `*texto*` | |
| Lista simple | `- item` | |
| Lista numerada | `1. item` | Para pasos secuenciales (reproducción de bugs) |
| Checklist | `- [ ] item` / `- [x] item` | Taiga los renderiza interactivos |
| Tabla | `\| col \| col \|` | Útil para comparar entorno, casos |
| Código inline | `` `código` `` | |
| Código en bloque | ```` ```lang ``` ```` | |
| Cita | `> texto` | Para contexto citado, no abusar |
| Separador | `---` | Para dividir secciones largas |
| Enlace | `[texto](url)` | |
| Imagen | `![alt](url)` | |
| Referencia a ticket | `#123` | Taiga autoenlaza al ticket con ese ID en el mismo proyecto |
| Mención | `@usuario` | Autoenlaza y notifica al usuario |
| Emoji shortcode | `:white_check_mark:` | También sirven emojis Unicode directos (✅, 🐛, 🎯) |

## Evitar

- **HTML crudo** (`<div>`, `<br>`, etc.) — no siempre renderiza igual en todos los clientes de Taiga.
- **Callouts estilo Obsidian** (`> [!note]`) — no soportados, Taiga los muestra como cita plana.
- **Footnotes** (`[^1]`) — sin soporte confiable.
- **Anidamiento profundo** (listas dentro de listas dentro de tablas) — dificulta lectura y a veces
  rompe el render.
- **Párrafos largos sin estructura** — rompe el principio de claridad visual aunque el markdown sea
  válido.

## Verificación

Antes de dar el ticket por terminado, relee con el `get_*` correspondiente y confirma visualmente
que encabezados, checklists y negritas se ven como se esperaba en el `description` devuelto.
