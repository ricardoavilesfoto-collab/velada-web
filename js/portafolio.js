/* ==========================================================
   VELADA ESTUDIO — Portafolio (galería horizontal tipo carrete)
   GSAP + ScrollTrigger + Flip. Solo transform/opacity.
   Mecánica: pin + scrub (rueda vertical → avance horizontal).
   Degrada con gracia sin GSAP o con prefers-reduced-motion.
   ========================================================== */
(function () {
  const doc = document.documentElement;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const fotos = Array.from(document.querySelectorAll(".foto"));
  const pista = document.querySelector(".galeria__pista");
  const viewport = document.querySelector(".galeria__viewport");
  const filtros = Array.from(document.querySelectorAll(".filtro"));
  const barra = document.querySelector(".galeria__barra-fill");
  const elActual = document.querySelector(".galeria__actual");
  const elTotal = document.querySelector(".galeria__total");
  const nav = document.getElementById("nav");
  const seccion = document.getElementById("galeria");

  // Alto real del nav sticky → alimenta el calc() del alto de la galería y el pin
  const setNavH = () => doc.style.setProperty("--nav-h", (nav ? nav.offsetHeight : 58) + "px");
  setNavH();
  window.addEventListener("resize", setNavH);

  // (Menú móvil, Lenis y cursor personalizado son globales: viven en site.js.)

  // ---------- HUD (barra de progreso + contador) ----------
  let totalVisible = fotos.length;
  const pad = (n) => String(n).padStart(2, "0");
  const setTotal = () => { if (elTotal) elTotal.textContent = pad(totalVisible); };

  function updateHud(progress) {
    if (barra) barra.style.width = (progress * 100).toFixed(1) + "%";
    const idx = Math.min(totalVisible, Math.max(1, Math.round(progress * (totalVisible - 1)) + 1));
    if (elActual) elActual.textContent = pad(idx);
  }

  function galeriaTop() {
    return window.scrollY + seccion.getBoundingClientRect().top;
  }

  // ---------- Filtrado real por categoría ----------
  function aplicarFiltro(cat, animate) {
    const match = (f) => cat === "todas" || f.dataset.categoria === cat;
    totalVisible = fotos.filter(match).length;
    const toggle = () => fotos.forEach((f) => f.classList.toggle("foto--oculta", !match(f)));

    if (animate && window.gsap && window.Flip) {
      // Se limpia TODO estilo inline residual antes de que Flip mida las posiciones. Esto cubre
      // dos casos: (1) el transform de entrada a medio aplicar si se filtra durante el stagger;
      // (2) el position:absolute; left:0; top:0 que Flip deja sobre las fotos tras un filtro
      // anterior — sin limpiarlo, las fotos que reaparecen al volver a "Todas" arrastraban ese
      // origen y quedaban apiladas en la esquina en vez de fluir a su lugar natural.
      gsap.killTweensOf(fotos);
      gsap.set(fotos, { clearProps: "all" });
      gsap.set(fotos, { opacity: 1 });
      const state = Flip.getState(fotos);
      toggle();
      Flip.from(state, {
        duration: 0.6, ease: "power2.inOut", absolute: true,
        onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, duration: 0.4 }),
        onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.92, duration: 0.3 }),
        onComplete: () => {
          // Flip deja estilos inline (position/top/left/tamaño/transform) sobre las fotos al
          // animarlas; sin limpiarlos, al volver a "Todas" tras varios filtros algunas quedaban
          // apiladas en el origen. Se restablece el layout dictado por CSS (flex + clases marco)
          // en cada asentamiento del filtro.
          gsap.set(fotos, { clearProps: "all" });
          if (window.ScrollTrigger) {
            ScrollTrigger.refresh();
            window.scrollTo({ top: galeriaTop(), behavior: "auto" }); // reinicia el carrete al principio
          }
        },
      });
    } else {
      toggle();
    }
    setTotal();
    updateHud(0);
  }

  filtros.forEach((btn) =>
    btn.addEventListener("click", () => {
      filtros.forEach((b) => { b.classList.remove("filtro--activo"); b.setAttribute("aria-pressed", "false"); });
      btn.classList.add("filtro--activo");
      btn.setAttribute("aria-pressed", "true");
      aplicarFiltro(btn.dataset.filtro, !reduce);
    })
  );

  // ---------- Guard: sin GSAP o reduced-motion → mostrar todo, scroll/layout nativos ----------
  if (reduce || typeof window.gsap === "undefined") {
    doc.classList.remove("js-portafolio");
    setTotal();
    return;
  }

  gsap.registerPlugin(ScrollTrigger, Flip);

  // Entrada en secuencia (una sola vez): solo fundido, SIN deslizamiento horizontal. Antes
  // usaba x:60 y las fotos nacían corridas a la derecha y se deslizaban a su lugar; ese
  // recorrido a la izquierda se percibía como un "brinco" al final de la carga. Un fundido
  // limpio las deja aparecer justo donde se quedan. (No se toca transform: las de preparativos
  // conservan su rotación CSS intacta.)
  doc.classList.remove("js-portafolio");
  gsap.from(fotos, {
    opacity: 0, duration: 0.7, ease: "power2.out", stagger: 0.06,
    clearProps: "opacity",
  });

  // ---------- Pin + avance horizontal: solo escritorio ----------
  // La traslación X se aplica en onUpdate/onRefresh (a partir de self.progress).
  // Lenis ya suaviza el scroll, así que el avance del carrete se siente fluido.
  const mm = gsap.matchMedia();
  mm.add("(min-width: 901px)", () => {
    const dist = () => Math.max(0, pista.scrollWidth - viewport.clientWidth);
    const apply = (p) => { gsap.set(pista, { x: -p * dist() }); updateHud(p); };

    const st = ScrollTrigger.create({
      trigger: "#galeria",
      start: () => "top top+=" + (nav ? nav.offsetHeight : 58),
      end: () => "+=" + dist(),
      pin: "#galeria",
      invalidateOnRefresh: true,
      onUpdate: (self) => apply(self.progress),
      onRefresh: (self) => apply(self.progress),
    });

    apply(0);
    return () => { st.kill(); gsap.set(pista, { x: 0 }); }; // cleanup al salir del breakpoint
  });
})();
