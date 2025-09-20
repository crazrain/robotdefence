// src/core/config.ts
import { Grade } from "./types";

export const HERO_ATTACK_POWER_CONFIG = {
  BASE_DAMAGE_BY_GRADE: {
    Basic: 18,
    Rare: 45,
    Epic: 80,
    Legendary: 150,
    Mythical: 400,
  } as Record<Grade, number>,
  LEVEL_MULTIPLIER: 1.5,
};

export function calculateHeroDamage(grade: Grade, level: number): number {
  const baseDamage = HERO_ATTACK_POWER_CONFIG.BASE_DAMAGE_BY_GRADE[grade];
  const damage = baseDamage * Math.pow(HERO_ATTACK_POWER_CONFIG.LEVEL_MULTIPLIER, level - 1);
  return Math.round(damage);
}


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