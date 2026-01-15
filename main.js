/* main.js
   - вставляет SVG <defs> фильтра для liquid glass (локально в документ)
   - выставляет абсолютный URL в CSS переменную --lg-filter (чтобы работать в Firefox)
   - помечает nav-buttons, nav-btn и content-block классом liquid-glass (автоматически)
   - содержит минимальную логику showContent (взято из вашего index)
*/

/* ---------- SVG filter (simple generated filter, can be tuned) ---------- */
const svgFilter = `
<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute;overflow:hidden">
  <defs>
    <filter id="liquid-glass-filter" x="0%" y="0%" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.007 0.007" numOctaves="2" seed="92" result="noise"/>
      <feGaussianBlur in="noise" stdDeviation="2" result="blurred"/>
      <feDisplacementMap in="SourceGraphic" in2="blurred" scale="40" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
  </defs>
</svg>`;

/* Insert SVG defs at top of <body> (so url(#id) works for same-document references) */
(function insertSvgAndSetupFilter() {
  try {
    document.addEventListener('DOMContentLoaded', () => {
      // add svg defs
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.width = 0; container.style.height = 0; container.style.overflow = 'hidden';
      container.innerHTML = svgFilter;
      document.body.insertBefore(container, document.body.firstChild);

      // build absolute URL for Firefox (location without hash) and set CSS variable
      const base = location.href.split('#')[0];
      const filterUrl = `url("${base}#liquid-glass-filter")`;
      document.documentElement.style.setProperty('--lg-filter', filterUrl);

      // Add classes to target elements: nav-buttons (container), each nav-btn, and content-block
      const navContainer = document.querySelector('.nav-buttons');
      if (navContainer) navContainer.classList.add('liquid-glass', 'liquid-glass-auto');

      document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.add('liquid-glass', 'liquid-glass-auto');
      });

      document.querySelectorAll('.content-block').forEach(el => {
        el.classList.add('liquid-glass', 'liquid-glass-auto');
      });

      // For browsers that don't support complex filter, swap to fallback:
      // prefer feature-detection (CSS.supports)
      const supports = (() => {
        try {
          // test filter with url should be reliable per guide
          return CSS && CSS.supports && CSS.supports('filter', 'url(#liquid-glass-filter)');
        } catch (e) { return false; }
      })();
      if (!supports) {
        document.querySelectorAll('.liquid-glass-auto').forEach(el => {
          el.classList.remove('liquid-glass-auto');
          el.classList.add('liquid-glass-fallback');
        });
      }
    });
  } catch (err) {
    console.warn('Ошибка при инициализации liquid-glass:', err);
  }
})();

/* ----------------- showContent / content data (adapted from your original) ----------------- */
const contentData = {
  guide: {
    title: 'Гид',
    text: '<p>Здесь — руководство по распознаванию фишинговых QR-кодoв.</p>'
  },
  help: {
    title: 'Я НЕ ПОНИМАЮ',
    text: '<p>Краткая таблица советов для разных пользователей.</p>'
  },
  catalog: {
    title: 'Каталог UML',
    text: '<p>В разработке.</p>'
  }
};

let currentContent = null;
function updateContent(section, titleEl, textEl, blockEl) {
  const data = contentData[section];
  if (!data) return;
  titleEl.textContent = data.title;
  textEl.innerHTML = data.text;
}
function showContent(section) {
  const contentBlock = document.getElementById('content');
  const contentTitle = document.getElementById('content-title');
  const contentText = document.getElementById('content-text');

  const scrollToTop = () => {
    try { contentBlock.scrollTo({ top: 0, behavior: 'smooth' }); }
    catch { contentBlock.scrollTop = 0; }
  };

  if (currentContent === section) { scrollToTop(); return; }

  if (currentContent !== null) {
    contentBlock.classList.add('hidden');
    setTimeout(()=> {
      updateContent(section, contentTitle, contentText, contentBlock);
      contentBlock.classList.remove('hidden');
      scrollToTop();
    }, 300);
  } else {
    updateContent(section, contentTitle, contentText, contentBlock);
    contentBlock.classList.remove('hidden');
    scrollToTop();
  }
  currentContent = section;
}

/* bind nav buttons */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const sec = btn.getAttribute('data-section');
      if (sec) showContent(sec);
    });
  });
  // open default
  showContent('guide');
});
