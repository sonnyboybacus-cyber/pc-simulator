"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  defaultState,
  getAssetPath,
  mergeState,
  getNotesKey,
  PerformanceBudgetAppState,
  PerformanceBudgetState,
  PerformanceBudgetStep,
} from "@/lib/store";
import { EnrolmentDashboard } from "@/components/EnrolmentDashboard";
import { CharacterizationCarousel } from "@/components/CharacterizationCarousel";
import { PerformanceBudgetCarousel } from "@/components/PerformanceBudgetCarousel";
import {
  fixPaths,
  setupSlideCharts,
  parseStyleString,
  updateVerticalChart,
  updateHorizontalChart,
  getEditableElements,
} from "@/lib/chart-utils";

// Helper functions moved to src/lib/chart-utils.ts

// --- Main Page Component ---
export default function Home() {
  const [appState, setAppState] = useState<any>(defaultState);
  const [slides, setSlides] = useState<any[]>([]);
  const [slidesLoaded, setSlidesLoaded] = useState(false);
  const [stylesToInject, setStylesToInject] = useState<string>('');
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const stageRef = useRef<any>(null);
  const [showNotesBubble, setShowNotesBubble] = useState(false);

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

      // Migrate slide state from old indices to new indices to support section dividers
      if (savedState.slides && !savedState.migrationSectionDividers) {
        const newSlidesState: any = {};
        const indexMapping: Record<number, number> = {
          0: 0,  // Title
          1: 1,  // Outline
          2: 3,  // School Profile (2 -> 3)
          3: 5,  // Enrolment Dashboard (3 -> 5)
          4: 6,  // Enrollment Action Matrix (4 -> 6)
          5: 8,  // Characterization (5 -> 8)
          6: 10, // Performance & Budget (6 -> 10)
          7: 11, // MOOE Management (7 -> 11)
          8: 13, // Issues & Concerns (8 -> 13)
          9: 14, // Thank You (9 -> 14)
        };
        for (const [oldIdxStr, slideState] of Object.entries(savedState.slides)) {
          const oldIdx = parseInt(oldIdxStr, 10);
          if (indexMapping[oldIdx] !== undefined) {
            newSlidesState[indexMapping[oldIdx]] = slideState;
          }
        }
        savedState.slides = newSlidesState;
        savedState.migrationSectionDividers = true;
        try {
          localStorage.setItem('pir-deck-state', JSON.stringify(savedState));
        } catch (e) {}
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
            
            const noteKey = getNotesKey(idx, savedState, label);
            const speakerNotes = savedState.notes[noteKey] ?? section.getAttribute('data-speaker-notes') ?? '';

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
    const activeSlide = slides[activeSlideIndex];
    const noteKey = getNotesKey(activeSlideIndex, appState, activeSlide?.label);
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
      const newNotes = { ...prev.notes, [noteKey]: val };
      const newState = { ...prev, notes: newNotes };
      saveState(newState);
      try {
        const channel = new BroadcastChannel('pir-deck-sync');
        channel.postMessage({ type: 'update-state', state: newState });
        channel.close();
      } catch (err) {}
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
        
        {/* --- Floating Edit Button Bubble --- */}
        <button 
          type="button" 
          className="editor-trigger-bubble"
          onClick={() => window.open(getAssetPath('/editor/'), '_blank')}
          title="Open Editor in New Tab"
          style={{ top: '20px', left: '20px' }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* --- Floating Speaker Notes Toggle Bubble --- */}
        <button 
          type="button" 
          className="editor-trigger-bubble"
          onClick={() => setShowNotesBubble(!showNotesBubble)}
          title="Toggle Speaker Notes Bubble"
          style={{ 
            top: '84px', 
            left: '20px',
            color: showNotesBubble ? 'var(--vibe-accent)' : '#fff',
            borderColor: showNotesBubble ? 'var(--vibe-accent)' : 'rgba(255, 255, 255, 0.15)',
            boxShadow: showNotesBubble ? '0 8px 32px var(--vibe-accent-glow)' : '0 8px 32px rgba(0, 0, 0, 0.35)'
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* --- Floating Speaker Notes Bubble --- */}
        {showNotesBubble && (
          <div 
            className="speaker-bubble" 
            style={{ 
              position: 'absolute', 
              left: '20px', 
              top: '148px', 
              width: '400px', 
              zIndex: 1000, 
              display: 'flex', 
              flexDirection: 'column', 
              background: '#0f172a',
              border: '1px solid #334155',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
              margin: 0
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--vibe-accent)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Speaker Notes</span>
                <button
                  type="button"
                  onClick={() => window.open(getAssetPath('/notes/'), 'speaker-notes', 'width=600,height=500,menubar=no,toolbar=no,location=no,status=no')}
                  title="Open Notes in New Window"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    color: '#94a3b8',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </button>
              </div>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Double-click notes area to edit</span>
            </div>
            {(() => {
              const activeSlide = slides[activeSlideIndex];
              const noteKey = getNotesKey(activeSlideIndex, appState, activeSlide?.label);
              const activeNotesText = appState.notes?.[noteKey] ?? activeSlide?.speakerNotes ?? '';
              return (
                <textarea
                  className="notes-textarea"
                  placeholder="No speaker notes for this slide/step."
                  value={activeNotesText}
                  onChange={handleNotesChange}
                  style={{ 
                    width: '100%', 
                    minHeight: '120px', 
                    maxHeight: '240px',
                    resize: 'vertical', 
                    background: 'transparent', 
                    border: 'none', 
                    padding: 0, 
                    boxShadow: 'none', 
                    color: '#cbd5e1', 
                    fontSize: '14px',
                    lineHeight: '1.4',
                    fontFamily: 'inherit',
                    outline: 'none'
                  }}
                />
              );
            })()}
          </div>
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

// Sub-components moved to src/components/PerformanceBudgetCarousel.tsx
