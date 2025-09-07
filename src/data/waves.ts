// src/data/waves.ts (예시)
import type { WaveDef } from '../core/types';

export const Waves: WaveDef[] = [
    // 웨이브 1: 기본(간격 자동), 지터 약간
    { durationSeconds: 3, topCount: 0, bottomCount: 1, hpScale: 1.00, speed: 80,  spawnJitter: 0.15 },

    // 웨이브 2: 하단 간격을 2.0초로 고정(오버라이드)
    { durationSeconds: 3, topCount: 0, bottomCount: 1, hpScale: 1.15, speed: 85,  spawnIntervalBottom: 2.0 },

    // 웨이브 3: 진행될수록 빨라지는 easeIn, 배치 2마리
    { durationSeconds: 3, topCount: 0, bottomCount: 1, hpScale: 1.30, speed: 90,  pacingCurve: 'easeIn', batchSize: 2, spawnJitter: 0.1 },

    // 웨이브 4: 진행될수록 느려지는 easeOut
    { durationSeconds: 3, topCount: 0, bottomCount: 1, hpScale: 1.50, speed: 95,  pacingCurve: 'easeOut' },

    // 웨이브 5: 고정 1.2초 간격 + 지터
    { durationSeconds: 3, topCount: 0, bottomCount: 1, hpScale: 1.75, speed: 100, spawnIntervalBottom: 1.2, spawnJitter: 0.1 },
];