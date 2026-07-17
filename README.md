# Velada Estudio — Página de inicio

Sitio estático (HTML + CSS + JS, sin build step) listo para Vercel.

## Estructura

```
velada-web/
├── index.html            ← inicio
├── portafolio.html       ← galería tipo carrete (4 "actos": preparativos/ceremonia/sesión/fiesta)
├── paquetes.html         ← tabla comparativa de precios
├── sobre-nosotros.html   ← equipo, valores, proceso
├── css/styles.css        ← estilos (tokens de la paleta oficial arriba del archivo)
├── js/
│   ├── site.js            ← global (menú móvil, Lenis, cursor, lightbox) — en todas las páginas
│   ├── main.js             ← preloader + animaciones de scroll (solo index.html)
│   ├── pagina.js           ← animaciones de scroll (paquetes/sobre-nosotros)
│   └── portafolio.js       ← pin + filtros + Flip (solo portafolio.html)
├── assets/
│   ├── favicon.svg
│   ├── vendor/          ← GSAP/ScrollTrigger/Flip/Lenis vendorizados (sin CDN)
│   └── img/             ← todas las imágenes
├── vercel.json          ← caché de assets + cleanUrls
├── robots.txt
├── sitemap.xml
├── NOTAS-TECNICAS.md    ← el "por qué" de las partes no evidentes del código + mapa del portafolio
└── PENDIENTES.md        ← checklist de contenido por completar
```

## Cómo cambiar las imágenes (lo más importante)

Cada placeholder tiene un **nombre fijo** y una **proporción exacta**. Para poner tus fotos reales solo reemplaza el archivo en `assets/img/` **con el mismo nombre** — no hay que tocar nada de código. La posición, rotación y tamaño ya están definidos en el CSS.

| Archivo | Dónde aparece | Proporción sugerida |
|---|---|---|
| `hero-centro.jpg` | Collage — foto central grande (B/N) | 3:4 vertical (~900×1200) |
| `hero-sup-izq.jpg` | Collage — superior izquierda | 4:3 (~800×600) |
| `hero-sup-der.jpg` | Collage — superior derecha | 4:3 (~800×600) |
| `hero-inf-izq.jpg` | Collage — inferior izquierda | 4:3 (~800×600) |
| `hero-inf-der.jpg` | Collage — inferior derecha (manos) | 1:1 (~700×700) |
| `grid-1..3.jpg` | Portafolio fila superior | 3:2 horizontal (~900×620) |
| `grid-4..7.jpg` | Portafolio fila inferior | vertical (~700×820) |
| `diferenciador.jpg` | Foto mano + teléfono con invitación | 4:5 (~880×1100) |
| `filosofia.jpg` | Sección Del posar al estar | 1:1 (~1000×1000) |
| `banner-luz.jpg` | Banner final "Cada boda tiene su propia luz" | panorámica (~2000×1100) |
| `og-image.jpg` | Imagen al compartir en redes | 1200×630 exacto |

> Esta tabla cubre las fotos del **index**. Las fotos del portafolio (`assets/img/portafolio/`,
> organizadas en 4 "actos") tienen su propio mapa en **`NOTAS-TECNICAS.md`**.

**Formato:** todas las fotos ya usan `<picture>` con **WebP + respaldo JPG**. Al reemplazar una imagen, genera también su `.webp` (ver `PERFORMANCE.md`). Calidad ~80 es buen equilibrio; procura que ninguna pese más de ~250 KB.

## Pendientes de personalizar

- [x] **Número de WhatsApp**: ya actualizado en las 4 páginas.
- [x] **Dominio**: `veladaestudio.mx` ya está en canonical, OG, JSON-LD, sitemap.xml y robots.txt.
- [x] **Links internos**: todas las páginas existen y están enlazadas correctamente.
- [ ] **Links de redes** en el footer (`#` por ahora — faltan las URLs reales de Facebook/Instagram)
- [ ] **Fotos placeholder** y el nombre del fotógrafo en `sobre-nosotros.html` (dice literalmente
  "[Nombre del fotógrafo]" — hay que reemplazarlo por el nombre real)
> Nota: la lista completa y actualizada de pendientes de contenido está en **`PENDIENTES.md`**.

## Correr localmente

```bash
npx serve .
```

> Los links internos usan URLs limpias (`/portafolio`, no `/portafolio.html`), igual que en
> Vercel. `npx serve .` las resuelve correctamente; un servidor simple como
> `python -m http.server` no, así que la navegación entre páginas solo funcionará abriendo
> cada archivo `.html` directamente por su nombre.

## Subir a Vercel

1. Sube la carpeta a un repo de GitHub
2. En [vercel.com](https://vercel.com) → **Add New Project** → importa el repo
3. Framework preset: **Other** (no hay build). Deploy y listo.

Cada `git push` redepliega automáticamente.

## Rendimiento y SEO (ya incluido)

- HTML semántico, un solo `<h1>`, alt text descriptivo en español en todas las fotos
- Meta title/description, Open Graph, JSON-LD de negocio local (`ProfessionalService`)
- Imágenes en **WebP** (`<picture>` + respaldo JPG), con `width`/`height` explícitos (cero layout shift) y `loading="lazy"` bajo el pliegue
- Imagen **LCP** (foto central del hero) con `preload` + `fetchpriority="high"`
- **Fuentes auto-alojadas** (`@font-face` local + `preload`, subset latin) — sin peticiones a Google Fonts
- **GSAP/ScrollTrigger/Flip/Lenis vendorizados** en `assets/vendor/` (sin CDN externo), diferidos; animaciones solo `transform`/`opacity` y `once: true`
- El sitio funciona completo **sin JavaScript** (las animaciones son mejora progresiva) — importante para bots
- `prefers-reduced-motion` respetado; caché inmutable de assets vía `vercel.json`

> **Antes de editar, lee `PERFORMANCE.md`** — explica qué se puede tocar libremente y qué requiere cuidado para no perder estas optimizaciones.

## Editar con Claude Code

Este repo está pensado para iterarse en VS Code con Claude Code:

```bash
cd velada-web
claude
```

Ejemplos de instrucciones útiles:
- "Cambia el número de WhatsApp en todo el sitio por +52 55 1234 5678"
- "Crea la página de Paquetes siguiendo el mismo sistema de diseño de index.html"
- "Convierte todas las imágenes a WebP y actualiza las referencias"


