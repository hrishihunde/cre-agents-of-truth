export interface ArrowData {
    f: string;
    t: string;
    lbl: string;
    type: 'req' | 'res' | 'dim';
    side: string;
    arc: number;
}

export interface StepData {
    file: string;
    lang: string;
    sub: string[];
    cur: string[];
    arrows: ArrowData[];
    code: string;
}

export interface ModalData {
    title: string;
    body: React.ReactNode;
}
