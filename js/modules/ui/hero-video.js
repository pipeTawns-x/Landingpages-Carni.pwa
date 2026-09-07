// Hero video — la animación es decoración; quien pide menos movimiento
// recibe el poster quieto en lugar del loop.
const heroVideo = document.querySelector('.home-hero-video__media');

if (heroVideo && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  heroVideo.removeAttribute('autoplay');
  heroVideo.pause();
}
