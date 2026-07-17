/* ==========================================================
   VELADA ESTUDIO — Animaciones de páginas interiores
   (Sobre Nosotros y futuras páginas de contenido).
   GSAP + ScrollTrigger. Solo transform/opacity, once: true.
   No hay loader de hero aquí (eso vive en main.js del index).
   El menú móvil, Lenis y el cursor son globales: viven en site.js.
   ========================================================== */

// La clase .js ya se agrega en un <script> inline del <head> (evita el parpadeo).
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

window.addEventListener("DOMContentLoaded", () => {
  const hasGsap = typeof gsap !== "undefined";

  // Sin animaciones (reduce-motion o sin GSAP): revela todo de inmediato.
  if (reduceMotion || !hasGsap) {
    document.documentElement.classList.remove("js");
    return;
  }

  if (typeof ScrollTrigger !== "undefined") gsap.registerPlugin(ScrollTrigger);

  // 1) Fade-up genérico al hacer scroll (mismo patrón que main.js)
  gsap.utils.toArray("[data-anim='fade-up']").forEach((el) => {
    gsap.to(el, {
      opacity: 1, y: 0, duration: .7, ease: "power2.out",
      startAt: { y: 28 },
      scrollTrigger: { trigger: el, start: "top 86%", once: true },
    });
  });

  // 2) Grids con stagger (valores, pasos)
  gsap.utils.toArray("[data-anim='grid']").forEach((grid) => {
    gsap.to(grid.children, {
      opacity: 1, y: 0, duration: .65, ease: "power2.out", stagger: .09,
      startAt: { y: 34 },
      scrollTrigger: { trigger: grid, start: "top 88%", once: true },
    });
  });

  // Los ScrollTrigger fijan su posición de disparo al crearse. En móvil, cuando la tipografía
  // o las imágenes terminan de cargar, la página se recorre y esas posiciones quedan
  // desfasadas → los textos aparecían tarde. Recalcular al estar listas la fuente y las imágenes.
  const refresh = () => { if (typeof ScrollTrigger !== "undefined") ScrollTrigger.refresh(); };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
  window.addEventListener("load", refresh);
});
