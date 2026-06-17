"use client";

import React, { useState, useEffect, useRef } from "react";
import { defaultState, SavedPerformanceBudgetState, PerformanceBudgetState, PerformanceBudgetStep, PerformanceMetric, PerformancePanel, BudgetRow, BudgetRowNumericField, PerformanceBudgetFieldValue, getAssetPath, mergeState, getNotesKey } from "@/lib/store";
import { getStepIcon } from "@/components/EnrolmentDashboard";

export default function Editor() {
  const [appState, setAppState] = useState<any>(defaultState);
  const [slides, setSlides] = useState<any[]>([]);
  const [slidesLoaded, setSlidesLoaded] = useState(false);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const channelRef = useRef<BroadcastChannel | null>(null);

  // Initialize sync channel and handshake
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const channel = new BroadcastChannel('pir-deck-sync');
    channelRef.current = channel;

    const handleMessage = (e: MessageEvent) => {
      const msg = e.data;
      if (!msg) return;

      if (msg.type === 'initial-sync-response') {
        if (msg.state) setAppState(msg.state);
        if (typeof msg.activeSlideIndex === 'number') {
          setActiveSlideIndex(msg.activeSlideIndex);
        }
      } else if (msg.type === 'update-state') {
        if (msg.state) setAppState(msg.state);
      } else if (msg.type === 'go-to-slide') {
        if (typeof msg.index === 'number') {
          setActiveSlideIndex(msg.index);
        }
      }
    };

    channel.addEventListener('message', handleMessage);

    // Request initial sync state from active presentation tab
    channel.postMessage({ type: 'request-initial-sync' });

    return () => {
      channel.removeEventListener('message', handleMessage);
      channel.close();
    };
  }, []);

  // Fetch slide definitions and server state on mount
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
        console.log('No saved state found or error, using defaults.');
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

      // Clear old saved texts for slide 3 to let the new layout render correctly
      if (savedState.slides && savedState.slides[2]) {
        delete savedState.slides[2];
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

          const sections = Array.from(doc.querySelectorAll('x-import section, x-import[component-from-global-scope="deck-stage"] section'));
          const parsedSlides = sections.map((section: any, idx: number) => {
            const label = section.getAttribute('data-label') || 'Slide';
            const screenLabel = section.getAttribute('data-screen-label') || '';
            const noteKey = getNotesKey(idx, savedState);
            const speakerNotes = savedState.notes[noteKey] ?? section.getAttribute('data-speaker-notes') ?? '';

            return {
              id: idx,
              label,
              screenLabel,
              speakerNotes
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

  const broadcastState = (newState: any) => {
    if (channelRef.current) {
      channelRef.current.postMessage({ type: 'update-state', state: newState });
    }
  };

  const handleGoToSlide = (index: number) => {
    setActiveSlideIndex(index);
    if (channelRef.current) {
      channelRef.current.postMessage({ type: 'go-to-slide', index });
    }
  };

  const handleThemeChange = (theme: string) => {
    const nextState = { ...appState, theme };
    setAppState(nextState);
    saveState(nextState);
    broadcastState(nextState);
  };

  const handleTransitionChange = (transition: string) => {
    const nextState = { ...appState, transition };
    setAppState(nextState);
    saveState(nextState);
    broadcastState(nextState);
  };

  const handleModeChange = (mode: 'presenter' | 'editor') => {
    const nextState = { ...appState, mode };
    setAppState(nextState);
    saveState(nextState);
    broadcastState(nextState);
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const noteKey = getNotesKey(activeSlideIndex, appState);

    // Update local slides list display
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
      const nextState = { ...prev, notes: newNotes };
      saveState(nextState);
      broadcastState(nextState);
      return nextState;
    });
  };

  const handleCharStepChange = (stepIdx: number) => {
    const nextState = {
      ...appState,
      characterization: { ...appState.characterization, currentStep: stepIdx }
    };
    setAppState(nextState);
    saveState(nextState);
    broadcastState(nextState);
  };

  const handleCharDataChange = (stepIdx: number, domIdx: number, field: string, val: any) => {
    const nextSteps = [...appState.characterization.steps];
    const nextDomains = [...nextSteps[stepIdx].domains];
    nextDomains[domIdx] = { ...nextDomains[domIdx], [field]: val };
    nextSteps[stepIdx] = { ...nextSteps[stepIdx], domains: nextDomains };
    const nextState = {
      ...appState,
      characterization: { ...appState.characterization, steps: nextSteps }
    };
    setAppState(nextState);
    saveState(nextState);
    broadcastState(nextState);
  };

  const handleCharActiveDomainChange = (domIdx: number) => {
    const nextState = {
      ...appState,
      characterization: { ...appState.characterization, activeDomainIdx: domIdx }
    };
    setAppState(nextState);
    saveState(nextState);
    broadcastState(nextState);
  };

  const handlePerfStepChange = (stepIdx: number) => {
    const perfState: PerformanceBudgetState = appState.performanceBudget || defaultState.performanceBudget;
    const nextState = {
      ...appState,
      performanceBudget: { ...perfState, currentStep: stepIdx, activePanelIdx: 0 }
    };
    setAppState(nextState);
    saveState(nextState);
    broadcastState(nextState);
  };

  const handlePerfActivePanelChange = (panelIdx: number) => {
    const perfState: PerformanceBudgetState = appState.performanceBudget || defaultState.performanceBudget;
    const nextState = {
      ...appState,
      performanceBudget: { ...perfState, activePanelIdx: panelIdx }
    };
    setAppState(nextState);
    saveState(nextState);
    broadcastState(nextState);
  };

  const handlePerfStepDataChange = (stepIdx: number, field: keyof PerformanceBudgetStep, val: PerformanceBudgetFieldValue) => {
    const perfState: PerformanceBudgetState = appState.performanceBudget || defaultState.performanceBudget;
    const nextSteps = [...perfState.steps];
    nextSteps[stepIdx] = { ...nextSteps[stepIdx], [field]: val } as PerformanceBudgetStep;
    const nextState = {
      ...appState,
      performanceBudget: { ...perfState, steps: nextSteps }
    };
    setAppState(nextState);
    saveState(nextState);
    broadcastState(nextState);
  };

  const handlePerfMetricChange = (metricIdx: number, field: keyof PerformanceMetric, val: number) => {
    const perfState: PerformanceBudgetState = appState.performanceBudget || defaultState.performanceBudget;
    const stepIdx = perfState.currentStep ?? defaultState.performanceBudget.currentStep;
    const step = perfState.steps[stepIdx];
    const nextMetrics = [...(step.metrics || [])];
    nextMetrics[metricIdx] = { ...nextMetrics[metricIdx], [field]: val };
    handlePerfStepDataChange(stepIdx, 'metrics', nextMetrics);
  };

  const handlePerfBudgetRowChange = (rowIdx: number, field: BudgetRowNumericField, val: number) => {
    const perfState: PerformanceBudgetState = appState.performanceBudget || defaultState.performanceBudget;
    const stepIdx = perfState.currentStep ?? defaultState.performanceBudget.currentStep;
    const step = perfState.steps[stepIdx];
    const nextRows = [...(step.budgetRows || [])];
    nextRows[rowIdx] = { ...nextRows[rowIdx], [field]: val };
    handlePerfStepDataChange(stepIdx, 'budgetRows', nextRows);
  };

  const handlePerfPanelFieldChange = (field: keyof PerformancePanel, val: string) => {
    const perfState: PerformanceBudgetState = appState.performanceBudget || defaultState.performanceBudget;
    const stepIdx = perfState.currentStep ?? defaultState.performanceBudget.currentStep;
    const step = perfState.steps[stepIdx];
    const panelIdx = perfState.activePanelIdx ?? defaultState.performanceBudget.activePanelIdx;
    const nextPanels = [...(step.panels || [])];
    nextPanels[panelIdx] = { ...nextPanels[panelIdx], [field]: val };
    handlePerfStepDataChange(stepIdx, 'panels', nextPanels);
  };

  const handlePerfPanelBulletChange = (bulletIdx: number, val: string) => {
    const perfState: PerformanceBudgetState = appState.performanceBudget || defaultState.performanceBudget;
    const stepIdx = perfState.currentStep ?? defaultState.performanceBudget.currentStep;
    const step = perfState.steps[stepIdx];
    const panelIdx = perfState.activePanelIdx ?? defaultState.performanceBudget.activePanelIdx;
    const nextPanels = [...(step.panels || [])];
    const nextBullets = [...(nextPanels[panelIdx].bullets || [])];
    nextBullets[bulletIdx] = val;
    nextPanels[panelIdx] = { ...nextPanels[panelIdx], bullets: nextBullets };
    handlePerfStepDataChange(stepIdx, 'panels', nextPanels);
  };

  const handleStepChange = (stepIdx: number) => {
    const nextState = {
      ...appState,
      dashboard: { ...appState.dashboard, currentStep: stepIdx }
    };
    setAppState(nextState);
    saveState(nextState);
    broadcastState(nextState);
  };

  const handleDashboardDataChange = (stepIdx: number, field: string, val: any) => {
    const nextSteps = [...appState.dashboard.steps];
    nextSteps[stepIdx] = { ...nextSteps[stepIdx], [field]: val };
    const nextState = {
      ...appState,
      dashboard: { ...appState.dashboard, steps: nextSteps }
    };
    setAppState(nextState);
    saveState(nextState);
    broadcastState(nextState);
  };

  const handleSliderChange = (valIdx: number, isTarget: boolean, val: number) => {
    const currentStep = appState.dashboard.currentStep;
    const step = appState.dashboard.steps[currentStep];

    if (currentStep === 3) {
      const newVals = [...step.values];
      newVals[valIdx] = val;
      handleDashboardDataChange(currentStep, 'values', newVals);
    } else if (currentStep === 0 || currentStep === 1 || currentStep === 2) {
      if (isTarget) {
        const newTargets = [...step.targets];
        newTargets[valIdx] = val;
        handleDashboardDataChange(currentStep, 'targets', newTargets);
      } else {
        const newActuals = [...step.actuals];
        newActuals[valIdx] = val;
        handleDashboardDataChange(currentStep, 'actuals', newActuals);
      }
    } else if (currentStep === 4) {
      const newFlows = [...step.flows];
      newFlows[valIdx] = val;
      handleDashboardDataChange(currentStep, 'flows', newFlows);
    }
  };

  const handleResetDeck = () => {
    if (confirm('Are you sure you want to reset presentation to slide 1?')) {
      handleGoToSlide(0);
    }
  };

  if (!slidesLoaded) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#cbd5e1', fontSize: '18px', fontWeight: 'bold' }}>
        Loading Editor Panel...
      </div>
    );
  }

  const activeSlide = slides[activeSlideIndex];
  const noteKey = getNotesKey(activeSlideIndex, appState);
  const activeNotesText = appState.notes?.[noteKey] ?? activeSlide?.speakerNotes ?? '';

  const isDashboardSlide = activeSlide?.label === "Enrolment Dashboard";
  const currentStep = appState.dashboard.currentStep;
  const currentStepData = appState.dashboard.steps[currentStep];

  const isCharSlide = activeSlide?.label === "Characterization";
  const isPerfBudgetSlide = activeSlide?.label === "Performance & Budget";
  const perfState: PerformanceBudgetState = appState.performanceBudget || defaultState.performanceBudget;
  const perfCurrentStep = perfState.currentStep ?? defaultState.performanceBudget.currentStep;
  const perfSteps = perfState.steps || defaultState.performanceBudget.steps;
  const perfCurrentStepData = perfSteps[perfCurrentStep] || defaultState.performanceBudget.steps[0];
  const perfPanels = perfCurrentStepData.panels || [];
  const perfActivePanelIdx = Math.max(0, Math.min(perfState.activePanelIdx ?? 0, Math.max(0, perfPanels.length - 1)));
  const perfActivePanel = perfPanels[perfActivePanelIdx];

  return (
    <div className="editor-page-root">
      {/* Left Sidebar: Slide list */}
      <aside className="editor-sidebar">
        <div className="editor-sidebar-header">
          <h2>Slides Rail</h2>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Click to navigate
          </div>
        </div>
        <div className="rail-list" style={{ overflowY: 'auto', flex: 1, padding: '16px' }}>
          {slides.map((slide, idx) => (
            <div
              key={slide.id}
              className={`rail-item ${idx === activeSlideIndex ? 'active' : ''}`}
              onClick={() => handleGoToSlide(idx)}
            >
              <span className="rail-item-num">{String(idx + 1).padStart(2, '0')}</span>
              <div className="rail-item-content">
                <div className="rail-item-label">{slide.label}</div>
                 <div className="rail-item-desc">
                  {(() => {
                    const itemNoteKey = getNotesKey(idx, appState);
                    return appState.notes?.[itemNoteKey] ?? slide.speakerNotes ?? 'No speaker notes.';
                  })()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Work Area */}
      <main className="editor-main">
        <header className="editor-main-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h1>Active Slide {activeSlideIndex + 1}</h1>
            <span style={{ fontSize: '13px', padding: '4px 10px', background: '#334155', borderRadius: '999px', fontWeight: 'bold', color: '#cbd5e1' }}>
              {activeSlide?.label}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* View Mode Toggle */}
            <div className="mode-toggle-switch">
              <button
                type="button"
                className={`mode-toggle-btn ${appState.mode === 'editor' ? 'active' : ''}`}
                onClick={() => handleModeChange('editor')}
              >
                Editor mode
              </button>
              <button
                type="button"
                className={`mode-toggle-btn ${appState.mode === 'presenter' ? 'active' : ''}`}
                onClick={() => handleModeChange('presenter')}
              >
                Presenter mode
              </button>
            </div>

            <button
              type="button"
              className="btn-action"
              onClick={handleResetDeck}
              style={{ background: '#1e293b', borderColor: '#334155' }}
            >
              Reset to Slide 1
            </button>
          </div>
        </header>

        <div className="editor-content-area">

          {/* Deck Settings Card */}
          <section className="editor-card">
            <h3 className="editor-card-title">Deck Configurations</h3>
            <div style={{ display: 'flex', gap: '32px' }}>
              <div style={{ flex: 1 }}>
                <div className="customizer-section-title">Theme vibe</div>
                <div className="theme-picker-grid">
                  {['slate', 'deped', 'emerald', 'sunset'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={`theme-dot ${appState.theme === t ? 'active' : ''}`}
                      data-vibe={t}
                      title={t.charAt(0).toUpperCase() + t.slice(1)}
                      onClick={() => handleThemeChange(t)}
                    />
                  ))}
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <div className="customizer-section-title">Slide Transition</div>
                <select
                  className="select-input"
                  value={appState.transition}
                  onChange={(e) => handleTransitionChange(e.target.value)}
                  style={{ background: '#0f172a', borderColor: '#334155' }}
                >
                  <option value="fade">Cross Fade</option>
                  <option value="slide">Slide Horizontal</option>
                  <option value="zoom">Zoom Center</option>
                  <option value="none">None</option>
                </select>
              </div>
            </div>
          </section>

          {/* Enrolment Dashboard Sub-Editor Panel */}
          {isDashboardSlide && (
            <section className="editor-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h3 className="editor-card-title" style={{ marginBottom: '8px' }}>Enrolment Dashboard Metrics</h3>
                <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 16px 0' }}>
                  Adjust dashboard data and see charts automatically update on the main screen in real-time.
                </p>
              </div>

              {/* Stepper controls */}
              <div id="dashboard-stepper" style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}>
                {appState.dashboard.steps.map((s: any, idx: number) => (
                  <button
                    key={idx}
                    type="button"
                    className={`dashboard-stepper-btn ${idx === currentStep ? 'active' : ''}`}
                    onClick={() => handleStepChange(idx)}
                    style={{ padding: '8px 12px' }}
                  >
                    <span className="dashboard-stepper-num">{String(idx + 1).padStart(2, '0')}</span>
                    {getStepIcon(idx)}
                    <span className="dashboard-stepper-label" style={{ fontSize: '13px' }}>{s.title}</span>
                  </button>
                ))}
              </div>

              {/* Slider lists */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Adjust range values
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', background: '#0f172a', padding: '16px', borderRadius: '8px', border: '1px solid #334155' }}>
                  {(currentStep === 0 || currentStep === 1 || currentStep === 2) && currentStepData.years && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {currentStepData.years.map((yr: string, yIdx: number) => (
                        <div key={yr} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                          <div className="dashboard-slider-item">
                            <div className="dashboard-slider-header" style={{ color: '#cbd5e1' }}>
                              <span>{yr} Target</span>
                              <span className="dashboard-slider-val" style={{ background: '#1e293b' }}>{(currentStepData.targets || [])[yIdx]}</span>
                            </div>
                            <input
                              type="range"
                              className="dashboard-range-input"
                              min={currentStep === 0 ? 1 : 10}
                              max={currentStepData.max}
                              value={(currentStepData.targets || [])[yIdx]}
                              onChange={(e) => handleSliderChange(yIdx, true, parseInt(e.target.value, 10))}
                            />
                          </div>
                          <div className="dashboard-slider-item">
                            <div className="dashboard-slider-header" style={{ color: '#cbd5e1' }}>
                              <span>{yr} Actual</span>
                              <span className="dashboard-slider-val" style={{ background: '#1e293b' }}>{(currentStepData.actuals || [])[yIdx]}</span>
                            </div>
                            <input
                              type="range"
                              className="dashboard-range-input"
                              min={currentStep === 0 ? 1 : 10}
                              max={currentStepData.max}
                              value={(currentStepData.actuals || [])[yIdx]}
                              onChange={(e) => handleSliderChange(yIdx, false, parseInt(e.target.value, 10))}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {currentStep === 3 && (
                    <>
                      <div className="dashboard-slider-item">
                        <div className="dashboard-slider-header" style={{ color: '#cbd5e1' }}>
                          <span>Grade 11 Enrolment</span>
                          <span className="dashboard-slider-val" style={{ background: '#1e293b' }}>{currentStepData.values[0]}</span>
                        </div>
                        <input
                          type="range"
                          className="dashboard-range-input"
                          min={1}
                          max={currentStepData.max}
                          value={currentStepData.values[0]}
                          onChange={(e) => handleSliderChange(0, false, parseInt(e.target.value, 10))}
                        />
                      </div>
                      <div className="dashboard-slider-item">
                        <div className="dashboard-slider-header" style={{ color: '#cbd5e1' }}>
                          <span>Grade 12 Enrolment</span>
                          <span className="dashboard-slider-val" style={{ background: '#1e293b' }}>{currentStepData.values[1]}</span>
                        </div>
                        <input
                          type="range"
                          className="dashboard-range-input"
                          min={1}
                          max={currentStepData.max}
                          value={currentStepData.values[1]}
                          onChange={(e) => handleSliderChange(1, false, parseInt(e.target.value, 10))}
                        />
                      </div>
                    </>
                  )}

                  {currentStep === 4 && currentStepData.cohorts && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' }}>
                      {currentStepData.cohorts.map((cName: string, cIdx: number) => (
                        <div key={cName} className="dashboard-slider-item">
                          <div className="dashboard-slider-header" style={{ color: '#cbd5e1' }}>
                            <span>{cName} Shift</span>
                            <span className="dashboard-slider-val" style={{ background: '#1e293b' }}>{(currentStepData.flows || [])[cIdx]}</span>
                          </div>
                          <input
                            type="range"
                            className="dashboard-range-input"
                            min={-15}
                            max={15}
                            value={(currentStepData.flows || [])[cIdx]}
                            onChange={(e) => handleSliderChange(cIdx, false, parseInt(e.target.value, 10))}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Text findings editor */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Edit findings text
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#94a3b8' }}>Finding</label>
                    <textarea
                      className="notes-textarea"
                      value={currentStepData.finding}
                      onChange={(e) => handleDashboardDataChange(currentStep, 'finding', e.target.value)}
                      style={{ height: '70px', background: '#0f172a', borderColor: '#334155' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#e0a96d' }}>Recommended Action</label>
                    <textarea
                      className="notes-textarea"
                      value={currentStepData.action}
                      onChange={(e) => handleDashboardDataChange(currentStep, 'action', e.target.value)}
                      style={{ height: '70px', background: '#0f172a', borderColor: '#334155' }}
                    />
                  </div>
                </div>
              </div>

            </section>
          )}

          {/* Performance & Budget Carousel Sub-Editor Panel */}
          {isPerfBudgetSlide && (
            <section className="editor-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h3 className="editor-card-title" style={{ marginBottom: '8px' }}>Performance & Budget Carousel</h3>
                <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 16px 0' }}>
                  Edit the merged learning outcomes, NC II, work immersion, and budget carousel in real-time.
                </p>
              </div>

              <div id="dashboard-stepper" style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}>
                {perfSteps.map((s, idx) => (
                  <button
                    key={s.title}
                    type="button"
                    className={`dashboard-stepper-btn ${idx === perfCurrentStep ? 'active' : ''}`}
                    onClick={() => handlePerfStepChange(idx)}
                    style={{ padding: '8px 10px' }}
                  >
                    <span className="dashboard-stepper-num">{String(idx + 1).padStart(2, '0')}</span>
                    <span className="dashboard-stepper-label" style={{ fontSize: '12px' }}>{s.title}</span>
                  </button>
                ))}
              </div>

              <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Active insight panel
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {perfPanels.map((panel, panelIdx) => (
                    <button
                      key={panel.title}
                      type="button"
                      className="btn-action"
                      onClick={() => handlePerfActivePanelChange(panelIdx)}
                      style={{
                        background: panelIdx === perfActivePanelIdx ? 'var(--vibe-accent)' : '#1e293b',
                        borderColor: panelIdx === perfActivePanelIdx ? 'transparent' : '#334155',
                        color: '#fff'
                      }}
                    >
                      {panel.title}
                    </button>
                  ))}
                </div>

                {perfActivePanel && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 'bold', color: '#94a3b8' }}>
                      Status
                      <input
                        type="text"
                        value={perfActivePanel.status}
                        onChange={(e) => handlePerfPanelFieldChange('status', e.target.value)}
                        style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#fff', padding: '8px 10px', outline: 'none' }}
                      />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 'bold', color: '#94a3b8' }}>
                      Finding
                      <textarea
                        className="notes-textarea"
                        value={perfActivePanel.finding}
                        onChange={(e) => handlePerfPanelFieldChange('finding', e.target.value)}
                        style={{ height: '72px', background: '#1e293b', borderColor: '#334155' }}
                      />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', fontWeight: 'bold', color: '#e0a96d' }}>
                      Recommended Action
                      <textarea
                        className="notes-textarea"
                        value={perfActivePanel.action}
                        onChange={(e) => handlePerfPanelFieldChange('action', e.target.value)}
                        style={{ height: '72px', background: '#1e293b', borderColor: '#334155' }}
                      />
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#94a3b8' }}>Detail Bullets</span>
                      {(perfActivePanel.bullets || []).map((bullet: string, bulletIdx: number) => (
                        <textarea
                          key={bulletIdx}
                          className="notes-textarea"
                          value={bullet}
                          onChange={(e) => handlePerfPanelBulletChange(bulletIdx, e.target.value)}
                          style={{ height: '48px', background: '#1e293b', borderColor: '#334155', fontSize: '13px', padding: '8px' }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Metric controls
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  {(perfCurrentStepData.metrics || []).map((metric, metricIdx) => (
                    <div key={`${metric.label}-${metricIdx}`} className="dashboard-slider-item" style={{ background: '#1e293b', padding: '12px', borderRadius: '8px', border: '1px solid #334155' }}>
                      <div className="dashboard-slider-header" style={{ color: '#cbd5e1', fontSize: '13px' }}>
                        <span>{metric.label}</span>
                        <span className="dashboard-slider-val" style={{ background: '#0f172a', fontSize: '12px' }}>{metric.unit || 'value'}</span>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        value={metric.value}
                        onChange={(e) => handlePerfMetricChange(metricIdx, 'value', Number(e.target.value))}
                        style={{ width: '100%', boxSizing: 'border-box', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff', padding: '8px 10px', outline: 'none' }}
                      />
                      {typeof metric.previous === 'number' && (
                        <input
                          type="number"
                          step="0.01"
                          value={metric.previous}
                          onChange={(e) => handlePerfMetricChange(metricIdx, 'previous', Number(e.target.value))}
                          title="Previous value"
                          style={{ width: '100%', boxSizing: 'border-box', marginTop: '8px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#cbd5e1', padding: '8px 10px', outline: 'none' }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {perfCurrentStepData.budgetRows && (
                <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    SOB budget rows
                  </div>
                  {perfCurrentStepData.budgetRows.map((row, rowIdx) => (
                    <div key={row.label} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '14px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                      <div style={{ gridColumn: '1 / -1', color: '#fff', fontWeight: 800 }}>{row.label}</div>
                      {(['allocation', 'downloaded', 'liquidated', 'tax', 'utilized', 'utilization'] as BudgetRowNumericField[]).map((field) => (
                        <label key={field} style={{ display: 'flex', flexDirection: 'column', gap: '5px', color: '#94a3b8', fontSize: '12px', fontWeight: 700 }}>
                          {field}
                          <input
                            type="number"
                            step="0.01"
                            value={row[field]}
                            onChange={(e) => handlePerfBudgetRowChange(rowIdx, field, Number(e.target.value))}
                            style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#fff', padding: '7px 8px', outline: 'none' }}
                          />
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Characterization Carousel Sub-Editor Panel */}
          {isCharSlide && (
            <section className="editor-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h3 className="editor-card-title" style={{ marginBottom: '8px' }}>Characterization Metrics</h3>
                <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 16px 0' }}>
                  Adjust maturity levels, status badges, and bullet descriptions in real-time.
                </p>
              </div>

              {/* Stepper controls */}
              <div id="dashboard-stepper" style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}>
                {(appState.characterization?.steps || defaultState.characterization.steps).map((s: any, idx: number) => (
                  <button
                    key={idx}
                    type="button"
                    className={`dashboard-stepper-btn ${idx === (appState.characterization?.currentStep ?? defaultState.characterization.currentStep) ? 'active' : ''}`}
                    onClick={() => handleCharStepChange(idx)}
                    style={{ padding: '8px 12px' }}
                  >
                    <span className="dashboard-stepper-num">{String(idx + 1).padStart(2, '0')}</span>
                    <span className="dashboard-stepper-label" style={{ fontSize: '13px' }}>{s.title}</span>
                  </button>
                ))}
              </div>

              {/* Edit inputs for 3 domains */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {((appState.characterization?.steps || defaultState.characterization.steps)[appState.characterization?.currentStep ?? defaultState.characterization.currentStep]?.domains || []).map((dom: any, domIdx: number) => {
                  const isActive = (appState.characterization?.activeDomainIdx ?? 0) === domIdx;
                  return (
                    <div
                      key={dom.name}
                      onClick={() => handleCharActiveDomainChange(domIdx)}
                      style={{
                        background: '#0f172a',
                        padding: '16px',
                        borderRadius: '10px',
                        border: isActive ? '2px solid var(--vibe-accent)' : '1px solid #334155',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: isActive ? '14px' : '0px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '15px', color: isActive ? 'var(--vibe-accent)' : '#fff' }}>{dom.name}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }} onClick={e => e.stopPropagation()}>
                          <span style={{ fontSize: '12px', color: '#94a3b8' }}>Status:</span>
                          <input
                            type="text"
                            value={dom.status}
                            onChange={(e) => handleCharDataChange(appState.characterization?.currentStep ?? defaultState.characterization.currentStep, domIdx, 'status', e.target.value)}
                            style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '6px', color: '#fff', padding: '4px 8px', fontSize: '12px', outline: 'none' }}
                          />
                        </div>
                      </div>

                      {isActive && (
                        <>
                          {/* Maturity slider */}
                          <div className="dashboard-slider-item" onClick={e => e.stopPropagation()}>
                            <div className="dashboard-slider-header" style={{ color: '#cbd5e1', fontSize: '13px' }}>
                              <span>Maturity Level</span>
                              <span className="dashboard-slider-val" style={{ background: '#1e293b', fontSize: '12px' }}>Level {dom.maturity} / 4</span>
                            </div>
                            <input
                              type="range"
                              className="dashboard-range-input"
                              min={1}
                              max={4}
                              value={dom.maturity}
                              onChange={(e) => handleCharDataChange(appState.characterization?.currentStep ?? defaultState.characterization.currentStep, domIdx, 'maturity', parseInt(e.target.value, 10))}
                            />
                          </div>

                          {/* Bullets textareas */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }} onClick={e => e.stopPropagation()}>
                            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#94a3b8' }}>Bullet Points (Descriptions)</span>
                            {dom.bullets.map((bullet: string, bIdx: number) => (
                              <textarea
                                key={bIdx}
                                className="notes-textarea"
                                value={bullet}
                                onChange={(e) => {
                                  const nextBullets = [...dom.bullets];
                                  nextBullets[bIdx] = e.target.value;
                                  handleCharDataChange(appState.characterization?.currentStep ?? defaultState.characterization.currentStep, domIdx, 'bullets', nextBullets);
                                }}
                                style={{ height: '45px', background: '#1e293b', borderColor: '#334155', fontSize: '13px', padding: '6px' }}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Speaker Notes Bubble */}
          <section className="editor-card" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, background: 'transparent', border: 'none', boxShadow: 'none', padding: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--vibe-accent)', fontWeight: 'bold', fontSize: '14px', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Speaker Notes Bubble</span>
              </div>
              <button
                type="button"
                className="popout-button"
                onClick={() => window.open(getAssetPath('/notes/'), 'speaker-notes', 'width=600,height=500,menubar=no,toolbar=no,location=no,status=no')}
                title="Open Notes in New Window"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '4px',
                  padding: '2px 8px',
                  fontSize: '11px',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                <span>Pop Out</span>
              </button>
            </div>
            
            <div className="speaker-bubble" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <textarea
                className="notes-textarea"
                placeholder="Type speaker notes for this slide/step here..."
                value={activeNotesText}
                onChange={handleNotesChange}
                style={{ flex: 1, minHeight: '120px', resize: 'none', background: 'transparent', border: 'none', padding: 0, boxShadow: 'none', color: '#cbd5e1' }}
              />
            </div>
            <div className="notes-hint" style={{ marginTop: '8px', color: '#64748b' }}>
              Edits automatically save and synchronize with presentation tab.
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
