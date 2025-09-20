// src/data/waves.ts
import type { WaveDef } from '../core/types';

export const Waves: WaveDef[] = [
    // 1: 기본 웨이브
    { durationSeconds: 20, topCount: 0, bottomCount: 15, hpScale: 1.0, speed: 80, spawnJitter: 0.2 },
    // 2: 약간 더 많고 빨라진 웨이브
    { durationSeconds: 20, topCount: 0, bottomCount: 20, hpScale: 1.1, speed: 85, spawnJitter: 0.2 },
    // 3: 체력이 증가하고, 2마리씩 짝지어 등장
    { durationSeconds: 25, topCount: 0, bottomCount: 25, hpScale: 1.2, speed: 90, batchSize: 2, spawnJitter: 0.1 },
    // 4: 점점 빠르게 등장하는 웨이브
    { durationSeconds: 25, topCount: 0, bottomCount: 30, hpScale: 1.3, speed: 95, pacingCurve: 'easeIn' },
    // 5: 보스 등장 전, 짧고 굵은 웨이브
    { durationSeconds: 15, topCount: 0, bottomCount: 20, hpScale: 1.5, speed: 100, spawnIntervalBottom: 0.5, spawnJitter: 0.1 },

    // 6: 강한 적들이 꾸준히 등장
    { durationSeconds: 30, topCount: 0, bottomCount: 40, hpScale: 1.8, speed: 100, spawnIntervalBottom: 0.7 },
    // 7: 3마리씩 짝지어 등장하는 빠른 웨이브
    { durationSeconds: 30, topCount: 0, bottomCount: 45, hpScale: 2.0, speed: 110, batchSize: 3, spawnJitter: 0.1 },
    // 8: 엄청난 물량 공세
    { durationSeconds: 30, topCount: 0, bottomCount: 60, hpScale: 2.2, speed: 115, spawnIntervalBottom: 0.4, spawnJitter: 0.2 },
    // 9: 점점 느려지지만 매우 강한 적들
    { durationSeconds: 35, topCount: 0, bottomCount: 40, hpScale: 2.5, speed: 100, pacingCurve: 'easeOut' },
    // 10: 중간 보스 웨이브, 강력한 적 소수 정예
    { durationSeconds: 20, topCount: 0, bottomCount: 15, hpScale: 4.0, speed: 120, spawnIntervalBottom: 1.0 },

    // 11: 다시 시작되는 물량 공세, 하지만 더 강하게
    { durationSeconds: 35, topCount: 0, bottomCount: 70, hpScale: 3.0, speed: 120, spawnJitter: 0.2 },
    // 12: 2마리씩, 빠르고 강하게
    { durationSeconds: 35, topCount: 0, bottomCount: 60, hpScale: 3.2, speed: 130, batchSize: 2, spawnIntervalBottom: 0.5 },
    // 13: 예측하기 힘든 등장 간격
    { durationSeconds: 40, topCount: 0, bottomCount: 50, hpScale: 3.5, speed: 125, spawnJitter: 0.5 },
    // 14: 점점 빨라지는 강한 적들
    { durationSeconds: 40, topCount: 0, bottomCount: 55, hpScale: 3.8, speed: 135, pacingCurve: 'easeIn' },
    // 15: 강력한 보스 웨이브
    { durationSeconds: 25, topCount: 0, bottomCount: 20, hpScale: 6.0, speed: 140, spawnIntervalBottom: 1.2 },

    // 16: 최후의 물량 공세
    { durationSeconds: 45, topCount: 0, bottomCount: 100, hpScale: 4.5, speed: 140, spawnIntervalBottom: 0.3, spawnJitter: 0.2 },
    // 17: 4마리씩 등장하는 최강의 적들
    { durationSeconds: 45, topCount: 0, bottomCount: 60, hpScale: 5.0, speed: 150, batchSize: 4, spawnIntervalBottom: 0.7 },
    // 18: 빠르고, 강하고, 예측 불가능
    { durationSeconds: 50, topCount: 0, bottomCount: 70, hpScale: 5.5, speed: 160, spawnJitter: 0.4, pacingCurve: 'easeIn' },
    // 19: 최종 보스 전 마지막 시험
    { durationSeconds: 50, topCount: 0, bottomCount: 50, hpScale: 7.0, speed: 150, pacingCurve: 'easeOut' },
    // 20: 최종 보스 웨이브, 모든 것을 쏟아붓는 공격
    { durationSeconds: 30, topCount: 0, bottomCount: 25, hpScale: 10.0, speed: 180, spawnIntervalBottom: 1.0, batchSize: 5 },
];
