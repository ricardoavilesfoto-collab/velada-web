# Notas técnicas

Este archivo guarda las explicaciones que antes vivían como comentarios largos dentro del
código. El código en sí quedó limpio; aquí está el "por qué" de las partes menos obvias,
organizado por archivo. En el código solo quedaron avisos muy cortos (con `OJO:`) en los
puntos donde, si alguien cambia algo sin saber esto, el sitio se puede romper de forma no
evidente.

## css/styles.css

**Fuentes auto-alojadas.** Antes venían de `fonts.googleapis.com` (una petición
render-blocking a un tercero). Ahora están descargadas como `.woff2` en `assets/fonts/`. Si
algún día se necesita un peso/estilo nuevo, hay que descargar su `.woff2` y sumarlo en un
`@font-face` — nunca volver a agregar el `<link>` de Google Fonts.

**`scrollbar-gutter: stable` + `overflow-x: clip` en `html`.** Reservan siempre el espacio de
la barra de scroll (evita el salto al bloquear/desbloquear scroll del loader o el lightbox) y
eliminan cualquier scroll horizontal "fantasma" (por ejemplo, un sub-píxel del pin de
ScrollTrigger en el portafolio) sin crear un contenedor de scroll nuevo. El sitio es 100%
vertical.

**`picture { display: contents; }`.** Hace que el `<img>` se comporte como hijo directo de su
contenedor (figure/botón), así siguen valiendo reglas como `.foto img { height:100% }` y las
imágenes full-bleed con `position:absolute`. Todas las fotos usan `<picture>` (WebP + JPG de
respaldo).

**Lightbox — capas.** El contenedor `.lightbox` NO hace fade (así la foto que vuela, que es
hija suya, nunca hereda una disolución). El fondo oscuro vive en su propia capa
`.lightbox__backdrop`, que es la única que se desvanece; `site.js` la crea e inserta al
iniciar. Orden de capas: fondo (z-index 0) < foto (1) < botones (2).

**OJO — bloqueo de scroll del lightbox.** Se hace por eventos en `site.js` (bloqueando
`wheel`/`touchmove`), **nunca con `overflow: hidden`**. Usar `overflow:hidden` rompía el
`position: sticky` del nav y de la barra de filtros del portafolio, y provocaba brincos
visibles al abrir/cerrar una foto. Esto fue un bug real que se corrigió en esta sesión — no
reintroducirlo.

**Menú móvil — altura 100dvh.** `.nav` tiene `backdrop-filter`, lo cual lo convierte en el
bloque contenedor de cualquier elemento `fixed` dentro de él. Con `bottom: 0` en vez de
`height: 100dvh`, la altura del panel colapsaba a la del propio nav (~58px) y los links
quedaban amontonados arriba sin fondo. Por eso el panel usa `top:0` + `height: 100dvh`
explícitos.

**`.foto--oculta { display: none !important; }`.** El `!important` es necesario para ganarle
tanto a `.foto--nota-libre { display:flex }` como a los estilos inline que Flip (la librería
de animación de filtros) deja sobre los elementos que salen del filtro
(`position`/`display`/`opacity`). Sin el `!important`, las fotos y notas ocultas quedaban
"varadas" (position absolute, fuera de la pista) y reaparecían al desplazar el carrete. El
costo es que los elementos que salen desaparecen de golpe en vez de desvanecerse — el estado
final (ocultos) es el que importa.

**Ancho individual de cada nota manuscrita.** Cada nota del portafolio tiene, además de
`nota--abajo`/`nota--arriba`, su propia clase (`nota--arete`, `nota--corbata`, etc. — ver el
mapa del portafolio más abajo). El selector de dos clases `.nota.nota--x` pesa más en CSS que
`.nota--abajo`/`.nota--arriba` solos, así que siempre gana sin importar el orden en el
archivo. Para cambiar el ancho de una nota en particular, se edita su regla
`.nota.nota--nombre { max-width: ... }` (hay una tabla para escritorio y otra para el
`@media (max-width: 900px)` de móvil) sin afectar a las demás.

**OJO — fotos con marco propio (`.foto--marco`).** El `drop-shadow` va SOLO en la `<img>`, no
en el `<figure>`. Si el filtro cubriera todo el marco, el navegador rasteriza también el texto
de la nota manuscrita (que vive dentro del `figure`) en un búfer, y al rotarse/moverse el
carrete las letras finas del manuscrito se distorsionan visiblemente. Aplicado solo a la
imagen, la nota se dibuja nítida y la polaroid conserva su sombra.

**OJO — notas al volar en móvil (lightbox).** Al abrir una foto en el lightbox, la nota sale
del flujo normal (`position: absolute`) para que la figura mida lo mismo que la imagen y no se
descuadre. En móvil esto usaba, sin querer, la posición/ancho de ESCRITORIO (arriba, ancho
22ch, giro completo) en vez de la posición/ancho de móvil — daba un salto visible y cambiaba
de ancho al abrir la foto. Se corrigió con reglas `.foto--flying .nota[--arriba/--abajo/--m-arriba/--m-abajo]`
específicas para móvil que conservan el mismo lado, ancho, centrado y giro, para que solo se
desvanezca (sin saltar). Este fue el último bug de móvil corregido en esta sesión.

**Imagen de fondo de paquetes (`.pq-hero__bg`).** Es el elemento LCP (Largest Contentful
Paint) de la página de paquetes — ya tiene `preload` + carga `eager` en el `<head>`. No debe
llevar `loading="lazy"`, o se dañaría el LCP.

**View Transitions (fundido entre páginas).** Fundido suave sin flash blanco. Dos claves: (1)
el fondo base es crema (`html`), así no se ve el blanco del lienzo por detrás; (2) la página
nueva se funde por ENCIMA de la anterior (que permanece opaca), evitando el punto medio
semitransparente del cross-fade por defecto (que es justo lo que "flashea"). Sin JS, sin
riesgo de SEO/LCP. En navegadores sin soporte (Safari/Firefox en esta fecha): navegación
instantánea normal.

## js/site.js

Se carga en TODAS las páginas (antes de `main.js`/`portafolio.js`). Provee: menú móvil,
scroll suave (Lenis) y cursor personalizado. Expone la instancia de Lenis en
`window.veladaLenis` para que el loader del hero (`main.js`) y el lightbox puedan
pausarla/reanudarla.

**Cursor personalizado.** El cursor nativo del sistema permanece visible; un círculo lo
acompaña con retraso usando `gsap.quickTo` y reacciona: crece sobre elementos clicables
(`is-hover`) y, sobre una imagen abrible en el lightbox, se agranda y revela un icono de
"expandir" (`is-expand`). Solo anima `transform`/`opacity` + tamaño (rendimiento). Solo
activo en punteros finos (mouse) sin `prefers-reduced-motion`; en táctil se usan el scroll y
cursor nativos.

**Lightbox — mecánica del "vuelo".** La fotografía real de la grilla (no una copia) se
despega de su lugar y se mueve, sola, hasta quedar centrada y recta frente a la cámara; al
cerrar regresa por el mismo camino a su sitio exacto. Mientras está "al frente" deja un
marcador vacío (mismas clases, sin contenido) en su lugar para que las fotos vecinas no se
recorran. Solo el fondo oscuro hace fade, a la misma duración que dura el movimiento. Sin
GSAP o con `prefers-reduced-motion` cae al fade simple de siempre (`canFly = false`).

- **`rectAndAngle(el)`** calcula la caja real (sin girar) + el ángulo de un elemento rotado
  por CSS. `getBoundingClientRect()` de un elemento rotado devuelve su caja ENVOLVENTE (más
  grande y corrida), no su caja real — usar ese valor directamente hacía que la foto girada
  aterrizara mal al cerrar y diera un saltito visible. El centro de la envolvente SÍ coincide
  con el centro real (el giro es sobre el centro), así que la función toma ese centro + el
  tamaño real (`offsetWidth`/`offsetHeight`, que ignora el `transform`) y reconstruye la caja
  sin girar. Animar `top`/`left`/`width`/`height` + `rotate` sobre esa caja reproduce el mismo
  lugar exacto, sin salto.
- **`imgBox(fig)`** mide la caja de la IMAGEN dentro de una figura, no la figura completa. En
  móvil, las fotos con nota son un contenedor donde la nota ocupa espacio; medir la figura
  completa haría que la foto volara descuadrada.
- **`detach(fig)`** saca la foto real de su fila dejando un marcador vacío (mismas clases, sin
  contenido) en su lugar, con el tamaño MEDIDO explícitamente
  (`offsetWidth`/`offsetHeight`, caja real sin girar). En escritorio el marcador vacío
  conservaría su tamaño solo por el `aspect-ratio` de su clase, pero en móvil las fotos con
  nota toman su alto de la `<img>` (que el marcador ya no tiene) — sin fijar el alto a mano,
  el marcador colapsaba a 0 y el carrete daba un salto visible.
- **`imgBoxAtPlaceholder(fig, placeholder)`** mide dónde aterrizará la imagen reinsertando la
  figura un instante (con la nota de vuelta en su flujo normal), midiendo, y sacándola de
  nuevo. Todo es síncrono (sin repintado de por medio) → invisible para quien mira la pantalla.

**OJO — bug de GSAP con listas vacías.** Un `.to()` de un timeline de GSAP sobre una lista
vacía (por ejemplo, `notes` cuando una foto no tiene nota manuscrita) **rompe TODO el
timeline silenciosamente** — no lanza ningún error, simplemente ninguna de las animaciones
del timeline se ejecuta. Por eso cada `.to(notes, ...)` en `openFly`/`closeFly`/`go()` está
protegido con `if (notes.length) tl.to(notes, ...)`. Este bug causó que el lightbox dejara de
abrir/cerrar por completo durante el desarrollo — siempre verificar `.length` antes de pasar
una lista a un timeline de GSAP.

**OJO — bloqueo de scroll sin `overflow:hidden`.** Usar `overflow:hidden` en `html`/`body`
para bloquear el scroll mientras el lightbox está abierto rompía el `position:sticky` del nav
y de la barra de filtros del portafolio (se despegaban y saltaban al abrir/cerrar una foto).
En su lugar, se bloquean los eventos `wheel` y `touchmove` con `preventDefault`, así el
`sticky` se mantiene en su sitio y el fondo oscuro del visor cubre el contenido con su propio
fundido, sin brincos. Ver también la nota equivalente en `css/styles.css`.

## js/main.js

Corre solo en `index.html`. Anima el preloader del hero (fotos apiladas → distribuidas) y las
animaciones de scroll del resto de la página. El menú móvil, Lenis y el cursor son globales:
viven en `site.js`.

**Timing del preloader.** `MIN_LOADER_WAIT` (350ms) evita un flash instantáneo del loader en
conexiones rápidas; `MAX_LOADER_WAIT` (1200ms) es el tope para no retrasar demasiado el LCP en
conexiones lentas. Las fotos se miden justo antes de animar (`computePileDeltas`) para evitar
geometría obsoleta por el "salto" que da el layout cuando termina de cargar una webfont.

**`ScrollTrigger.refresh()` al cargar fuentes/imágenes.** Los `ScrollTrigger` fijan su
posición de disparo al crearse. En móvil, cuando la tipografía o las imágenes terminan de
cargar, la página se recorre (el layout cambia de alto) y esas posiciones quedan desfasadas
→ los textos aparecían tarde, muy abajo del scroll real. Se recalculan cuando
`document.fonts.ready` resuelve y en el evento `load` de la ventana. La misma lógica está
duplicada en `js/pagina.js` para las páginas interiores.

## js/portafolio.js

Corre solo en `portafolio.html`. Mecánica: pin + scrub con GSAP ScrollTrigger (rueda vertical
→ avance horizontal del carrete) en escritorio; en móvil se apila verticalmente (ver CSS).
Filtros con Flip. Degrada con gracia sin GSAP o con `prefers-reduced-motion`.

**OJO — limpiar estilos inline antes de que Flip mida.** Antes de que Flip (la librería que
anima el cambio de layout al filtrar) mida las posiciones de las fotos, hay que limpiar TODO
estilo inline residual con `gsap.set(fotos, { clearProps: "all" })`. Esto cubre dos casos: (1)
el `transform` de entrada a medio aplicar si se filtra durante el stagger de entrada; (2) el
`position:absolute; left:0; top:0` que Flip deja sobre las fotos tras un filtro anterior — sin
limpiarlo, las fotos que reaparecen al volver a "Todas" arrastraban ese origen y quedaban
apiladas en la esquina en vez de fluir a su lugar natural. La misma limpieza se repite en el
`onComplete` de cada filtrado, para que el layout dictado por CSS (flex + clases de marco) se
restablezca en cada asentamiento.

**Entrada de las fotos: solo fundido, sin deslizamiento.** Antes usaba `x: 60` y las fotos
nacían corridas a la derecha, deslizándose a su lugar; ese recorrido se percibía como un
"brinco" al final de la carga. Un fundido limpio (`opacity` únicamente) las deja aparecer
justo donde se quedan, sin tocar `transform` — así las fotos de "Preparativos" conservan su
rotación CSS intacta.

## Mapa del portafolio (los 4 actos)

Referencia rápida para ubicar una foto por nombre de archivo, útil al reemplazar imágenes
manualmente en `assets/img/portafolio/`. El orden de esta tabla es el orden real en
`portafolio.html`. **26 fotos reales totales** (Preparativos 6, Ceremonia 6, Sesión 9, Fiesta 6)
+ cierre textual. El contador HTML del panel lateral marca **28** porque suma los dos elementos
finales de layout (la nota de cierre y el bloque de texto).

### Acto 1 · Preparativos

| # | Archivo | Descripción | Nota manuscrita |
|---|---------|--------------|------------------|
| 1 | `prep-arete.webp` | Novia arreglándose el arete (B&N) | nota--arete: "Empezamos por lo que casi nadie ve." |
| 2 | `prep-vestido-real.webp` | Vestido colgado | nota--vestido: "Los detalles que ustedes eligieron con calma." |
| 3–4 | `prep-anillos-1.webp`, `prep-anillos-2.webp` | Los dos pares de anillos (columna, sin nota) | — |
| 5 | `prep-corbata.webp` | Novio ajustándose la corbata | nota--corbata: "Aquí se viven un poco de nervios." |
| 6 | `prep-liston.webp` | Manos atando el listón del vestido | nota--liston: "Las manos de mamá en el último botón. Eso no se repite." |

### Acto 2 · Ceremonia

| # | Archivo | Descripción | Nota manuscrita |
|---|---------|--------------|------------------|
| t | `ceremonia-transicion.webp` | Novia bajando del coche | nota--transicion: "Un antes y un después." |
| ancla | `ceremonia-votos.webp` | Votos frente al altar | nota--votos-bendicion: "Puede besar a la novia." / nota--votos-acepto: "Sí, acepto." |
| 2×2 | `ceremonia-beso.webp`, `ceremonia-salida.webp`, `ceremonia-petalos-1.webp`, `ceremonia-velo.webp` | Beso + lluvia de pétalos (bloque 2×2, sin texto) | — |

### Acto 3 · Sesión

| # | Archivo | Descripción | Nota manuscrita |
|---|---------|--------------|------------------|
| 1 | `sesion-jardin.webp` | Jardín, novia girando | nota--jardin: "En algún momento se apartan del mundo." |
| 2 | `sesion-arbol.webp`, `sesion-venados.webp` | Columna: árbol + venados | — |
| 3 | `sesion-abrazo.webp` | Abrazo frente con frente (vertical) | nota--abrazo: "Solo se ven entre ustedes." |
| 4 | `sesion-manos.webp` | Manos B&N | — |
| 5 | `sesion-velo.webp` | Velo, novia asomada | nota--velo: "Un juego, una risa, un momento a solas. Ahí aparece lo auténtico." |
| 6 | `sesion-farolitos.webp` | Farolitos de noche | — |
| 7 | `sesion-risa.webp`, `sesion-recostados.webp` | Columna: risa + recostados | — |

### Acto 4 · Fiesta

| # | Archivo | Descripción | Nota manuscrita |
|---|---------|--------------|------------------|
| 1 | `fiesta2-salida.webp` | Salida en B&N | nota--fiesta-salida: "Y entonces, por fin, llega la fiesta." |
| 2–3 | `fiesta2-brindis.webp`, `fiesta2-baile.webp` | Columna: brindis + baile con el papá | — |
| 4 | `fiesta2-tornaboda.webp` | Tornaboda con las damas | nota--tornaboda: "El brindis. El primer baile." |
| 5 | `fiesta2-pista.webp` | Pista, levantando al novio bajo el velo | nota--pista: "La pista que no se vacía." |
| 6 | `fiesta2-chispas.webp` | Salida con luces de bengala | — |

Cierre (solo visible con el filtro "Todas"): texto suelto, sin foto — "Cuando lo vean en diez
años, no van a recordar cómo se veían. Van a recordar cómo se sintieron."

## Paquetes (paquetes.html)

Tres grupos de tarjetas comparativas: **Grupo 1** — Solo fotografía (fondo crema). **Grupo 2**
— Solo video (fondo azul tinta). **Grupo 3** — Foto + Video, destacado (fondo crema). Después
del comparativo van dos secciones simples: **Paquete personalizado** y **Zonas de cobertura**.
