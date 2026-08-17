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

  // ===== Contact form =====
  // FormSubmit の ajax エンドポイントへ送信し、ページ内で完了を伝える。
  // 通信に失敗した場合は form の action へ通常送信でフォールバックする。
  const contactForm = document.getElementById('contactForm');
  const formThanks = document.getElementById('formThanks');
  const formError = document.getElementById('formError');
  if (contactForm && formThanks) {
    const submitButton = contactForm.querySelector('.form-button');
    const buttonLabel = submitButton ? submitButton.innerHTML : '';

    // 非JS環境用の _next で戻ってきたときも完了メッセージを出す
    if (location.search.indexOf('sent=1') > -1) formThanks.hidden = false;

    contactForm.addEventListener('submit', (e) => {
      if (!contactForm.checkValidity()) {
        e.preventDefault();
        contactForm.reportValidity();
        return;
      }
      if (!window.fetch) return; // 通常送信に任せる
      e.preventDefault();

      formThanks.hidden = true;
      if (formError) formError.hidden = true;
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = document.documentElement.getAttribute('data-lang') === 'en' ? 'SENDING…' : '送信中…';
      }

      const action = contactForm.getAttribute('action').replace('formsubmit.co/', 'formsubmit.co/ajax/');
      fetch(action, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new FormData(contactForm)
      })
        .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then((data) => {
          // 未有効化などの失敗時も HTTP 200 で success:"false" が返るため中身で判定する
          const ok = data && (data.success === true || String(data.success) === 'true');
          if (!ok) throw new Error((data && data.message) || 'not delivered');
          contactForm.reset();
          formThanks.hidden = false;
        })
        .catch(() => {
          if (formError) formError.hidden = false;
          else contactForm.submit();
        })
        .then(() => {
          if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerHTML = buttonLabel;
          }
        });
    });
  }

  // ===== 字余りガード =====
  // 段落・見出しの最終行が1〜2文字だけになる場合、その要素の右余白を
  // 少しずつ（最大28px）足して折り返し位置をずらし、字余りを解消する。
  // CSSのtext-wrapで直りきらないケースの保険。画面幅が変わるたびに再計算。
  const ORPHAN_SELECTOR = '.section p, .section dd, .section h2, .section h3, .statement-body p, .section-lead, .lead p';
  const lastLineCount = (el) => {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const lines = new Map(); // 行のY位置 -> その行の文字列
    let node;
    while ((node = walker.nextNode())) {
      const text = node.textContent;
      for (let i = 0; i < text.length; i++) {
        if (/\s/.test(text[i])) continue;
        const range = document.createRange();
        range.setStart(node, i);
        range.setEnd(node, i + 1);
        const rect = range.getClientRects()[0];
        if (!rect || rect.width === 0) continue; // 非表示言語のspan等
        const key = Math.round(rect.top / 8) * 8;
        lines.set(key, (lines.get(key) || '') + text[i]);
      }
    }
    if (lines.size < 2) return null; // 1行以下なら対象外
    const lastKey = Math.max(...lines.keys());
    // 句読点・記号を除いた実質の文字数で判定（「ます。」=2文字 扱い）
    return lines.get(lastKey).replace(/[、。・．，「」『』（）()！？!?.,—–-]/g, '').length;
  };
  const fixOrphans = () => {
    document.querySelectorAll(ORPHAN_SELECTOR).forEach((el) => {
      el.style.paddingRight = '';
      el.style.paddingLeft = '';
      const count = lastLineCount(el);
      if (count === null || count > 2) return;
      const centered = getComputedStyle(el).textAlign === 'center';
      for (let pad = 4; pad <= 28; pad += 4) {
        if (centered) {
          el.style.paddingLeft = (pad / 2) + 'px';
          el.style.paddingRight = (pad / 2) + 'px';
        } else {
          el.style.paddingRight = pad + 'px';
        }
        const now = lastLineCount(el);
        if (now === null || now > 2) return; // 解消できたら確定
      }
      el.style.paddingRight = ''; // 解消できなければ元に戻す
      el.style.paddingLeft = '';
    });
  };
  let orphanTimer = null;
  const scheduleOrphanFix = () => {
    if (orphanTimer) clearTimeout(orphanTimer);
    orphanTimer = setTimeout(fixOrphans, 150);
  };
  window.addEventListener('resize', scheduleOrphanFix);
  if (langToggle) langToggle.addEventListener('click', scheduleOrphanFix);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(scheduleOrphanFix); // Webフォント適用後に実測
  }
  scheduleOrphanFix();

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
