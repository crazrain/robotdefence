// src/objects/Hero.ts

import { Unit } from './Unit';
import Phaser from 'phaser';
import type { HeroType, HeroRank } from '../core/types'; // HeroType, HeroRank 임포트

export class Hero extends Unit {
    public type: HeroType; // 영웅 종류 속성 추가
    public rank: HeroRank; // 영웅 등급 속성 추가

    constructor(scene: Phaser.Scene, x: number, y: number, atk: number, atkInterval: number, range: number, type: HeroType) {
        super(scene, x, y, atk, atkInterval, range);
        this.type = type; // 생성자에서 영웅 종류 설정

        // HeroType을 HeroRank로 매핑
        const heroTypeToRankMap: Record<HeroType, HeroRank> = {
            'TypeA': 'Rank1',
            'TypeB': 'Rank2',
            'TypeC': 'Rank3',
            'TypeD': 'Rank4',
            'TypeE': 'Rank5',
        };
        this.rank = heroTypeToRankMap[this.type]; // 영웅 등급 설정

        // 등급별 배경 색상 정의 (영웅의 실제 색상에는 영향을 주지 않음)
        const heroRankBackgroundColors: Record<HeroRank, number> = {
            'Rank1': 0x808080, // Gray
            'Rank2': 0x0000ff, // Blue
            'Rank3': 0x800080, // Purple
            'Rank4': 0xffa500, // Orange
            'Rank5': 0xff0000, // Red
        };
        // 이 색상은 셀 배경색으로 사용될 예정이며, 영웅 자체의 색상에는 영향을 주지 않습니다.
        // this.setFillStyle(heroRankBackgroundColors[this.rank] || 0x808080, 1); // 영웅 등급에 따라 색상 설정, 기본값은 Gray

        const heroColors: Record<HeroType, number> = {
            'TypeA': 0xffd700, // Gold
            'TypeB': 0x00bfff, // Deep Sky Blue
            'TypeC': 0xff6347, // Tomato
            'TypeD': 0x8a2be2, // Blue Violet
            'TypeE': 0x32cd32, // Lime Green
        };
        this.setFillStyle(heroColors[this.type] || 0xffd700, 1); // 영웅 종류에 따라 색상 설정, 기본값은 Gold
        this.setInteractive();
    }

    // 셀 내에서 영웅의 상대적인 위치를 조정하는 메서드
    public updatePositionInCell(index: number, total: number, cellCenterX: number, cellCenterY: number) {
        const { offsetX, offsetY } = Hero.calculateOffsetInCell(index, total);
        this.x = cellCenterX + offsetX;
        this.y = cellCenterY + offsetY;
    }

    // 셀 내에서 영웅의 상대적인 위치 오프셋을 계산하는 정적 메서드
    public static calculateOffsetInCell(index: number, total: number): { offsetX: number, offsetY: number } {
        let offsetX = 0;
        let offsetY = 0;
        const spacing = 25; // 영웅 간의 간격 증가

        if (total === 1) {
            // 1개일 때는 중앙에 배치
            offsetX = 0;
            offsetY = 0;
        } else if (total === 2) {
            // 2개일 때는 좌우로 배치, 더 넓게
            offsetX = index === 0 ? -spacing / 2 : spacing / 2;
            offsetY = 0;
        } else if (total === 3) {
            // 3개일 때는 삼각형 형태로 배치, 간격 넓게
            if (index === 0) {
                offsetX = 0;
                offsetY = -spacing / 2;
            } else if (index === 1) {
                offsetX = -spacing / 2;
                offsetY = spacing / 2;
            } else {
                offsetX = spacing / 2;
                offsetY = spacing / 2;
            }
        }
        return { offsetX, offsetY };
    }

    // 셀 내에서 영웅의 최종 목표 위치를 계산하는 정적 메서드
    public static calculateTargetPositionInCell(index: number, total: number, cellCenterX: number, cellCenterY: number): { x: number, y: number } {
        const { offsetX, offsetY } = Hero.calculateOffsetInCell(index, total);
        return { x: cellCenterX + offsetX, y: cellCenterY + offsetY };
    }
}
