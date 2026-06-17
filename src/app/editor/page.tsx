"use client";

import React, { useState, useEffect, useRef } from "react";

interface DashboardStep {
  title: string;
  labels?: string[];
  values: number[];
  max: number;
  finding: string;
  action: string;
  years?: string[];
  targets?: number[];
  actuals?: number[];
  grades?: string[];
  cohorts?: string[];
  flows?: number[];
}

const defaultState = {
  theme: 'slate',
  transition: 'fade',
  mode: 'editor',
  notes: {} as Record<number, string>,
  slides: {} as Record<number, { texts: Record<number, string>; charts?: any }>,
  dashboard: {
    currentStep: 0,
    steps: [
      {
        title: "Kindergarten",
        labels: ["Target", "Actual"],
        values: [7, 8],
        max: 20,
        finding: "Kindergarten intake is small but consistently on or above target.",
        action: "Sustain early-registration drives to protect the feeder pipeline."
      },
      {
        title: "Elementary",
        years: ["2024-25", "2025-26", "2026-27"],
        targets: [96, 98, 91],
        actuals: [98, 91, 90],
        max: 120,
        finding: "A -7 dip in 2025-2026, then stabilizing near the target (-1) in 2026-2027.",
        action: "Track transfer-out reasons and strengthen learner retention in the elementary cohort."
      },
      {
        title: "Junior High",
        years: ["2024-25", "2025-26", "2026-27"],
        targets: [48, 52, 56],
        actuals: [52, 56, 59],
        max: 80,
        finding: "Actual enrolment consistently exceeded target in both years targets were set (+4, then +3).",
        action: "Set slightly more ambitious targets and plan section/teacher load for continued growth."
      },
      {
        title: "Senior High",
        grades: ["Grade 11", "Grade 12"],
        values: [8, 11],
        max: 30,
        finding: "SHS enrolment declined from 27 to 19 due to transfers to schools offering Cookery / Automotive.",
        action: "Build on the 6 new computer units to make GAS / ICT-CSS strands more competitive."
      },
      {
        title: "Cohort Tracking",
        cohorts: ["KG-G1", "G1-G2", "G2-G3", "G3-G4", "G4-G5", "G5-G6", "G7-G8", "G8-G9", "G9-G10"],
        flows: [8, 3, -10, 7, 2, -7, 2, 1, 0],
        max: 20,
        finding: "Grade 3 and Grade 6 grew, while Kindergarten, Grade 2, Grade 5, and JHS Grade 7 / Grade 10 contracted.",
        action: "Strengthen Grade 6 to 7 transition and Grade 10 to 11 bridging into Senior High School."
      }
    ]
  },
  characterization: {
    currentStep: 0,
    activeDomainIdx: 0,
    steps: [
      {
        title: "Equipment & Assessment",
        subtitle: "Curriculum Support — Equipment, ICT & Assessment",
        domains: [
          {
            name: "Instructional Equipment",
            letter: "E",
            status: "Equipped · ICT uneven",
            maturity: 3,
            bullets: [
              "Smart TVs in all classrooms; printers for all teachers, laptops for some.",
              "Science & Mathematics equipment available and actively used.",
              "ICT tools remain uneven across teachers, affecting consistency."
            ]
          },
          {
            name: "ICT Environment",
            letter: "I",
            status: "Constrained",
            maturity: 2,
            bullets: [
              "Rising SHS ICT Programming enrolment raises equipment demand.",
              "Existing resources are limited relative to curriculum needs.",
              "Hands-on ICT competencies are the most affected."
            ]
          },
          {
            name: "Assessment",
            letter: "A",
            status: "Functional · strengthen",
            maturity: 3,
            bullets: [
              "Regional Unified Quarterly Exams standardise assessment.",
              "Pacing does not always align with exam coverage.",
              "HOTS / NAT / PISA capacity-building and ICT for data analysis needed."
            ]
          }
        ]
      },
      {
        title: "Teachers & Facilities",
        subtitle: "Curriculum Support — Teachers, Materials & Facilities",
        domains: [
          {
            name: "Teachers",
            letter: "T",
            status: "Adaptable · multi-level load",
            maturity: 3,
            bullets: [
              "Small, fluctuating classes mean multi-level loads and flexible deployment.",
              "Teachers handle multiple areas and grade levels, esp. JHS and SHS.",
              "SHS ICT Programming raises specialisation demands."
            ]
          },
          {
            name: "Instructional Materials",
            letter: "M",
            status: "Transitional",
            maturity: 2,
            bullets: [
              "Limited provision; many resources outdated (pandemic-era).",
              "MATATAG rollout delayed and staggered — started Grades 1 & 7.",
              "Uneven access to updated materials across grade levels."
            ]
          },
          {
            name: "Facilities",
            letter: "F",
            status: "Functional · not optimised",
            maturity: 2,
            bullets: [
              "14 classrooms, incl. temporary Marcos-type structures for SHS.",
              "Missing: computer lab, clinic, DRRM room, Teen Center.",
              "Home Economics room dilapidated, now used as storage."
            ]
          }
        ]
      },
      {
        title: "Governance & Partnerships",
        subtitle: "Curriculum Support — Leadership, SDO & Partnerships",
        domains: [
          {
            name: "School Leadership",
            letter: "L",
            status: "Stabilising",
            maturity: 3,
            bullets: [
              "Operating amid program expansion and SHS validation.",
              "Managing enrolment swings, compliance and limited resources.",
              "Needs stronger forecasting, optimisation and supervision."
            ]
          },
          {
            name: "SDO Technical Assistance",
            letter: "S",
            status: "Comprehensive support",
            maturity: 4,
            bullets: [
              "Training, staffing, ICT, assessment, supervision & governance support.",
              "Strong for compliance and initial implementation needs.",
              "Needs sustained coaching and on-site technical assistance."
            ]
          },
          {
            name: "Community & Partnerships",
            letter: "P",
            status: "Developing",
            maturity: 2,
            bullets: [
              "Strong PTA, Barangay LGU and School Governing Council support.",
              "Backed early SHS / TVL support and work immersion.",
              "Engagement still developing in depth and sustainability."
            ]
          }
        ]
      }
    ]
  }
};

const getStepIcon = (idx: number) => {
  switch (idx) {
    case 0:
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ display: 'inline-block' }}>
          <circle cx="12" cy="12" r="9" strokeDasharray="30 15" />
        </svg>
      );
    case 1:
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ display: 'inline-block' }}>
          <path d="M3 20L8 14L14 17L21 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 2:
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ display: 'inline-block' }}>
          <rect x="3" y="11" width="4" height="10" rx="1" />
          <rect x="10" y="6" width="4" height="15" rx="1" />
          <rect x="17" y="13" width="4" height="8" rx="1" />
        </svg>
      );
    case 3:
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ display: 'inline-block' }}>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="4" strokeDasharray="6 3" />
        </svg>
      );
    case 4:
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ display: 'inline-block' }}>
          <path d="M4 12h16M14 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return null;
  }
};

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
        const stateRes = await fetch('/.pir-deck.state.json?t=' + Date.now());
        if (stateRes.ok) {
          const stateData = await stateRes.json();
          savedState = {
            ...defaultState,
            ...stateData,
            notes: stateData.notes || {},
            slides: stateData.slides || {},
            dashboard: {
              currentStep: stateData.dashboard?.currentStep ?? defaultState.dashboard.currentStep,
              steps: defaultState.dashboard.steps.map((step: any, idx: number) => ({
                ...step,
                ...(stateData.dashboard?.steps?.[idx] || {})
              }))
            },
            characterization: {
              currentStep: stateData.characterization?.currentStep ?? defaultState.characterization.currentStep,
              activeDomainIdx: stateData.characterization?.activeDomainIdx ?? defaultState.characterization.activeDomainIdx ?? 0,
              steps: defaultState.characterization.steps.map((step: any, idx: number) => ({
                ...step,
                ...(stateData.characterization?.steps?.[idx] || {}),
                domains: step.domains.map((dom: any, dIdx: number) => ({
                  ...dom,
                  ...(stateData.characterization?.steps?.[idx]?.domains?.[dIdx] || {})
                }))
              }))
            }
          };
        }
      } catch (err) {
        console.log('No saved state found or error, using defaults.');
      }
      setAppState(savedState);

      try {
        const htmlRes = await fetch('/PIR 2026.dc.html');
        if (htmlRes.ok) {
          const htmlText = await htmlRes.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(htmlText, 'text/html');

          const sections = Array.from(doc.querySelectorAll('x-import section, x-import[component-from-global-scope="deck-stage"] section'));
          const parsedSlides = sections.map((section: any, idx: number) => {
            const label = section.getAttribute('data-label') || 'Slide';
            const screenLabel = section.getAttribute('data-screen-label') || '';
            const speakerNotes = savedState.notes[idx] ?? section.getAttribute('data-speaker-notes') ?? '';

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
      await fetch('/api/save-state', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(stateToSave),
      });
    } catch (err) {
      console.error('Failed to save state:', err);
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

    const nextNotes = { ...appState.notes, [activeSlideIndex]: val };
    const nextState = { ...appState, notes: nextNotes };
    setAppState(nextState);
    saveState(nextState);
    broadcastState(nextState);
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

    if (currentStep === 0 || currentStep === 3) {
      const newVals = [...step.values];
      newVals[valIdx] = val;
      handleDashboardDataChange(currentStep, 'values', newVals);
    } else if (currentStep === 1 || currentStep === 2) {
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
  const isDashboardSlide = activeSlide?.label === "Enrolment Dashboard";
  const currentStep = appState.dashboard.currentStep;
  const currentStepData = appState.dashboard.steps[currentStep];

  const isCharSlide = activeSlide?.label === "Characterization";

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
                <div className="rail-item-desc">{slide.speakerNotes || 'No speaker notes.'}</div>
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
                  {currentStep === 0 && (
                    <>
                      <div className="dashboard-slider-item">
                        <div className="dashboard-slider-header" style={{ color: '#cbd5e1' }}>
                          <span>Target Value</span>
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
                          <span>Actual Value</span>
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

                  {(currentStep === 1 || currentStep === 2) && currentStepData.years && (
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
                              min={10}
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
                              min={10}
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

          {/* Speaker Notes Card */}
          <section className="editor-card" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            <h3 className="editor-card-title">Speaker Notes</h3>
            <textarea
              className="notes-textarea"
              placeholder="Type speaker notes for this slide here..."
              value={activeSlide?.speakerNotes || ''}
              onChange={handleNotesChange}
              style={{ flex: 1, minHeight: '120px', resize: 'none', background: '#0f172a', borderColor: '#334155' }}
            />
            <div className="notes-hint" style={{ marginTop: '8px', color: '#64748b' }}>
              Edits automatically save to server and synchronize with presentation tab.
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
