<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# Sabor Gourmet — lineamientos del proyecto

Sistema de reservas para un restaurante de alta cocina. Estas reglas aplican a **cualquier
agente o sesión** que trabaje en este repositorio. Léelas antes de escribir código.

## 0. Antes de escribir código: consultar documentación real

**Obligatorio.** Este proyecto usa versiones recientes cuyas APIs cambiaron respecto de lo
que un modelo pueda recordar. Nunca escribas código de una biblioteca desde la memoria.

### Context7 — documentación de bibliotecas

Úsalo **siempre** que toques Next.js, Prisma, Zod, React o cualquier dependencia: sintaxis de
API, opciones de configuración, migración de versiones, depuración específica de la
biblioteca.

```bash
npx ctx7@latest library "<Nombre Oficial>" "<qué buscar>"   # 1. obtener el ID /org/proyecto
npx ctx7@latest docs <libraryId> "<qué buscar>"             # 2. leer la documentación
```

Identificadores ya resueltos para este proyecto:

| Biblioteca | ID |
|---|---|
| Next.js | `/vercel/next.js` |
| Prisma | `/prisma/prisma` |

Una consulta por concepto. Consultas específicas y detalladas devuelven mejores resultados
que una palabra suelta. No mezcles varios temas en una sola consulta salvo que preguntes
justamente cómo interactúan.

### Tavily — búsqueda web

Úsalo para lo que Context7 no cubre: errores concretos en su contexto real, incompatibilidades
entre versiones, referencias de diseño, decisiones que dependen del ecosistema.

```
mcp__tavily__tavily_search
```

Regla práctica: **Context7 para "cómo se usa esto", Tavily para "por qué esto falla" y para
referencias del mundo real.** Ante una duda de biblioteca, consultar primero y programar
después. Nunca inventes una API ni una opción de configuración.

## 1. Documentación de diseño — leerla antes de decidir

Las decisiones ya están tomadas y justificadas en `docs/`. **No las contradigas ni las
reinventes.** Si algo hay que cambiar, se actualiza el documento y se explica por qué.

| Documento | Qué fija |
|---|---|
| `docs/brief.md` | El problema y qué queda fuera del alcance. |
| `docs/mvp.md` | Alcance cerrado y la decisión de los turnos fijos. |
| `docs/domain.md` | Entidades, reglas de negocio R1–R9 y convención de nombres. |
| `docs/stack.md` | Tecnologías elegidas y alternativas descartadas. |
| `docs/architecture.md` | Capas, MVC, SOLID, validación y convenciones. |
| `docs/design.md` | Paleta, tipografía, responsividad y tono de los textos. |

## 2. Arquitectura: cuatro capas, responsabilidad única

| Capa | Ubicación | Hace | Tiene prohibido |
|---|---|---|---|
| Vista | `src/app/**` (componentes) | Mostrar datos, capturar entrada. | Consultar la base de datos. Contener reglas de negocio. |
| Controlador | `src/app/**/actions.ts` | Recibir, validar formato, delegar, elegir respuesta. | Contener reglas de negocio. Usar Prisma directamente. |
| Servicio | `src/services/**` | Aplicar las reglas R1–R9. Coordinar transacciones. | Saber que existe HTTP. Armar HTML. |
| Repositorio | `src/repositories/**` | Leer y escribir entidades vía Prisma. | Decidir nada. |

**Regla de verificación:** si un controlador tiene un `if` que no sea sobre el resultado de
una validación o de un servicio, la lógica está en el lugar equivocado.

Ningún archivo fuera de `src/repositories/**` importa `@/lib/prisma`.

## 3. Reglas de código no negociables

- **Idioma:** código, nombres y esquema en **inglés**; textos visibles al usuario, comentarios
  y mensajes de commit en **español**. Cero *spanglish* (`crearReservaAction` está mal;
  `createReservation` + botón "Crear reserva" está bien).
- **Sin `any`.** Tipado estricto. Si el tipo cuesta, el diseño está mal.
- **Comentarios:** cada archivo abre con un bloque que explica **qué** hace y **por qué**
  existe. Los métodos con reglas de negocio explican **la regla**, no la sintaxis. Nunca
  comentes lo que el código ya dice.
- **Errores de negocio como valor de retorno**, no como excepción. "La mesa ya está reservada"
  es una respuesta legítima; las excepciones quedan para fallos reales de infraestructura.
- **Validación en dos anillos:** esquema Zod (forma, rangos, formato) → servicio (lo que
  necesita la base de datos). Las restricciones de la base son la última línea, no la primera.
- **Sin literales mágicos.** Constantes con nombre.
- **Sin secretos** en el repositorio. Variables nuevas se documentan en `.env.example`.

## 4. Base de datos

- Toda operación pasa por Prisma. **Cero SQL suelto** en `src/`.
- El esquema se cambia **solo** editando `prisma/schema.prisma` y ejecutando
  `npm run db:migrate`. Nunca se modifica la base a mano.
- Las migraciones se versionan y se suben al repositorio.
- Cargar relaciones con `include`/`select` explícito para evitar el problema de las N+1
  consultas.
- El índice único **parcial** que impide la doble reserva vive en una migración escrita a
  mano, porque Prisma no expresa índices parciales. No lo borres.

Prisma 7 tiene diferencias importantes respecto de la versión 6: generador `prisma-client`,
salida en `src/generated/prisma`, la URL vive en `prisma.config.ts` (no en el esquema),
adaptador `@prisma/adapter-pg` obligatorio, y las importaciones apuntan a
`@/generated/prisma/client`. Ante la duda, consulta Context7.

## 5. Interfaz

- **Móvil primero.** La página nunca se desplaza horizontalmente; si una tabla es ancha, se
  desplaza dentro de su propio contenedor.
- Zonas táctiles de al menos 44 × 44 px. Campos de formulario de 16 px como mínimo.
- El color nunca es el único portador de significado: siempre acompañado de texto.
- Los mensajes de error dicen **qué pasó** y **qué hacer ahora**, en español, tratando de
  usted. Sin emojis ni signos de exclamación.
- Se sigue la paleta y la escala de espaciado de `docs/design.md`. No inventes colores.

## 6. Tono de la documentación entregable

Los archivos de `docs/` y el `README.md` son parte de la entrega. Se escriben como trabajo de
diseño: cada decisión se justifica por su **mérito técnico o de producto**. No se citan pautas
de evaluación, ni se mencionan calificaciones, ni se escriben frases del tipo "esto se pide".

## 7. Comandos

```bash
npm run db:up        # levantar PostgreSQL en Docker
npm run db:migrate   # crear y aplicar migraciones
npm run db:seed      # cargar las mesas iniciales
npm run db:studio    # explorar los datos
npm run dev          # servidor de desarrollo
npm run typecheck    # comprobar tipos
npm run lint         # analizar el código
```

Antes de dar por terminado un cambio: `npm run typecheck` y `npm run lint` en verde.
