import type { WaveDef } from '../core/types';

// 기본 제한 시간 상향(예: 50~70초 구간)
export const Waves: WaveDef[] = [
    { durationSeconds: 50, topCount: 10, bottomCount: 10, hpScale: 1.00, speed: 80  },
    { durationSeconds: 55, topCount: 12, bottomCount: 12, hpScale: 1.15, speed: 85  },
    { durationSeconds: 60, topCount: 14, bottomCount: 14, hpScale: 1.30, speed: 90  },
    { durationSeconds: 65, topCount: 16, bottomCount: 16, hpScale: 1.50, speed: 95  },
    { durationSeconds: 70, topCount: 18, bottomCount: 18, hpScale: 1.75, speed: 100 },
];