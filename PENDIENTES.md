# Pendientes de contenido — Velada Estudio

Última actualización: julio 2026. Este archivo lista **solo lo que realmente falta** del sitio
en producción. Cuando reemplaces un archivo de imagen, mantén el mismo nombre para no tocar
el HTML/CSS.

Estado general: la web está en vivo en https://www.veladaestudio.com.mx con las 4 páginas
(Inicio, Portafolio, Paquetes, Sobre Nosotros). Portafolio con 26 fotos reales terminado.

---

## Pendientes reales

### Links del footer (aplican a las 4 páginas)
- [ ] **Redes sociales del footer:** hoy `href="#"`. Actualizar por las URLs reales:
  - Instagram: `https://www.instagram.com/veladaestudio/`
  - Facebook: URL real de la página (pendiente confirmar el handle final)
- [ ] **Links de Legal** (`Privacidad` y `Términos`): hoy `href="#"`. Faltan las páginas
  `/privacidad` y `/terminos` con su contenido.

### Dominio
- [x] **Redirect de `veladaestudio.com` y `veladaestudio.com.mx` (apex) → `www.veladaestudio.com.mx`.**
  Configurado desde el panel de Vercel (Project Settings → Domains). El dominio canónico del
  sitio es `www.veladaestudio.com.mx`; todos los demás dominios/variantes redirigen ahí.

### SEO / distribución
- [ ] **Metadatos EXIF/IPTC** en fotografías subidas a `assets/img/` (autor, ubicación,
  keywords) — ayuda a SEO de imágenes en Google.
- [ ] **Alta en bodas.com.mx** y **MyWed** con enlace a la web.
- [ ] **Catálogos** en Facebook Business y Google Business Profile con los paquetes.

### Portafolio (opcional, ya funciona)
- Ajustes finos de rotación/posición de notas manuscritas
  (`style="--r:Ndeg"` en cada `.nota` y modificadores `.nota--arriba/--abajo/--izq/--der`)
  si se detecta alguna encimada en un ancho intermedio. No urgente.

### Limpieza opcional del repositorio (no afecta al sitio)
Hay ~16 MB de imágenes en `assets/img/` que ya no se referencian en ninguna página (quedaron
de versiones anteriores). El navegador solo descarga lo que está referenciado, pero pesan en
el repo. Se pueden borrar cuando quieras, sin tocar código:

- `assets/img/equipo-01.jpg`, `equipo-02.jpg`
- `assets/img/hero-centro.png`, `hero-inf-der.png`, `hero-inf-izq.png`, `hero-sup-der.png`, `hero-sup-izq.png`
- `assets/img/nosotros-filosofia.jpg`, `nosotros-quienes.jpg`
- `assets/img/portafolio/fiesta-01..04.jpg` y `.webp` (placeholders viejos)
- `assets/img/portafolio/sesion-01..04.jpg` y `.webp` (placeholders viejos)

---

## Historial de cambios recientes

- **jul 2026** — Portafolio terminado: 26 fotos reales distribuidas en 4 actos
  (Preparativos 6, Ceremonia 6, Sesión 9, Fiesta 6) + cierre textual. Notas manuscritas Biro
  colocadas con variedad alrededor.
- **jul 2026** — `sobre-nosotros.html` con nombre real: **Ricardo** en la polaroid principal.
  El bloque de la segunda polaroid (Iris) queda comentado en el HTML para futura activación
  si se suma al equipo.
- **jul 2026** — WhatsApp final `525529425671` en las 4 páginas.
- **jul 2026** — Dominio final `www.veladaestudio.com.mx` en canonical, og:url, sitemap, JSON-LD.
- **jul 2026** — `llms.txt` publicado para agentes de IA.
- **jul 2026** — Redirect de `veladaestudio.com` y del apex `.com.mx` hacia `www.veladaestudio.com.mx` configurado en Vercel.
