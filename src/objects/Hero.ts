// src/objects/Hero.ts

import { Unit } from './Unit';
import Phaser from 'phaser';
import type { HeroType } from '../core/types'; // HeroType 임포트

export class Hero extends Unit {
    public type: HeroType; // 영웅 종류 속성 추가

    constructor(scene: Phaser.Scene, x: number, y: number, atk: number, atkInterval: number, range: number, type: HeroType) {
        super(scene, x, y, atk, atkInterval, range);
        this.type = type; // 생성자에서 영웅 종류 설정

        const heroColors: Record<HeroType, number> = {
            'TypeA': 0xffd700, // Gold
            'TypeB': 0x00bfff, // Deep Sky Blue
            'TypeC': 0xff6347, // Tomato
        };
        this.setFillStyle(heroColors[this.type] || 0xffd700, 1); // 영웅 종류에 따라 색상 설정, 기본값은 Gold
        this.setInteractive();
    }

    // 셀 내에서 영웅의 상대적인 위치를 조정하는 메서드
    public updatePositionInCell(index: number, total: number, cellCenterX: number, cellCenterY: number) {
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
        this.x = cellCenterX + offsetX;
        this.y = cellCenterY + offsetY;
    }
}
