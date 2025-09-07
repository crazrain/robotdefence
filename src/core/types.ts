export type Vec2 = { x: number; y: number };
export type Mode = 'solo' | 'duo';

// src/core/types.ts (WaveDef 확장)
export type WaveDef = {
    durationSeconds: number;
    topCount: number;
    bottomCount: number;
    hpScale: number;
    speed: number;

    // 선택 항목(없으면 기본 로직 사용)
    spawnIntervalBottom?: number; // 하단 스폰 간격(초) 고정 오버라이드
    spawnJitter?: number;         // 지터(초) 예: 0.2면 ±0.2 내 랜덤
    batchSize?: number;           // 묶음 스폰 수(기본 1)
    pacingCurve?: 'linear' | 'easeIn' | 'easeOut'; // 진행률 기반 가감속
};
export type WaveRuntime = {
    index: number;
    timeLeft: number;
    topToSpawn: number;
    bottomToSpawn: number;
    spawnIntervalTop: number;
    spawnIntervalBottom: number;
    spawnTimerTop: number;
    spawnTimerBottom: number;
};
