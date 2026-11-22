// Keep the original film, but give the visitor control and stop work offscreen.
export function initHeroVideo(video, button, environment = { window, document }) {
  if (!video) return () => {};
  const { window: browser, document: page } = environment;
  const preference = browser.matchMedia('(prefers-reduced-motion: reduce)');
  let visible = !browser.IntersectionObserver;
  let manualChoice = null;
  let disposed = false;
  let revision = 0;

  const label = (playing) => {
    if (!button) return;
    button.textContent = playing ? 'Pausar video' : 'Reproducir video';
    button.setAttribute('aria-label', button.textContent);
  };
  const wantsPlayback = () => !disposed && visible && !page.hidden &&
    (manualChoice === null ? !preference.matches : manualChoice);

  function sync() {
    const current = ++revision;
    if (!wantsPlayback()) {
      video.pause();
      label(false);
      return;
    }
    label(true);
    Promise.resolve(video.play()).then(() => {
      // A pending play request must not restart playback after pause or teardown.
      if (!wantsPlayback()) video.pause();
    }).catch(() => {
      if (current === revision) label(false);
    });
  }
  const toggle = () => {
    manualChoice = video.paused;
    sync();
  };
  const changePreference = () => { manualChoice = null; sync(); };
  const observer = browser.IntersectionObserver ? new browser.IntersectionObserver(entries => {
    visible = entries.some(entry => entry.isIntersecting);
    sync();
  }, { threshold: 0.05 }) : null;

  video.removeAttribute('autoplay');
  if (button) {
    button.hidden = false;
    button.addEventListener('click', toggle);
  }
  page.addEventListener('visibilitychange', sync);
  preference.addEventListener('change', changePreference);
  observer?.observe(video);
  sync();

  return () => {
    disposed = true;
    revision++;
    observer?.disconnect();
    button?.removeEventListener('click', toggle);
    page.removeEventListener('visibilitychange', sync);
    preference.removeEventListener('change', changePreference);
    video.pause();
    label(false);
  };
}

if (typeof document !== 'undefined') {
  initHeroVideo(
    document.querySelector('.home-hero-video__media'),
    document.querySelector('[data-hero-playback]')
  );
}
