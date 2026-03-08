import React from 'react';
import { MODALS } from '../data/constants';

interface ModalProps {
    activeModal: string;
    setModalOpen: (open: boolean) => void;
}

export const Modal = ({ activeModal, setModalOpen }: ModalProps) => {
    let title = "";
    let body = null;

    if (activeModal === 'readme') {
        title = "README.md";
        body = (
            <div dangerouslySetInnerHTML={{ __html: `
<h4>Agents-of-Truth</h4>
<p>Open per-call payments + private API keys for AI agents.</p>
<h4>x402 — Atomic Payments</h4>
<p>HTTP-native payment protocol. Any API can require payment via <code>402 Payment Required</code>. Agents pay per-call with USDC on Base L2.</p>
<p><span class="mtag">x402-express</span> <span class="mtag">EIP-3009</span> <span class="mtag">Base Sepolia</span></p>
<h4>CRE + Vault DON — Private Keys</h4>
<p>Chainlink Runtime Environment keeps creator API keys private. Vault DON uses threshold encryption. Confidential HTTP ensures keys never appear in logs, output, or on-chain.</p>
<p><span class="mtag">CRE</span> <span class="mtag">Vault DON</span> <span class="mtag">Confidential HTTP</span></p>
<h4>Architecture</h4>
<p><strong>Agent</strong> → API Call → <code>402</code> → signs → retries</p>
<p><strong>API Call</strong> → Facilitator → Blockchain → CRE trigger</p>
<p><strong>CRE</strong> → Vault DON → Confidential HTTP → External API</p>
<h4>Quick Start</h4>
<p><code>git clone github.com/smartcontractkit/cre_x402_smartcon_demo</code></p>
<p><span class="mtag">Privacy Track</span> <span class="mtag">CRE & AI</span> <span class="mtag">Chainlink Convergence 2026</span></p>
            `}} />
        );
    } else {
        const modalData = MODALS[activeModal];
        if (modalData) {
            title = modalData.title;
            body = modalData.body;
        }
    }

    return (
        <div
            className="fixed inset-0 bg-black/75 z-[300] flex items-center justify-center"
            onClick={() => setModalOpen(false)}
        >
            <div
                className="bg-bg2 border border-b1 rounded-[8px] w-[480px] max-w-[90vw] max-h-[76vh] flex flex-col overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-[12px_14px] border-b border-b0 flex items-center justify-between">
                    <span className="text-[12px] font-semibold text-t0">
                        {title}
                    </span>
                    <button
                        className="w-[20px] h-[20px] rounded-full border border-b1 bg-bg3 text-t2 cursor-pointer text-[11px] flex items-center justify-center transition-all duration-100 hover:border-t0 hover:text-t0"
                        onClick={() => setModalOpen(false)}
                    >
                        ✕
                    </button>
                </div>
                <div
                    className="mbody p-[14px] overflow-y-auto flex-1 text-[10.5px] text-t2 leading-[1.85] font-sans"
                >
                    {body}
                </div>
            </div>
        </div>
    );
};
