# Rendimiento — cómo trabajar el sitio sin romperlo

Velada es un sitio **estático** en Vercel (sin build step). Ya está muy optimizado.
Esta guía es para que, al editar contenido, no se pierda lo logrado. Está pensada para
leerse sin saber de código.

## Estado actual (optimizaciones aplicadas — julio 2026)

- **Fuentes auto-alojadas.** Las 3 tipografías (Alegreya, Alegreya Sans SC, Radio Canada)
  se sirven desde `assets/fonts/` vía `@font-face` en `css/styles.css`. **Ya NO se cargan
  desde Google Fonts** (se eliminó la petición render-blocking a un tercero). Biro Script
  Plus también es local.
- **Imágenes en WebP.** Todas las fotos usan `<picture>` con WebP + respaldo JPG. El
  navegador descarga el WebP (mucho más ligero) y cae al JPG solo si no lo soporta.
- **Imagen LCP con preload.** La foto central del hero (`assets/img/hero-centro.webp`) es
  el elemento más grande de la portada; se precarga en el `<head>` del `index.html`.
- **Animaciones locales.** GSAP, ScrollTrigger, Flip y Lenis viven en `assets/vendor/`
  (versiones fijas: GSAP 3.12.5, Lenis 1.3.11). No dependen de ningún CDN externo.
- **HTML sin comentarios** en producción (las notas de contenido viven en `PENDIENTES.md`).
- **Cero scripts de terceros / tracking.** No hay Google Tag Manager, Analytics, Meta Pixel
  ni HubSpot.

## Puedes hacer esto libremente (sin avisar)

- Cambiar textos, colores, espaciados, botones.
- Editar cualquier imagen que **no** sea la portada/hero del inicio (ver siguiente sección).
- Cambiar títulos, descripciones y datos de SEO.
- Agregar o quitar secciones **más abajo** en cualquier página (no lo primero que se ve).

## Esto sí requiere cuidado

### 1. Cambiar la foto central del hero del inicio
`assets/img/hero-centro.*` es la **imagen LCP** (la que Google mide como "lo más pesado de
la pantalla"). Si la cambias:
- Mantén el mismo nombre de archivo, o
- Actualiza el `<link rel="preload" ... href="assets/img/hero-centro.webp">` del `<head>`
  de `index.html` con el nombre nuevo.

### 2. Imágenes nuevas (cualquier página)
Toda foto nueva debe:
- Tener **`width` y `height`** en el `<img>` (evita que la página brinque al cargar → CLS 0).
- Llevar **`loading="lazy"`** si NO es lo primero que se ve al entrar.
- Tener una **versión WebP** y envolverse en `<picture>`, igual que las demás:
  ```html
  <picture>
    <source srcset="assets/img/mi-foto.webp" type="image/webp">
    <img src="assets/img/mi-foto.jpg" alt="…" width="1200" height="800" loading="lazy" decoding="async">
  </picture>
  ```
  Para generar el `.webp` desde un `.jpg` sin instalar nada permanente:
  ```bash
  npx sharp-cli -i mi-foto.jpg -o . --format webp -q 80
  ```
  (o cualquier conversor WebP; calidad ~80 es un buen equilibrio).

### 3. No re-agregar Google Fonts
Las fuentes ya son locales. **No** vuelvas a poner el `<link href="fonts.googleapis.com…">`.
Si necesitas un peso o estilo nuevo, descarga su `.woff2` (subset latin) a `assets/fonts/`
y añade su `@font-face` en `styles.css`.

### 4. No instalar plugins/scripts pesados de terceros en la ruta crítica
Si algún día se añade analítica o un chat, cárgalo **diferido** (`defer`/`async`) y ligero.
Evita gestores de etiquetas pesados (tipo GTM) salvo que sea imprescindible.

### 5. Actualizar GSAP/Lenis es un cambio deliberado
Viven en `assets/vendor/` con versión fija. No se actualizan solos; hacerlo es una decisión
consciente (probar animaciones después).

## Notas técnicas
- **Caché:** `vercel.json` cachea `/assets/*` por 1 año (`immutable`). Por eso, si
  reemplazas un archivo dentro de `assets/` **con el mismo nombre**, los visitantes que ya
  lo tenían en caché podrían seguir viendo el viejo un tiempo. Para forzar actualización
  inmediata, cambia el nombre del archivo (y su referencia) o avisa al desarrollador.
- **Servir localmente:** `npx serve .` o `python -m http.server 8000` en la raíz. En local
  las URLs llevan `.html`; en Vercel no (por `cleanUrls`).
- **Medición real:** el score de PageSpeed de laboratorio penaliza las animaciones GSAP en
  CPU lenta; lo que importa para SEO/Ads son los Core Web Vitals de usuarios reales. El
  loader animado del hero es una decisión de diseño que fija un piso de LCP en la 1ª visita.

## Posible mejora futura (opcional)
- **`srcset` responsive**: servir versiones más pequeñas de las imágenes grandes en móvil
  (hero, `diferenciador`, banners de ancho completo). Reduce bytes en celular. No aplicado
  aún para no aumentar el marcado; se puede añadir imagen por imagen cuando se quiera.
