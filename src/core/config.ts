// src/core/config.ts
import { Grade, RarityGroup } from "./types";

export const HERO_ATTACK_POWER_CONFIG = {
  BASE_DAMAGE_BY_GRADE: {
    Basic: 36,
    Rare: 90,
    Epic: 160,
    Legendary: 300,
    Mythical: 800,
  } as Record<Grade, number>,
  LEVEL_MULTIPLIER: 1.5,
};

export const PERMANENT_UPGRADE_CONFIG = {
  NormalRare: {
    baseCost: 30,
    costIncrease: 30,
    damageBonus: 0.1, // 10%
  },
  Epic: {
    baseCost: 60,
    costIncrease: 60,
    damageBonus: 0.1,
  },
  LegendaryMythical: {
    baseCost: 2000,
    costIncrease: 1000,
    damageBonus: 0.1,
  },
};

export function getRarityGroup(grade: Grade): RarityGroup {
    if (grade === 'Basic' || grade === 'Rare') {
        return 'NormalRare';
    }
    if (grade === 'Epic') {
        return 'Epic';
    }
    return 'LegendaryMythical';
}

export function calculateHeroDamage(grade: Grade, level: number, imageKey: string, permanentUpgradeLevel: number): number {
  const baseDamage = HERO_ATTACK_POWER_CONFIG.BASE_DAMAGE_BY_GRADE[grade];

  // 영웅 종류(1, 2, 3)에 따른 데미지 비율 적용
  let damageMultiplier = 1.0;
  const heroType = parseInt(imageKey.slice(-1), 10); // 'Basic1' -> 1

  switch (heroType) {
    case 2: // 0.5초 간격, 데미지 비율 3
      damageMultiplier = 3 / 8; // 기준(8) 대비
      break;
    case 3: // 3.0초 간격, 데미지 비율 10
      damageMultiplier = 10 / 8; // 기준(8) 대비
      break;
    case 1: // 1.0초 간격, 데미지 비율 8 (기준)
    default:
      damageMultiplier = 1.0;
      break;
  }

  const typeAdjustedDamage = baseDamage * damageMultiplier;
  
  const levelDamage = typeAdjustedDamage * Math.pow(HERO_ATTACK_POWER_CONFIG.LEVEL_MULTIPLIER, level - 1);

  const rarityGroup = getRarityGroup(grade);
  const permanentUpgradeBonus = 1 + (PERMANENT_UPGRADE_CONFIG[rarityGroup].damageBonus * permanentUpgradeLevel);
  
  const finalDamage = levelDamage * permanentUpgradeBonus;

  return Math.round(finalDamage);
}


export interface GameConfig {
    difficulty: any; // Assuming Difficulty is a string literal type like 'Normal' | 'Hard'
    roundTimeLimitSec: number;
    useWaveTimeoutFail: boolean;
    waveDurationScale: number;

    spawnIntervalScale: number; // 스폰 간격 전역 배수(0.8이면 20% 더 빠르게)
}

export function getDefaultConfig(difficulty: any = 'Normal'): GameConfig {
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
