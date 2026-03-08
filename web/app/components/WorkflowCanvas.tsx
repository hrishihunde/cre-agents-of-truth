/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps, @typescript-eslint/no-unused-vars */
import React, { useRef, useEffect, useState } from 'react';
import { ALL_NODES, STEPS } from '../data/constants';

interface WorkflowCanvasProps {
    curStep: number;
    openInfo: (id: string, e: React.MouseEvent) => void;
}

export const WorkflowCanvas = ({ curStep, openInfo }: WorkflowCanvasProps) => {
    const canvasRef = useRef<HTMLDivElement>(null);
    const nodesRef = useRef<Record<string, HTMLDivElement | null>>({});
    const [arrows, setArrows] = useState<any[]>([]);

    useEffect(() => {
        renderArrows(curStep);
        const handleResize = () => { if (curStep > 0) renderArrows(curStep); };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [curStep]);

    const getBox = (id: string) => {
        const el = nodesRef.current[id];
        const cv = canvasRef.current;
        if (!el || !cv) return null;
        const er = el.getBoundingClientRect();
        const cr = cv.getBoundingClientRect();
        const cx = er.left - cr.left + er.width / 2;
        const cy = er.top - cr.top + er.height / 2;
        return { cx, cy, l: cx - er.width / 2, r: cx + er.width / 2, t: cy - er.height / 2, b: cy + er.height / 2, w: er.width, h: er.height };
    };

    const computeArrow = (from: string, to: string, label: string | null, type: string, side: string, arcPx: number) => {
        const F = getBox(from);
        const T = getBox(to);
        if (!F || !T) return null;

        const arc = arcPx || 40;
        let x1, y1, x2, y2, cpx1, cpy1, cpx2, cpy2, lx, ly;

        if (side === 'top') {
            x1 = F.cx + F.w * 0.15; y1 = F.t;
            x2 = T.cx - T.w * 0.15; y2 = T.t;
            const midY = Math.min(y1, y2) - arc;
            cpx1 = x1; cpy1 = midY;
            cpx2 = x2; cpy2 = midY;
            lx = (x1 + x2) / 2; ly = midY - 4;
        } else if (side === 'bottom') {
            x1 = F.cx + F.w * 0.15; y1 = F.b;
            x2 = T.cx - T.w * 0.15; y2 = T.b;
            const midY = Math.max(y1, y2) + arc;
            cpx1 = x1; cpy1 = midY;
            cpx2 = x2; cpy2 = midY;
            lx = (x1 + x2) / 2; ly = midY + 4;
        } else if (side === 'right-left') {
            x1 = F.r + 2; y1 = F.cy;
            x2 = T.l - 2; y2 = T.cy;
            cpx1 = (x1 + x2) / 2; cpy1 = y1;
            cpx2 = (x1 + x2) / 2; cpy2 = y2;
            lx = (x1 + x2) / 2; ly = (y1 + y2) / 2 - 14;
        } else if (side === 'bottom-top') {
            x1 = F.cx; y1 = F.b + 2;
            x2 = T.cx; y2 = T.t - 2;
            const midX = (x1 + x2) / 2;
            cpx1 = midX; cpy1 = y1 + (y2 - y1) * 0.3;
            cpx2 = midX; cpy2 = y1 + (y2 - y1) * 0.7;
            lx = midX + 70; ly = (y1 + y2) / 2;
        } else if (side === 'top-bottom') {
            x1 = F.cx; y1 = F.t - 2;
            x2 = T.cx; y2 = T.b + 2;
            const midX = (x1 + x2) / 2;
            cpx1 = midX; cpy1 = y1 + (y2 - y1) * 0.3;
            cpx2 = midX; cpy2 = y1 + (y2 - y1) * 0.7;
            lx = midX - 70; ly = (y1 + y2) / 2;
        } else {
            x1 = F.r + 2; y1 = F.cy;
            x2 = T.l - 2; y2 = T.cy;
            cpx1 = (x1 * 2 + x2) / 3; cpy1 = y1;
            cpx2 = (x1 + x2 * 2) / 3; cpy2 = y2;
            lx = (x1 + x2) / 2; ly = Math.min(y1, y2) - 16;
        }

        const d = `M${x1},${y1} C${cpx1},${cpy1} ${cpx2},${cpy2} ${x2},${y2}`;
        return { d, type, label, lx, ly, isDashed: type === 'res' || type === 'dim' };
    };

    const renderArrows = (step: number) => {
        const s = STEPS[step];
        if (!s) return;
        const newArrows: any[] = [];
        let keyIdx = 0;
        
        for (let i = 1; i < step; i++) {
            if (STEPS[i]) {
                STEPS[i].arrows.forEach((a: any) => {
                    const arr = computeArrow(a.f, a.t, null, 'dim', a.side, a.arc);
                    if (arr) newArrows.push({ ...arr, key: keyIdx++ });
                });
            }
        }
        s.arrows.forEach((a: any) => {
            const arr = computeArrow(a.f, a.t, a.lbl, a.type, a.side, a.arc);
            if (arr) newArrows.push({ ...arr, key: keyIdx++ });
        });
        setArrows(newArrows);
    };

    const s = STEPS[curStep] || STEPS[1];
    const isCur = (id: string) => s.cur?.includes(id);
    const isDone = (id: string) => {
        if (isCur(id)) return false;
        for (let j = 1; j < curStep; j++) {
            if (STEPS[j] && STEPS[j].cur?.includes(id)) return true;
        }
        return false;
    };
    const isDim = (id: string) => !isCur(id) && !isDone(id);

    const NodePositions: Record<string, { left: string; top: string }> = {
        ag: { left: '10%', top: '30%' },
        sk: { left: '35%', top: '30%' },
        fa: { left: '62%', top: '30%' },
        bc: { left: '90%', top: '30%' },
        cr: { left: '15%', top: '68%' },
        vd: { left: '48%', top: '68%' },
        ea: { left: '82%', top: '68%' }
    };
    
    const NodeDetails: Record<string, { icon: string; title: string; sub: string; role: string }> = {
        ag: { icon: '🤖', title: 'Agent', sub: 'Claude AI caller', role: 'Initiator' },
        sk: { icon: '⚡', title: 'API Call', sub: 'x402-protected', role: 'Gateway' },
        fa: { icon: '🔗', title: 'Facilitator', sub: 'x402.org verifier', role: 'Verifier' },
        bc: { icon: '⛓️', title: 'Blockchain', sub: 'Base L2 · USDC', role: 'Settlement' },
        cr: { icon: '⚙️', title: 'CRE Runtime', sub: 'Chainlink workflow', role: 'Orchestrator' },
        vd: { icon: '🔒', title: 'Vault DON', sub: 'Threshold secrets', role: 'Key Custodian' },
        ea: { icon: '🌐', title: 'External API', sub: "Creator's service", role: 'Provider' }
    };

    return (
        <div className="flex-1 relative overflow-hidden bg-[var(--bg)]" ref={canvasRef}>
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-[5]" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <marker id="mReq" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><path d="M0,.5L7,3 0,5.5" fill="#E8713A"/></marker>
                    <marker id="mRes" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><path d="M0,.5L7,3 0,5.5" fill="#666"/></marker>
                    <marker id="mDim" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><path d="M0,.5L7,3 0,5.5" fill="#1a1a1a"/></marker>
                </defs>
                {arrows.map((a) => (
                    <path key={a.key} d={a.d} fill="none"
                        stroke={a.type === 'req' ? '#E8713A' : a.type === 'res' ? '#666' : '#1a1a1a'}
                        strokeWidth={a.type === 'dim' ? 1 : 1.5}
                        strokeDasharray={a.isDashed ? '6 4' : 'none'}
                        markerEnd={`url(#m${a.type.charAt(0).toUpperCase() + a.type.slice(1)})`}
                        style={a.type === 'req' ? { animation: 'dash 8s linear infinite' } : {}}
                    />
                ))}
            </svg>
            <div className="absolute inset-0 z-[15] pointer-events-none">
                {arrows.map(a => a.label && (
                    <div key={`lbl-${a.key}`} style={{ left: `${a.lx}px`, top: `${a.ly}px`, transform: 'translateX(-50%)' }} className={`absolute pointer-events-none font-mono text-[9px] leading-[1.2] px-[7px] py-[2px] rounded-[3px] whitespace-nowrap text-center ${a.type === 'req' ? 'text-[#E8713A] bg-[rgba(232,113,58,.08)] border border-[rgba(232,113,58,.25)]' : 'text-[#888] bg-[rgba(100,100,100,.08)] border border-[rgba(100,100,100,.2)]'}`}>
                        {a.label}
                    </div>
                ))}
            </div>

            {ALL_NODES.map((id) => {
                const n = NodeDetails[id];
                const cur = isCur(id);
                const done = isDone(id);
                const pos = NodePositions[id];

                return (
                    <div key={id} className="absolute z-10 transform -translate-x-1/2 -translate-y-1/2" style={{ left: pos.left, top: pos.top }} ref={el => { nodesRef.current[id] = el; }}>
                        <div className={`node-box ${cur ? 'cur' : done ? 'done' : 'dim'}`}>
                            <span className="text-[18px] mb-[4px] block leading-none">{n.icon}</span>
                            <div className="text-[11px] font-bold text-t0 mb-[1px] tracking-[0.2px]">{n.title}</div>
                            <div className="text-[8px] text-t3 leading-[1.3]">{n.sub}</div>
                            <div className="text-[7.5px] text-[#E8713A] font-bold tracking-[0.7px] uppercase mt-[5px]">{n.role}</div>
                            <div className={`mt-[3px] text-[8px] font-mono ${cur ? 'text-[#E8713A] font-semibold' : done ? 'text-[#888]' : 'text-[#555]'}`}>
                                {cur ? <><span className="w-[6px] h-[6px] rounded-full bg-[#E8713A] inline-block mr-[3px] align-middle animate-[pulseOrange_1.4s_infinite]"></span>running</> : done ? 'done' : '—'}
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    );
};
