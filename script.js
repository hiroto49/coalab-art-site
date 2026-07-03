(() => {
  'use strict';

  // ===== Language toggle =====
  const html = document.documentElement;
  const langToggle = document.getElementById('langToggle');
  const STORAGE_KEY = 'roaa-lang';

  const applyLang = (lang) => {
    html.setAttribute('data-lang', lang);
    html.setAttribute('lang', lang === 'en' ? 'en' : 'ja');
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
  };

  const initialLang = (() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'ja' || stored === 'en') return stored;
    } catch (e) {}
    return 'ja';
  })();
  applyLang(initialLang);

  if (langToggle) {
    langToggle.addEventListener('click', () => {
      const current = html.getAttribute('data-lang') || 'ja';
      applyLang(current === 'ja' ? 'en' : 'ja');
    });
  }

  // ===== Hero slideshow =====
  const slides = Array.from(document.querySelectorAll('.hero-slide'));
  const dotsContainer = document.getElementById('heroDots');
  let currentSlide = 0;
  let slideTimer = null;

  if (slides.length > 1 && dotsContainer) {
    slides.forEach((_, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.setAttribute('aria-label', `Slide ${i + 1}`);
      if (i === 0) btn.classList.add('is-active');
      btn.addEventListener('click', () => goToSlide(i));
      dotsContainer.appendChild(btn);
    });

    const dots = Array.from(dotsContainer.children);

    const goToSlide = (idx) => {
      slides[currentSlide].classList.remove('is-active');
      dots[currentSlide].classList.remove('is-active');
      currentSlide = (idx + slides.length) % slides.length;
      slides[currentSlide].classList.add('is-active');
      dots[currentSlide].classList.add('is-active');
      restartTimer();
    };

    const next = () => goToSlide(currentSlide + 1);

    const restartTimer = () => {
      if (slideTimer) clearInterval(slideTimer);
      slideTimer = setInterval(next, 6000);
    };

    restartTimer();
    dotsContainer.querySelectorAll('button').forEach((btn, i) => {
      btn.addEventListener('click', () => goToSlide(i));
    });
  }

  // ===== Header scroll state =====
  const header = document.getElementById('siteHeader');
  const updateHeader = () => {
    if (!header) return;
    if (window.scrollY > 40) header.classList.add('is-scrolled');
    else header.classList.remove('is-scrolled');
  };
  window.addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();

  // ===== Mobile menu =====
  const menuToggle = document.getElementById('menuToggle');
  const nav = document.getElementById('primaryNav');
  if (menuToggle && nav) {
    menuToggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('is-open');
      menuToggle.classList.toggle('is-open', isOpen);
      menuToggle.setAttribute('aria-expanded', String(isOpen));
    });
    nav.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        nav.classList.remove('is-open');
        menuToggle.classList.remove('is-open');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ===== Contact form (placeholder: no backend yet) =====
  const contactForm = document.getElementById('contactForm');
  const formThanks = document.getElementById('formThanks');
  if (contactForm && formThanks) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!contactForm.checkValidity()) {
        contactForm.reportValidity();
        return;
      }
      contactForm.reset();
      formThanks.hidden = false;
    });
  }

  // ===== Reveal on scroll (subtle) =====
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    document.querySelectorAll('.section-title, .section-lead, .service-card, .gallery-item, .concept-list li, .contact-method, .profile-meta > div').forEach(el => {
      el.classList.add('reveal');
      obs.observe(el);
    });
  }
})();
