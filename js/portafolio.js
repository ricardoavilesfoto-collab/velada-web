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

  const setNavH = () => doc.style.setProperty("--nav-h", (nav ? nav.offsetHeight : 58) + "px");
  setNavH();
  window.addEventListener("resize", setNavH);

  // Menú móvil, Lenis y cursor personalizado son globales: viven en site.js.
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

  function aplicarFiltro(cat, animate) {
    const match = (f) => cat === "todas" || f.dataset.categoria === cat;
    totalVisible = fotos.filter(match).length;
    const toggle = () => fotos.forEach((f) => f.classList.toggle("foto--oculta", !match(f)));

    if (animate && window.gsap && window.Flip) {
      // OJO: limpiar TODO estilo inline antes de que Flip mida — si no, el position:absolute que
      // Flip deja de un filtro anterior hace que las fotos reaparezcan apiladas en la esquina.
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
          gsap.set(fotos, { clearProps: "all" }); // limpia los estilos inline que deja Flip (ver arriba)
          if (window.ScrollTrigger) {
            ScrollTrigger.refresh();
            window.scrollTo({ top: galeriaTop(), behavior: "auto" });
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

  if (reduce || typeof window.gsap === "undefined") {
    doc.classList.remove("js-portafolio");
    setTotal();
    return;
  }

  gsap.registerPlugin(ScrollTrigger, Flip);

  // Solo fundido, SIN deslizamiento horizontal (x:60 hacía que las fotos "brincaran" al
  // llegar): así no se toca transform y las de preparativos conservan su rotación CSS.
  doc.classList.remove("js-portafolio");
  gsap.from(fotos, {
    opacity: 0, duration: 0.7, ease: "power2.out", stagger: 0.06,
    clearProps: "opacity",
  });

  // Pin + avance horizontal (solo escritorio): la traslación X se aplica en onUpdate/onRefresh.
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
