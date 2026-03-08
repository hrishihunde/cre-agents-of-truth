import React from 'react';

interface SidebarProps {
    curStep: number;
    setCurStep: (step: number) => void;
    openReadme: () => void;
}

export const Sidebar = ({ curStep, setCurStep, openReadme }: SidebarProps) => {
    return (
        <div id="sb" className="bg-[var(--bg1)] border-r border-[var(--b0)] overflow-y-auto overflow-x-hidden">
            <div className="pt-[9px] pb-[2px]">
                <div className="px-[12px] py-[3px] text-[9px] font-semibold tracking-[0.9px] uppercase text-[var(--t3)]">x402 Gateway</div>
                <div className={`sbi i1 ${curStep === 1 ? 'active' : ''}`} onClick={() => setCurStep(1)}>
                    <div className={`sc ${curStep === 1 ? 'cur' : curStep > 1 ? 'done' : ''}`}>{curStep > 1 ? '✓' : ''}</div>
                    <span className="slbl">x402-gateway.ts</span><span className="sbadge">S1</span>
                </div>
                <div className={`sbi i1 ${curStep === 2 ? 'active' : ''}`} onClick={() => setCurStep(2)}>
                    <div className={`sc ${curStep === 2 ? 'cur' : curStep > 2 ? 'done' : ''}`}>{curStep > 2 ? '✓' : ''}</div>
                    <span className="slbl">jwt-trigger.ts</span><span className="sbadge">S2</span>
                </div>
                <div className="sbi i2"><div className="sb-icon">📄</div><span className="slbl">payment.config.ts</span></div>
            </div><div className="sdiv"></div>
            
            <div className="pt-[9px] pb-[2px]">
                <div className="px-[12px] py-[3px] text-[9px] font-semibold tracking-[0.9px] uppercase text-[var(--t3)]">CRE Runtime</div>
                <div className={`sbi i1 ${curStep === 3 ? 'active' : ''}`} onClick={() => setCurStep(3)}>
                    <div className={`sc ${curStep === 3 ? 'cur' : curStep > 3 ? 'done' : ''}`}>{curStep > 3 ? '✓' : ''}</div>
                    <span className="slbl">handler.go</span><span className="sbadge">S3</span>
                </div>
                <div className={`sbi i1 ${curStep === 4 ? 'active' : ''}`} onClick={() => setCurStep(4)}>
                    <div className={`sc ${curStep === 4 ? 'cur' : curStep > 4 ? 'done' : ''}`}>{curStep > 4 ? '✓' : ''}</div>
                    <span className="slbl">vault-don.sol</span><span className="sbadge">S4</span>
                </div>
                <div className="sbi i2"><div className="sb-icon">📄</div><span className="slbl">capabilities.yaml</span></div>
            </div><div className="sdiv"></div>
            
            <div className="pt-[9px] pb-[2px]">
                <div className="px-[12px] py-[3px] text-[9px] font-semibold tracking-[0.9px] uppercase text-[var(--t3)]">Confidential HTTP</div>
                <div className={`sbi i1 ${curStep === 5 ? 'active' : ''}`} onClick={() => setCurStep(5)}>
                    <div className={`sc ${curStep === 5 ? 'cur' : curStep > 5 ? 'done' : ''}`}>{curStep > 5 ? '✓' : ''}</div>
                    <span className="slbl">conf-http.go</span><span className="sbadge">S5</span>
                </div>
                <div className={`sbi i1 ${curStep === 6 ? 'active' : ''}`} onClick={() => setCurStep(6)}>
                    <div className={`sc ${curStep === 6 ? 'cur' : curStep > 6 ? 'done' : ''}`}>{curStep > 6 ? '✓' : ''}</div>
                    <span className="slbl">response.go</span><span className="sbadge">S6</span>
                </div>
                <div className={`sbi i1 ${curStep === 7 ? 'active' : ''}`} onClick={() => setCurStep(7)}>
                    <div className={`sc ${curStep === 7 ? 'cur' : curStep > 7 ? 'done' : ''}`}>{curStep > 7 ? '✓' : ''}</div>
                    <span className="slbl">settle.ts</span><span className="sbadge">S7</span>
                </div>
            </div><div className="sdiv"></div>
            
            <div className="pt-[9px] pb-[2px]">
                <div className="px-[12px] py-[3px] text-[9px] font-semibold tracking-[0.9px] uppercase text-[var(--t3)]">Project</div>
                <div className="sbi i1 cursor-pointer" onClick={openReadme}>
                    <div className="sb-icon">📖</div><span className="slbl">README.md</span>
                </div>
                <div className="sbi i2"><div className="sb-icon">⚙️</div><span className="slbl">.env.example</span></div>
                <div className="sbi i2"><div className="sb-icon">📦</div><span className="slbl">package.json</span></div>
            </div>
        </div>
    );
};
