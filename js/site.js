// window.veladaLenis expone la instancia de Lenis para que main.js y el lightbox puedan pausarla/reanudarla.
(function () {
  // Menú móvil: se cierra con la X, tocando el fondo, con Escape o al elegir una opción.
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

    menu.addEventListener("click", (e) => { if (e.target === menu) setMenu(false); });
    menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && menu.classList.contains("is-open")) setMenu(false);
    });
  }

  // finePointer+!reduceMotion: en táctil se usan scroll y cursor nativos, sin mejoras.
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const hasGsap = typeof gsap !== "undefined";
  const enhance = finePointer && !reduceMotion && hasGsap;

  if (hasGsap && typeof ScrollTrigger !== "undefined") gsap.registerPlugin(ScrollTrigger);

  let lenis = null;
  if (enhance && typeof Lenis !== "undefined") {
    lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });
    if (typeof ScrollTrigger !== "undefined") lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000)); // un solo rAF, compartido con GSAP
    gsap.ticker.lagSmoothing(0);

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
  window.veladaLenis = lenis;

  if (enhance) initCursor();
  initLightbox(); // no requiere puntero fino: funciona también táctil

  // El cursor nativo permanece visible; este círculo lo acompaña con gsap.quickTo (ver NOTAS-TECNICAS.md).
  function initCursor() {
    const el = document.createElement("div");
    el.className = "cursor-follow";
    el.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"/></svg>';
    document.body.appendChild(el);

    gsap.set(el, { xPercent: -50, yPercent: -50 });
    const toX = gsap.quickTo(el, "x", { duration: 0.80, ease: "power3" });
    const toY = gsap.quickTo(el, "y", { duration: 0.80, ease: "power3" });

    const MEDIA = ".portfolio__item, .hero__photo, .foto:not(.foto--texto)";
    const CLICKABLE = "a, button, .btn, [role='button'], input, textarea, label, .wa-float";

    function updateState(target) {
      if (!target || !target.closest) return;
      const onMedia = !!target.closest(MEDIA);
      el.classList.toggle("is-expand", onMedia);
      el.classList.toggle("is-hover", !onMedia && !!target.closest(CLICKABLE));
    }

    let ready = false;
    window.addEventListener("pointermove", (e) => {
      if (e.pointerType && e.pointerType !== "mouse") return;
      if (!ready) { ready = true; document.documentElement.classList.add("cursor-ready"); }
      toX(e.clientX); toY(e.clientY);
      updateState(e.target);
    });
    document.addEventListener("pointerover", (e) => updateState(e.target));

    document.addEventListener("mouseleave", () => document.documentElement.classList.remove("cursor-ready"));
    document.addEventListener("mouseenter", () => { if (ready) document.documentElement.classList.add("cursor-ready"); });
  }

  // Lightbox: la foto real (no una copia) se despega de la grilla y vuela al centro; deja un
  // marcador vacío en su lugar. Sin GSAP o con reduced-motion cae al fade simple (canFly=false).
  // Ver NOTAS-TECNICAS.md para el detalle de la animación.
  function initLightbox() {
    const lb = document.getElementById("lightbox");
    if (!lb) return;

    const imgEl = lb.querySelector(".lightbox__img"); // fallback sin vuelo (canFly=false)
    const counter = lb.querySelector(".lightbox__counter");
    const btnClose = lb.querySelector(".lightbox__close");
    const btnPrev = lb.querySelector(".lightbox__nav--prev");
    const btnNext = lb.querySelector(".lightbox__nav--next");

    // Fondo separado del contenedor para que la foto que vuela no herede su fade (se crea aquí,
    // no en el HTML, para no tener que editarlo en cada página).
    let backdrop = lb.querySelector(".lightbox__backdrop");
    if (!backdrop) {
      backdrop = document.createElement("div");
      backdrop.className = "lightbox__backdrop";
      lb.insertBefore(backdrop, lb.firstChild);
    }

    const TRIGGERS = ".portfolio__item, .hero__photo, .foto:not(.foto--texto)";
    // prev/next se limita al grupo de la foto abierta (hero, grilla portafolio o carrete) para que no se mezclen.
    const galleryRoot = (fig) => fig.closest(".hero__collage, .portfolio__grid, .galeria__pista") || document;
    const visiblesIn = (root) => Array.from(root.querySelectorAll(TRIGGERS))
      .filter((f) => !f.classList.contains("foto--oculta") && !f.classList.contains("foto--marcador")
        && getComputedStyle(f).display !== "none");

    const canFly = hasGsap && !reduceMotion;
    const EASE = "power3.inOut"; // aceleración + desaceleración marcadas, movimiento "premium"
    const OPEN_DUR = 0.6, CLOSE_DUR = 0.5, NAV_DUR = 0.45;
    const FIG_CLEAR = "position,top,left,width,height,rotate,xPercent,yPercent";

    let list = [];
    let index = 0;
    let lastFocus = null;
    let currentFig = null;         // la foto real que está actualmente "al frente" (o null)
    let currentPlaceholder = null; // su marcador vacío en la grilla

    // OJO: bloqueo de scroll por evento, NO overflow:hidden (rompía el position:sticky del nav
    // y de la barra de filtros). Ver NOTAS-TECNICAS.md.
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

    // Caja real (sin girar) + ángulo de un elemento rotado por CSS: getBoundingClientRect() de un
    // elemento rotado da su caja envolvente, no la real (daba saltos al cerrar). Detalle: NOTAS-TECNICAS.md
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

    // Caja de la IMAGEN, no de la figura: en móvil la nota ocupa espacio dentro de la figura,
    // medirla completa haría que la foto volara descuadrada.
    function imgBox(fig) {
      const img = fig.querySelector("img");
      if (!img) return rectAndAngle(fig);
      const r = img.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const w = img.offsetWidth, h = img.offsetHeight;
      const angle = rectAndAngle(fig).rotate; // el giro está en la figura, no en la <img>
      return { top: cy - h / 2, left: cx - w / 2, width: w, height: h, rotate: angle };
    }

    function targetRect(naturalW, naturalH) {
      const maxW = window.innerWidth * 0.92;
      const maxH = window.innerHeight * 0.86;
      const scale = Math.min(maxW / naturalW, maxH / naturalH, 1);
      const w = naturalW * scale, h = naturalH * scale;
      return { top: (window.innerHeight - h) / 2, left: (window.innerWidth - w) / 2, width: w, height: h, rotate: 0 };
    }

    // Marcador vacío (mismas clases) con tamaño MEDIDO explícito: en móvil el alto de una foto con
    // nota depende de la <img>, que el marcador no tiene, así que sin fijarlo colapsaba a 0 (salto
    // en el carrete). offsetWidth/Height = caja real sin girar. Detalle: NOTAS-TECNICAS.md
    function detach(fig) {
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
      gsap.set(fig.querySelectorAll(".nota"), { clearProps: "opacity" });
    }

    // Mide dónde aterrizará la imagen reinsertando la figura un instante y sacándola de nuevo;
    // todo síncrono (sin repintado) → invisible para el usuario.
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
      const from = imgBox(fig);
      const { img } = srcOf(fig);
      const to = targetRect(img.naturalWidth || from.width, img.naturalHeight || from.height);

      currentPlaceholder = detach(fig);
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

      const tl = gsap.timeline();
      tl.to(backdrop, { opacity: 1, duration: OPEN_DUR, ease: EASE }, 0)
        .to(fig, {
          top: to.top, left: to.left, width: to.width, height: to.height, rotate: 0,
          duration: OPEN_DUR, ease: EASE,
        }, 0);
      // OJO: .to() sobre una lista vacía rompe TODO el timeline en GSAP silenciosamente — siempre verificar .length antes.
      if (notes.length) tl.to(notes, { opacity: 0, duration: 0.22, ease: "power1.out" }, 0);
    }

    function finishClose() {
      lb.classList.remove("is-open");
      lb.setAttribute("aria-hidden", "true");
      gsap.set(backdrop, { clearProps: "opacity" });
      if (currentFig && currentPlaceholder) reattach(currentFig, currentPlaceholder);
      currentFig = null; currentPlaceholder = null;
      // El scroll se restaura hasta que la foto YA aterrizó (antes, se veía un brinco a media animación).
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
      const to = imgBoxAtPlaceholder(fig, currentPlaceholder);  // dónde aterriza en la grilla
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
      btnClose.focus({ preventScroll: true }); // preventScroll evita que enfocar desplace la página en móvil
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

    document.addEventListener("click", (e) => {
      if (lb.contains(e.target)) return;
      const fig = e.target.closest && e.target.closest(TRIGGERS);
      if (fig) open(fig);
    });

    btnClose.addEventListener("click", close);
    btnPrev.addEventListener("click", () => go(-1));
    btnNext.addEventListener("click", () => go(1));
    lb.addEventListener("click", (e) => { if (e.target === lb || e.target === backdrop) close(); });

    document.addEventListener("keydown", (e) => {
      if (!lb.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "ArrowRight") go(1);
    });
  }
})();
