// El menú móvil, Lenis y el cursor son globales: viven en site.js. No hay loader de hero aquí.
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

window.addEventListener("DOMContentLoaded", () => {
  const hasGsap = typeof gsap !== "undefined";

  if (reduceMotion || !hasGsap) {
    document.documentElement.classList.remove("js");
    return;
  }

  if (typeof ScrollTrigger !== "undefined") gsap.registerPlugin(ScrollTrigger);

  gsap.utils.toArray("[data-anim='fade-up']").forEach((el) => {
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
      scrollTrigger: { trigger: grid, start: "top 88%", once: true },
    });
  });

  // ScrollTrigger.refresh() al cargar fuentes/imágenes: evita que en móvil los textos
  // aparezcan tarde por el desfase de layout que deja el swap de webfont.
  const refresh = () => { if (typeof ScrollTrigger !== "undefined") ScrollTrigger.refresh(); };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
  window.addEventListener("load", refresh);
});
