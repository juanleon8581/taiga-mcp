# Plantillas por tipo de ticket

Todas usan encabezados `##`, emoji de sección para escaneo visual, y lenguaje llano. El emoji es
fijo por sección (no lo cambies) — así el ojo aprende a ubicar cada bloque de un vistazo.

Ejemplos en español; si el proyecto es en inglés, traduce encabezados y contenido manteniendo
la misma estructura y emojis.

## User Story

```markdown
## 🎯 Objetivo

1-2 frases: qué valor obtiene el usuario/negocio con esto.

## 👥 Historia

**Como** [tipo de usuario]
**Quiero** [acción/funcionalidad]
**Para** [beneficio/razón]

## ✅ Criterios de aceptación

- [ ] Criterio verificable 1
- [ ] Criterio verificable 2
- [ ] Criterio verificable 3

## 📌 Notas

Dependencias, fuera de alcance, o referencias a otros tickets (`#123`). Omitir sección si no aplica.
```

## Issue (bug)

```markdown
## 🐛 Descripción

Qué está fallando, en una o dos frases claras.

## 🔁 Pasos para reproducir

1. Ir a...
2. Hacer clic en...
3. Observar...

## ✅ Resultado esperado

Qué debería pasar.

## ❌ Resultado actual

Qué pasa en realidad.

## 🌐 Entorno

- **Navegador/dispositivo:** ...
- **URL/pantalla:** ...
- **Rol/usuario:** ...

## 📎 Evidencia

Capturas, logs o links. Omitir si no hay.
```

## Epic

```markdown
## 🎯 Objetivo

Qué gran problema resuelve o qué oportunidad captura esta épica.

## 💡 Contexto/problema

Por qué es necesaria ahora; qué pasa si no se hace.

## 📦 Alcance

**Incluye:**
- Punto 1
- Punto 2

**No incluye:**
- Punto fuera de alcance

## 🧩 Historias relacionadas

- #id — nombre de la historia
- #id — nombre de la historia

## 📈 Métrica de éxito

Cómo se sabe que la épica cumplió su objetivo.
```

## Task

```markdown
## 🔧 Qué hacer

Descripción concreta de la tarea.

## ✅ Checklist

- [ ] Paso 1
- [ ] Paso 2

## 🔗 Relacionado

Historia de usuario padre: #id (si aplica).
```
