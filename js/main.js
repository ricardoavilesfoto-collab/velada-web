// El menú móvil, Lenis y el cursor personalizado son globales: viven en site.js.
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const LOADER_KEY = "veladaLoaderShown";
const alreadyShown = sessionStorage.getItem(LOADER_KEY) === "1";
const skipHeroAnimation = reduceMotion || typeof gsap === "undefined" || alreadyShown;

if (!skipHeroAnimation) {
  // Se agrega antes de DOMContentLoaded para que no haya un frame scrolleable de por medio.
  document.documentElement.classList.add("is-loading");
  sessionStorage.setItem(LOADER_KEY, "1");
}

window.addEventListener("DOMContentLoaded", () => {
  const hasGsap = typeof gsap !== "undefined";
  if (hasGsap && typeof ScrollTrigger !== "undefined") gsap.registerPlugin(ScrollTrigger);

  const lenis = window.veladaLenis || null; // Lenis se crea en site.js, aquí solo se consume
  if (lenis && document.documentElement.classList.contains("is-loading")) lenis.stop();

  if (skipHeroAnimation) {
    document.documentElement.classList.remove("js");
    document.documentElement.classList.remove("is-loading");
    document.getElementById("loader")?.remove();
    lenis?.start();
    return;
  }

  // Preloader: fotos del hero apiladas en el centro → se distribuyen a su posición final.
  const collage = document.querySelector(".hero__collage");
  const loaderEl = document.getElementById("loader");
  const photos = gsap.utils.toArray(".hero__photo")
    .filter((el) => getComputedStyle(el).display !== "none");

  const JITTER = [10, -8, 6, -11, 9]; // jitter de rotación determinístico mientras están apiladas

  function computePileDeltas() {
    const collageRect = collage.getBoundingClientRect();
    const pileX = collageRect.left + collageRect.width / 2;
    const pileY = collageRect.top + collageRect.height / 2;
    return photos.map((el) => {
      const r = el.getBoundingClientRect();
      return {
        dx: pileX - (r.left + r.width / 2),
        dy: pileY - (r.top + r.height / 2),
        rot: gsap.getProperty(el, "rotate"),
      };
    });
  }

  function waitForHeroImages() {
    const imgs = Array.from(document.querySelectorAll(".hero__photo img"));
    return Promise.all(imgs.map((img) => {
      const ready = () => (img.decode ? img.decode().catch(() => {}) : Promise.resolve());
      if (img.complete && img.naturalWidth > 0) return ready();
      return new Promise((resolve) => {
        img.addEventListener("load", () => ready().then(resolve, resolve), { once: true });
        img.addEventListener("error", resolve, { once: true }); // nunca cuelga el loader por una imagen rota
      });
    }));
  }

  const MIN_LOADER_WAIT = 350;  // evita un flash instantáneo en conexiones rápidas
  const MAX_LOADER_WAIT = 1200; // tope: no retrasar demasiado el LCP en conexiones lentas

  Promise.all([
    Promise.race([waitForHeroImages(), new Promise((res) => setTimeout(res, MAX_LOADER_WAIT))]),
    new Promise((res) => setTimeout(res, MIN_LOADER_WAIT)),
  ]).then(runLoader);

  function runLoader() {
    const deltas = computePileDeltas(); // medido justo antes de animar, evita geometría obsoleta por swap de webfont
    const centro = document.querySelector(".hero__photo--centro");
    const others = photos.filter((el) => el !== centro);
    const centroIndex = photos.indexOf(centro);
    const centroDelta = deltas[centroIndex];

    gsap.set(centro, {
      x: centroDelta.dx, y: centroDelta.dy, scale: 0.5, opacity: 0,
      rotate: centroDelta.rot + JITTER[centroIndex % JITTER.length],
    });

    gsap.set(others, {
      x: (i, el) => deltas[photos.indexOf(el)].dx,
      y: (i, el) => deltas[photos.indexOf(el)].dy,
      scale: 0.3, opacity: 1, // ocultas detrás de centro por z-index, no por opacidad
      rotate: centroDelta.rot,
    });

    // Libera el scroll en cuanto el loader se desvanece, sin esperar los textos del hero.
    // Idempotente: lo dispara el fade del loader y, como red de seguridad, el onComplete.
    let scrollUnlocked = false;
    const unlockScroll = () => {
      if (scrollUnlocked) return;
      scrollUnlocked = true;
      document.documentElement.classList.remove("is-loading"); // habilita el scroll y oculta el loader
      loaderEl?.remove();
      lenis?.start();
    };

    const loaderTl = gsap.timeline({
      defaults: { ease: "power2.out" },
      onComplete: unlockScroll,
    });

    loaderTl
      .to(".loader__bar-fill", { scaleX: 1, duration: 1.0, ease: "power1.inOut" }, 0)
      .to(centro, { opacity: 1, scale: .82, duration: .35 }, 0)
      .to(centro, { x: 0, y: 0, scale: 1, duration: .55, ease: "power3.out", rotate: centroDelta.rot }, "-=.05")
      .to(others, {
        x: 0, y: 0, scale: 1, duration: .55, stagger: .07, ease: "power3.out",
        rotate: (i, el) => deltas[photos.indexOf(el)].rot,
      }, "<")
      .to(loaderEl, { opacity: 0, duration: .35, ease: "power1.out", onComplete: unlockScroll }, "-=.35")
      .to(".hero__head [data-anim]", { opacity: 1, y: 0, duration: .7, stagger: .12, startAt: { y: 24 } }, "-=.55")
      .to(".hero__note", { opacity: 1, duration: .6, stagger: .15 }, "-=.4")
      .to(".hero__cta, .hero__micro, .hero__geo", { opacity: 1, y: 0, duration: .6, stagger: .1, startAt: { y: 18 } }, "-=.4");
  }

  gsap.utils.toArray("main [data-anim='fade-up']").forEach((el) => {
    if (el.closest(".hero")) return; // el hero ya tiene su timeline
    gsap.to(el, {
      opacity: 1, y: 0, duration: .7, ease: "power2.out",
      startAt: { y: 28 },
      scrollTrigger: { trigger: el, start: "top 86%", once: true },
    });
  });

  gsap.utils.toArray("[data-anim='grid']").forEach((grid) => {
    gsap.to(grid.children, {
      opacity: 1, y: 0, duration: .65, ease: "power2.out", stagger: .09,
      startAt: { y: 34 },
      scrollTrigger: { trigger: grid, start: "top 82%", once: true },
    });
  });

  gsap.to(".banner__bg", {
    yPercent: 12, ease: "none",
    scrollTrigger: { trigger: ".banner", start: "top bottom", end: "bottom top", scrub: true },
  });

  // ScrollTrigger.refresh() al cargar fuentes/imágenes: evita que en móvil los textos
  // aparezcan tarde por el desfase de layout que deja el swap de webfont.
  const refresh = () => { if (typeof ScrollTrigger !== "undefined") ScrollTrigger.refresh(); };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
  window.addEventListener("load", refresh);
});
