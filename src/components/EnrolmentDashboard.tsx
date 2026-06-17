import React from "react";

export const getStepIcon = (idx: number) => {
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

export const EnrolmentDashboard = ({
    stepData,
    currentStep,
    mode,
    onStepChange,
    onDataChange
}: {
    stepData: any[];
    currentStep: number;
    mode: string;
    onStepChange: (idx: number) => void;
    onDataChange: (idx: number, field: string, val: any) => void;
}) => {
    const step = stepData[currentStep];

    const handleSliderChange = (valIdx: number, isTarget: boolean, val: number) => {
        if (currentStep === 3) {
            const newVals = [...step.values];
            newVals[valIdx] = val;
            onDataChange(currentStep, 'values', newVals);
        } else if (currentStep === 0 || currentStep === 1 || currentStep === 2) {
            if (isTarget) {
                const newTargets = [...step.targets];
                newTargets[valIdx] = val;
                onDataChange(currentStep, 'targets', newTargets);
            } else {
                const newActuals = [...step.actuals];
                newActuals[valIdx] = val;
                onDataChange(currentStep, 'actuals', newActuals);
            }
        } else if (currentStep === 4) {
            const newFlows = [...step.flows];
            newFlows[valIdx] = val;
            onDataChange(currentStep, 'flows', newFlows);
        }
    };

    const handleBlurText = (field: 'finding' | 'action', e: React.FocusEvent<HTMLDivElement>) => {
        onDataChange(currentStep, field, e.target.textContent || '');
    };

    return (
        <div id="enrolment-dashboard-container" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '20px 40px', boxSizing: 'border-box', width: '100%' }}>
            {/* Stepper Wizard Header */}
            <div id="dashboard-stepper">
                {stepData.map((s, idx) => (
                    <button
                        key={idx}
                        type="button"
                        className={`dashboard-stepper-btn ${idx === currentStep ? 'active' : ''}`}
                        onClick={() => onStepChange(idx)}
                    >
                        <span className="dashboard-stepper-num">{String(idx + 1).padStart(2, '0')}</span>
                        {getStepIcon(idx)}
                        <span className="dashboard-stepper-label">{s.title}</span>
                    </button>
                ))}
            </div>

            {/* Main Split Layout */}
            <div style={{ flex: 1, display: 'flex', gap: '40px', minHeight: 0 }}>
                {/* Left Area (Chart Viewport) */}
                <div id="dashboard-chart-viewport" className="dashboard-card-glass" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '24px', position: 'relative', overflow: 'hidden' }}>
                    {currentStep === 0 && <GroupedColumns data={step} />}
                    {currentStep === 1 && <AreaChart data={step} />}
                    {currentStep === 2 && <GroupedColumns data={step} />}
                    {currentStep === 3 && <DonutChart data={step} />}
                    {currentStep === 4 && <CohortFlow data={step} />}
                </div>

                {/* Right Area (Controls & Findings) */}
                <div style={{ width: '38%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Sliders Control Card */}
                    <div id="dashboard-controls-card" className="dashboard-card-glass" style={{ padding: '24px' }}>
                        <div id="dashboard-controls-title" style={{ fontSize: '18px', fontWeight: 700, color: '#0a2f52', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Adjust Metrics</div>
                        <div id="dashboard-sliders-list" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            {(currentStep === 0 || currentStep === 1 || currentStep === 2) && step.years && (
                                <>
                                    <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
                                        {step.years.map((yr: string, yIdx: number) => (
                                            <React.Fragment key={yr}>
                                                <DashboardSlider label={`${yr} Target`} value={(step.targets || [])[yIdx]} min={currentStep === 0 ? 1 : 10} max={step.max} disabled={mode !== 'editor'} onChange={(val) => handleSliderChange(yIdx, true, val)} />
                                                <DashboardSlider label={`${yr} Actual`} value={(step.actuals || [])[yIdx]} min={currentStep === 0 ? 1 : 10} max={step.max} disabled={mode !== 'editor'} onChange={(val) => handleSliderChange(yIdx, false, val)} />
                                            </React.Fragment>
                                        ))}
                                    </div>
                                </>
                            )}
                            {currentStep === 3 && (
                                <>
                                    <DashboardSlider label="Grade 11 Enrolment" value={step.values[0]} min={1} max={step.max} disabled={mode !== 'editor'} onChange={(val) => handleSliderChange(0, false, val)} />
                                    <DashboardSlider label="Grade 12 Enrolment" value={step.values[1]} min={1} max={step.max} disabled={mode !== 'editor'} onChange={(val) => handleSliderChange(1, false, val)} />
                                </>
                            )}
                            {currentStep === 4 && step.cohorts && (
                                <>
                                    <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
                                        {step.cohorts.map((cName: string, cIdx: number) => (
                                            <DashboardSlider key={cName} label={`${cName} flow shift`} value={(step.flows || [])[cIdx]} min={-15} max={15} disabled={mode !== 'editor'} onChange={(val) => handleSliderChange(cIdx, false, val)} />
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    {/* Findings & Action Card */}
                    <div id="dashboard-details-card" className="dashboard-card-glass" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', padding: '24px' }}>
                        <div>
                            <div style={{ fontSize: '14px', fontWeight: 800, color: '#9aa7b4', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Finding</div>
                            <div
                                className="no-edit"
                                contentEditable={mode === 'editor'}
                                suppressContentEditableWarning
                                onBlur={(e) => handleBlurText('finding', e)}
                                style={{ fontSize: '18px', lineHeight: '1.45', color: '#2c3e50', outline: 'none', border: mode === 'editor' ? '1px dashed var(--vibe-accent)' : 'none', borderRadius: '6px', padding: '6px', minHeight: '36px' }}
                            >
                                {step.finding}
                            </div>
                        </div>
                        <div style={{ borderLeft: '4px solid #f5a623', paddingLeft: '14px' }}>
                            <div style={{ fontSize: '14px', fontWeight: 800, color: '#b9791a', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Recommended Action</div>
                            <div
                                className="no-edit"
                                contentEditable={mode === 'editor'}
                                suppressContentEditableWarning
                                onBlur={(e) => handleBlurText('action', e)}
                                style={{ fontSize: '18px', lineHeight: '1.45', color: '#0a2f52', fontWeight: 600, outline: 'none', border: mode === 'editor' ? '1px dashed var(--vibe-accent)' : 'none', borderRadius: '6px', padding: '6px', minHeight: '36px' }}
                            >
                                {step.action}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const DashboardSlider = ({
    label,
    value,
    min,
    max,
    disabled,
    onChange
}: {
    label: string;
    value: number;
    min: number;
    max: number;
    disabled: boolean;
    onChange: (val: number) => void;
}) => {
    return (
        <div className="dashboard-slider-item">
            <div className="dashboard-slider-header">
                <span>{label}</span>
                <span className="dashboard-slider-val">{value}</span>
            </div>
            <input
                type="range"
                className="dashboard-range-input"
                min={min}
                max={max}
                value={value}
                disabled={disabled}
                onChange={(e) => onChange(parseInt(e.target.value, 10))}
            />
        </div>
    );
};

export const RadialGauges = ({ data }: { data: any }) => {
    const [target, actual] = data.values;
    const max = data.max || 20;
    const targetPct = Math.round((target / max) * 100);
    const actualPct = Math.round((actual / max) * 100);

    const cOuter = 2 * Math.PI * 100; // ~628
    const cInner = 2 * Math.PI * 70;  // ~440

    return (
        <svg width="100%" height="100%" viewBox="0 0 400 320" style={{ fontFamily: 'inherit', maxWidth: '100%', maxHeight: '100%' }}>
            <defs>
                <filter id="radial-shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#0a2f52" floodOpacity="0.08" />
                </filter>
                <linearGradient id="radial-actual-grad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="var(--vibe-accent)" />
                    <stop offset="100%" stopColor="var(--vibe-accent-hover)" />
                </linearGradient>
                <linearGradient id="radial-target-grad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#cbd5e1" />
                    <stop offset="100%" stopColor="#94a3b8" />
                </linearGradient>
            </defs>

            {/* Concentric backdrops */}
            <circle cx="200" cy="150" r="100" fill="none" stroke="#f1f5f9" strokeWidth="14" />
            <circle cx="200" cy="150" r="70" fill="none" stroke="#f1f5f9" strokeWidth="14" />

            {/* Target (Inner) */}
            <circle cx="200" cy="150" r="70" fill="none" stroke="url(#radial-target-grad)" strokeWidth="14"
                strokeDasharray={cInner} strokeDashoffset={cInner - (target / max) * cInner}
                strokeLinecap="round" transform="rotate(-90 200 150)" style={{ transition: 'stroke-dashoffset 0.45s ease' }} />
            {/* Actual (Outer) */}
            <circle cx="200" cy="150" r="100" fill="none" stroke="url(#radial-actual-grad)" strokeWidth="14"
                strokeDasharray={cOuter} strokeDashoffset={cOuter - (actual / max) * cOuter}
                strokeLinecap="round" transform="rotate(-90 200 150)" style={{ transition: 'stroke-dashoffset 0.45s ease' }} />

            {/* Central Card Backdrop */}
            <circle cx="200" cy="150" r="56" fill="#ffffff" filter="url(#radial-shadow)" />

            {/* Central Display Metric */}
            <text x="200" y="145" textAnchor="middle" fill="#0a2f52" fontSize="38" fontWeight="900" className="mono">{actual}</text>
            <text x="200" y="166" textAnchor="middle" fill="#64748b" fontSize="10" fontWeight="800" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>Actual vs {target}</text>

            <g transform="translate(65, 285)">
                <circle cx="10" cy="10" r="6" fill="var(--vibe-accent)" />
                <text x="22" y="14" fill="#475569" fontSize="12" fontWeight="700">Actual ({actualPct}%)</text>

                <circle cx="150" cy="10" r="6" fill="#94a3b8" />
                <text x="162" y="14" fill="#475569" fontSize="12" fontWeight="700">Target ({targetPct}%)</text>
            </g>
        </svg>
    );
};

export const AreaChart = ({ data }: { data: any }) => {
    const targets = data.targets || [96, 98, 91];
    const actuals = data.actuals || [98, 91, 90];
    const max = data.max || 120;

    const w = 520, h = 280;
    const xPadding = 60, yPadding = 45;
    const chartW = w - xPadding * 2;
    const chartH = h - yPadding * 2;

    const xCoords = [xPadding, xPadding + chartW / 2, xPadding + chartW];
    const getY = (val: number) => h - yPadding - (val / max) * chartH;

    const targetY = targets.map(getY);
    const actualY = actuals.map(getY);

    const dTarget = `M ${xCoords[0]} ${targetY[0]} Q ${xCoords[1]} ${targetY[1]} ${xCoords[2]} ${targetY[2]}`;
    const dActual = `M ${xCoords[0]} ${actualY[0]} Q ${xCoords[1]} ${actualY[1]} ${xCoords[2]} ${actualY[2]}`;

    return (
        <svg width="100%" height="100%" viewBox="0 0 520 280" style={{ fontFamily: 'inherit', maxWidth: '100%', maxHeight: '100%' }}>
            <defs>
                <filter id="area-shadow" x="-10%" y="-10%" width="120%" height="120%">
                    <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#0a2f52" floodOpacity="0.06" />
                </filter>
                <filter id="line-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="var(--vibe-accent)" floodOpacity="0.25" />
                </filter>
                <linearGradient id="grad-actual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--vibe-accent)" stopOpacity="0.26" />
                    <stop offset="100%" stopColor="var(--vibe-accent)" stopOpacity="0" />
                </linearGradient>
            </defs>

            {/* Horizontal grid lines */}
            <line x1={xPadding} y1={yPadding} x2={w - xPadding} y2={yPadding} stroke="#f1f5f9" strokeWidth="1" />
            <line x1={xPadding} y1={yPadding + chartH / 2} x2={w - xPadding} y2={yPadding + chartH / 2} stroke="#f1f5f9" strokeWidth="1" />
            <line x1={xPadding} y1={h - yPadding} x2={w - xPadding} y2={h - yPadding} stroke="#e2e8f0" strokeWidth="2" />

            {/* Fill Area under actuals */}
            <path d={`${dActual} L ${xCoords[2]} ${h - yPadding} L ${xCoords[0]} ${h - yPadding} Z`} fill="url(#grad-actual)" />

            {/* Plot lines */}
            <path d={dTarget} fill="none" stroke="#cbd5e1" strokeWidth="3" strokeDasharray="6" className="svg-animate-draw" />
            <path d={dActual} fill="none" stroke="var(--vibe-accent)" strokeWidth="4.5" className="svg-animate-draw" filter="url(#line-glow)" strokeLinecap="round" />

            {/* Value points & labels */}
            {xCoords.map((x, i) => (
                <g key={i}>
                    {/* Target Point */}
                    <circle cx={x} cy={targetY[i]} r="5" fill="#fff" stroke="#94a3b8" strokeWidth="2.5" />
                    <text x={x} y={targetY[i] - 14} textAnchor="middle" fill="#64748b" fontSize="11" fontWeight="700" className="mono">{targets[i]}</text>

                    {/* Actual Point */}
                    <circle cx={x} cy={actualY[i]} r="6" fill="#fff" stroke="var(--vibe-accent)" strokeWidth="3" filter="url(#area-shadow)" />
                    <circle cx={x} cy={actualY[i]} r="3" fill="var(--vibe-accent)" />
                    <text x={x} y={actualY[i] + 22} textAnchor="middle" fill="#0a2f52" fontSize="13" fontWeight="850" className="mono">{actuals[i]}</text>

                    {/* Year Labels */}
                    <text x={x} y={h - 14} textAnchor="middle" fill="#475569" fontSize="12" fontWeight="700">{(data.years || [])[i]}</text>
                </g>
            ))}
        </svg>
    );
};

export const GroupedColumns = ({ data }: { data: any }) => {
    const targets = data.targets || [48, 52, 56];
    const actuals = data.actuals || [52, 56, 59];
    const max = data.max || 80;

    const w = 520, h = 280;
    const xPadding = 60, yPadding = 45;
    const chartH = h - yPadding * 2;

    const xCenters = [120, 260, 400];
    const getY = (val: number) => h - yPadding - (val / max) * chartH;
    const getH = (val: number) => (val / max) * chartH;

    return (
        <svg width="100%" height="100%" viewBox="0 0 520 280" style={{ fontFamily: 'inherit', maxWidth: '100%', maxHeight: '100%' }}>
            <defs>
                <filter id="bar-shadow" x="-15%" y="-15%" width="130%" height="130%">
                    <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#0a2f52" floodOpacity="0.05" />
                </filter>
                <linearGradient id="col-target-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#e2e8f0" />
                    <stop offset="100%" stopColor="#cbd5e1" />
                </linearGradient>
                <linearGradient id="col-actual-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--vibe-accent)" />
                    <stop offset="100%" stopColor="var(--vibe-accent-hover)" />
                </linearGradient>
            </defs>
            <line x1={xPadding} y1={yPadding} x2={w - xPadding} y2={yPadding} stroke="#f1f5f9" strokeWidth="1" />
            <line x1={xPadding} y1={h - yPadding} x2={w - xPadding} y2={h - yPadding} stroke="#cbd5e1" strokeWidth="1.5" />

            {xCenters.map((cx, i) => {
                const tH = getH(targets[i]);
                const aH = getH(actuals[i]);
                const tY = getY(targets[i]);
                const aY = getY(actuals[i]);

                return (
                    <g key={i} filter="url(#bar-shadow)">
                        {/* Target Column */}
                        <rect x={cx - 36} y={tY} width="28" height={tH} fill="url(#col-target-grad)" rx="6" ry="6" className="svg-bar-rect" />
                        <text x={cx - 22} y={tY - 8} textAnchor="middle" fill="#718096" fontSize="11" fontWeight="700" className="mono">{targets[i]}</text>

                        {/* Actual Column */}
                        <rect x={cx + 6} y={aY} width="28" height={aH} fill="url(#col-actual-grad)" rx="6" ry="6" className="svg-bar-rect" />
                        <text x={cx + 20} y={aY - 8} textAnchor="middle" fill="var(--vibe-accent)" fontSize="13" fontWeight="850" className="mono">{actuals[i]}</text>

                        {/* Year Label */}
                        <text x={cx} y={h - 14} textAnchor="middle" fill="#475569" fontSize="12" fontWeight="700">{(data.years || [])[i]}</text>
                    </g>
                );
            })}
        </svg>
    );
};

export const DonutChart = ({ data }: { data: any }) => {
    const g11 = data.values[0];
    const g12 = data.values[1];
    const total = g11 + g12;

    const c = 2 * Math.PI * 90; // ~565
    const g11Len = total > 0 ? (g11 / total) * c : 0;
    const g12Len = total > 0 ? (g12 / total) * c : 0;

    return (
        <svg width="100%" height="100%" viewBox="0 0 400 320" style={{ fontFamily: 'inherit', maxWidth: '100%', maxHeight: '100%' }}>
            <defs>
                <filter id="donut-shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="5" stdDeviation="7" floodColor="#0a2f52" floodOpacity="0.08" />
                </filter>
                <linearGradient id="donut-g12-grad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="var(--vibe-accent)" />
                    <stop offset="100%" stopColor="var(--vibe-accent-hover)" />
                </linearGradient>
                <linearGradient id="donut-g11-grad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#94a3b8" />
                    <stop offset="100%" stopColor="#64748b" />
                </linearGradient>
            </defs>

            {/* Segmented slices with spacers */}
            {/* Grade 12 (Outer/Primary) */}
            <circle cx="200" cy="140" r="90" fill="none" stroke="url(#donut-g12-grad)" strokeWidth="22"
                strokeDasharray={`${g12Len - 3} ${c}`} strokeDashoffset="0"
                transform="rotate(-90 200 140)" className="svg-donut-slice" strokeLinecap="round" />
            {/* Grade 11 (Inner/Secondary) */}
            <circle cx="200" cy="140" r="90" fill="none" stroke="url(#donut-g11-grad)" strokeWidth="22"
                strokeDasharray={`${g11Len - 3} ${c}`} strokeDashoffset={`-${g12Len}`}
                transform="rotate(-90 200 140)" className="svg-donut-slice" strokeLinecap="round" />

            {/* Inner Central card backdrop */}
            <circle cx="200" cy="140" r="62" fill="#ffffff" filter="url(#donut-shadow)" />

            {/* Central total text */}
            <text x="200" y="136" textAnchor="middle" fill="#0a2f52" fontSize="38" fontWeight="900" className="mono">{total}</text>
            <text x="200" y="158" textAnchor="middle" fill="#64748b" fontSize="10" fontWeight="800" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total SHS Enrolment</text>

            {/* Legend labels */}
            <g transform="translate(60, 275)">
                <rect x="10" y="6" width="12" height="12" fill="#64748b" rx="3" />
                <text x="28" y="16" fill="#475569" fontSize="12" fontWeight="700">Grade 11 ({g11})</text>

                <rect x="160" y="6" width="12" height="12" fill="var(--vibe-accent)" rx="3" />
                <text x="178" y="16" fill="#475569" fontSize="12" fontWeight="700">Grade 12 ({g12})</text>
            </g>
        </svg>
    );
};

export const CohortFlow = ({ data }: { data: any }) => {
    const cohorts = data.cohorts || [];
    const flows = data.flows || [];

    return (
        <svg width="100%" height="100%" viewBox="0 0 600 300" style={{ fontFamily: 'inherit', maxWidth: '100%', maxHeight: '100%' }}>
            <defs>
                <filter id="flow-glow" x="-10%" y="-10%" width="120%" height="120%">
                    <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#0a2f52" floodOpacity="0.08" />
                </filter>
                <linearGradient id="f-up" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.75" />
                    <stop offset="100%" stopColor="#34d399" stopOpacity="0.2" />
                </linearGradient>
                <linearGradient id="f-down" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.75" />
                    <stop offset="100%" stopColor="#f87171" stopOpacity="0.2" />
                </linearGradient>
                <linearGradient id="f-flat" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0.2" />
                </linearGradient>
            </defs>

            {cohorts.map((cName: string, idx: number) => {
                const x = 30 + idx * 60;
                const val = flows[idx] || 0;
                const isUp = val > 0;
                const isZero = val === 0;

                const y1 = 150;
                const y2 = isZero ? 150 : (isUp ? 80 : 220);

                const pathD = `M ${x} ${y1} C ${x + 25} ${y1}, ${x + 35} ${y2}, ${x + 50} ${y2}`;
                const color = isZero ? "url(#f-flat)" : (isUp ? "url(#f-up)" : "url(#f-down)");
                const textCol = isZero ? "#64748b" : (isUp ? "#10b981" : "#ef4444");
                const sign = isUp ? "+" : "";

                return (
                    <g key={idx} filter="url(#flow-glow)">
                        {/* Curved ribbon path */}
                        <path d={pathD} fill="none" stroke={color} strokeWidth={Math.max(6, Math.min(20, Math.abs(val) * 1.8))} className="svg-flow-path" strokeLinecap="round" />

                        {/* double rings for nodes */}
                        <circle cx={x} cy={y1} r="6" fill="#fff" stroke="#0a2f52" strokeWidth="2.5" />
                        <circle cx={x} cy={y1} r="3" fill="#0a2f52" />

                        <circle cx={x + 50} cy={y2} r="6" fill="#fff" stroke="var(--vibe-accent)" strokeWidth="2.5" />
                        <circle cx={x + 50} cy={y2} r="3" fill="var(--vibe-accent)" />

                        {/* Flow value tag */}
                        <g transform={`translate(${x + 25}, ${y2 - 12})`}>
                            <rect x="-16" y="-12" width="32" height="16" rx="4" fill="#fff" stroke={textCol} strokeWidth="1" opacity="0.9" />
                            <text textAnchor="middle" y="0" fill={textCol} fontSize="10" fontWeight="800" className="mono">{sign}{val}</text>
                        </g>

                        {/* Label below */}
                        <text x={x + 25} y="270" textAnchor="middle" fill="#475569" fontSize="9" fontWeight="700" transform={`rotate(-35 ${x + 25} 270)`}>{cName}</text>
                    </g>
                );
            })}
        </svg>
    );
};