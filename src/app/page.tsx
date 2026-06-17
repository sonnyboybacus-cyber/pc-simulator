"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  defaultState,
  PerformanceMetric,
  PerformancePanel,
  BudgetRow,
  PerformanceBudgetStep,
  PerformanceBudgetState,
  SavedPerformanceBudgetStep,
  SavedPerformanceBudgetState,
  PerformanceBudgetAppState,
  PhilIriDataset,
  PhilIriLevels,
  getAssetPath,
  mergeState,
} from "@/lib/store";
import { EnrolmentDashboard } from "@/components/EnrolmentDashboard";
import { CharacterizationCarousel } from "@/components/CharacterizationCarousel";


const fixPaths = (root: HTMLElement) => {
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
const parseNumber = (text: string) => {
  const cleaned = String(text || '').replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
  return cleaned ? Number(cleaned[0]) : NaN;
};

const closestChartGroup = (bar: HTMLElement): HTMLElement => {
  return (bar.closest('div[style*="border-bottom"]') || 
          bar.closest('div[style*="display: flex"]') || 
          bar.parentElement) as HTMLElement;
};

const hasChartFill = (el: HTMLElement) => {
  const style = el.getAttribute('style') || '';
  if (!/background\s*:/i.test(style)) return false;
  return !/(#eef2f6|rgb\(\s*238\s*,\s*242\s*,\s*246\s*\)|rgba\(\s*255\s*,\s*255\s*,\s*255)/i.test(style);
};

const updateVerticalChart = (section: HTMLElement, targetLabel: HTMLElement) => {
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

const updateHorizontalChart = (section: HTMLElement) => {
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

const getEditableElements = (slide: HTMLElement): HTMLElement[] => {
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

const setupSlideCharts = (slide: HTMLElement) => {
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

const parseStyleString = (styleStr: string): React.CSSProperties => {
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

// --- Main Page Component ---
export default function Home() {
  const [appState, setAppState] = useState<any>(defaultState);
  const [slides, setSlides] = useState<any[]>([]);
  const [slidesLoaded, setSlidesLoaded] = useState(false);
  const [stylesToInject, setStylesToInject] = useState<string>('');
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const stageRef = useRef<any>(null);

  // Sync state and slide changes with the editor tab
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const channel = new BroadcastChannel('pir-deck-sync');
    
    const handleMessage = (e: MessageEvent) => {
      const msg = e.data;
      if (!msg) return;
      
      if (msg.type === 'go-to-slide') {
        const index = msg.index;
        const stage = stageRef.current;
        if (stage && typeof stage._go === 'function') {
          stage._go(index, 'api');
        } else {
          window.location.hash = String(index + 1);
        }
        setActiveSlideIndex(index);
      } else if (msg.type === 'update-state') {
        setAppState(msg.state);
      } else if (msg.type === 'request-initial-sync') {
        // Send our current state back to the newly opened editor tab
        channel.postMessage({
          type: 'initial-sync-response',
          state: appState,
          activeSlideIndex: activeSlideIndex
        });
      }
    };
    
    channel.addEventListener('message', handleMessage);
    return () => {
      channel.removeEventListener('message', handleMessage);
      channel.close();
    };
  }, [appState, activeSlideIndex]);

  // Global key listener to toggle mode on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAppState((prev: any) => {
          const nextMode = prev.mode === 'presenter' ? 'editor' : 'presenter';
          const newState = { ...prev, mode: nextMode };
          saveState(newState);
          
          try {
            const channel = new BroadcastChannel('pir-deck-sync');
            channel.postMessage({ type: 'update-state', state: newState });
            channel.close();
          } catch (err) {}
          
          return newState;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Sync themes and transitions with document body
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme-vibe', appState.theme);
      document.body.setAttribute('data-theme-vibe', appState.theme);
      
      document.body.className = document.body.className.replace(/slide-transition-\w+/g, '');
      document.body.classList.add(`slide-transition-${appState.transition}`);
      
      if (appState.mode === 'editor') {
        document.body.dataset.pirEditing = 'true';
      } else {
        document.body.dataset.pirEditing = 'false';
      }
    }
  }, [appState.theme, appState.transition, appState.mode]);

  // Load state and slides on mount
  useEffect(() => {
    const loadData = async () => {
      let savedState = { ...defaultState };
      try {
        const stateRes = await fetch(getAssetPath('/.pir-deck.state.json?t=' + Date.now()));
        if (stateRes.ok) {
          const stateData = await stateRes.json();
          savedState = mergeState(stateData);
        }
      } catch (err) {
        console.log('No saved state found or error fetching, using defaults.');
      }

      // Check localStorage for overrides
      try {
        const localStateStr = localStorage.getItem('pir-deck-state');
        if (localStateStr) {
          const localState = JSON.parse(localStateStr);
          savedState = mergeState({
            ...savedState,
            ...localState
          });
        }
      } catch (e) {
        console.error('Failed to load state from localStorage:', e);
      }

      setAppState(savedState);

      try {
        const htmlRes = await fetch(getAssetPath('/PIR 2026.dc.html'));
        if (htmlRes.ok) {
          const htmlText = await htmlRes.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(htmlText, 'text/html');

          const styles = Array.from(doc.querySelectorAll('style')).map(s => s.innerHTML).join('\n');
          setStylesToInject(styles);

          const sections = Array.from(doc.querySelectorAll('x-import section, x-import[component-from-global-scope="deck-stage"] section'));
          
          const parsedSlides = sections.map((section: any, idx: number) => {
            const label = section.getAttribute('data-label') || 'Slide';
            const screenLabel = section.getAttribute('data-screen-label') || '';
            const style = section.getAttribute('style') || '';
            const className = section.getAttribute('class') || '';
            
            const speakerNotes = savedState.notes[idx] ?? section.getAttribute('data-speaker-notes') ?? '';

            if (savedState.slides[idx]?.texts) {
              const editables = getEditableElements(section);
              editables.forEach((el: any, editIdx: number) => {
                const savedText = savedState.slides[idx].texts[editIdx];
                if (savedText !== undefined) {
                  el.textContent = savedText;
                }
              });
              setupSlideCharts(section);
            } else {
              setupSlideCharts(section);
            }

            const editables = getEditableElements(section);
            editables.forEach((el: any, editIdx: number) => {
              el.setAttribute('data-pir-edit-index', String(editIdx));
              el.setAttribute('data-pir-editable', 'true');
            });

            fixPaths(section);

            return {
              id: idx,
              label,
              screenLabel,
              speakerNotes,
              styleAttr: style,
              className,
              htmlContent: section.innerHTML
            };
          });

          setSlides(parsedSlides);
          setSlidesLoaded(true);
        }
      } catch (err) {
        console.error('Error loading presentation slides:', err);
      }
    };

    loadData();
  }, []);

  // Listen to deck-stage slidechange events
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    
    const handleSlideChange = (e: any) => {
      const index = e.detail.index;
      setActiveSlideIndex(index);
      try {
        const channel = new BroadcastChannel('pir-deck-sync');
        channel.postMessage({ type: 'go-to-slide', index });
        channel.close();
      } catch (err) {}
    };

    stage.addEventListener('slidechange', handleSlideChange);
    return () => {
      stage.removeEventListener('slidechange', handleSlideChange);
    };
  }, [slidesLoaded]);

  const saveState = async (stateToSave: any) => {
    try {
      localStorage.setItem('pir-deck-state', JSON.stringify(stateToSave));
    } catch (e) {
      console.error('Failed to save state to localStorage:', e);
    }

    try {
      await fetch(getAssetPath('/api/save-state'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(stateToSave),
      });
    } catch (err) {
      console.error('Failed to save state to server:', err);
    }
  };

  const goToSlide = (index: number) => {
    const stage = stageRef.current;
    if (stage && typeof stage._go === 'function') {
      stage._go(index, 'api');
    } else {
      window.location.hash = String(index + 1);
    }
    setActiveSlideIndex(index);
  };

  const handleResetDeck = () => {
    if (confirm('Are you sure you want to reset presentation to slide 1?')) {
      goToSlide(0);
    }
  };

  const handleModeChange = (mode: 'presenter' | 'editor') => {
    setAppState((prev: any) => {
      const newState = { ...prev, mode };
      saveState(newState);
      return newState;
    });
  };

  const handleThemeChange = (theme: string) => {
    setAppState((prev: any) => {
      const newState = { ...prev, theme };
      saveState(newState);
      return newState;
    });
  };

  const handleTransitionChange = (transition: string) => {
    setAppState((prev: any) => {
      const newState = { ...prev, transition };
      saveState(newState);
      return newState;
    });
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setSlides(prev => {
      const updated = [...prev];
      if (updated[activeSlideIndex]) {
        updated[activeSlideIndex] = {
          ...updated[activeSlideIndex],
          speakerNotes: val
        };
      }
      return updated;
    });

    setAppState((prev: any) => {
      const newNotes = { ...prev.notes, [activeSlideIndex]: val };
      const newState = { ...prev, notes: newNotes };
      saveState(newState);
      return newState;
    });
  };

  // Handle Double Click to edit texts on normal slides
  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (appState.mode !== 'editor') return;
    const target = e.target as HTMLElement;
    const section = target.closest('section');
    if (!section) return;
    const slideIdx = parseInt(section.getAttribute('data-slide-index') || '-1', 10);
    if (section.getAttribute('data-label') === 'Enrolment Dashboard') return;
    if (section.getAttribute('data-label') === 'Performance & Budget') return;

    if (['H1', 'H2', 'H3', 'P', 'LI', 'SPAN', 'DIV'].includes(target.tagName)) {
      if (target.closest('.pir-chart-tools') || target.closest('.pir-wizard') || target.closest('.pir-long-toggle')) return;
      target.contentEditable = 'true';
      target.focus();
    }
  };

  // Handle Blur to save texts on normal slides
  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.contentEditable === 'true') {
      target.contentEditable = 'false';
      const textVal = target.textContent || '';
      const section = target.closest('section');
      if (!section) return;
      const slideIdx = parseInt(section.getAttribute('data-slide-index') || '-1', 10);
      const editIdx = parseInt(target.getAttribute('data-pir-edit-index') || '-1', 10);
      
      if (slideIdx !== -1 && editIdx !== -1) {
        if (target.dataset.pirChart === 'vertical') {
          updateVerticalChart(section, target);
        } else if (target.dataset.pirChart === 'horizontal') {
          updateHorizontalChart(section);
        }
        
        const newHtml = section.innerHTML;
        
        setSlides(prev => {
          const updated = [...prev];
          if (updated[slideIdx]) {
            updated[slideIdx] = {
              ...updated[slideIdx],
              htmlContent: newHtml
            };
          }
          return updated;
        });

        setAppState((prev: any) => {
          const newSlidesState = { ...prev.slides };
          if (!newSlidesState[slideIdx]) {
            newSlidesState[slideIdx] = { texts: {}, charts: {} };
          }
          if (!newSlidesState[slideIdx].texts) {
            newSlidesState[slideIdx].texts = {};
          }
          newSlidesState[slideIdx].texts[editIdx] = textVal;
          const newState = { ...prev, slides: newSlidesState };
          saveState(newState);
          return newState;
        });
      }
    }
  };

  if (!slidesLoaded) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', background: '#080c14', color: '#cbd5e1', fontSize: '20px', fontWeight: 'bold' }}>
        Loading JNIS Program Implementation Review...
      </div>
    );
  }

  const activeSlide = slides[activeSlideIndex];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: stylesToInject }} />
      <div id="presenter-layout-root" className={appState.mode === 'presenter' ? 'presenter-mode-active' : ''}>
        
        {/* --- Floating Edit Button --- */}
        {appState.mode !== 'presenter' && (
          <button 
            type="button" 
            className="editor-open-btn"
            onClick={() => window.open(getAssetPath('/editor/'), '_blank')}
            title="Open Editor in New Tab"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}

        {/* --- Center Slide Viewport --- */}
        <div 
          className="shell-canvas-viewport"
          onDoubleClick={handleDoubleClick}
          onBlur={handleBlur}
        >
          <deck-stage ref={stageRef} width="1920" height="1080" no-rail norail>
            {slides.map((slide, idx) => {
              if (slide.label === "Enrolment Dashboard") {
                return (
                  <section
                    key={slide.id}
                    data-slide-index={idx}
                    data-label={slide.label}
                    className={slide.className}
                    style={parseStyleString(slide.styleAttr)}
                  >
                    <EnrolmentDashboard 
                      stepData={appState.dashboard.steps}
                      currentStep={appState.dashboard.currentStep}
                      mode={appState.mode}
                      onStepChange={(stepIdx) => {
                        setAppState((prev: any) => {
                          const newState = {
                            ...prev,
                            dashboard: { ...prev.dashboard, currentStep: stepIdx }
                          };
                          saveState(newState);
                          return newState;
                        });
                      }}
                      onDataChange={(stepIdx, field, val) => {
                        setAppState((prev: any) => {
                          const newSteps = [...prev.dashboard.steps];
                          newSteps[stepIdx] = { ...newSteps[stepIdx], [field]: val };
                          const newState = {
                            ...prev,
                            dashboard: { ...prev.dashboard, steps: newSteps }
                          };
                          saveState(newState);
                          return newState;
                        });
                      }}
                    />
                  </section>
                );
              }
              if (slide.label === "Performance & Budget") {
                return (
                  <section
                    key={slide.id}
                    data-slide-index={idx}
                    data-label={slide.label}
                    className={slide.className}
                    style={parseStyleString(slide.styleAttr)}
                  >
                    <PerformanceBudgetCarousel
                      stepData={appState.performanceBudget?.steps || defaultState.performanceBudget.steps}
                      currentStep={appState.performanceBudget?.currentStep ?? defaultState.performanceBudget.currentStep}
                      activePanelIdx={appState.performanceBudget?.activePanelIdx ?? defaultState.performanceBudget.activePanelIdx}
                      mode={appState.mode}
                      onActivePanelChange={(panelIdx) => {
                        setAppState((prev: PerformanceBudgetAppState) => {
                          const perfState: PerformanceBudgetState = prev.performanceBudget || defaultState.performanceBudget;
                          const newState = {
                            ...prev,
                            performanceBudget: { ...perfState, activePanelIdx: panelIdx }
                          };
                          saveState(newState);
                          try {
                            const channel = new BroadcastChannel('pir-deck-sync');
                            channel.postMessage({ type: 'update-state', state: newState });
                            channel.close();
                          } catch (err) {}
                          return newState;
                        });
                      }}
                      onStepChange={(stepIdx) => {
                        setAppState((prev: PerformanceBudgetAppState) => {
                          const perfState: PerformanceBudgetState = prev.performanceBudget || defaultState.performanceBudget;
                          const newState = {
                            ...prev,
                            performanceBudget: { ...perfState, currentStep: stepIdx, activePanelIdx: 0 }
                          };
                          saveState(newState);
                          try {
                            const channel = new BroadcastChannel('pir-deck-sync');
                            channel.postMessage({ type: 'update-state', state: newState });
                            channel.close();
                          } catch (err) {}
                          return newState;
                        });
                      }}
                      onDataChange={(stepIdx, field, val) => {
                        setAppState((prev: PerformanceBudgetAppState) => {
                          const perfState: PerformanceBudgetState = prev.performanceBudget || defaultState.performanceBudget;
                          const newSteps = [...(perfState.steps || defaultState.performanceBudget.steps)];
                          newSteps[stepIdx] = { ...newSteps[stepIdx], [field]: val } as PerformanceBudgetStep;
                          const newState = {
                            ...prev,
                            performanceBudget: { ...perfState, steps: newSteps }
                          };
                          saveState(newState);
                          try {
                            const channel = new BroadcastChannel('pir-deck-sync');
                            channel.postMessage({ type: 'update-state', state: newState });
                            channel.close();
                          } catch (err) {}
                          return newState;
                        });
                      }}
                    />
                  </section>
                );
              }
              if (slide.label === "Characterization") {
                return (
                  <section
                    key={slide.id}
                    data-slide-index={idx}
                    data-label={slide.label}
                    className={slide.className}
                    style={parseStyleString(slide.styleAttr)}
                  >
                    <CharacterizationCarousel 
                      stepData={appState.characterization?.steps || defaultState.characterization.steps}
                      currentStep={appState.characterization?.currentStep ?? defaultState.characterization.currentStep}
                      activeDomainIdx={appState.characterization?.activeDomainIdx ?? 0}
                      mode={appState.mode}
                      onActiveDomainChange={(domIdx) => {
                        setAppState((prev: any) => {
                          const charState = prev.characterization || defaultState.characterization;
                          const newState = {
                            ...prev,
                            characterization: { ...charState, activeDomainIdx: domIdx }
                          };
                          saveState(newState);
                          try {
                            const channel = new BroadcastChannel('pir-deck-sync');
                            channel.postMessage({ type: 'update-state', state: newState });
                            channel.close();
                          } catch (err) {}
                          return newState;
                        });
                      }}
                      onStepChange={(stepIdx) => {
                        setAppState((prev: any) => {
                          const charState = prev.characterization || defaultState.characterization;
                          const newState = {
                            ...prev,
                            characterization: { ...charState, currentStep: stepIdx }
                          };
                          saveState(newState);
                          try {
                            const channel = new BroadcastChannel('pir-deck-sync');
                            channel.postMessage({ type: 'update-state', state: newState });
                            channel.close();
                          } catch (err) {}
                          return newState;
                        });
                      }}
                      onDataChange={(stepIdx, domIdx, field, val) => {
                        setAppState((prev: any) => {
                          const charState = prev.characterization || defaultState.characterization;
                          const newSteps = [...charState.steps];
                          const newDomains = [...newSteps[stepIdx].domains];
                          newDomains[domIdx] = { ...newDomains[domIdx], [field]: val };
                          newSteps[stepIdx] = { ...newSteps[stepIdx], domains: newDomains };
                          const newState = {
                            ...prev,
                            characterization: { ...charState, steps: newSteps }
                          };
                          saveState(newState);
                          try {
                            const channel = new BroadcastChannel('pir-deck-sync');
                            channel.postMessage({ type: 'update-state', state: newState });
                            channel.close();
                          } catch (err) {}
                          return newState;
                        });
                      }}
                    />
                  </section>
                );
              }
              return (
                <section
                  key={slide.id}
                  data-slide-index={idx}
                  data-label={slide.label}
                  data-screen-label={slide.screenLabel}
                  className={slide.className}
                  style={parseStyleString(slide.styleAttr)}
                  dangerouslySetInnerHTML={{ __html: slide.htmlContent }}
                />
              );
            })}
          </deck-stage>
        </div>

      </div>
    </>
  );
}

// ==========================================
// --- Sub-components for Enrolment Dashboard ---
// ==========================================

const formatMoneyShort = (value: number) => {
  if (value >= 1000000) return `PHP ${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `PHP ${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}K`;
  return `PHP ${value.toLocaleString()}`;
};

const formatMoneyFull = (value: number) => `PHP ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const clampPercent = (value: number) => Math.max(0, Math.min(100, value));

const getMetricColor = (value: number, target?: number) => {
  if (target === 0) return value <= 5 ? "#10b981" : value <= 15 ? "#f5a623" : "#ef4444";
  if (target && value >= target) return "#10b981";
  if (value >= 60) return "#f5a623";
  return "#ef4444";
};

const averageMetric = (metrics: PerformanceMetric[]) => {
  if (!metrics.length) return 0;
  return metrics.reduce((sum, metric) => sum + metric.value, 0) / metrics.length;
};

const PerformanceBudgetCarousel = ({
  stepData,
  currentStep,
  activePanelIdx,
  mode,
  onStepChange,
  onActivePanelChange,
  onDataChange
}: {
  stepData: PerformanceBudgetStep[];
  currentStep: number;
  activePanelIdx: number;
  mode: string;
  onStepChange: (idx: number) => void;
  onActivePanelChange: (idx: number) => void;
  onDataChange: (stepIdx: number, field: string, val: unknown) => void;
}) => {
  const safeStepData = stepData || [];
  const safeCurrentStep = Math.max(0, Math.min(currentStep ?? 0, Math.max(0, safeStepData.length - 1)));
  const step = safeStepData[safeCurrentStep] || { title: "", subtitle: "", visual: "learning", metrics: [], panels: [] };
  const panels = step.panels || [];
  const safeActivePanelIdx = Math.max(0, Math.min(activePanelIdx ?? 0, Math.max(0, panels.length - 1)));

  const updatePanelField = (panelIdx: number, field: keyof PerformancePanel, value: string) => {
    const nextPanels = panels.map((panel, idx) => idx === panelIdx ? { ...panel, [field]: value } : panel);
    onDataChange(safeCurrentStep, "panels", nextPanels);
  };

  const updatePanelBullet = (panelIdx: number, bulletIdx: number, value: string) => {
    const nextPanels = panels.map((panel, idx) => {
      if (idx !== panelIdx) return panel;
      const nextBullets = [...(panel.bullets || [])];
      nextBullets[bulletIdx] = value;
      return { ...panel, bullets: nextBullets };
    });
    onDataChange(safeCurrentStep, "panels", nextPanels);
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", padding: "20px 40px", boxSizing: "border-box", width: "100%", fontFamily: "inherit" }}>
      <div id="dashboard-stepper" style={{ marginBottom: "20px" }}>
        {safeStepData.map((item, idx) => (
          <button
            key={item.title}
            type="button"
            className={`dashboard-stepper-btn ${idx === safeCurrentStep ? "active" : ""}`}
            onClick={() => onStepChange(idx)}
            style={{ padding: "12px 14px" }}
          >
            <span className="dashboard-stepper-num" style={{ fontSize: "17px" }}>{String(idx + 1).padStart(2, "0")}</span>
            <span className="dashboard-stepper-label" style={{ fontSize: "20px", fontWeight: 800 }}>{item.title}</span>
          </button>
        ))}
      </div>

      <div style={{ flex: 1, display: "flex", gap: "36px", minHeight: 0 }}>
        <div className="dashboard-card-glass" style={{ flex: 1.2, display: "flex", flexDirection: "column", padding: "30px", overflow: "hidden" }}>
          <div style={{ marginBottom: "18px" }}>
            <div style={{ fontSize: "18px", fontWeight: 800, color: "#f5a623", textTransform: "uppercase", letterSpacing: "0.6px" }}>Performance & Budget</div>
            <h3 style={{ fontSize: "34px", lineHeight: 1.1, fontWeight: 900, color: "#0a2f52", margin: "6px 0 4px" }}>{step.title}</h3>
            <div style={{ fontSize: "20px", color: "#5b6b7d", fontWeight: 700 }}>{step.subtitle}</div>
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <PerformanceBudgetVisual step={step} activePanelIdx={safeActivePanelIdx} />
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "14px", overflowY: "auto", minWidth: 0 }}>
          {panels.map((panel, panelIdx) => {
            const isSelected = panelIdx === safeActivePanelIdx;
            return (
              <div
                key={panel.title}
                className="dashboard-card-glass"
                onClick={() => onActivePanelChange(panelIdx)}
                style={{
                  padding: isSelected ? "26px 32px" : "18px 24px",
                  cursor: "pointer",
                  borderColor: isSelected ? "var(--vibe-accent)" : "rgba(255, 255, 255, 0.28)",
                  boxShadow: isSelected ? "0 20px 44px var(--vibe-accent-glow), inset 0 0 0 1px rgba(255,255,255,0.3)" : "none",
                  overflow: "hidden",
                  maxHeight: isSelected ? "560px" : "92px",
                  transition: "all 0.35s cubic-bezier(0.25, 1, 0.5, 1)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", alignItems: "center" }}>
                  <h4 style={{ fontSize: isSelected ? "31px" : "24px", color: "#0a2f52", margin: 0, fontWeight: 900, lineHeight: 1.1 }}>{panel.title}</h4>
                  <span
                    contentEditable={mode === "editor"}
                    suppressContentEditableWarning
                    onBlur={(e) => updatePanelField(panelIdx, "status", e.currentTarget.textContent || "")}
                    onClick={(e) => {
                      if (mode === "editor") e.stopPropagation();
                    }}
                    style={{
                      fontSize: "17px",
                      fontWeight: 900,
                      color: "#0a2f52",
                      background: "#fdf4e3",
                      border: mode === "editor" ? "1px dashed var(--vibe-accent)" : "1px solid #f5d9a8",
                      borderRadius: "999px",
                      padding: "8px 16px",
                      whiteSpace: "nowrap",
                      outline: "none"
                    }}
                  >
                    {panel.status}
                  </span>
                </div>

                <div style={{ opacity: isSelected ? 1 : 0, visibility: isSelected ? "visible" : "hidden", height: isSelected ? "auto" : 0, overflow: "hidden", transition: "opacity 0.25s ease" }}>
                  <div style={{ marginTop: "20px", display: "grid", gridTemplateColumns: "1fr", gap: "14px" }}>
                    <EditableInsight
                      label="Finding"
                      value={panel.finding}
                      editable={mode === "editor"}
                      onBlur={(value) => updatePanelField(panelIdx, "finding", value)}
                    />
                    <EditableInsight
                      label="Recommended Action"
                      value={panel.action}
                      editable={mode === "editor"}
                      accent
                      onBlur={(value) => updatePanelField(panelIdx, "action", value)}
                    />
                    <ul style={{ margin: "4px 0 0", paddingLeft: "24px", display: "flex", flexDirection: "column", gap: "10px" }}>
                      {(panel.bullets || []).map((bullet, bulletIdx) => (
                        <li key={bulletIdx} style={{ fontSize: "25px", color: "#2c3e50", lineHeight: 1.35, fontWeight: 650 }}>
                          <span
                            contentEditable={mode === "editor"}
                            suppressContentEditableWarning
                            onBlur={(e) => updatePanelBullet(panelIdx, bulletIdx, e.currentTarget.textContent || "")}
                            onClick={(e) => {
                              if (mode === "editor") e.stopPropagation();
                            }}
                            style={{ outline: "none", border: mode === "editor" ? "1px dashed var(--vibe-accent)" : "none", borderRadius: "4px", padding: "1px 3px" }}
                          >
                            {bullet}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const EditableInsight = ({
  label,
  value,
  editable,
  accent,
  onBlur
}: {
  label: string;
  value: string;
  editable: boolean;
  accent?: boolean;
  onBlur: (value: string) => void;
}) => (
  <div style={{ borderLeft: accent ? "4px solid #f5a623" : "4px solid #d8e1ec", paddingLeft: "14px" }}>
    <div style={{ fontSize: "15px", fontWeight: 900, color: accent ? "#b9791a" : "#9aa7b4", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "6px" }}>{label}</div>
    <div
      contentEditable={editable}
      suppressContentEditableWarning
      onBlur={(e) => onBlur(e.currentTarget.textContent || "")}
      onClick={(e) => {
        if (editable) e.stopPropagation();
      }}
      style={{
        fontSize: "24px",
        lineHeight: 1.35,
        color: accent ? "#0a2f52" : "#2c3e50",
        fontWeight: accent ? 750 : 650,
        outline: "none",
        border: editable ? "1px dashed var(--vibe-accent)" : "none",
        borderRadius: "6px",
        padding: "5px"
      }}
    >
      {value}
    </div>
  </div>
);

const PerformanceBudgetVisual = ({ step, activePanelIdx = 0 }: { step: PerformanceBudgetStep; activePanelIdx?: number }) => {
  if (step.visual === "certification") return <CertificationVisual step={step} />;
  if (step.visual === "immersion") return <ImmersionVisual step={step} />;
  if (step.visual === "budgetOverview") return <BudgetOverviewVisual step={step} />;
  if (step.visual === "sobDetail") return <SobDetailVisual step={step} />;
  return <LearningOutcomesVisual step={step} activePanelIdx={activePanelIdx} />;
};

// Learning Outcomes: each collapsible card on the right drives a distinct visual on the left.
// Index-aligned to the step's panels (ELLNA, NAT Grade 6, NAT Grade 10, PHIL-IRI).
const LO_GROUPS: { key: string; kind: "slope" | "radar" | "gauge" | "recovery"; title: string; caption: string }[] = [
  { key: "ELLNA", kind: "slope", title: "ELLNA", caption: "Previous → current vs the 75% target" },
  { key: "NAT G6", kind: "radar", title: "NAT Grade 6", caption: "Five learning areas vs the 75% target" },
  { key: "NAT G10", kind: "gauge", title: "NAT Grade 10", caption: "Mastery gap to the 75% target" },
  { key: "PHIL-IRI", kind: "recovery", title: "PHIL-IRI", caption: "Reading recovery — frustration down, independence up" }
];

const LearningOutcomesVisual = ({ step, activePanelIdx = 0 }: { step: PerformanceBudgetStep; activePanelIdx?: number }) => {
  const idx = Math.max(0, Math.min(activePanelIdx, LO_GROUPS.length - 1));
  const group = LO_GROUPS[idx];
  const metrics = step.metrics.filter((metric) => (metric.group || "Other") === group.key);
  const isRecovery = group.key === "PHIL-IRI";
  const summary = isRecovery
    ? 100 - averageMetric(metrics.filter((metric) => metric.target === 0))
    : averageMetric(metrics);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", minHeight: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", marginBottom: "16px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
          <span style={{ fontSize: "14px", fontWeight: 900, letterSpacing: "0.6px", textTransform: "uppercase", color: "#fff", background: "var(--vibe-accent)", borderRadius: "999px", padding: "7px 16px", whiteSpace: "nowrap" }}>{group.title}</span>
          <span style={{ fontSize: "17px", color: "#5b6b7d", fontWeight: 750 }}>{group.caption}</span>
        </div>
        <span className="mono" style={{ fontSize: "27px", fontWeight: 900, color: "#0a2f52", whiteSpace: "nowrap" }}>
          {summary.toFixed(1)}% <span style={{ fontSize: "14px", color: "#9aa7b4", fontWeight: 800 }}>{isRecovery ? "recovery signal" : "group average"}</span>
        </span>
      </div>
      <div key={idx} className="pb-viz-enter" style={{ flex: 1, minHeight: 0 }}>
        {metrics.length === 0 ? (
          <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#9aa7b4", fontSize: "20px", fontWeight: 700 }}>No metrics for this group.</div>
        ) : group.kind === "slope" ? (
          <SlopeChart metrics={metrics} target={75} />
        ) : group.kind === "radar" ? (
          <RadarChart metrics={metrics} target={75} />
        ) : group.kind === "gauge" ? (
          <GaugeBulletPanel metrics={metrics} target={75} />
        ) : (
          <RecoveryChart datasets={step.philIri ?? []} metrics={metrics} />
        )}
      </div>
    </div>
  );
};

// ELLNA — dumbbell / slope: previous ● → current ● on a 0–100 track with a target tick.
const SlopeChart = ({ metrics, target }: { metrics: PerformanceMetric[]; target: number }) => (
  <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", gap: "22px" }}>
    {metrics.map((metric) => {
      const current = metric.value;
      const previous = metric.previous;
      const hasPrev = typeof previous === "number";
      const up = hasPrev ? current >= (previous as number) : true;
      const color = !hasPrev ? "#f5a623" : up ? "#10b981" : "#ef4444";
      const lo = hasPrev ? Math.min(current, previous as number) : current;
      const hi = hasPrev ? Math.max(current, previous as number) : current;
      return (
        <div key={metric.label}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "10px", gap: "12px" }}>
            <span style={{ fontSize: "22px", fontWeight: 850, color: "#0a2f52" }}>{metric.label.replace("ELLNA ", "")}</span>
            <span style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
              {hasPrev && <span className="mono" style={{ fontSize: "17px", color: "#9aa7b4", fontWeight: 800 }}>{(previous as number).toFixed(1)}%</span>}
              <span className="mono" style={{ fontSize: "15px", color }}>{up ? "▲" : "▼"}</span>
              <span className="mono" style={{ fontSize: "23px", fontWeight: 900, color: "#0a2f52" }}>{current.toFixed(1)}%</span>
            </span>
          </div>
          <div style={{ position: "relative", height: "20px", background: "#eef2f6", borderRadius: "999px" }}>
            <div style={{ position: "absolute", left: `${clampPercent(target)}%`, top: "-6px", bottom: "-6px", width: "3px", background: "#0a2f52", opacity: 0.55, transform: "translateX(-1px)" }} />
            <div style={{ position: "absolute", top: "50%", height: "6px", transform: "translateY(-50%)", left: `${clampPercent(lo)}%`, width: `${clampPercent(hi) - clampPercent(lo)}%`, background: color, opacity: 0.5, borderRadius: "999px" }} />
            {hasPrev && <span style={{ position: "absolute", top: "50%", left: `${clampPercent(previous as number)}%`, width: "16px", height: "16px", borderRadius: "50%", background: "#fff", border: "3px solid #b9c6d4", transform: "translate(-50%, -50%)" }} />}
            <span style={{ position: "absolute", top: "50%", left: `${clampPercent(current)}%`, width: "20px", height: "20px", borderRadius: "50%", background: color, border: "3px solid #fff", boxShadow: "0 2px 6px rgba(10,47,82,0.25)", transform: "translate(-50%, -50%)" }} />
          </div>
        </div>
      );
    })}
    <div style={{ display: "flex", gap: "22px", alignItems: "center", marginTop: "4px", fontSize: "15px", color: "#5b6b7d", fontWeight: 750 }}>
      <span style={{ display: "flex", alignItems: "center", gap: "7px" }}><span style={{ width: "13px", height: "13px", borderRadius: "50%", background: "#fff", border: "3px solid #b9c6d4" }} />Previous</span>
      <span style={{ display: "flex", alignItems: "center", gap: "7px" }}><span style={{ width: "15px", height: "15px", borderRadius: "50%", background: "#10b981" }} />Current</span>
      <span style={{ display: "flex", alignItems: "center", gap: "7px" }}><span style={{ width: "3px", height: "16px", background: "#0a2f52", opacity: 0.55 }} />Target {target}%</span>
    </div>
  </div>
);

// NAT Grade 6 — radar/spider over the five learning areas, with a faint "previous" overlay.
const RadarChart = ({ metrics, target }: { metrics: PerformanceMetric[]; target: number }) => {
  const size = 560;
  const cx = size / 2;
  const cy = size / 2 + 4;
  const R = 180;
  const n = metrics.length || 1;
  const angleFor = (i: number) => (-90 + (i * 360) / n) * (Math.PI / 180);
  const pointAt = (i: number, radius: number) => ({ x: cx + radius * Math.cos(angleFor(i)), y: cy + radius * Math.sin(angleFor(i)) });
  const polyPoints = (vals: number[]) => vals.map((v, i) => { const p = pointAt(i, (clampPercent(v) / 100) * R); return `${p.x.toFixed(1)},${p.y.toFixed(1)}`; }).join(" ");
  const currentVals = metrics.map((m) => m.value);
  const prevVals = metrics.map((m) => (typeof m.previous === "number" ? (m.previous as number) : 0));
  const hasPrev = metrics.some((m) => typeof m.previous === "number");
  const rings = [25, 50, 75, 100];

  return (
    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg viewBox={`0 0 ${size} ${size}`} style={{ width: "100%", height: "100%" }} preserveAspectRatio="xMidYMid meet">
        {rings.map((r) => (
          <polygon
            key={r}
            points={metrics.map((_, i) => { const p = pointAt(i, (r / 100) * R); return `${p.x.toFixed(1)},${p.y.toFixed(1)}`; }).join(" ")}
            fill="none"
            stroke={r === target ? "var(--vibe-accent)" : "#e2e8f0"}
            strokeWidth={r === target ? 2 : 1}
            strokeDasharray={r === target ? "6 6" : undefined}
          />
        ))}
        {metrics.map((m, i) => {
          const edge = pointAt(i, R);
          const label = pointAt(i, R + 30);
          const anchor = Math.abs(label.x - cx) < 10 ? "middle" : label.x > cx ? "start" : "end";
          const name = m.label.replace("NAT G6 ", "").replace("NAT ", "");
          return (
            <g key={m.label}>
              <line x1={cx} y1={cy} x2={edge.x} y2={edge.y} stroke="#e2e8f0" strokeWidth="1" />
              <text x={label.x} y={label.y - 5} textAnchor={anchor} fontSize="19" fontWeight="850" fill="#0a2f52">{name}</text>
              <text x={label.x} y={label.y + 16} textAnchor={anchor} fontSize="17" fontWeight="900" fill={getMetricColor(m.value, target)} className="mono">{m.value.toFixed(1)}%</text>
            </g>
          );
        })}
        {hasPrev && <polygon points={polyPoints(prevVals)} fill="none" stroke="#b9c6d4" strokeWidth="2" strokeDasharray="5 5" />}
        <polygon points={polyPoints(currentVals)} fill="var(--vibe-accent)" fillOpacity="0.22" stroke="var(--vibe-accent)" strokeWidth="3" />
        {currentVals.map((v, i) => { const p = pointAt(i, (clampPercent(v) / 100) * R); return <circle key={i} cx={p.x} cy={p.y} r="6" fill="var(--vibe-accent)" stroke="#fff" strokeWidth="2" />; })}
      </svg>
    </div>
  );
};

// Shared bullet bar: filled value with a target tick, used by gauge + recovery views.
const BulletBar = ({ label, value, target }: { label: string; value: number; target: number }) => {
  const pct = clampPercent(value);
  const color = getMetricColor(value, target);
  const gap = target - value;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px", gap: "12px" }}>
        <span style={{ fontSize: "23px", fontWeight: 850, color: "#0a2f52" }}>{label}</span>
        <span style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
          <span className="mono" style={{ fontSize: "24px", fontWeight: 900, color }}>{value.toFixed(1)}%</span>
          {gap > 0 && <span style={{ fontSize: "15px", fontWeight: 800, color: "#b9791a", background: "#fdf4e3", borderRadius: "999px", padding: "3px 10px", whiteSpace: "nowrap" }}>{gap.toFixed(1)} to target</span>}
        </span>
      </div>
      <div style={{ position: "relative", height: "22px", background: "#eef2f6", borderRadius: "999px" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: "999px", transition: "width 0.35s ease" }} />
        <div style={{ position: "absolute", left: `${clampPercent(target)}%`, top: "-6px", bottom: "-6px", width: "3px", background: "#0a2f52", transform: "translateX(-1px)" }} />
      </div>
    </div>
  );
};

// NAT Grade 10 — gauge ring for the overall score + bullet bars showing gap to the 75% target.
const GaugeBulletPanel = ({ metrics, target }: { metrics: PerformanceMetric[]; target: number }) => {
  const overall = metrics.find((m) => /overall/i.test(m.label)) || metrics[0];
  return (
    <div style={{ height: "100%", display: "grid", gridTemplateColumns: "0.85fr 1.15fr", gap: "30px", alignItems: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }}>
        <PerfRing value={overall?.value ?? 0} label="Overall Proficiency" size={300} />
        <div style={{ fontSize: "17px", color: "#5b6b7d", fontWeight: 800, textAlign: "center" }}>
          {Math.max(0, target - (overall?.value ?? 0)).toFixed(1)} pts below the {target}% mastery target
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "26px" }}>
        {metrics.map((m) => (
          <BulletBar key={m.label} label={m.label.replace("NAT G10 ", "")} value={m.value} target={target} />
        ))}
      </div>
    </div>
  );
};

// PHIL-IRI — reading recovery: frustration (lower is better) shrinking prev→now, plus independence.
// PHIL-IRI reading levels (stacked-bar segments).
const PHIL_LEVELS: { key: keyof PhilIriLevels; label: string; color: string }[] = [
  { key: "independent", label: "Independent", color: "#10b981" },
  { key: "instructional", label: "Instructional", color: "#f5a623" },
  { key: "frustration", label: "Frustration", color: "#ef4444" }
];

const fmtPhil = (v: number) => `${v % 1 === 0 ? v : v.toFixed(2)}%`;

const PhilIriStack = ({ title, dist }: { title: string; dist: PhilIriLevels }) => (
  <div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px", gap: "12px" }}>
      <span style={{ fontSize: "22px", fontWeight: 850, color: "#0a2f52" }}>{title}</span>
      <span className="mono" style={{ fontSize: "15px", fontWeight: 800, color: "#5b6b7d" }}>
        {fmtPhil(dist.independent)} Ind · {fmtPhil(dist.instructional)} Inst · {fmtPhil(dist.frustration)} Frust
      </span>
    </div>
    <div style={{ display: "flex", height: "32px", borderRadius: "10px", overflow: "hidden", background: "#eef2f6" }}>
      {PHIL_LEVELS.map((lvl) => {
        const v = dist[lvl.key];
        if (v <= 0) return null;
        return (
          <div key={lvl.key} style={{ width: `${clampPercent(v)}%`, background: lvl.color, display: "flex", alignItems: "center", justifyContent: "center", transition: "width 0.35s ease" }}>
            {v >= 9 && <span className="mono" style={{ fontSize: "14px", fontWeight: 800, color: "#fff" }}>{Math.round(v)}%</span>}
          </div>
        );
      })}
    </div>
  </div>
);

// PHIL-IRI — full breakdown: toggle Key Stage + Year, stacked Independent/Instructional/Frustration
// bars for Filipino & English, with collapsible strategic interpretation. Falls back to metrics if no datasets.
const RecoveryChart = ({ datasets, metrics }: { datasets: PhilIriDataset[]; metrics: PerformanceMetric[] }) => {
  const stages = Array.from(new Set(datasets.map((d) => d.keyStage)));
  const years = Array.from(new Set(datasets.map((d) => d.year)));
  const [ks, setKs] = useState<string>(stages[0] ?? "KS2");
  const [yr, setYr] = useState<string>(years[years.length - 1] ?? "");
  const [showNotes, setShowNotes] = useState(false);

  if (!datasets.length) {
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", gap: "18px" }}>
        {metrics.map((m) => (
          <BulletBar key={m.label} label={m.label} value={m.value} target={m.target ?? 75} />
        ))}
      </div>
    );
  }

  const active =
    datasets.find((d) => d.keyStage === ks && d.year === yr) ||
    datasets.find((d) => d.keyStage === ks) ||
    datasets[0];

  const pill = (selected: boolean): React.CSSProperties => ({
    border: 0,
    cursor: "pointer",
    borderRadius: "999px",
    padding: "8px 16px",
    fontSize: "16px",
    fontWeight: 800,
    fontFamily: "inherit",
    background: selected ? "var(--vibe-accent)" : "transparent",
    color: selected ? "#fff" : "#5b6b7d",
    transition: "background 0.2s ease, color 0.2s ease"
  });

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", gap: "18px", minHeight: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: "14px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: "4px", background: "#f7f9fb", padding: "4px", borderRadius: "999px" }}>
            {stages.map((s) => (
              <button key={s} type="button" onClick={() => setKs(s)} style={pill(s === ks)}>{s === "KS2" ? "Key Stage 2" : s === "KS3" ? "Key Stage 3" : s}</button>
            ))}
          </div>
          <div style={{ display: "flex", gap: "4px", background: "#f7f9fb", padding: "4px", borderRadius: "999px" }}>
            {years.map((y) => (
              <button key={y} type="button" onClick={() => setYr(y)} style={pill(y === yr)}>{y}</button>
            ))}
          </div>
        </div>
        <span className="mono" style={{ fontSize: "15px", fontWeight: 800, color: "#5b6b7d", whiteSpace: "nowrap" }}>n = {active.total} · {active.grades}</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <PhilIriStack title="Filipino" dist={active.filipino} />
        <PhilIriStack title="English" dist={active.english} />
      </div>

      <div style={{ display: "flex", gap: "20px", alignItems: "center", fontSize: "15px", color: "#5b6b7d", fontWeight: 750 }}>
        {PHIL_LEVELS.map((lvl) => (
          <span key={lvl.key} style={{ display: "flex", alignItems: "center", gap: "7px" }}>
            <span style={{ width: "13px", height: "13px", borderRadius: "4px", background: lvl.color }} />{lvl.label}
          </span>
        ))}
      </div>

      <div style={{ borderTop: "1px solid #eef2f6", paddingTop: "12px", marginTop: "auto" }}>
        <button
          type="button"
          onClick={() => setShowNotes((s) => !s)}
          style={{ border: 0, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", padding: 0, fontFamily: "inherit", fontSize: "16px", fontWeight: 800, color: "#0a2f52" }}
        >
          <span style={{ display: "inline-block", transform: showNotes ? "rotate(90deg)" : "none", transition: "transform 0.2s ease" }}>▸</span>
          Strategic interpretation
        </button>
        {showNotes && (
          <ul style={{ margin: "12px 0 0", paddingLeft: "22px", display: "flex", flexDirection: "column", gap: "8px" }}>
            {active.interpretation.map((line, i) => (
              <li key={i} style={{ fontSize: "18px", lineHeight: 1.4, color: "#2c3e50", fontWeight: 600 }}>{line}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

const CertificationVisual = ({ step }: { step: PerformanceBudgetStep }) => {
  const passRate = step.metrics.find((metric) => metric.label === "Pass Rate")?.value ?? 100;
  const learners = step.metrics.find((metric) => metric.label === "Certified Learners")?.value ?? 16;
  const roster = step.roster ?? [];
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", gap: "22px", justifyContent: "center" }}>
      <div style={{ display: "grid", gridTemplateColumns: "0.9fr 1.1fr", gap: "34px", alignItems: "center" }}>
        <PerfRing value={passRate} label="NC II Passing Rate" size={260} />
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <BigNumberCard label="Certified Grade 12 CSS Learners" value={String(learners)} caption="First batch result" tone="#f5a623" />
          <BigNumberCard label="Industry Partner" value="ICST" caption="Immaculate Conception School of Technology" tone="#0a2f52" />
        </div>
      </div>
      {roster.length > 0 && (
        <div className="dashboard-card-glass" style={{ padding: "20px 26px", background: "#fff !important" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "14px", gap: "12px" }}>
            <span style={{ fontSize: "20px", fontWeight: 900, color: "#0a2f52" }}>Certified NC II Holders</span>
            <span className="mono" style={{ fontSize: "15px", fontWeight: 800, color: "#10b981" }}>{roster.length} learners · 100% pass</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px 18px" }}>
            {roster.map((name, i) => (
              <div key={name} style={{ display: "flex", gap: "8px", alignItems: "baseline", fontSize: "15px", color: "#2c3e50", fontWeight: 650 }}>
                <span className="mono" style={{ color: "#9aa7b4", fontSize: "13px", minWidth: "18px" }}>{String(i + 1).padStart(2, "0")}</span>
                <span>{name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const ImmersionVisual = ({ step }: { step: PerformanceBudgetStep }) => (
  <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", gap: "22px" }}>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "18px" }}>
      {step.metrics.map((metric) => (
        <div key={metric.label} className="dashboard-card-glass" style={{ padding: "26px 24px", textAlign: "center", background: "rgba(10,47,82,0.08) !important" }}>
          <div style={{ width: "72px", height: "72px", borderRadius: "50%", margin: "0 auto 14px", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--vibe-accent)", color: "#fff", fontSize: "28px", fontWeight: 900 }}>
            {metric.label.split(" ")[0].slice(0, 3)}
          </div>
          <div style={{ fontSize: "30px", fontWeight: 900, color: "#0a2f52" }}>{metric.label}</div>
          <div style={{ marginTop: "10px", fontSize: "20px", color: "#5b6b7d", fontWeight: 700 }}>Active support</div>
          <PerfHorizontalBar label="Engagement" value={metric.value} max={100} valueLabel={`${metric.value}%`} compact />
        </div>
      ))}
    </div>
    <div className="dashboard-card-glass" style={{ padding: "30px 34px", borderLeft: "6px solid #f5a623" }}>
      <div style={{ fontSize: "32px", lineHeight: 1.25, color: "#0a2f52", fontWeight: 850 }}>
        Visible monitoring connects immersion, partner support, and certification readiness.
      </div>
    </div>
  </div>
);

const BudgetOverviewVisual = ({ step }: { step: PerformanceBudgetStep }) => {
  const rows = step.budgetRows || [];
  const totalAllocation = rows.reduce((sum, row) => sum + row.allocation, 0);
  const totalUtilized = rows.reduce((sum, row) => sum + row.utilized, 0);
  return (
    <div style={{ height: "100%", display: "grid", gridTemplateRows: "auto 1fr", gap: "22px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
        <BigNumberCard label="Total SOB Allocation" value={formatMoneyShort(totalAllocation)} caption="ES + JHS" tone="#0a2f52" />
        <BigNumberCard label="Total Utilized" value={formatMoneyShort(totalUtilized)} caption={formatMoneyFull(totalUtilized)} tone="#10b981" />
        <BigNumberCard label="Downloaded Utilization" value="88.13%" caption="Combined ES + JHS" tone="#f5a623" />
      </div>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: "24px" }}>
        {rows.map((row) => (
          <BudgetStackedBar key={row.label} row={row} totalAllocation={totalAllocation} />
        ))}
      </div>
    </div>
  );
};

const SobDetailVisual = ({ step }: { step: PerformanceBudgetStep }) => (
  <div style={{ height: "100%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "22px", alignItems: "stretch" }}>
    {(step.budgetRows || []).map((row) => (
      <BudgetDetailCard key={row.label} row={row} />
    ))}
  </div>
);

const PerfRing = ({ value, label, size = 250 }: { value: number; label: string; size?: number }) => {
  const pct = clampPercent(value);
  const radius = 88;
  const circumference = 2 * Math.PI * radius;
  const dash = (pct / 100) * circumference;
  return (
    <svg width={size} height={size} viewBox="0 0 240 240" style={{ maxWidth: "100%" }}>
      <defs>
        <linearGradient id={`perf-ring-${label.replace(/\W/g, "")}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--vibe-accent)" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
      </defs>
      <circle cx="120" cy="120" r={radius} fill="#fff" stroke="#edf2f7" strokeWidth="18" />
      <circle
        cx="120"
        cy="120"
        r={radius}
        fill="none"
        stroke={`url(#perf-ring-${label.replace(/\W/g, "")})`}
        strokeWidth="18"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circumference}`}
        transform="rotate(-90 120 120)"
        style={{ transition: "stroke-dasharray 0.4s ease" }}
      />
      <text x="120" y="116" textAnchor="middle" fill="#0a2f52" fontSize="44" fontWeight="900" className="mono">{pct.toFixed(pct % 1 === 0 ? 0 : 1)}%</text>
      <text x="120" y="146" textAnchor="middle" fill="#5b6b7d" fontSize="15" fontWeight="800">{label}</text>
    </svg>
  );
};

const PerfHorizontalBar = ({
  label,
  value,
  max,
  valueLabel,
  compact
}: {
  label: string;
  value: number;
  max: number;
  valueLabel: string;
  compact?: boolean;
}) => {
  const pct = clampPercent((value / max) * 100);
  const color = getMetricColor(value, max === 100 ? 75 : undefined);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: compact ? "5px" : "8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "baseline" }}>
        <span style={{ fontSize: compact ? "17px" : "22px", fontWeight: 850, color: "#0a2f52" }}>{label}</span>
        <span className="mono" style={{ fontSize: compact ? "16px" : "21px", fontWeight: 900, color }}>{valueLabel}</span>
      </div>
      <div style={{ height: compact ? "10px" : "16px", background: "#eef2f6", borderRadius: "999px", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: "999px", transition: "width 0.35s ease" }} />
      </div>
    </div>
  );
};

const BigNumberCard = ({ label, value, caption, tone }: { label: string; value: string; caption: string; tone: string }) => (
  <div className="dashboard-card-glass" style={{ padding: "24px 26px", background: "#fff !important" }}>
    <div style={{ fontSize: "17px", color: "#5b6b7d", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</div>
    <div className="mono" style={{ fontSize: "44px", lineHeight: 1.05, color: tone, fontWeight: 900, marginTop: "8px" }}>{value}</div>
    <div style={{ fontSize: "18px", color: "#2c3e50", fontWeight: 700, marginTop: "8px" }}>{caption}</div>
  </div>
);

const BudgetStackedBar = ({ row, totalAllocation }: { row: BudgetRow; totalAllocation: number }) => {
  const allocationPct = clampPercent((row.allocation / totalAllocation) * 100);
  const utilizedPct = clampPercent((row.utilized / row.allocation) * 100);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "10px" }}>
        <div style={{ fontSize: "26px", fontWeight: 900, color: "#0a2f52" }}>{row.label}</div>
        <div className="mono" style={{ fontSize: "24px", fontWeight: 900, color: "#10b981" }}>{formatMoneyFull(row.utilized)}</div>
      </div>
      <div style={{ height: "28px", background: "#eef2f6", borderRadius: "999px", overflow: "hidden", display: "flex" }}>
        <div style={{ width: `${allocationPct}%`, background: "#d8e1ec" }}>
          <div style={{ width: `${utilizedPct}%`, height: "100%", background: "#10b981", borderRadius: "999px" }} />
        </div>
      </div>
      <div style={{ marginTop: "8px", fontSize: "18px", color: "#5b6b7d", fontWeight: 750 }}>
        {formatMoneyFull(row.allocation)} allocation - {row.utilization}% of downloaded funds utilized
      </div>
    </div>
  );
};

const BudgetDetailCard = ({ row }: { row: BudgetRow }) => (
  <div className="dashboard-card-glass" style={{ padding: "28px 30px", display: "flex", flexDirection: "column", gap: "18px", background: "#fff !important" }}>
    <div>
      <div style={{ fontSize: "32px", fontWeight: 900, color: "#0a2f52" }}>{row.label}</div>
      <div style={{ fontSize: "20px", color: "#5b6b7d", fontWeight: 750 }}>SOB 2026 obligation and disbursement</div>
    </div>
    <PerfRing value={row.utilization} label="Downloaded Utilization" size={210} />
    {[
      ["Allocation", row.allocation],
      ["Downloaded", row.downloaded],
      ["Liquidated", row.liquidated],
      ["Tax Remittance", row.tax],
      ["Utilized", row.utilized]
    ].map(([label, value]) => (
      <div key={label as string} style={{ display: "flex", justifyContent: "space-between", gap: "12px", padding: "12px 14px", background: label === "Utilized" ? "#e3f7ef" : "#f7f9fb", borderRadius: "10px" }}>
        <span style={{ fontSize: "20px", color: "#2c3e50", fontWeight: 800 }}>{label}</span>
        <span className="mono" style={{ fontSize: "21px", color: label === "Utilized" ? "#1f8a5b" : "#0a2f52", fontWeight: 900 }}>{formatMoneyFull(value as number)}</span>
      </div>
    ))}
  </div>
);
