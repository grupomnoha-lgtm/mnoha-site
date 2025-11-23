// Lightweight accessible carousel
(function(){
  const bannerRoot = document.querySelector('.photo-banner .banner');
  if (!bannerRoot) return;

  const track = bannerRoot.querySelector('.banner__track');
  const slides = Array.from(bannerRoot.querySelectorAll('.banner__slide'));
  const prevBtn = bannerRoot.querySelector('.banner__nav--prev');
  const nextBtn = bannerRoot.querySelector('.banner__nav--next');
  const dotsContainer = bannerRoot.querySelector('.banner__dots');
  const autoplay = bannerRoot.dataset.autoplay === 'true';
  const intervalMs = parseInt(bannerRoot.dataset.interval, 10) || 4500;

  let current = 0;
  let timerId = null;

  function goTo(index) {
    if (index < 0) index = slides.length - 1;
    if (index >= slides.length) index = 0;
    current = index;
    const offset = -current * 100;
    track.style.transform = `translateX(${offset}%)`;
    updateDots();
  }

  function prev() { goTo(current - 1); }
  function next() { goTo(current + 1); }

  function createDots() {
    slides.forEach((s, i) => {
      const btn = document.createElement('button');
      btn.className = 'banner__dot';
      btn.type = 'button';
      btn.setAttribute('role','tab');
      btn.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      btn.setAttribute('aria-label', `Ir a la imagen ${i+1}`);
      btn.addEventListener('click', () => { goTo(i); resetAutoplay(); });
      dotsContainer.appendChild(btn);
    });
  }

  function updateDots() {
    const dots = Array.from(dotsContainer.children);
    dots.forEach((d, i) => d.setAttribute('aria-selected', String(i === current)));
  }

  function startAutoplay(){
    if (!autoplay) return;
    stopAutoplay();
    timerId = setInterval(() => next(), intervalMs);
  }
  function stopAutoplay(){ if (timerId) { clearInterval(timerId); timerId = null; } }
  function resetAutoplay(){ stopAutoplay(); startAutoplay(); }

  // Init
  createDots();
  goTo(0);
  startAutoplay();

  // Events
  prevBtn.addEventListener('click', () => { prev(); resetAutoplay(); });
  nextBtn.addEventListener('click', () => { next(); resetAutoplay(); });

  bannerRoot.addEventListener('mouseenter', stopAutoplay);
  bannerRoot.addEventListener('mouseleave', startAutoplay);

  // Keyboard support
  bannerRoot.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { prev(); resetAutoplay(); }
    if (e.key === 'ArrowRight') { next(); resetAutoplay(); }
  });

  // Make the banner focusable for keyboard navigation
  bannerRoot.tabIndex = 0;
})();
