import React from 'react';

export const fixPaths = (root: HTMLElement) => {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  if (!basePath) return;

  root.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src');
    if (src && src.startsWith('./')) {
      img.setAttribute('src', basePath + src.slice(1));
    }
  });

  root.querySelectorAll('image-slot').forEach((slot) => {
    const src = slot.getAttribute('src');
    if (src && src.startsWith('./')) {
      slot.setAttribute('src', basePath + src.slice(1));
    }
  });
};

// --- Helper Functions for Slide Chart Syncing ---
export const parseNumber = (text: string) => {
  const cleaned = String(text || '').replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
  return cleaned ? Number(cleaned[0]) : NaN;
};

export const closestChartGroup = (bar: HTMLElement): HTMLElement => {
  return (bar.closest('div[style*="border-bottom"]') || 
          bar.closest('div[style*="display: flex"]') || 
          bar.parentElement) as HTMLElement;
};

export const hasChartFill = (el: HTMLElement) => {
  const style = el.getAttribute('style') || '';
  if (!/background\s*:/i.test(style)) return false;
  return !/(#eef2f6|rgb\(\s*238\s*,\s*242\s*,\s*246\s*\)|rgba\(\s*255\s*,\s*255\s*,\s*255)/i.test(style);
};

export const updateVerticalChart = (section: HTMLElement, targetLabel: HTMLElement) => {
  const items = Array.from(section.querySelectorAll('span.mono[data-pir-chart="vertical"]')) as HTMLElement[];
  const values = items.map((el) => {
    const cleaned = String(el.textContent || '').replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
    return cleaned ? Number(cleaned[0]) : NaN;
  }).filter((n) => !Number.isNaN(n));
  
  const maxValue = Math.max(1, ...values);
  
  items.forEach((item) => {
    const val = parseFloat(item.textContent || '');
    if (Number.isNaN(val)) return;
    item.dataset.pirValue = String(val);
    const holder = item.parentElement;
    if (!holder) return;
    const bar = Array.from(holder.children).find((child: any) => {
      const style = child.getAttribute('style') || '';
      return /height\s*:\s*\d+(?:\.\d+)?%/i.test(style) && hasChartFill(child);
    }) as HTMLElement;
    if (bar) {
      bar.style.height = Math.max(4, Math.min(100, (val / maxValue) * 100)).toFixed(1) + '%';
    }
  });
};

export const updateHorizontalChart = (section: HTMLElement) => {
  const percentLabels = Array.from(section.querySelectorAll('span.mono[data-pir-chart="horizontal"]')) as HTMLElement[];
  percentLabels.forEach((label) => {
    const val = parseFloat(label.textContent || '');
    if (Number.isNaN(val)) return;
    label.dataset.pirValue = String(val);
    const row = label.parentElement;
    if (!row) return;
    let bar = Array.from(row.querySelectorAll('div'))
      .filter((item: any) => {
        const style = item.getAttribute('style') || '';
        return /width\s*:\s*\d+(?:\.\d+)?%/i.test(style) && hasChartFill(item);
      })
      .pop() as HTMLElement;

    if (!bar && row.nextElementSibling) {
      bar = Array.from(row.nextElementSibling.querySelectorAll('div'))
        .filter((item: any) => {
          const style = item.getAttribute('style') || '';
          return /width\s*:\s*\d+(?:\.\d+)?%/i.test(style) && hasChartFill(item);
        })
        .pop() as HTMLElement;
    }
    if (bar) {
      bar.style.width = Math.max(0, Math.min(100, val)).toFixed(1) + '%';
    }
  });
};

export const getEditableElements = (slide: HTMLElement): HTMLElement[] => {
  const elements: HTMLElement[] = [];
  const walker = document.createTreeWalker(slide, NodeFilter.SHOW_ELEMENT, {
    acceptNode(node: any) {
      if (node.closest('.pir-chart-tools') || 
          node.closest('.pir-wizard') || 
          node.closest('.pir-long-toggle') ||
          node.closest('.confirm-backdrop') ||
          node.closest('.ctxmenu') ||
          node.closest('#enrolment-dashboard-container') ||
          ['STYLE', 'SCRIPT', 'IMAGE-SLOT', 'NAV'].includes(node.tagName)) {
        return NodeFilter.FILTER_REJECT;
      }
      
      if (node.hasAttribute('data-pir-editable') || 
          ['H1', 'H2', 'H3', 'P', 'LI', 'SPAN', 'DIV'].includes(node.tagName)) {
        
        const hasDirectText = Array.from(node.childNodes).some(
          (child: any) => child.nodeType === Node.TEXT_NODE && child.textContent.trim().length > 0
        );
        if (hasDirectText) {
          return NodeFilter.FILTER_ACCEPT;
        }
      }
      return NodeFilter.FILTER_SKIP;
    }
  });

  while(walker.nextNode()) {
    elements.push(walker.currentNode as HTMLElement);
  }
  return elements;
};

export const setupSlideCharts = (slide: HTMLElement) => {
  const verticalGroups = new Map<HTMLElement, any[]>();
  const vBars = Array.from(slide.querySelectorAll('div'))
    .filter((bar) => {
      const style = bar.getAttribute('style') || '';
      return /height\s*:\s*\d+(?:\.\d+)?%/i.test(style) && hasChartFill(bar);
    });

  vBars.forEach((bar) => {
    const holder = bar.parentElement;
    if (!holder) return;
    const label = Array.from(holder.children).find((child: any) => child.matches && child.matches('span.mono')) as HTMLElement;
    if (!label) return;
    const value = parseNumber(label.textContent || '');
    if (Number.isNaN(value)) return;

    const group = closestChartGroup(bar);
    if (!verticalGroups.has(group)) verticalGroups.set(group, []);
    verticalGroups.get(group)!.push({ label, bar });

    label.setAttribute('data-pir-editable', 'true');
    label.dataset.pirChart = 'vertical';
    label.dataset.pirValue = String(value);
    label.setAttribute('role', 'spinbutton');
  });

  verticalGroups.forEach((items, group) => {
    group.dataset.pirChartGroup = 'vertical';
  });

  const percentLabels = Array.from(slide.querySelectorAll('span.mono'))
    .filter((label) => /%/.test(label.textContent || '')) as HTMLElement[];

  percentLabels.forEach((label) => {
    const row = label.parentElement;
    if (!row) return;
    let bar = Array.from(row.querySelectorAll('div'))
      .filter((item: any) => {
        const style = item.getAttribute('style') || '';
        return /width\s*:\s*\d+(?:\.\d+)?%/i.test(style) && hasChartFill(item);
      })
      .pop() as HTMLElement;

    if (!bar && row.nextElementSibling) {
      bar = Array.from(row.nextElementSibling.querySelectorAll('div'))
        .filter((item: any) => {
          const style = item.getAttribute('style') || '';
          return /width\s*:\s*\d+(?:\.\d+)?%/i.test(style) && hasChartFill(item);
        })
        .pop() as HTMLElement;
    }
    if (!bar) return;

    label.setAttribute('data-pir-editable', 'true');
    label.dataset.pirChart = 'horizontal';
    label.dataset.pirValue = String(parseNumber(label.textContent || ''));
    label.setAttribute('role', 'spinbutton');
  });
};

export const parseStyleString = (styleStr: string): React.CSSProperties => {
  const styles: any = {};
  if (!styleStr) return styles;
  styleStr.split(';').forEach(pair => {
    const parts = pair.split(':');
    if (parts.length >= 2) {
      const rawKey = parts[0].trim();
      const val = parts.slice(1).join(':').trim();
      if (rawKey.startsWith('--')) {
        styles[rawKey] = val;
      } else {
        const key = rawKey.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
        styles[key] = val;
      }
    }
  });
  return styles;
};
