// src/core/config.ts
export interface GameConfig {
    difficulty: Difficulty;
    roundTimeLimitSec: number;
    useWaveTimeoutFail: boolean;
    waveDurationScale: number;

    spawnIntervalScale: number; // 스폰 간격 전역 배수(0.8이면 20% 더 빠르게)
}

export function getDefaultConfig(difficulty: Difficulty = 'Normal'): GameConfig {
    switch (difficulty) {
        case 'Hard':
            return { difficulty, roundTimeLimitSec: 900, useWaveTimeoutFail: false, waveDurationScale: 0.95, spawnIntervalScale: 0.9 };
        case 'Extreme':
            return { difficulty, roundTimeLimitSec: 900, useWaveTimeoutFail: false, waveDurationScale: 0.9,  spawnIntervalScale: 0.8 };
        case 'Normal':
        default:
            return { difficulty: 'Normal', roundTimeLimitSec: 900, useWaveTimeoutFail: false, waveDurationScale: 1.0, spawnIntervalScale: 1.0 };
    }
}