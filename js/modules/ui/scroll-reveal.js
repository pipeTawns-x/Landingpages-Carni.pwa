// Scroll reveal: reutiliza el patrón del bento (IntersectionObserver).
// Las secciones marcadas con .reveal se animan al entrar en viewport.
// Respetan prefers-reduced-motion: sin animación, aparecen directamente visibles.
(function() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  const reveals = document.querySelectorAll('.reveal');
  if (!reveals.length || typeof IntersectionObserver === 'undefined') {
    reveals.forEach(r => r.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  reveals.forEach(r => observer.observe(r));
})();
