// src/data/waves.ts
import type { WaveDef } from '../core/types';

export const Waves: WaveDef[] = [
    // 1: 기본 웨이브
    { durationSeconds: 30, topCount: 0, bottomCount: 15, hpScale: 1.0, speed: 80, spawnJitter: 0.2 },
    // 2: 약간 더 많고 빨라진 웨이브
    { durationSeconds: 30, topCount: 0, bottomCount: 20, hpScale: 1.1, speed: 85, spawnJitter: 0.2 },
    // 3: 체력이 증가하고, 2마리씩 짝지어 등장
    { durationSeconds: 40, topCount: 0, bottomCount: 25, hpScale: 1.2, speed: 90, batchSize: 2, spawnJitter: 0.1 },
    // 4: 점점 빠르게 등장하는 웨이브
    { durationSeconds: 40, topCount: 0, bottomCount: 30, hpScale: 1.3, speed: 95, pacingCurve: 'easeIn' },
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
    { durationSeconds: 35, topCount: 0, bottomCount: 60, hpScale: 3.2, speed: 130, batchSize: 2, spawnJitter: 0.5 },
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

    // 21: 일반 웨이브
    { durationSeconds: 30, topCount: 0, bottomCount: 27, hpScale: 10.52, speed: 181, spawnIntervalBottom: 0.99, batchSize: 5, spawnJitter: 0.1 },

    // 22: 일반 웨이브
    { durationSeconds: 30, topCount: 0, bottomCount: 29, hpScale: 11.04, speed: 182, spawnIntervalBottom: 0.98, batchSize: 5, spawnJitter: 0.2 },

    // 23: 페이싱 변화 웨이브
    { durationSeconds: 30, topCount: 0, bottomCount: 31, hpScale: 11.57, speed: 183, spawnIntervalBottom: 0.97, batchSize: 5, spawnJitter: 0.1, pacingCurve: 'easeIn' },

    // 24: 일반 웨이브
    { durationSeconds: 30, topCount: 0, bottomCount: 33, hpScale: 12.11, speed: 184, spawnIntervalBottom: 0.96, batchSize: 5, spawnJitter: 0.2 },

    // 25: 물량 공세 + 배치 사이즈 증가
    { durationSeconds: 31, topCount: 0, bottomCount: 35, hpScale: 12.66, speed: 185, spawnIntervalBottom: 0.85, batchSize: 6, spawnJitter: 0.1 },

    // 26: 일반 웨이브
    { durationSeconds: 31, topCount: 0, bottomCount: 37, hpScale: 13.22, speed: 186, spawnIntervalBottom: 0.84, batchSize: 6, spawnJitter: 0.2 },

    // 27: 페이싱 변화 웨이브
    { durationSeconds: 31, topCount: 0, bottomCount: 39, hpScale: 13.79, speed: 187, spawnIntervalBottom: 0.83, batchSize: 6, spawnJitter: 0.1, pacingCurve: 'easeOut' },

    // 28: 일반 웨이브
    { durationSeconds: 31, topCount: 0, bottomCount: 41, hpScale: 14.37, speed: 188, spawnIntervalBottom: 0.82, batchSize: 6, spawnJitter: 0.2 },

    // 29: 일반 웨이브
    { durationSeconds: 31, topCount: 0, bottomCount: 43, hpScale: 14.96, speed: 189, spawnIntervalBottom: 0.81, batchSize: 6, spawnJitter: 0.1 },

    // 30: 보스 웨이브 - 강력한 적 소수 정예
    { durationSeconds: 32, topCount: 0, bottomCount: 30, hpScale: 23.34, speed: 209, spawnIntervalBottom: 1.3, batchSize: 7, spawnJitter: 0.2, pacingCurve: 'easeIn' },

    // 31: 일반 웨이브
    { durationSeconds: 32, topCount: 0, bottomCount: 47, hpScale: 16.18, speed: 191, spawnIntervalBottom: 0.79, batchSize: 7, spawnJitter: 0.1 },

    // 32: 일반 웨이브
    { durationSeconds: 32, topCount: 0, bottomCount: 49, hpScale: 16.79, speed: 192, spawnIntervalBottom: 0.78, batchSize: 7, spawnJitter: 0.2 },

    // 33: 페이싱 변화 웨이브
    { durationSeconds: 32, topCount: 0, bottomCount: 51, hpScale: 17.41, speed: 193, spawnIntervalBottom: 0.77, batchSize: 7, spawnJitter: 0.1, pacingCurve: 'easeIn' },

    // 34: 일반 웨이브
    { durationSeconds: 32, topCount: 0, bottomCount: 53, hpScale: 18.04, speed: 194, spawnIntervalBottom: 0.76, batchSize: 7, spawnJitter: 0.2 },

    // 35: 물량 공세 + 배치 사이즈 증가
    { durationSeconds: 33, topCount: 0, bottomCount: 55, hpScale: 18.68, speed: 195, spawnIntervalBottom: 0.65, batchSize: 8, spawnJitter: 0.1 },

    // 36: 일반 웨이브
    { durationSeconds: 33, topCount: 0, bottomCount: 57, hpScale: 19.33, speed: 196, spawnIntervalBottom: 0.64, batchSize: 8, spawnJitter: 0.2 },

    // 37: 페이싱 변화 웨이브
    { durationSeconds: 33, topCount: 0, bottomCount: 59, hpScale: 20.0, speed: 197, spawnIntervalBottom: 0.63, batchSize: 8, spawnJitter: 0.1, pacingCurve: 'easeOut' },

    // 38: 일반 웨이브
    { durationSeconds: 33, topCount: 0, bottomCount: 61, hpScale: 20.68, speed: 198, spawnIntervalBottom: 0.62, batchSize: 8, spawnJitter: 0.2 },

    // 39: 일반 웨이브
    { durationSeconds: 33, topCount: 0, bottomCount: 63, hpScale: 21.37, speed: 199, spawnIntervalBottom: 0.61, batchSize: 8, spawnJitter: 0.1 },

    // 40: 보스 웨이브 - 강력한 적 소수 정예
    { durationSeconds: 34, topCount: 0, bottomCount: 44, hpScale: 33.06, speed: 219, spawnIntervalBottom: 1.1, batchSize: 9, spawnJitter: 0.2, pacingCurve: 'easeIn' },

    // 41: 일반 웨이브
    { durationSeconds: 34, topCount: 0, bottomCount: 67, hpScale: 22.69, speed: 201, spawnIntervalBottom: 0.59, batchSize: 9, spawnJitter: 0.1 },

    // 42: 일반 웨이브
    { durationSeconds: 34, topCount: 0, bottomCount: 69, hpScale: 23.42, speed: 202, spawnIntervalBottom: 0.58, batchSize: 9, spawnJitter: 0.2 },

    // 43: 페이싱 변화 웨이브
    { durationSeconds: 34, topCount: 0, bottomCount: 71, hpScale: 24.16, speed: 203, spawnIntervalBottom: 0.57, batchSize: 9, spawnJitter: 0.1, pacingCurve: 'easeIn' },

    // 44: 일반 웨이브
    { durationSeconds: 34, topCount: 0, bottomCount: 73, hpScale: 24.91, speed: 204, spawnIntervalBottom: 0.56, batchSize: 9, spawnJitter: 0.2 },

    // 45: 물량 공세 + 배치 사이즈 증가
    { durationSeconds: 35, topCount: 0, bottomCount: 75, hpScale: 25.67, speed: 205, spawnIntervalBottom: 0.45, batchSize: 10, spawnJitter: 0.1 },

    // 46: 일반 웨이브
    { durationSeconds: 35, topCount: 0, bottomCount: 77, hpScale: 26.45, speed: 206, spawnIntervalBottom: 0.44, batchSize: 10, spawnJitter: 0.2 },

    // 47: 페이싱 변화 웨이브
    { durationSeconds: 35, topCount: 0, bottomCount: 79, hpScale: 27.24, speed: 207, spawnIntervalBottom: 0.43, batchSize: 10, spawnJitter: 0.1, pacingCurve: 'easeOut' },

    // 48: 일반 웨이브
    { durationSeconds: 35, topCount: 0, bottomCount: 81, hpScale: 28.04, speed: 208, spawnIntervalBottom: 0.42, batchSize: 10, spawnJitter: 0.2 },

    // 49: 일반 웨이브
    { durationSeconds: 35, topCount: 0, bottomCount: 83, hpScale: 28.85, speed: 209, spawnIntervalBottom: 0.41, batchSize: 10, spawnJitter: 0.1 },

    // 50: 보스 웨이브 - 강력한 적 소수 정예
    { durationSeconds: 36, topCount: 0, bottomCount: 58, hpScale: 44.78, speed: 229, spawnIntervalBottom: 0.9, batchSize: 10, spawnJitter: 0.2, pacingCurve: 'easeIn' },

    // 51: 일반 웨이브
    { durationSeconds: 36, topCount: 0, bottomCount: 87, hpScale: 30.51, speed: 211, spawnIntervalBottom: 0.39, batchSize: 10, spawnJitter: 0.1 },

    // 52: 일반 웨이브
    { durationSeconds: 36, topCount: 0, bottomCount: 89, hpScale: 31.34, speed: 212, spawnIntervalBottom: 0.38, batchSize: 10, spawnJitter: 0.2 },

    // 53: 페이싱 변화 웨이브
    { durationSeconds: 36, topCount: 0, bottomCount: 91, hpScale: 32.18, speed: 213, spawnIntervalBottom: 0.37, batchSize: 10, spawnJitter: 0.1, pacingCurve: 'easeIn' },

    // 54: 일반 웨이브
    { durationSeconds: 36, topCount: 0, bottomCount: 93, hpScale: 33.03, speed: 214, spawnIntervalBottom: 0.36, batchSize: 10, spawnJitter: 0.2 },

    // 55: 물량 공세 + 배치 사이즈 증가
    { durationSeconds: 37, topCount: 0, bottomCount: 95, hpScale: 33.9, speed: 215, spawnIntervalBottom: 0.25, batchSize: 10, spawnJitter: 0.1 },

    // 56: 일반 웨이브
    { durationSeconds: 37, topCount: 0, bottomCount: 97, hpScale: 34.78, speed: 216, spawnIntervalBottom: 0.24, batchSize: 10, spawnJitter: 0.2 },

    // 57: 페이싱 변화 웨이브
    { durationSeconds: 37, topCount: 0, bottomCount: 99, hpScale: 35.67, speed: 217, spawnIntervalBottom: 0.23, batchSize: 10, spawnJitter: 0.1, pacingCurve: 'easeOut' },

    // 58: 일반 웨이브
    { durationSeconds: 37, topCount: 0, bottomCount: 101, hpScale: 36.58, speed: 218, spawnIntervalBottom: 0.22, batchSize: 10, spawnJitter: 0.2 },

    // 59: 일반 웨이브
    { durationSeconds: 37, topCount: 0, bottomCount: 103, hpScale: 37.5, speed: 219, spawnIntervalBottom: 0.21, batchSize: 10, spawnJitter: 0.1 },

    // 60: 보스 웨이브 - 강력한 적 소수 정예
    { durationSeconds: 38, topCount: 0, bottomCount: 72, hpScale: 58.13, speed: 239, spawnIntervalBottom: 0.7, batchSize: 10, spawnJitter: 0.2, pacingCurve: 'easeIn' },

    // 61: 일반 웨이브
    { durationSeconds: 38, topCount: 0, bottomCount: 107, hpScale: 39.29, speed: 221, spawnIntervalBottom: 0.19, batchSize: 10, spawnJitter: 0.1 },

    // 62: 일반 웨이브
    { durationSeconds: 38, topCount: 0, bottomCount: 109, hpScale: 40.23, speed: 222, spawnIntervalBottom: 0.18, batchSize: 10, spawnJitter: 0.2 },

    // 63: 페이싱 변화 웨이브
    { durationSeconds: 38, topCount: 0, bottomCount: 111, hpScale: 41.18, speed: 223, spawnIntervalBottom: 0.17, batchSize: 10, spawnJitter: 0.1, pacingCurve: 'easeIn' },

    // 64: 일반 웨이브
    { durationSeconds: 38, topCount: 0, bottomCount: 113, hpScale: 42.14, speed: 224, spawnIntervalBottom: 0.16, batchSize: 10, spawnJitter: 0.2 },

    // 65: 물량 공세 + 배치 사이즈 증가
    { durationSeconds: 39, topCount: 0, bottomCount: 115, hpScale: 43.12, speed: 225, spawnIntervalBottom: 0.1, batchSize: 10, spawnJitter: 0.1 },

    // 66: 일반 웨이브
    { durationSeconds: 39, topCount: 0, bottomCount: 117, hpScale: 44.11, speed: 226, spawnIntervalBottom: 0.1, batchSize: 10, spawnJitter: 0.2 },

    // 67: 페이싱 변화 웨이브
    { durationSeconds: 39, topCount: 0, bottomCount: 119, hpScale: 45.11, speed: 227, spawnIntervalBottom: 0.1, batchSize: 10, spawnJitter: 0.1, pacingCurve: 'easeOut' },

    // 68: 일반 웨이브
    { durationSeconds: 39, topCount: 0, bottomCount: 121, hpScale: 46.13, speed: 228, spawnIntervalBottom: 0.1, batchSize: 10, spawnJitter: 0.2 },

    // 69: 일반 웨이브
    { durationSeconds: 39, topCount: 0, bottomCount: 123, hpScale: 47.16, speed: 229, spawnIntervalBottom: 0.1, batchSize: 10, spawnJitter: 0.1 },

    // 70: 보스 웨이브 - 강력한 적 소수 정예
    { durationSeconds: 40, topCount: 0, bottomCount: 86, hpScale: 73.04, speed: 249, spawnIntervalBottom: 0.6, batchSize: 10, spawnJitter: 0.2, pacingCurve: 'easeIn' },

    // 71: 일반 웨이브
    { durationSeconds: 40, topCount: 0, bottomCount: 127, hpScale: 48.21, speed: 231, spawnIntervalBottom: 0.1, batchSize: 10, spawnJitter: 0.1 },

    // 72: 일반 웨이브
    { durationSeconds: 40, topCount: 0, bottomCount: 129, hpScale: 49.27, speed: 232, spawnIntervalBottom: 0.1, batchSize: 10, spawnJitter: 0.2 },

    // 73: 페이싱 변화 웨이브
    { durationSeconds: 40, topCount: 0, bottomCount: 131, hpScale: 50.35, speed: 233, spawnIntervalBottom: 0.1, batchSize: 10, spawnJitter: 0.1, pacingCurve: 'easeIn' },

    // 74: 일반 웨이브
    { durationSeconds: 40, topCount: 0, bottomCount: 133, hpScale: 51.44, speed: 234, spawnIntervalBottom: 0.1, batchSize: 10, spawnJitter: 0.2 },

    // 75: 물량 공세 + 배치 사이즈 증가
    { durationSeconds: 41, topCount: 0, bottomCount: 135, hpScale: 52.54, speed: 235, spawnIntervalBottom: 0.1, batchSize: 10, spawnJitter: 0.1 },

    // 76: 일반 웨이브
    { durationSeconds: 41, topCount: 0, bottomCount: 137, hpScale: 53.66, speed: 236, spawnIntervalBottom: 0.1, batchSize: 10, spawnJitter: 0.2 },

    // 77: 페이싱 변화 웨이브
    { durationSeconds: 41, topCount: 0, bottomCount: 139, hpScale: 54.79, speed: 237, spawnIntervalBottom: 0.1, batchSize: 10, spawnJitter: 0.1, pacingCurve: 'easeOut' },

    // 78: 일반 웨이브
    { durationSeconds: 41, topCount: 0, bottomCount: 141, hpScale: 55.94, speed: 238, spawnIntervalBottom: 0.1, batchSize: 10, spawnJitter: 0.2 },

    // 79: 일반 웨이브
    { durationSeconds: 41, topCount: 0, bottomCount: 143, hpScale: 57.1, speed: 239, spawnIntervalBottom: 0.1, batchSize: 10, spawnJitter: 0.1 },

    // 80: 보스 웨이브 - 강력한 적 소수 정예
    { durationSeconds: 42, topCount: 0, bottomCount: 100, hpScale: 88.9, speed: 259, spawnIntervalBottom: 0.5, batchSize: 10, spawnJitter: 0.2, pacingCurve: 'easeIn' },
];
