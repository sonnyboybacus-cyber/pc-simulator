import React, { useState, useEffect } from "react";

export const CharacterizationCarousel = ({
    stepData,
    currentStep,
    activeDomainIdx,
    mode,
    onStepChange,
    onActiveDomainChange,
    onDataChange
}: {
    stepData: any[];
    currentStep: number;
    activeDomainIdx?: number;
    mode: string;
    onStepChange: (idx: number) => void;
    onActiveDomainChange?: (idx: number) => void;
    onDataChange: (stepIdx: number, domIdx: number, field: string, val: any) => void;
}) => {
    const safeStepData = stepData || [];
    const safeCurrentStep = currentStep ?? 0;
    const step = safeStepData[safeCurrentStep] || { domains: [] };
    const [hoveredDomainIdx, setHoveredDomainIdx] = useState<number | null>(null);

    const [localActiveIdx, setLocalActiveIdx] = useState(0);
    const activeIdx = activeDomainIdx !== undefined ? activeDomainIdx : localActiveIdx;
    const setActiveIdx = (idx: number) => {
        if (onActiveDomainChange) {
            onActiveDomainChange(idx);
        } else {
            setLocalActiveIdx(idx);
        }
    };

    // Ensure activeIdx is in bounds if step domains change
    useEffect(() => {
        if (step.domains && step.domains.length > 0 && activeIdx >= step.domains.length) {
            setActiveIdx(0);
        }
    }, [safeCurrentStep, step.domains?.length]);

    const handleBlurBullet = (domIdx: number, bulletIdx: number, e: React.FocusEvent<any>) => {
        const nextBullets = [...step.domains[domIdx].bullets];
        nextBullets[bulletIdx] = e.target.textContent || '';
        onDataChange(safeCurrentStep, domIdx, 'bullets', nextBullets);
    };

    const handleBlurStatus = (domIdx: number, e: React.FocusEvent<any>) => {
        onDataChange(safeCurrentStep, domIdx, 'status', e.target.textContent || '');
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '20px 40px', boxSizing: 'border-box', width: '100%', fontFamily: 'inherit' }}>
            {/* Stepper Wizard Header */}
            <div id="dashboard-stepper" style={{ marginBottom: '24px' }}>
                {safeStepData.map((s: any, idx: number) => (
                    <button
                        key={idx}
                        type="button"
                        className={`dashboard-stepper-btn ${idx === safeCurrentStep ? 'active' : ''}`}
                        onClick={() => onStepChange(idx)}
                        style={{ padding: '12px 24px' }}
                    >
                        <span className="dashboard-stepper-num" style={{ fontSize: '18px' }}>{String(idx + 1).padStart(2, '0')}</span>
                        <span className="dashboard-stepper-label" style={{ fontSize: '22px', fontWeight: 'bold' }}>{s.title}</span>
                    </button>
                ))}
            </div>

            <div style={{ flex: 1, display: 'flex', gap: '40px', minHeight: 0 }}>
                {/* Left Area: Infographic circular dials */}
                <div className="dashboard-card-glass" style={{ flex: 1.25, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '32px', position: 'relative' }}>
                    <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                        <h3 style={{ fontSize: '30px', fontWeight: 800, color: '#0a2f52', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Maturity Metrics</h3>
                        <span style={{ fontSize: '18px', color: '#5b6b7d', fontWeight: 600 }}>Curriculum Support System Assessment</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', width: '100%', gap: '20px' }}>
                        {step.domains.map((dom: any, domIdx: number) => {
                            const r = 45;
                            const circ = 2 * Math.PI * r; // ~282
                            const pct = (dom.maturity / 4) * circ;

                            // Colors based on maturity
                            let strokeColor = "var(--vibe-accent)";
                            if (dom.maturity === 4) strokeColor = "#10b981"; // Emerald
                            else if (dom.maturity === 3) strokeColor = "#f5a623"; // DepEd Gold
                            else if (dom.maturity === 2) strokeColor = "#f97316"; // Orange

                            const isSelected = activeIdx === domIdx;
                            const isHovered = hoveredDomainIdx === domIdx;
                            const isEditor = mode === 'editor';

                            return (
                                <div
                                    key={dom.name}
                                    onMouseEnter={() => setHoveredDomainIdx(domIdx)}
                                    onMouseLeave={() => setHoveredDomainIdx(null)}
                                    onClick={() => {
                                        setActiveIdx(domIdx);
                                        if (isEditor) {
                                            const nextMaturity = (dom.maturity % 4) + 1;
                                            onDataChange(safeCurrentStep, domIdx, 'maturity', nextMaturity);
                                        }
                                    }}
                                    title={isEditor ? "Click to change maturity level" : undefined}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '16px',
                                        width: '30%',
                                        cursor: 'pointer',
                                        transform: isSelected ? 'scale(1.12)' : isHovered ? 'scale(1.06)' : 'scale(1)',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                    }}
                                >
                                    <svg width="165" height="165" viewBox="0 0 120 120" style={{ maxWidth: '100%', maxHeight: '100%', overflow: 'visible' }}>
                                        <circle cx="60" cy="60" r={r} fill="none" stroke="#f1f5f9" strokeWidth="9" />
                                        <circle
                                            cx="60"
                                            cy="60"
                                            r={r}
                                            fill="none"
                                            stroke={strokeColor}
                                            strokeWidth="9"
                                            strokeDasharray={circ}
                                            strokeDashoffset={circ - pct}
                                            strokeLinecap="round"
                                            transform="rotate(-90 60 60)"
                                            style={{
                                                transition: 'stroke-dashoffset 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
                                                filter: isSelected ? `drop-shadow(0 0 12px ${strokeColor}ee)` : isHovered ? `drop-shadow(0 0 8px ${strokeColor}99)` : 'drop-shadow(0 2px 5px rgba(0,0,0,0.06))'
                                            }}
                                        />
                                        <text
                                            x="60"
                                            y="70"
                                            textAnchor="middle"
                                            fontSize="44"
                                            fontWeight="900"
                                            fill="#0a2f52"
                                            style={{
                                                transform: isSelected ? 'scale(1.15)' : isHovered ? 'scale(1.08)' : 'scale(1)',
                                                transformOrigin: '60px 60px',
                                                transition: 'transform 0.3s ease'
                                            }}
                                        >
                                            {dom.letter}
                                        </text>
                                    </svg>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{
                                            fontSize: isSelected ? '26px' : '22px',
                                            fontWeight: isSelected ? 900 : 800,
                                            color: isSelected ? 'var(--vibe-accent)' : '#0a2f52',
                                            wordWrap: 'break-word',
                                            maxWidth: '220px',
                                            transition: 'all 0.3s ease',
                                            lineHeight: '1.2'
                                        }}>{dom.name}</div>
                                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: strokeColor, marginTop: '6px' }}>Level {dom.maturity} / 4</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right Area: Clean Accordion Cards */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', minWidth: 0 }}>
                    {step.domains.map((dom: any, domIdx: number) => {
                        const isHovered = hoveredDomainIdx === domIdx;
                        const isSelected = activeIdx === domIdx;
                        const isAnyHovered = hoveredDomainIdx !== null;

                        return (
                            <div
                                key={dom.name}
                                className="dashboard-card-glass"
                                onMouseEnter={() => setHoveredDomainIdx(domIdx)}
                                onMouseLeave={() => setHoveredDomainIdx(null)}
                                onClick={() => {
                                    setActiveIdx(domIdx);
                                }}
                                style={{
                                    padding: isSelected ? '32px 40px' : '20px 28px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: isSelected ? '22px' : '0px',
                                    cursor: 'pointer',
                                    transition: 'all 0.4s cubic-bezier(0.25, 1, 0.5, 1)',
                                    borderColor: isSelected ? 'var(--vibe-accent)' : isHovered ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.25)',
                                    boxShadow: isSelected
                                        ? '0 24px 56px var(--vibe-accent-glow), inset 0 0 0 1px rgba(255, 255, 255, 0.3)'
                                        : isHovered
                                            ? '0 8px 24px rgba(10, 47, 82, 0.05)'
                                            : 'none',
                                    transform: isSelected ? 'translateY(-2px)' : 'none',
                                    opacity: isAnyHovered && !isHovered && !isSelected ? 0.6 : 1,
                                    overflow: 'hidden',
                                    maxHeight: isSelected ? '600px' : '96px',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', width: '100%' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{
                                            width: '42px',
                                            height: '42px',
                                            borderRadius: '50%',
                                            background: isSelected ? 'var(--vibe-accent)' : 'rgba(10, 47, 82, 0.05)',
                                            color: isSelected ? '#fff' : '#0a2f52',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 800,
                                            fontSize: '20px',
                                            transition: 'all 0.3s ease'
                                        }}>
                                            {dom.letter}
                                        </div>
                                        <h4 style={{
                                            fontSize: isSelected ? '34px' : '24px',
                                            fontWeight: 850,
                                            color: '#0a2f52',
                                            margin: 0,
                                            letterSpacing: '-0.5px',
                                            transition: 'font-size 0.3s ease'
                                        }}>
                                            {dom.name}
                                        </h4>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span
                                            contentEditable={mode === 'editor'}
                                            suppressContentEditableWarning
                                            onBlur={(e) => handleBlurStatus(domIdx, e)}
                                            onClick={(e) => {
                                                if (mode === 'editor') e.stopPropagation();
                                            }}
                                            style={{
                                                fontSize: isSelected ? '18px' : '16px',
                                                fontWeight: 800,
                                                color: dom.maturity >= 3 ? '#10b981' : '#b9791a',
                                                background: dom.maturity >= 3 ? '#e3f7ef' : '#fdf4e3',
                                                padding: '8px 18px',
                                                borderRadius: '999px',
                                                whiteSpace: 'nowrap',
                                                outline: 'none',
                                                border: mode === 'editor' ? '1px dashed var(--vibe-accent)' : 'none',
                                                transition: 'all 0.3s ease'
                                            }}
                                        >
                                            {dom.status}
                                        </span>

                                        <svg
                                            width="26"
                                            height="26"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="#0a2f52"
                                            strokeWidth="2.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            style={{
                                                transform: isSelected ? 'rotate(180deg)' : 'rotate(0deg)',
                                                transition: 'transform 0.3s ease',
                                                opacity: 0.7
                                            }}
                                        >
                                            <polyline points="6 9 12 15 18 9" />
                                        </svg>
                                    </div>
                                </div>

                                <div style={{
                                    opacity: isSelected ? 1 : 0,
                                    transition: 'opacity 0.3s ease, max-height 0.3s ease',
                                    visibility: isSelected ? 'visible' : 'hidden',
                                    height: isSelected ? 'auto' : 0,
                                    maxHeight: isSelected ? '450px' : 0,
                                    overflowY: isSelected ? 'auto' : 'hidden',
                                    paddingRight: '6px'
                                }}>
                                    <ul style={{ margin: 0, paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {dom.bullets.map((bullet: string, bIdx: number) => (
                                            <li key={bIdx} style={{ fontSize: '28px', color: '#2c3e50', lineHeight: '1.6', fontWeight: 600 }}>
                                                <span
                                                    contentEditable={mode === 'editor'}
                                                    suppressContentEditableWarning
                                                    onBlur={(e) => handleBlurBullet(domIdx, bIdx, e)}
                                                    onClick={(e) => {
                                                        if (mode === 'editor') e.stopPropagation();
                                                    }}
                                                    style={{ outline: 'none', border: mode === 'editor' ? '1px dashed var(--vibe-accent)' : 'none', borderRadius: '4px', padding: '1px 3px' }}
                                                >
                                                    {bullet}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                    {(dom.driver || dom.bottleneck) && (
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginTop: '22px' }}>
                                            {dom.driver && (
                                                <div style={{ borderLeft: '4px solid #10b981', paddingLeft: '14px' }}>
                                                    <div style={{ fontSize: '17px', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>▲ Driver</div>
                                                    <div style={{ fontSize: '20px', color: '#2c3e50', lineHeight: 1.45, fontWeight: 600 }}>{dom.driver}</div>
                                                </div>
                                            )}
                                            {dom.bottleneck && (
                                                <div style={{ borderLeft: '4px solid #ef4444', paddingLeft: '14px' }}>
                                                    <div style={{ fontSize: '17px', fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>▼ Bottleneck</div>
                                                    <div style={{ fontSize: '20px', color: '#2c3e50', lineHeight: 1.45, fontWeight: 600 }}>{dom.bottleneck}</div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};