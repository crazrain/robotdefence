import type { Hero } from '../objects/Hero'; // Hero 클래스 임포트

export type Vec2 = { x: number; y: number };
export type Mode = 'solo' | 'duo';

export type Grade = 'Basic' | 'Rare' | 'Epic' | 'Legendary' | 'Mythical';
export type RarityGroup = 'NormalRare' | 'Epic' | 'LegendaryMythical';

export type HeroType = 'TypeA' | 'TypeB' | 'TypeC' | 'TypeD' | 'TypeE'; // 새로운 영웅 종류 정의

export type HeroRank = 'Rank1' | 'Rank2' | 'Rank3' | 'Rank4' | 'Rank5'; // 영웅 등급 정의

// GridCell 타입을 확장하여 영웅 정보를 포함
export type GridCell = {
    col: number;
    row: number;
    x: number;
    y: number;
    occupiedHeroes: Hero[]; // 해당 셀에 있는 영웅 객체 배열로 변경
};

// src/core/types.ts (WaveDef 확장)
export type WaveDef = {
    durationSeconds: number;
    topCount: number;
    bottomCount: number;
    hpScale: number;
    speed: number;
    isBoss?: boolean;

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
