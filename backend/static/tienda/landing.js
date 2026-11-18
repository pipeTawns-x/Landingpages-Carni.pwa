/*
 * Motion of the landing page (ventas:landing), with GSAP 3.13 and ScrollTrigger served from
 * static/tienda/vendor/gsap/. Loaded with `defer` after both, so the DOM is parsed.
 *
 * - Hero: the 16:9 frame opens and the headline rises word by word; on scroll the text lifts
 *   away. The video itself never moves or scales: it is seen whole (Eduardo, "sin zoom").
 * - Kinetic strip: its two lines slide in opposite directions with the scroll.
 * - Bento: the tiles open with a wipe from below, in batches; each photo drifts inside its tile.
 * - The other sections: titles and cards rise into place as they enter.
 *
 * Nothing runs when the visitor asks for less motion or when GSAP did not load: the page is
 * complete and still. The class `gsap` on <html> switches off the CSS fallback entrances.
 */
(() => {
  const { gsap, ScrollTrigger } = window;
  if (!gsap || !ScrollTrigger) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add("gsap");

  const EASE = "expo.out";
  const all = (selector) => Array.from(document.querySelectorAll(selector));

  // ------------------------------------------------------------------ hero
  const hero = document.querySelector("[data-hero]");
  if (hero) {
    const intro = gsap.timeline({ defaults: { ease: EASE } });
    intro
      .from("[data-hero-media]", { clipPath: "inset(10% 8% 10% 8% round 24px)", duration: 1.5 })
      .from("[data-word]", { yPercent: 115, rotate: 6, duration: 1.2, stagger: 0.07 }, 0.3)
      .from("[data-hero-line]", { y: 28, autoAlpha: 0, duration: 1, stagger: 0.12 }, 0.75);

    gsap.to("[data-hero-copy]", {
      y: -80,
      autoAlpha: 0,
      ease: "none",
      scrollTrigger: { trigger: hero, start: "25% top", end: "bottom top", scrub: true },
    });
  }

  // ---------------------------------------------------------- kinetic strip
  all("[data-cinta-line]").forEach((line) => {
    const direction = Number(line.dataset.cintaLine) || 1;
    gsap.fromTo(
      line,
      { xPercent: direction > 0 ? 0 : -30 },
      {
        xPercent: direction > 0 ? -30 : 0,
        ease: "none",
        scrollTrigger: { trigger: line, start: "top bottom", end: "bottom top", scrub: 0.6 },
      },
    );
  });

  // ------------------------------------------------------------------ bento
  const tiles = all("[data-bento-tile]");
  if (tiles.length) {
    gsap.set(tiles, { clipPath: "inset(100% 0% 0% 0% round 16px)" });
    ScrollTrigger.batch(tiles, {
      start: "top 88%",
      once: true,
      onEnter: (batch) =>
        gsap.to(batch, {
          clipPath: "inset(0% 0% 0% 0% round 16px)",
          duration: 1.3,
          ease: EASE,
          stagger: 0.09,
        }),
    });
    all("[data-bento-photo]").forEach((photo) => {
      gsap.fromTo(
        photo,
        { yPercent: -8, scale: 1.22 },
        {
          yPercent: 8,
          scale: 1.08,
          ease: "none",
          scrollTrigger: { trigger: photo.parentElement, start: "top bottom", end: "bottom top", scrub: true },
        },
      );
    });
  }

  // ------------------------------------------------------ titles and cards
  const risers = all("[data-reveal], main .entrada");
  gsap.set(risers, { y: 56, autoAlpha: 0 });
  ScrollTrigger.batch(risers, {
    start: "top 90%",
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, { y: 0, autoAlpha: 1, duration: 1.1, ease: EASE, stagger: 0.1, overwrite: true }),
  });
  all("main .entrada-foto").forEach((photo) => {
    gsap.fromTo(
      photo,
      { scale: 1.18 },
      {
        scale: 1,
        ease: "none",
        scrollTrigger: { trigger: photo, start: "top bottom", end: "center center", scrub: true },
      },
    );
  });

  // Fonts and lazy photos change the layout after load: measure again once they are in.
  window.addEventListener("load", () => ScrollTrigger.refresh());
})();
