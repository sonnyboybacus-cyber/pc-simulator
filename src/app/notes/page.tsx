'use client';

import React, { useState, useEffect, useRef } from 'react';
import { defaultState, mergeState, getAssetPath, getNotesKey } from '@/lib/store';

export default function NotesPrompter() {
  const [appState, setAppState] = useState<any>(defaultState);
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [slides, setSlides] = useState<any[]>([]);
  const [slidesLoaded, setSlidesLoaded] = useState(false);
  const [fontSize, setFontSize] = useState<number>(24); // Default readable font size in px
  const [syncStatus, setSyncStatus] = useState<'connected' | 'syncing' | 'disconnected'>('syncing');
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load slides config from PIR 2026.dc.html (similar to page.tsx)
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

  // Listen to BroadcastChannel for updates
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const channel = new BroadcastChannel('pir-deck-sync');

    const handleMessage = (e: MessageEvent) => {
      const msg = e.data;
      if (!msg) return;

      if (msg.type === 'go-to-slide') {
        setActiveSlideIndex(msg.index);
        setSyncStatus('connected');
      } else if (msg.type === 'update-state') {
        setAppState(msg.state);
        setSyncStatus('connected');
      } else if (msg.type === 'initial-sync-response') {
        setAppState(msg.state);
        setActiveSlideIndex(msg.activeSlideIndex);
        setSyncStatus('connected');
      }
    };

    channel.addEventListener('message', handleMessage);

    // Request initial state sync on mount
    channel.postMessage({ type: 'request-initial-sync' });

    // Fallback sync status after a short delay
    const timer = setTimeout(() => {
      setSyncStatus((prev) => (prev === 'syncing' ? 'disconnected' : prev));
    }, 1500);

    return () => {
      channel.removeEventListener('message', handleMessage);
      channel.close();
      clearTimeout(timer);
    };
  }, []);

  // Sync state changes back to deck & editor
  const updateAndBroadcast = (newState: any) => {
    setAppState(newState);
    try {
      localStorage.setItem('pir-deck-state', JSON.stringify(newState));
    } catch (e) {
      console.error(e);
    }
    try {
      const channel = new BroadcastChannel('pir-deck-sync');
      channel.postMessage({ type: 'update-state', state: newState });
      channel.close();
    } catch (err) {}
  };

  const goToSlide = (index: number) => {
    setActiveSlideIndex(index);
    try {
      const channel = new BroadcastChannel('pir-deck-sync');
      channel.postMessage({ type: 'go-to-slide', index });
      channel.close();
    } catch (err) {}
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const noteKey = getNotesKey(activeSlideIndex, appState);

    // Update slides cache locally
    if (slides[activeSlideIndex]) {
      const updatedSlides = [...slides];
      updatedSlides[activeSlideIndex] = {
        ...updatedSlides[activeSlideIndex],
        speakerNotes: val
      };
      setSlides(updatedSlides);
    }

    const newNotes = { ...appState.notes, [noteKey]: val };
    const newState = { ...appState, notes: newNotes };
    updateAndBroadcast(newState);
  };

  // Keyboard navigation inside Prompter (ignoring when typing in textarea)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement === textareaRef.current) return;

      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'Backspace') {
        e.preventDefault();
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeSlideIndex, appState, slides]);

  const handlePrev = () => {
    if (activeSlideIndex === 3 && appState.dashboard && appState.dashboard.currentStep > 0) {
      const nextDashboard = {
        ...appState.dashboard,
        currentStep: appState.dashboard.currentStep - 1
      };
      const newState = { ...appState, dashboard: nextDashboard };
      updateAndBroadcast(newState);
      return;
    }
    if (activeSlideIndex === 6 && appState.performanceBudget && appState.performanceBudget.currentStep > 0) {
      const nextPerfBudget = {
        ...appState.performanceBudget,
        currentStep: appState.performanceBudget.currentStep - 1
      };
      const newState = { ...appState, performanceBudget: nextPerfBudget };
      updateAndBroadcast(newState);
      return;
    }

    if (activeSlideIndex > 0) {
      const prevIdx = activeSlideIndex - 1;
      let newState = { ...appState };
      if (prevIdx === 3 && newState.dashboard) {
        newState.dashboard = { ...newState.dashboard, currentStep: 4 };
      }
      if (prevIdx === 6 && newState.performanceBudget) {
        newState.performanceBudget = { ...newState.performanceBudget, currentStep: 4 };
      }
      updateAndBroadcast(newState);
      goToSlide(prevIdx);
    }
  };

  const handleNext = () => {
    if (activeSlideIndex === 3 && appState.dashboard && appState.dashboard.currentStep < 4) {
      const nextDashboard = {
        ...appState.dashboard,
        currentStep: appState.dashboard.currentStep + 1
      };
      const newState = { ...appState, dashboard: nextDashboard };
      updateAndBroadcast(newState);
      return;
    }
    if (activeSlideIndex === 6 && appState.performanceBudget && appState.performanceBudget.currentStep < 4) {
      const nextPerfBudget = {
        ...appState.performanceBudget,
        currentStep: appState.performanceBudget.currentStep + 1
      };
      const newState = { ...appState, performanceBudget: nextPerfBudget };
      updateAndBroadcast(newState);
      return;
    }

    if (activeSlideIndex < slides.length - 1) {
      const nextIdx = activeSlideIndex + 1;
      let newState = { ...appState };
      if (nextIdx === 3 && newState.dashboard) {
        newState.dashboard = { ...newState.dashboard, currentStep: 0 };
      }
      if (nextIdx === 6 && newState.performanceBudget) {
        newState.performanceBudget = { ...newState.performanceBudget, currentStep: 0 };
      }
      updateAndBroadcast(newState);
      goToSlide(nextIdx);
    }
  };

  const adjustFontSize = (delta: number) => {
    setFontSize(prev => Math.max(14, Math.min(64, prev + delta)));
  };

  const activeSlide = slides[activeSlideIndex];
  const noteKey = getNotesKey(activeSlideIndex, appState);
  const activeNotesText = appState.notes?.[noteKey] ?? activeSlide?.speakerNotes ?? '';

  // Calculate slide title + step indicator
  let slideTitle = activeSlide?.label || `Slide ${activeSlideIndex + 1}`;
  let stepTitle = '';
  
  if (activeSlideIndex === 3 && appState.dashboard) {
    const stepIdx = appState.dashboard.currentStep ?? 0;
    const stepLabel = appState.dashboard.steps?.[stepIdx]?.title || '';
    stepTitle = `(${stepLabel})`;
  } else if (activeSlideIndex === 6 && appState.performanceBudget) {
    const stepIdx = appState.performanceBudget.currentStep ?? 0;
    const stepLabel = appState.performanceBudget.steps?.[stepIdx]?.title || '';
    stepTitle = `(${stepLabel})`;
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: '#090d16',
      color: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '16px',
      boxSizing: 'border-box'
    }}>
      {/* Header Panel */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #1e293b',
        paddingBottom: '12px',
        marginBottom: '16px',
        flexShrink: 0
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              fontWeight: 800,
              color: '#f97316'
            }}>
              Prompter Window
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: syncStatus === 'connected' ? '#10b981' : syncStatus === 'syncing' ? '#f59e0b' : '#ef4444',
                boxShadow: syncStatus === 'connected' ? '0 0 8px #10b981' : 'none',
                display: 'inline-block'
              }} />
              <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'capitalize' }}>{syncStatus}</span>
            </div>
          </div>
          <h1 style={{ margin: '4px 0 0 0', fontSize: '18px', fontWeight: 700, color: '#f1f5f9' }}>
            {slideTitle} <span style={{ color: '#94a3b8', fontWeight: 500 }}>{stepTitle}</span>
          </h1>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Font Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#1e293b', padding: '4px', borderRadius: '6px' }}>
            <button
              onClick={() => adjustFontSize(-2)}
              title="Decrease Font Size"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#cbd5e1',
                padding: '4px 8px',
                fontSize: '13px',
                fontWeight: 'bold',
                cursor: 'pointer',
                borderRadius: '4px'
              }}
            >
              A-
            </button>
            <span style={{ fontSize: '12px', color: '#94a3b8', padding: '0 4px', minWidth: '32px', textAlign: 'center' }}>
              {fontSize}px
            </span>
            <button
              onClick={() => adjustFontSize(2)}
              title="Increase Font Size"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#cbd5e1',
                padding: '4px 8px',
                fontSize: '13px',
                fontWeight: 'bold',
                cursor: 'pointer',
                borderRadius: '4px'
              }}
            >
              A+
            </button>
          </div>

          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
            Slide {activeSlideIndex + 1} of {slides.length}
          </div>
        </div>
      </header>

      {/* Prompter Content / Prompter Scroll Area */}
      <main style={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        marginBottom: '16px',
        position: 'relative'
      }}>
        <textarea
          ref={textareaRef}
          value={activeNotesText}
          onChange={handleNotesChange}
          placeholder="No speaker notes for this slide/step. Type here to add notes."
          style={{
            flex: 1,
            width: '100%',
            height: '100%',
            background: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: '8px',
            color: '#e2e8f0',
            fontSize: `${fontSize}px`,
            lineHeight: '1.6',
            padding: '24px',
            boxSizing: 'border-box',
            resize: 'none',
            outline: 'none',
            fontFamily: 'inherit',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
          }}
        />
      </main>

      {/* Footer / Control Bar */}
      <footer style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        paddingTop: '8px'
      }}>
        <div style={{ fontSize: '12px', color: '#475569' }}>
          Keyboard: <kbd style={{ background: '#1e293b', padding: '2px 6px', borderRadius: '4px', border: '1px solid #334155' }}>Space</kbd> / <kbd style={{ background: '#1e293b', padding: '2px 6px', borderRadius: '4px', border: '1px solid #334155' }}>➡</kbd> for Next, <kbd style={{ background: '#1e293b', padding: '2px 6px', borderRadius: '4px', border: '1px solid #334155' }}>⬅</kbd> for Prev.
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handlePrev}
            disabled={activeSlideIndex === 0 && (!appState.dashboard || appState.dashboard.currentStep === 0)}
            style={{
              background: '#1e293b',
              color: '#f8fafc',
              border: '1px solid #334155',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px',
              opacity: (activeSlideIndex === 0 && (!appState.dashboard || appState.dashboard.currentStep === 0)) ? 0.4 : 1
            }}
          >
            ◀ Previous Step
          </button>
          <button
            onClick={handleNext}
            disabled={activeSlideIndex === slides.length - 1 && (!appState.dashboard || activeSlideIndex !== 3 || appState.dashboard.currentStep === 4) && (!appState.performanceBudget || activeSlideIndex !== 6 || appState.performanceBudget.currentStep === 4)}
            style={{
              background: '#f97316',
              color: '#ffffff',
              border: 'none',
              padding: '8px 20px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px',
              boxShadow: '0 4px 12px rgba(249, 115, 22, 0.25)',
              opacity: (activeSlideIndex === slides.length - 1 && (!appState.dashboard || activeSlideIndex !== 3 || appState.dashboard.currentStep === 4) && (!appState.performanceBudget || activeSlideIndex !== 6 || appState.performanceBudget.currentStep === 4)) ? 0.4 : 1
            }}
          >
            Next Step ▶
          </button>
        </div>
      </footer>
    </div>
  );
}
