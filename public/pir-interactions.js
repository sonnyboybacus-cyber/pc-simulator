(() => {
  const EDITABLE_ATTR = 'data-pir-editable';

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const parseNumber = (text) => {
    const cleaned = String(text || '').replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
    return cleaned ? Number(cleaned[0]) : NaN;
  };
  const isPercentText = (text) => /%/.test(String(text || ''));
  const styleText = (el) => (el && el.getAttribute('style')) || '';
  const hasPercentHeight = (el) => /height\s*:\s*\d+(?:\.\d+)?%/i.test(styleText(el));
  const hasPercentWidth = (el) => /width\s*:\s*\d+(?:\.\d+)?%/i.test(styleText(el));
  const hasChartFill = (el) => {
    const style = styleText(el);
    if (!/background\s*:/i.test(style)) return false;
    return !/(#eef2f6|rgb\(\s*238\s*,\s*242\s*,\s*246\s*\)|rgba\(\s*255\s*,\s*255\s*,\s*255)/i.test(style);
  };

  function isDarkSlide(slide) {
    const bg = styleText(slide).toLowerCase();
    return bg.includes('#0a2f52') || bg.includes('#0e477c') || bg.includes('linear-gradient(150deg') || bg.includes('linear-gradient(155deg');
  }

  function makeEl(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text != null) el.textContent = text;
    return el;
  }

  function getSlides() {
    return Array.from(document.querySelectorAll('section[data-label]'));
  }

  function getStage() {
    return document.querySelector('deck-stage') || document.querySelector('x-import');
  }

  function goToSlide(index) {
    const stage = document.querySelector('deck-stage');
    if (stage && typeof stage._go === 'function') {
      stage._go(index, 'api');
      return;
    }
    window.location.hash = String(index + 1);
  }

  function ensureSpeakerNotes(slides) {
    slides.forEach((slide) => {
      if (!slide.hasAttribute('data-speaker-notes')) {
        slide.setAttribute('data-speaker-notes', '');
      }
    });
  }

  function addWizard(slides) {
    const total = slides.length;
    slides.forEach((slide, index) => {
      slide.classList.add('pir-slide');
      if (slide.querySelector(':scope > .pir-wizard')) return;

      const wizard = makeEl('nav', 'pir-wizard');
      if (isDarkSlide(slide)) wizard.classList.add('dark');
      wizard.setAttribute('aria-label', 'Slide wizard');

      const label = makeEl('div', 'pir-step-label');
      label.appendChild(makeEl('span', '', String(index + 1).padStart(2, '0') + '/' + String(total).padStart(2, '0')));
      label.appendChild(makeEl('span', '', slide.getAttribute('data-label') || 'Slide'));
      wizard.appendChild(label);

      const track = makeEl('div', 'pir-track');
      slides.forEach((targetSlide, dotIndex) => {
        const dot = makeEl('button', 'pir-dot');
        dot.type = 'button';
        dot.setAttribute('aria-label', 'Go to slide ' + (dotIndex + 1));
        dot.title = (dotIndex + 1) + '. ' + (targetSlide.getAttribute('data-label') || 'Slide');
        if (dotIndex === index) dot.setAttribute('aria-current', 'step');
        dot.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          goToSlide(dotIndex);
        });
        track.appendChild(dot);
      });
      wizard.appendChild(track);
      slide.appendChild(wizard);
    });
  }

  function closestChartGroup(bar) {
    return bar.closest('div[style*="border-bottom"]')
      || bar.closest('div[style*="display: flex"]')
      || bar.parentElement;
  }

  function markVerticalCharts(slide) {
    const groups = new Map();
    const bars = Array.from(slide.querySelectorAll('div[style*="height:"][style*="background:"]'))
      .filter((bar) => hasPercentHeight(bar) && hasChartFill(bar));

    bars.forEach((bar) => {
      const holder = bar.parentElement;
      if (!holder) return;
      const label = Array.from(holder.children).find((child) => child.matches && child.matches('span.mono'));
      const value = parseNumber(label && label.textContent);
      if (!label || Number.isNaN(value)) return;

      const group = closestChartGroup(bar);
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group).push({ label, bar });

      label.setAttribute(EDITABLE_ATTR, 'true');
      label.dataset.pirChart = 'vertical';
      label.dataset.pirValue = String(value);
      label.setAttribute('role', 'spinbutton');
      label.setAttribute('aria-label', 'Editable chart value');
    });

    groups.forEach((items, group) => {
      items.forEach(({ label }) => {
        label._pirUpdate = () => {
          const values = items.map((item) => parseNumber(item.label.textContent)).filter((n) => !Number.isNaN(n));
          const maxValue = Math.max(1, ...values);
          items.forEach((item) => {
            const value = parseNumber(item.label.textContent);
            if (Number.isNaN(value)) return;
            item.label.dataset.pirValue = String(value);
            item.bar.style.height = clamp((value / maxValue) * 100, 4, 100).toFixed(1) + '%';
          });
        };
      });
      group.dataset.pirChartGroup = 'vertical';
    });
  }

  function markHorizontalCharts(slide) {
    const percentLabels = Array.from(slide.querySelectorAll('span.mono'))
      .filter((label) => isPercentText(label.textContent));

    percentLabels.forEach((label) => {
      const row = label.parentElement;
      if (!row) return;
      let bar = Array.from(row.querySelectorAll('div[style*="width:"][style*="background:"]'))
        .filter((item) => hasPercentWidth(item) && hasChartFill(item))
        .pop();

      if (!bar && row.nextElementSibling) {
        bar = Array.from(row.nextElementSibling.querySelectorAll('div[style*="width:"][style*="background:"]'))
          .filter((item) => hasPercentWidth(item) && hasChartFill(item))
          .pop();
      }
      if (!bar) return;

      label.setAttribute(EDITABLE_ATTR, 'true');
      label.dataset.pirChart = 'horizontal';
      label.dataset.pirValue = String(parseNumber(label.textContent));
      label.setAttribute('role', 'spinbutton');
      label.setAttribute('aria-label', 'Editable chart percentage');
      label._pirUpdate = () => {
        const value = parseNumber(label.textContent);
        if (Number.isNaN(value)) return;
        label.dataset.pirValue = String(value);
        bar.style.width = clamp(value, 0, 100).toFixed(1) + '%';
      };
    });
  }

  function setEditMode(slide, enabled, button, state) {
    slide.dataset.pirEditing = enabled ? 'true' : 'false';
    const editable = Array.from(slide.querySelectorAll('[' + EDITABLE_ATTR + '="true"]'));
    editable.forEach((el) => {
      if (enabled) {
        el.setAttribute('contenteditable', 'true');
        el.setAttribute('spellcheck', 'false');
        el.setAttribute('inputmode', 'decimal');
      } else {
        el.removeAttribute('contenteditable');
        el.removeAttribute('spellcheck');
        el.removeAttribute('inputmode');
      }
    });
    if (button) button.textContent = enabled ? 'Done' : 'Edit data';
    if (state) state.textContent = enabled ? 'Editing' : editable.length + ' values';
  }

  function addChartTools(slide) {
    if (slide.querySelector(':scope > .pir-chart-tools')) return;
    markVerticalCharts(slide);
    markHorizontalCharts(slide);

    const editable = Array.from(slide.querySelectorAll('[' + EDITABLE_ATTR + '="true"]'));
    if (!editable.length) return;

    editable.forEach((el) => {
      if (el.dataset.pirBound === 'true') return;
      el.dataset.pirBound = 'true';
      el.addEventListener('input', () => {
        if (typeof el._pirUpdate === 'function') el._pirUpdate();
      });
      el.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          el.blur();
        }
      });
    });

    const tools = makeEl('div', 'pir-chart-tools');
    if (isDarkSlide(slide)) tools.classList.add('dark');
    const state = makeEl('span', 'pir-chart-state', editable.length + ' values');
    const button = makeEl('button', 'pir-tool', 'Edit data');
    button.type = 'button';
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const enabled = slide.dataset.pirEditing !== 'true';
      setEditMode(slide, enabled, button, state);
      if (enabled && editable[0]) editable[0].focus();
    });
    tools.appendChild(state);
    tools.appendChild(button);
    slide.appendChild(tools);
    setEditMode(slide, false, button, state);
  }

  function collapseLongText(slide) {
    Array.from(slide.querySelectorAll('p')).forEach((paragraph) => {
      if (paragraph.closest('details') || paragraph.closest('.pir-long-wrap')) return;
      const text = (paragraph.textContent || '').trim();
      if (text.length < 180) return;

      const wrap = makeEl('div', 'pir-long-wrap');
      wrap.dataset.expanded = 'false';
      paragraph.classList.add('pir-long-text');
      paragraph.parentNode.insertBefore(wrap, paragraph);
      wrap.appendChild(paragraph);

      const toggle = makeEl('button', 'pir-long-toggle', 'More');
      toggle.type = 'button';
      toggle.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        const expanded = wrap.dataset.expanded === 'true';
        wrap.dataset.expanded = expanded ? 'false' : 'true';
        toggle.textContent = expanded ? 'More' : 'Less';
      });
      wrap.appendChild(toggle);
    });
  }

  function enhanceSlides() {
    const stage = getStage();
    if (stage) {
      stage.setAttribute('no-rail', '');
      stage.setAttribute('norail', '');
    }

    const slides = getSlides();
    if (!slides.length) return false;
    ensureSpeakerNotes(slides);
    addWizard(slides);
    slides.forEach((slide) => {
      collapseLongText(slide);
      addChartTools(slide);
    });
    return true;
  }

  function boot() {
    if (enhanceSlides()) return;
    const observer = new MutationObserver(() => {
      if (enhanceSlides()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    window.setTimeout(() => observer.disconnect(), 10000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
