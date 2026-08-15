# Identidad visual — Restaurante pa’ que mi suegra

Cómo debe verse y sentirse el sistema. Este documento existe para que las decisiones
visuales sean **decisiones**, y no lo que el framework traiga por defecto.

## 1. Posicionamiento

"Restaurante pa’ que mi suegra" es un restaurante de **alta cocina**. El sitio no compite con una app de
delivery: compite con la sensación de llamar por teléfono a un lugar bueno y que te atiendan
bien. Debe transmitir **calma, cuidado y confianza**.

Consecuencia práctica: nada de urgencia comercial. Sin contadores regresivos, sin "¡Solo
quedan 2 mesas!", sin banners. La escasez se comunica mostrando honestamente qué hay
disponible.

## 2. Referencias

Referencias reales revisadas para calibrar el tono (sitios de alta cocina reconocidos por su
diseño):

- **Eleven Madison Park** — tono editorial, galería amplia, la reserva siempre visible pero
  sin gritar; los datos de contacto viven en el pie.
- **Noma** — minimalismo deliberado: tipografía serif de peso fino, casi sin cromo de
  interfaz, la fotografía carga todo el peso expresivo. Sin parallax, sin video, sin
  degradados en los botones.
- **Alinea / Canlis** — una sola historia visual dominante conectada al posicionamiento de la
  marca.

Principio de UX transversal recogido de las guías de diseño para restaurantes: **una sola
acción principal por página**, y la reserva nunca escondida. Un comensal con hambre y un
teléfono en la mano debe poder llegar al formulario en un toque.

## 3. Paleta

Tomamos la combinación clásica de alta cocina —neutros cálidos y profundos con un metal como
acento— evitando el dorado saturado que abarata la percepción.

| Rol | Color | Hex | Uso |
|---|---|---|---|
| Fondo profundo | Carbón cálido | `#14110F` | Fondo de páginas de presentación. |
| Fondo claro | Hueso | `#F7F4EF` | Fondo de formularios y del panel de administración. |
| Superficie | Arena | `#EBE5DB` | Tarjetas, filas de tabla alternas. |
| Texto principal | Tinta | `#1C1917` | Sobre fondos claros. |
| Texto sobre oscuro | Crema | `#F2EDE4` | Sobre fondos oscuros. |
| Texto secundario | Piedra | `#6B6259` | Etiquetas, ayudas, metadatos. |
| Acento | Latón | `#B08D57` | Bordes finos, subrayados, detalles. Nunca superficies grandes. |
| Acción | Granate | `#7A2E2E` | Botón principal, enlaces activos. |
| Éxito | Oliva | `#4A5D3A` | Reserva confirmada. |
| Error | Rojo profundo | `#9B2C2C` | Errores de validación. |
| Neutro deshabilitado | Ceniza | `#A8A29E` | Mesas inactivas, botones inhabilitados. |

**Reglas de uso**

- El latón es un **acento**, no un fondo. Aparece en trazos de 1–2 px, nunca en bloques.
- El color no es el único portador de significado: un estado cancelado lleva color *y*
  etiqueta de texto. Sin esto, quien no distingue colores no puede usar el sistema.
- Todo texto cumple contraste **AA** como mínimo (4.5:1 en texto normal, 3:1 en texto grande).

## 4. Tipografía

Un par tipográfico, sin más.

| Uso | Familia | Notas |
|---|---|---|
| Títulos | Serif de contraste alto (p. ej. *Cormorant Garamond*, *Playfair Display*) | Peso ligero, tamaños generosos, interletrado levemente abierto. Es la voz del restaurante. |
| Cuerpo e interfaz | Sans-serif neutra (p. ej. *Inter*, *Source Sans 3*) | Legibilidad por sobre personalidad. Es la voz del sistema. |

**Escala** (base 16 px, razón 1.25):

```
12 · 14 · 16 · 20 · 25 · 31 · 39 · 49
```

Los formularios usan 16 px como mínimo en el campo de entrada: por debajo de eso, los
navegadores móviles hacen zoom automático al enfocar y rompen la maquetación.

## 5. Espaciado y forma

- **Escala de espaciado de 4 px:** `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64`. Ningún valor
  arbitrario.
- **Radio de borde:** 2 px. Casi recto. Las esquinas muy redondeadas leen como app casual, no
  como restaurante de mantel.
- **Sombras:** mínimas o ninguna. La jerarquía se construye con espacio y contraste, no con
  profundidad falsa.
- **Aire generoso.** El espacio en blanco es lo que comunica categoría; es la herramienta más
  barata que tenemos.

## 6. Responsividad

**Móvil primero**, sin excepciones. Puntos de quiebre:

| Nombre | Ancho | Comportamiento |
|---|---|---|
| Móvil | < 640 px | Una columna. Mesas disponibles como tarjetas apiladas. La tabla de administración se convierte en tarjetas. |
| Tableta | 640–1024 px | Dos columnas en la selección de mesas. Tabla de administración con desplazamiento horizontal. |
| Escritorio | > 1024 px | Rejilla de mesas de tres o cuatro columnas. Tabla completa. |

Reglas duras:

- Toda zona táctil mide al menos **44 × 44 px**.
- La página **nunca** se desplaza horizontalmente. Si una tabla es ancha, se desplaza ella
  dentro de su propio contenedor.
- Las imágenes son fluidas y no bloquean el primer renderizado.

## 7. Cómo se ve cada pantalla

**Portal público — inicio.** Una imagen del restaurante a pantalla completa sobre fondo
carbón, el nombre en serif, una línea de descripción y **un solo** botón: *Reservar una mesa*.
Dirección, teléfono y horarios en el pie.

**Portal público — buscar disponibilidad.** Fondo hueso. Tres campos —fecha, turno, número de
personas— y un botón. Nada más en pantalla.

**Portal público — elegir mesa.** Rejilla de tarjetas: número de mesa, capacidad, zona. Las
no disponibles no se muestran (no se muestran en gris: si no sirve, no ocupa espacio).

**Portal público — confirmación.** El código de reserva grande, en serif, con un aviso claro
de guardarlo. Debajo, el resumen de la reserva y los enlaces para modificar o cancelar.

**Panel de administración.** Sobrio y denso, fondo hueso, sin fotografía. Es una herramienta
de trabajo: prioriza el escaneo rápido. Filtro por fecha arriba, listado debajo, estado con
color y etiqueta.

## 8. Tono de los textos

Cortés, breve, en español neutro, tratando de **usted**.

| ✅ | ❌ |
|---|---|
| "Su reserva quedó confirmada." | "¡Listo! 🎉 Tu mesa te espera." |
| "Esa mesa ya fue reservada para ese turno. Le mostramos las que siguen disponibles." | "Error: constraint violation." |
| "Indique un correo válido, por ejemplo nombre@dominio.cl." | "Email inválido." |

Todo mensaje de error dice **qué pasó** y **qué hacer ahora**.

## 9. Imágenes

Fotografía de plato y de salón, cálida, con poca profundidad de campo. Se obtienen de bancos
de imágenes libres (Unsplash) y se **descargan al proyecto**: no se enlazan en caliente desde
un dominio externo, para que la aplicación funcione sin conexión durante la demostración. Se
convierten a WebP y se cargan de forma diferida las que están bajo el pliegue.

Toda imagen lleva texto alternativo descriptivo. Las decorativas lo llevan vacío.

---

Documentos relacionados: [`brief.md`](./brief.md) · [`mvp.md`](./mvp.md) · [`domain.md`](./domain.md) · [`architecture.md`](./architecture.md)
