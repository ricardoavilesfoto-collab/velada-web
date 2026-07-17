# Velada Estudio — Página de inicio

Sitio estático (HTML + CSS + JS, sin build step) listo para Vercel.

## Estructura

```
velada-web/
├── index.html          ← toda la página de inicio
├── css/styles.css      ← estilos (tokens de la paleta oficial arriba del archivo)
├── js/main.js          ← animaciones GSAP + menú móvil
├── assets/
│   ├── favicon.svg
│   └── img/            ← TODAS las imágenes (placeholders por ahora)
├── vercel.json         ← caché de assets
├── robots.txt
└── sitemap.xml
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

**Formato:** todas las fotos ya usan `<picture>` con **WebP + respaldo JPG**. Al reemplazar una imagen, genera también su `.webp` (ver `PERFORMANCE.md`). Calidad ~80 es buen equilibrio; procura que ninguna pese más de ~250 KB.

## Pendientes de personalizar (buscar en `index.html`)

- [ ] **Número de WhatsApp**: buscar `5215500000000` y reemplazar (aparece 4 veces)
- [ ] **Dominio**: buscar `veladaestudio.mx` y poner el dominio definitivo (canonical, OG, JSON-LD, sitemap.xml, robots.txt)
- [ ] **Links de redes** en el footer (`#` por ahora)
- [ ] **Links internos** de "Ver portafolio completo", "Saber más", etc. (apuntan a `#` hasta que existan esas páginas)
> Nota: la lista completa y actualizada de pendientes de contenido está en **`PENDIENTES.md`**.

## Correr localmente

```bash
npx serve .
```

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


