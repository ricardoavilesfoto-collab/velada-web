/* ==========================================================
   VELADA ESTUDIO — Comportamiento global del sitio
   Se carga en TODAS las páginas (antes de main.js / portafolio.js).
   Provee: menú móvil, scroll suave (Lenis) y cursor personalizado.
   Expone la instancia de Lenis en window.veladaLenis para que el
   loader del hero y el lightbox puedan pausarla/reanudarla.
   Solo transform/opacity. Requiere GSAP + ScrollTrigger + Lenis ya cargados.
   ========================================================== */
(function () {
  // ---------- Menú móvil ----------
  // Panel a pantalla completa. Se abre con el botón hamburguesa y se cierra de cuatro
  // maneras: la X del panel, tocando el fondo vacío, con Escape o al elegir una opción.
  // Mientras está abierto se bloquea el scroll del fondo (clase .menu-open en <html>).
  const burger = document.getElementById("burger");
  const menu = document.querySelector(".nav__menu");
  if (burger && menu) {
    const docEl = document.documentElement;
    const closeBtn = menu.querySelector(".nav__close");

    const setMenu = (open) => {
      menu.classList.toggle("is-open", open);
      burger.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", String(open));
      docEl.classList.toggle("menu-open", open);
    };

    burger.addEventListener("click", () => setMenu(!menu.classList.contains("is-open")));
    if (closeBtn) closeBtn.addEventListener("click", () => setMenu(false));

    // Tap en el fondo del panel (no en un enlace/botón) cierra
    menu.addEventListener("click", (e) => { if (e.target === menu) setMenu(false); });

    // Elegir una opción cierra
    menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setMenu(false)));

    // Escape cierra
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && menu.classList.contains("is-open")) setMenu(false);
    });
  }

  // Solo en punteros finos (mouse) y sin reduced-motion. En táctil: scroll y cursor nativos.
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const hasGsap = typeof gsap !== "undefined";
  const enhance = finePointer && !reduceMotion && hasGsap;

  if (hasGsap && typeof ScrollTrigger !== "undefined") gsap.registerPlugin(ScrollTrigger);

  // ---------- Scroll suave global (Lenis) ----------
  let lenis = null;
  if (enhance && typeof Lenis !== "undefined") {
    lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });
    if (typeof ScrollTrigger !== "undefined") lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000)); // un solo rAF, compartido con GSAP
    gsap.ticker.lagSmoothing(0);

    // Anchors internos del nav con scroll suave (compensando el nav sticky).
    // Los links entre páginas (p. ej. index.html#paquetes) no empiezan con "#", así que no se tocan.
    const nav = document.getElementById("nav");
    document.querySelectorAll('.nav__link[href^="#"]').forEach((a) => {
      const id = a.getAttribute("href");
      if (id.length <= 1) return;
      a.addEventListener("click", (e) => {
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: -(nav ? nav.offsetHeight : 0) });
      });
    });
  }
  window.veladaLenis = lenis; // consumido por el loader del hero (main.js) y el lightbox

  // ---------- Cursor: círculo que sigue al cursor nativo (estilo editorial) ----------
  if (enhance) initCursor();

  // Lightbox global (index + portafolio). No requiere puntero fino: funciona también táctil.
  initLightbox();

  // El cursor NATIVO permanece visible; un círculo lo sigue con retraso (gsap.quickTo) y
  // reacciona: crece sobre clicables (is-hover) y, sobre una imagen abrible en lightbox,
  // se agranda y revela un icono de "expandir" (is-expand). Solo transform/opacity + tamaño.
  function initCursor() {
    const el = document.createElement("div");
    el.className = "cursor-follow";
    el.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"/></svg>';
    document.body.appendChild(el);

    gsap.set(el, { xPercent: -50, yPercent: -50 });
    const toX = gsap.quickTo(el, "x", { duration: 0.80, ease: "power3" });
    const toY = gsap.quickTo(el, "y", { duration: 0.80, ease: "power3" });

    const MEDIA = ".portfolio__item, .hero__photo, .foto:not(.foto--texto)"; // imágenes que abren en lightbox (las tarjetas de texto no)
    const CLICKABLE = "a, button, .btn, [role='button'], input, textarea, label, .wa-float";

    function updateState(target) {
      if (!target || !target.closest) return;
      const onMedia = !!target.closest(MEDIA);
      el.classList.toggle("is-expand", onMedia);
      el.classList.toggle("is-hover", !onMedia && !!target.closest(CLICKABLE));
    }

    let ready = false;
    window.addEventListener("pointermove", (e) => {
      if (e.pointerType && e.pointerType !== "mouse") return; // ignora touch/pen
      if (!ready) { ready = true; document.documentElement.classList.add("cursor-ready"); }
      toX(e.clientX); toY(e.clientY);
      updateState(e.target);
    });
    // Reacciona aunque el mouse no se mueva (contenido que cambia bajo el cursor)
    document.addEventListener("pointerover", (e) => updateState(e.target));

    document.addEventListener("mouseleave", () => document.documentElement.classList.remove("cursor-ready"));
    document.addEventListener("mouseenter", () => { if (ready) document.documentElement.classList.add("cursor-ready"); });
  }

  // ---------- Lightbox: abrir foto, navegar (prev/next, teclado) y cerrar ----------
  // La fotografía real de la grilla (no una copia) se despega de su lugar y se mueve, sola,
  // hasta quedar centrada y recta frente a la cámara; al cerrar regresa por el mismo camino
  // a su sitio exacto. Mientras está "al frente" deja un marcador vacío (mismas clases, sin
  // contenido) en su lugar para que las fotos vecinas no se recorran. Solo el fondo oscuro
  // hace fade, a la misma duración que dura el movimiento. Sin GSAP o con reduced-motion cae
  // al fade simple de siempre (canFly = false).
  function initLightbox() {
    const lb = document.getElementById("lightbox");
    if (!lb) return;

    const imgEl = lb.querySelector(".lightbox__img"); // solo se usa en el fallback sin vuelo
    const counter = lb.querySelector(".lightbox__counter");
    const btnClose = lb.querySelector(".lightbox__close");
    const btnPrev = lb.querySelector(".lightbox__nav--prev");
    const btnNext = lb.querySelector(".lightbox__nav--next");

    // Capa del fondo oscuro, SEPARADA del contenedor: es la única que hace fade. Así la foto
    // que vuela (hija de .lightbox) nunca hereda la disolución del fondo. Se crea aquí para
    // no tener que editar el HTML de cada página.
    let backdrop = lb.querySelector(".lightbox__backdrop");
    if (!backdrop) {
      backdrop = document.createElement("div");
      backdrop.className = "lightbox__backdrop";
      lb.insertBefore(backdrop, lb.firstChild);
    }

    const TRIGGERS = ".portfolio__item, .hero__photo, .foto:not(.foto--texto)"; // las tarjetas de texto no abren el visor
    // La navegación (prev/next) se limita al "grupo" de la foto abierta: el collage del hero,
    // la grilla del portafolio o el carrete de la página de portafolio; así el hero no se mezcla
    // con la grilla de abajo. Si no está en ninguno, se usa todo el documento.
    const galleryRoot = (fig) => fig.closest(".hero__collage, .portfolio__grid, .galeria__pista") || document;
    const visiblesIn = (root) => Array.from(root.querySelectorAll(TRIGGERS))
      .filter((f) => !f.classList.contains("foto--oculta") && !f.classList.contains("foto--marcador")
        && getComputedStyle(f).display !== "none"); // excluye las laterales ocultas del hero en móvil

    const canFly = hasGsap && !reduceMotion;
    const EASE = "power3.inOut"; // aceleración + desaceleración marcadas, movimiento "premium"
    const OPEN_DUR = 0.6, CLOSE_DUR = 0.5, NAV_DUR = 0.45;
    const FIG_CLEAR = "position,top,left,width,height,rotate,xPercent,yPercent";

    let list = [];
    let index = 0;
    let lastFocus = null;
    let currentFig = null;         // la foto real que está actualmente "al frente" (o null)
    let currentPlaceholder = null; // su marcador vacío en la grilla

    // Bloqueo de scroll SIN overflow:hidden: usar overflow rompía el position:sticky del nav y de la
    // barra de filtros (se despegaban y saltaban). En su lugar se bloquean rueda y touch por evento,
    // así el sticky se mantiene en su sitio y el fondo del visor lo cubre con su fundido, sin brincos.
    const blockScroll = (e) => e.preventDefault();
    function lockScroll() {
      document.documentElement.classList.add("lb-open");
      window.addEventListener("wheel", blockScroll, { passive: false });
      window.addEventListener("touchmove", blockScroll, { passive: false });
    }
    function unlockScroll() {
      document.documentElement.classList.remove("lb-open");
      window.removeEventListener("wheel", blockScroll, { passive: false });
      window.removeEventListener("touchmove", blockScroll, { passive: false });
    }

    const srcOf = (fig) => {
      const img = fig.querySelector("img");
      return { img, src: (img && (img.currentSrc || img.src)) || "", alt: (img && img.alt) || "" };
    };

    // Caja REAL (sin girar) + rotación, de un elemento que puede estar rotado por CSS.
    // getBoundingClientRect() de un elemento rotado devuelve su caja ENVOLVENTE (más grande y
    // corrida), no su caja real — eso hacía que la foto girada aterrizara mal al cerrar y diera
    // un saltito. El centro de la envolvente SÍ coincide con el centro real (el giro es sobre el
    // centro), así que tomamos ese centro + el tamaño real (offsetWidth/Height, que ignora el
    // transform) y reconstruimos la caja sin girar. Animar top/left/width/height + rotate sobre
    // esa caja reproduce el mismo lugar exacto, sin salto.
    function rectAndAngle(el) {
      const r = el.getBoundingClientRect();
      const t = getComputedStyle(el).transform;
      let angle = 0;
      if (t && t !== "none") {
        const m = t.match(/^matrix\(([^)]+)\)/);
        if (m) {
          const v = m[1].split(",").map(Number);
          angle = Math.atan2(v[1], v[0]) * (180 / Math.PI);
        }
      }
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2; // centro real (invariante al giro)
      const w = el.offsetWidth, h = el.offsetHeight;              // tamaño real sin girar
      return { top: cy - h / 2, left: cx - w / 2, width: w, height: h, rotate: angle };
    }

    // Caja de la IMAGEN de una figura (no de la figura). En móvil, las fotos con nota son un contenedor
    // donde la nota ocupa espacio; medir la figura completa haría que la foto volara descuadrada. Aquí
    // tomamos la caja real de la <img> (su centro + su tamaño) con el giro que vive en la figura.
    function imgBox(fig) {
      const img = fig.querySelector("img");
      if (!img) return rectAndAngle(fig);
      const r = img.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const w = img.offsetWidth, h = img.offsetHeight;
      const angle = rectAndAngle(fig).rotate; // el giro está en la figura, no en la <img>
      return { top: cy - h / 2, left: cx - w / 2, width: w, height: h, rotate: angle };
    }

    // Rect centrado en viewport que respeta object-fit:contain dentro de 92vw x 86vh,
    // sin agrandar más allá del tamaño natural.
    function targetRect(naturalW, naturalH) {
      const maxW = window.innerWidth * 0.92;
      const maxH = window.innerHeight * 0.86;
      const scale = Math.min(maxW / naturalW, maxH / naturalH, 1);
      const w = naturalW * scale, h = naturalH * scale;
      return { top: (window.innerHeight - h) / 2, left: (window.innerWidth - w) / 2, width: w, height: h, rotate: 0 };
    }

    // Saca la foto real de su fila dejando un marcador vacío (mismas clases, sin contenido,
    // así que ocupa exactamente el mismo espacio) en su lugar. Se le fija el tamaño MEDIDO:
    // en escritorio el marcador vacío conserva su tamaño por el aspect-ratio de su clase, pero
    // en móvil las fotos con nota toman su alto de la <img> (que el marcador ya no tiene), así
    // que sin un alto explícito el marcador colapsaba a 0 y el carrete daba un salto.
    function detach(fig) {
      // offsetWidth/Height = caja REAL sin girar (getBoundingClientRect daría la envolvente
      // AGRANDADA de una foto rotada → el marcador quedaría más grande y al cerrar habría salto).
      const placeholder = fig.cloneNode(false);
      placeholder.classList.add("foto--marcador"); // vacío e inerte: sin clic, sin hover
      placeholder.style.width = fig.offsetWidth + "px";
      placeholder.style.height = fig.offsetHeight + "px";
      fig.before(placeholder);
      fig.classList.add("foto--flying");
      lb.appendChild(fig);
      return placeholder;
    }
    function reattach(fig, placeholder) {
      placeholder.replaceWith(fig);
      fig.classList.remove("foto--flying");
      gsap.set(fig, { clearProps: FIG_CLEAR });
      gsap.set(fig.querySelectorAll(".nota"), { clearProps: "opacity" }); // la nota vuelve a su opacidad normal
    }

    // Mide dónde aterrizará la IMAGEN en su lugar de la grilla: reinserta la figura un instante (con la
    // nota de vuelta en su flujo), mide, y la vuelve a sacar. Todo síncrono (sin repintado) → invisible.
    function imgBoxAtPlaceholder(fig, placeholder) {
      placeholder.replaceWith(fig);
      fig.classList.remove("foto--flying");
      gsap.set(fig, { clearProps: FIG_CLEAR });
      const box = imgBox(fig);
      fig.before(placeholder);
      fig.classList.add("foto--flying");
      lb.appendChild(fig);
      return box;
    }

    function render() {
      const s = srcOf(list[index]);
      imgEl.src = s.src; imgEl.alt = s.alt;
      counter.textContent = `${index + 1} / ${list.length}`;
    }

    function openFly(fig) {
      const from = imgBox(fig); // caja de la IMAGEN en su lugar (no de la figura, por la nota en móvil)
      const { img } = srcOf(fig);
      const to = targetRect(img.naturalWidth || from.width, img.naturalHeight || from.height);

      currentPlaceholder = detach(fig); // marcador = figura completa; luego la nota pasa a absolute
      currentFig = fig;
      const notes = fig.querySelectorAll(".nota");
      gsap.killTweensOf([fig, backdrop, ...notes]);
      gsap.set(fig, {
        position: "fixed", top: from.top, left: from.left,
        width: from.width, height: from.height, rotate: from.rotate,
        xPercent: 0, yPercent: 0,
      });

      counter.textContent = `${index + 1} / ${list.length}`;
      gsap.set(backdrop, { opacity: 0 });
      lb.classList.add("is-open");
      lb.setAttribute("aria-hidden", "false");

      // El fondo se oscurece al ritmo en que la foto vuela y aterriza; la nota se desvanece (fade)
      // en el primer tramo para que no se corte de golpe.
      const tl = gsap.timeline();
      tl.to(backdrop, { opacity: 1, duration: OPEN_DUR, ease: EASE }, 0)
        .to(fig, {
          top: to.top, left: to.left, width: to.width, height: to.height, rotate: 0,
          duration: OPEN_DUR, ease: EASE,
        }, 0);
      // OJO: un .to() sobre una lista vacía ROMPE todo el timeline en GSAP → solo si hay notas.
      if (notes.length) tl.to(notes, { opacity: 0, duration: 0.22, ease: "power1.out" }, 0);
    }

    function finishClose() {
      lb.classList.remove("is-open");
      lb.setAttribute("aria-hidden", "true");
      gsap.set(backdrop, { clearProps: "opacity" });
      if (currentFig && currentPlaceholder) reattach(currentFig, currentPlaceholder);
      currentFig = null; currentPlaceholder = null;
      // El scroll/foco de fondo se restauran hasta que la foto YA aterrizó en su lugar:
      // hacerlo antes provocaba un brinco visible a media animación de regreso.
      unlockScroll();
      if (window.veladaLenis) window.veladaLenis.start();
      if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus({ preventScroll: true });
    }

    function closeFly() {
      if (!currentFig || !currentPlaceholder) { finishClose(); return; }
      const fig = currentFig;
      const notes = fig.querySelectorAll(".nota");
      gsap.killTweensOf([fig, backdrop, ...notes]);
      const current = rectAndAngle(fig);                        // dónde está ahora (centrada)
      const to = imgBoxAtPlaceholder(fig, currentPlaceholder);  // dónde aterriza la imagen en la grilla
      gsap.set(fig, {
        position: "fixed", top: current.top, left: current.left,
        width: current.width, height: current.height, rotate: current.rotate,
        xPercent: 0, yPercent: 0,
      });

      const tl = gsap.timeline();
      tl.to(backdrop, { opacity: 0, duration: CLOSE_DUR, ease: EASE }, 0)
        .to(fig, {
          top: to.top, left: to.left, width: to.width, height: to.height, rotate: to.rotate,
          duration: CLOSE_DUR, ease: EASE,
          onComplete: finishClose,
        }, 0);
      if (notes.length) tl.to(notes, { opacity: 1, duration: 0.3, ease: "power1.out" }, CLOSE_DUR - 0.3);
    }

    function open(fig) {
      list = visiblesIn(galleryRoot(fig));
      index = list.indexOf(fig);
      if (index < 0 || !list.length) return;
      lastFocus = document.activeElement;
      if (window.veladaLenis) window.veladaLenis.stop();
      btnClose.focus({ preventScroll: true }); // preventScroll: enfocar no debe desplazar la página (saltos en móvil)
      lockScroll();

      if (canFly) {
        openFly(fig);
      } else {
        render();
        lb.classList.add("is-open");
        lb.setAttribute("aria-hidden", "false");
      }
    }
    function close() {
      if (canFly) {
        closeFly();
      } else {
        unlockScroll();
        if (window.veladaLenis) window.veladaLenis.start();
        if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus({ preventScroll: true });
        lb.classList.remove("is-open");
        lb.setAttribute("aria-hidden", "true");
      }
    }
    function go(dir) {
      if (!list.length) return;

      if (canFly) {
        if (!currentFig || !currentPlaceholder) return;
        const oldFig = currentFig, oldPlaceholder = currentPlaceholder;

        index = (index + dir + list.length) % list.length;
        const newFig = list[index];

        // La foto actual regresa a su lugar (el fondo se queda oscuro) mientras su nota reaparece;
        // la siguiente sale de su lugar y su nota se desvanece — puro movimiento, sin tocar el fondo.
        const oldNotes = oldFig.querySelectorAll(".nota");
        const oldCurrent = rectAndAngle(oldFig);
        const backRect = imgBoxAtPlaceholder(oldFig, oldPlaceholder);
        gsap.killTweensOf([oldFig, ...oldNotes]);
        gsap.set(oldFig, {
          position: "fixed", top: oldCurrent.top, left: oldCurrent.left,
          width: oldCurrent.width, height: oldCurrent.height, rotate: oldCurrent.rotate,
          xPercent: 0, yPercent: 0,
        });
        const tlOld = gsap.timeline();
        tlOld.to(oldFig, {
            top: backRect.top, left: backRect.left, width: backRect.width, height: backRect.height,
            rotate: backRect.rotate, duration: NAV_DUR, ease: EASE,
            onComplete() { reattach(oldFig, oldPlaceholder); },
          }, 0);
        if (oldNotes.length) tlOld.to(oldNotes, { opacity: 1, duration: 0.25, ease: "power1.out" }, NAV_DUR - 0.25);

        const fromNew = imgBox(newFig);
        const { img } = srcOf(newFig);
        const toNew = targetRect(img.naturalWidth || fromNew.width, img.naturalHeight || fromNew.height);
        currentPlaceholder = detach(newFig);
        currentFig = newFig;
        const newNotes = newFig.querySelectorAll(".nota");
        gsap.killTweensOf([newFig, ...newNotes]);
        gsap.set(newFig, {
          position: "fixed", top: fromNew.top, left: fromNew.left,
          width: fromNew.width, height: fromNew.height, rotate: fromNew.rotate,
          xPercent: 0, yPercent: 0,
        });
        counter.textContent = `${index + 1} / ${list.length}`;
        const tlNew = gsap.timeline();
        tlNew.to(newFig, {
            top: toNew.top, left: toNew.left, width: toNew.width, height: toNew.height, rotate: 0,
            duration: NAV_DUR, ease: EASE,
          }, 0);
        if (newNotes.length) tlNew.to(newNotes, { opacity: 0, duration: 0.2, ease: "power1.out" }, 0);
      } else {
        index = (index + dir + list.length) % list.length;
        render();
      }
    }

    // Delegación: un clic en cualquier figura abrible abre el lightbox (robusto ante filtros/reflow)
    document.addEventListener("click", (e) => {
      if (lb.contains(e.target)) return;
      const fig = e.target.closest && e.target.closest(TRIGGERS);
      if (fig) open(fig);
    });

    btnClose.addEventListener("click", close);
    btnPrev.addEventListener("click", () => go(-1));
    btnNext.addEventListener("click", () => go(1));
    lb.addEventListener("click", (e) => { if (e.target === lb || e.target === backdrop) close(); }); // clic en el fondo

    document.addEventListener("keydown", (e) => {
      if (!lb.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "ArrowRight") go(1);
    });
  }
})();
