# Pendientes de contenido — Velada Estudio

Notas rescatadas de los comentarios del HTML (se eliminaron del código para dejar el
deploy limpio). Aquí quedan como checklist. Cuando reemplaces un archivo, **mantén el
mismo nombre** para no tocar el HTML/CSS.

## Imágenes placeholder por reemplazar
- [ ] `assets/img/nosotros-equipo-01.webp` — retrato real del fotógrafo principal (WebP, con su marco/polaroid).
- [ ] `assets/img/nosotros-equipo-02.webp` — segundo retrato real (o eliminar esa polaroid en `sobre-nosotros.html`).
- [ ] `assets/img/nosotros-tira.jpg` (+ `.webp`) — foto de boda propia, panorámica (transición full-bleed).
- [ ] `assets/img/icono-presencia.jpg` — ícono real de "Presencia".
- [ ] `assets/img/icono-autenticidad.jpg` — ícono real de "Autenticidad".
- [ ] `assets/img/icono-calidez.jpg` — ícono real de "Calidez".
- [ ] `assets/img/icono-compromiso.jpg` — ícono real de "Compromiso".
- [ ] `assets/img/proceso-fondo.jpg` (+ `.webp`) — foto de boda propia, panorámica ~1749×1100.
- [x] Categoría **Preparativos** (6 fotos) — reemplazadas por fotos reales con marco propio
  tipo polaroid (`prep-arete`, `prep-vestido-real`, `prep-anillos-1`, `prep-anillos-2`,
  `prep-corbata`, `prep-liston`, todas `.webp`). El carrusel se amplió de 4 a 6 lugares.
- [x] Categoría **Ceremonia** (6 fotos) — reemplazadas por fotos reales polaroid: transición
  `ceremonia-transicion`, foto ancla `ceremonia-votos`, y bloque 2×2 sin texto
  (`ceremonia-beso`, `ceremonia-salida`, `ceremonia-petalos-1`, `ceremonia-velo`, todas
  `.webp`). El bloque 2×2 vive en un contenedor `.galeria__grid` (solo layout); cada celda
  es una `.foto` independiente que abre su propio lightbox.
- Estas polaroids (Preparativos y Ceremonia) van **sin** `<picture>`/fallback JPG (el marco
  trae transparencia; aplanar a JPG perdería la sombra irregular) y usan `.foto--marco*` en
  vez de `foto--wide/land/square/portrait`, para respetar su proporción real sin recorte.
- [ ] Las fotos restantes (sesión, fiesta) siguen siendo placeholders de desarrollo (muestran
  nombre y dimensión). Reemplazar por fotos reales.
  - Al reemplazar cualquier `.jpg`, **regenera también su `.webp`** (ver PERFORMANCE.md → "Imágenes nuevas").
- El portafolio ahora es un **relato tipo diario**: las frases van como notas manuscritas
  (Biro) colocadas con variedad alrededor de las fotos (abajo/arriba/al lado) y sueltas entre
  fotos, con rotación. No requiere fotos nuevas — reutiliza las 16 existentes; los momentos
  "de dos líneas" (Sí, acepto / Puede besar · El brindis / La pista) son dos notas sobre una
  foto real. (Se eliminaron los placeholders `prep-detalle-01`, `ceremonia-beso-01`,
  `fiesta-brindis-01` que se habían creado para un enfoque anterior.)

## Datos de contacto y dominio
- [x] **WhatsApp:** número real (`525535571558`) ya está en las 4 páginas.
- [x] **Dominio:** `veladaestudio.com.mx` confirmado en canonical, og:url, og:image, sitemap.xml y JSON-LD de las 4 páginas.
- [x] **Enlaces internos:** todos apuntan a las páginas reales, con URLs limpias (`/portafolio`,
  `/paquetes`, `/sobre-nosotros`, `/`) que coinciden con `cleanUrls:true` de `vercel.json`.
- [ ] Redes sociales del footer: confirmar/actualizar URLs (Facebook/Instagram, hoy `href="#"`).

## Texto placeholder por reemplazar
- [x] `sobre-nosotros.html`: nombres reales puestos (Ricardo / Iris) en las polaroids del equipo.

## Limpieza opcional de assets (no urgente)
Hay ~16 MB de imágenes en `assets/img/` que ya no se usan en ninguna página (quedaron de
versiones anteriores del portafolio): `equipo-01.jpg`, `equipo-02.jpg`, `hero-centro.png`,
`hero-inf-der.png`, `hero-inf-izq.png`, `hero-sup-der.png`, `hero-sup-izq.png`,
`nosotros-filosofia.jpg`, `nosotros-quienes.jpg`, y en `assets/img/portafolio/`:
`fiesta-01..04.jpg/webp`, `sesion-01..04.jpg/webp`. No afectan el sitio (el navegador solo
descarga lo que está referenciado), pero sí pesan en el repositorio. Se pueden borrar cuando
quieras, sin tocar código.

## Notas de diseño (posición manual)
- Nombres manuscritos de las polaroids (`.polaroid__nombre--1/--2`): ajustar a mano su posición (top/left/bottom + transform) en `styles.css`, igual que el "Love…" del index.

## Portafolio — relato manuscrito (EN PAUSA, retomar en otra sesión)
El portafolio (`portafolio.html`) ya funciona como historia con notas manuscritas (Biro)
colocadas con variedad alrededor de las fotos (sistema `.nota` + `.foto--nota-libre` en
`styles.css`; ver también `js/site.js` para la exclusión del lightbox). Está "va mejorando"
pero quedan **detalles por afinar** en una próxima sesión:
- Ajustar a mano rotaciones/posiciones de las notas (`style="--r:Ndeg"` en cada nota, y los
  modificadores `.nota--arriba/--abajo/--izq/--der`) para que se sienta más "hecho a mano".
- Revisar las notas al costado (`.foto--nota-lado`: vestido y sesión-atardecer) por si se
  enciman con la foto vecina en algún ancho.
- Las 12 fotos de ceremonia/sesión/fiesta siguen siendo placeholders de desarrollo.
