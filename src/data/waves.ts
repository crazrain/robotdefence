// 웨이브 데이터 예시
export type WaveDef = {
    durationSeconds: number; // 웨이브 제한 시간(초)
    topCount: number;        // 위쪽 자리(P2) 소환 수
    bottomCount: number;     // 아래쪽 자리(P1) 소환 수
    hpScale: number;
    speed: number;
};

export const Waves: WaveDef[] = [
    { durationSeconds: 20, topCount: 8,  bottomCount: 8,  hpScale: 1.00, speed: 80  },
    { durationSeconds: 22, topCount: 10, bottomCount: 10, hpScale: 1.12, speed: 85  },
    { durationSeconds: 24, topCount: 12, bottomCount: 12, hpScale: 1.25, speed: 90  },
    { durationSeconds: 26, topCount: 14, bottomCount: 14, hpScale: 1.40, speed: 95  },
    { durationSeconds: 28, topCount: 16, bottomCount: 16, hpScale: 1.60, speed: 100 },
];