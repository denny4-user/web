// управление контентом и фолбэк для liquid glass
const contentData = {
  guide: {
    title: 'ГИД',
    text: '<h3>Примеры QR-мошенничества</h3><p>Выберите тему слева.</p>'
  },
  help: {
    title: 'Я НЕ ПОНИМАЮ',
    text: '<p>Тут — простой текст справки...</p>'
  },
  catalog: {
    title: 'Каталог UML',
    text: '<h3 style="text-align:center;">В разработке</h3><p style="text-align:center">Скоро...</p>'
  }
};

let currentContent = null;

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
    setTimeout(() => {
      updateContent(section, contentTitle, contentText, contentBlock);
      contentBlock.classList.remove('hidden');
      scrollToTop();
    }, 260);
  } else {
    updateContent(section, contentTitle, contentText, contentBlock);
    contentBlock.classList.remove('hidden');
    scrollToTop();
  }
  currentContent = section;
}

function updateContent(section, titleEl, textEl, blockEl) {
  const data = contentData[section] || {title:'',text:''};
  titleEl.textContent = data.title;
  textEl.innerHTML = data.text;
}

// Проверка поддержки фильтра/backdrop-filter и переключение на фолбэк
function applyLiquidGlassFallbackIfNeeded() {
  const supportsBackdrop = CSS.supports('backdrop-filter', 'blur(1px)') ||
                           CSS.supports('-webkit-backdrop-filter','blur(1px)');
  const supportsFilterUrl = CSS.supports('filter', 'url(#id)') || true;
  const elems = document.querySelectorAll('[data-lg]');

  if (!supportsBackdrop || !supportsFilterUrl) {
    elems.forEach(el => {
      el.classList.remove('liquid-glass');
      el.classList.add('liquid-glass-fallback');
    });
  } else {
    // Если поддерживается, оставляем .liquid-glass
    elems.forEach(el => {
      // Можно настроить элемент вручную через переменные, если нужно
      // Пример: el.style.setProperty('--lg-blur', '12px');
    });
  }
}

// минимальный курсор-глоу
(function cursorGlowInit(){
  const glow = document.getElementById('cursorGlow');
  if(!glow) return;
  let mouseX = 0, mouseY = 0, x = 0, y = 0, speed = 0.15;
  document.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; });
  function tick(){
    x += (mouseX - x) * speed;
    y += (mouseY - y) * speed;
    glow.style.left = (x - 60) + 'px';
    glow.style.top = (y - 60) + 'px';
    requestAnimationFrame(tick);
  }
  tick();
})();

// запуск при загрузке DOM
window.addEventListener('DOMContentLoaded', () => {
  applyLiquidGlassFallbackIfNeeded();
  // Выбираем раздел по умолчанию
  showContent('guide');
});

/* Liquid Glass Settings controller */
(function(){
  const defaults = {
    baseFreq: 13,      // 0.012
    noiseBlur: 2,      // stdDeviation
    dispScale: 120,     // scale
    cssBlur: 9,       // --lg-blur (px)
    tint: 0,           // % белого -> 0.06
    inner: 24,          // inset shadow
  };

  // ID элементов панели
  const panel = document.getElementById('lg-settings-panel');
  const btn = document.getElementById('lg-settings-btn');
  const closeBtn = document.getElementById('lg-close');

  const elems = {
    freq: document.getElementById('lg-freq'),
    blur: document.getElementById('lg-blur'),
    scale: document.getElementById('lg-scale'),
    cssBlur: document.getElementById('lg-css-blur'),
    tint: document.getElementById('lg-tint'),
    inner: document.getElementById('lg-inner'),
    reset: document.getElementById('lg-reset'),
  };

  const valueEls = {
    freq: document.getElementById('lg-freq-value'),
    blur: document.getElementById('lg-blur-value'),
    scale: document.getElementById('lg-scale-value'),
    cssBlur: document.getElementById('lg-css-blur-value'),
    tint: document.getElementById('lg-tint-value'),
    inner: document.getElementById('lg-inner-value'),
  };

  // Сохраняем ссылку на <feTurbulence>, <feGaussianBlur>, <feDisplacementMap>
  const feTurb = document.querySelector('#liquid-glass-filter feTurbulence');
  const feGauss = document.querySelector('#liquid-glass-filter feGaussianBlur');
  const feDisp = document.querySelector('#liquid-glass-filter feDisplacementMap');

  // Восстановление настроек из localStorage или defaults
  const state = Object.assign({}, defaults);

  function initControls(){
    elems.freq.min = 4; elems.freq.max = 40; elems.freq.step = 1; 
    elems.freq.value = state.baseFreq;
    elems.blur.min = 0; elems.blur.max = 8; elems.blur.step = 0.1; 
    elems.blur.value = state.noiseBlur;
    elems.scale.min = 0; elems.scale.max = 120; elems.scale.step = 1; 
    elems.scale.value = state.dispScale;
    elems.cssBlur.min = 0; elems.cssBlur.max = 30; elems.cssBlur.step = 0.5; 
    elems.cssBlur.value = state.cssBlur;
    elems.tint.min = 0; elems.tint.max = 100; elems.tint.step = 1; 
    elems.tint.value = state.tint;
    elems.inner.min = 0; elems.inner.max = 24; elems.inner.step = 1; 
    elems.inner.value = state.inner;

    updateValueDisplays();
    applySettings();
  }

  function updateValueDisplays(){
    valueEls.freq.textContent = (Number(elems.freq.value) / 1000).toFixed(3);
    valueEls.blur.textContent = Number(elems.blur.value).toFixed(1) + ' px';
    valueEls.scale.textContent = elems.scale.value + '  ';
    valueEls.cssBlur.textContent = elems.cssBlur.value + ' px';
    valueEls.tint.textContent = elems.tint.value + '%';
    valueEls.inner.textContent = elems.inner.value + ' px';
  }

  function applySettings(){
    // SVG-фильтр (noise baseFrequency, blur, displacement)
    if (feTurb) {
      const bf = (Number(elems.freq.value) / 1000).toFixed(4);
      feTurb.setAttribute('baseFrequency', `${bf} ${bf}`);
    }
    if (feGauss) {
      feGauss.setAttribute('stdDeviation', String(Number(elems.blur.value)));
    }
    if (feDisp) {
      feDisp.setAttribute('scale', String(Number(elems.scale.value)));
    }

    // CSS-переменные
    document.documentElement.style.setProperty('--lg-blur', `${Number(elems.cssBlur.value)}px`);
    const tintAlpha = (Number(elems.tint.value) / 100).toFixed(3);
    document.documentElement.style.setProperty('--lg-bg-color', `rgba(255,255,255,${tintAlpha})`);
    document.documentElement.style.setProperty('--lg-inner-shadow', `${Number(elems.inner.value)}px`);
	updateValueDisplays()
  }

  // Обработчики событий
  [elems.freq, elems.blur, elems.scale, elems.cssBlur, elems.tint, elems.inner].forEach(input => {
    input.addEventListener('input', () => applySettings());
  });

  elems.reset.addEventListener('click', () => {
    elems.freq.value = defaults.baseFreq;
    elems.blur.value = defaults.noiseBlur;
    elems.scale.value = defaults.dispScale;
    elems.cssBlur.value = defaults.cssBlur;
    elems.tint.value = defaults.tint;
    elems.inner.value = defaults.inner;
    applySettings(true);
  });


  // открыть/закрыть панель
  btn.addEventListener('click', () => {
    const hidden = panel.getAttribute('aria-hidden') === 'true';
    panel.setAttribute('aria-hidden', String(!hidden));
  });
  closeBtn.addEventListener('click', () => panel.setAttribute('aria-hidden', 'true'));

  // закрыть при клике вне панели
  document.addEventListener('click', (e) => {
    if (!panel || !btn) return;
    if (panel.getAttribute('aria-hidden') === 'true') return;
    const target = e.target;
    if (!panel.contains(target) && !btn.contains(target)) {
      panel.setAttribute('aria-hidden', 'true');
    }
  });

  window.addEventListener('DOMContentLoaded', initControls);
})();
