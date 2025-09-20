// src/objects/Hero.ts

import Phaser from 'phaser';
import { GridCell } from '../core/Grid';
import { Grade, HeroType } from '../core/types'; // HeroType, HeroRank 임포트
import { HEROES_DATA, HERO_SELL_RETURN_RATE } from '../data/heroData';
import { Enemy } from './Enemy';
import { Projectile } from './Projectile';
import { calculateHeroDamage } from "../core/config";

export class Hero extends Phaser.GameObjects.Image {
    public type: HeroType; // 영웅 종류 속성 추가
    public rank: number; // 영웅 등급 속성 (숫자 타입으로 변경)
    public level: number; // 영웅 레벨
    public atk: number;
    public atkInterval: number;
    public range: number;
    public timeSinceAttack = 0;
    public lastTarget?: Enemy;
    public targetStick = 0;
    private fireSoundKey: string;
    private fireEffectKey: string;
    public cell: GridCell | null = null; // 자신이 속한 셀 정보

    private static heroRankBackgroundColors: { [key: number]: number } = {
        1: 0x95a5a6, // Gray (연한 회색)
        2: 0x3498db, // Blue (부드러운 파란색)
        3: 0x9b59b6, // Purple (부드러운 보라색)
        4: 0xf39c12, // Orange (선명한 주황색)
        5: 0xe74c3c, // Red (선명한 빨간색)
    };

    private static heroRankValues: { [key: number]: number } = {
        1: 100,   // 1등급 영웅의 가치
        2: 300,   // 2등급 영웅의 가치
        3: 900,   // 3등급 영웅의 가치
        4: 2700,  // 4등급 영웅의 가치
        5: 8100,  // 5등급 영웅의 가치
    };

    constructor(scene: Phaser.Scene, x: number, y: number, imageKey: string) {
        const heroData = HEROES_DATA.find(h => h.imageKey === imageKey);
        if (!heroData) {
            throw new Error(`Hero data not found for imageKey: ${imageKey}`);
        }

        const heroSize = 40;
        
        super(scene, x, y, imageKey);
        this.scene.add.existing(this);
        this.setInteractive();

        this.imageKey = imageKey; // imageKey를 인스턴스 속성으로 저장

        this.type = heroData.type;
        this.level = 1;

        // HeroType을 HeroRank로 매핑
        const heroTypeToRankMap: Record<HeroType, number> = {
            'TypeA': 1,
            'TypeB': 2,
            'TypeC': 3,
            'TypeD': 4,
            'TypeE': 5,
        };
        this.rank = heroTypeToRankMap[this.type]; // 영웅 등급 설정

        this.atk = calculateHeroDamage(this.getGrade(), this.level, this.imageKey);
        this.atkInterval = heroData.atkInterval;
        this.attackSpeed = heroData.attackSpeed;
        this.range = heroData.range;

        this.setDisplaySize(heroSize, heroSize);
        this.fireSoundKey = heroData.imageKey + '_sound';
        this.fireEffectKey = heroData.imageKey + '_effect';
    }

    getGrade(): Grade {
        switch (this.rank) {
            case 1: return 'Basic';
            case 2: return 'Rare';
            case 3: return 'Epic';
            case 4: return 'Legendary';
            case 5: return 'Mythical';
            default: return 'Basic';
        }
    }

    upgrade() {
        this.level++;
        this.atk = calculateHeroDamage(this.getGrade(), this.level, this.imageKey);
        // TODO: Add visual indicator for level up
    }

    public getRankBackgroundColor(): number {
        return Hero.heroRankBackgroundColors[this.rank] || 0x808080; // 숫자 키로 조회
    }

    public getSellPrice(): number {
        const value = Hero.heroRankValues[this.rank] || 0;
        return Math.floor(value * HERO_SELL_RETURN_RATE);
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
        const spacing = 35; // 영웅 간의 간격 증가

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

    update(dt: number, enemies: Enemy[], projectiles: Projectile[]) {
        // 씬이 이미 파괴/비활성 상태면 아무것도 하지 않음
        // (재시작 직후 남아 있는 콜백이 도는 경우 방어)
        // @ts-ignore
        if (!this.scene || !this.scene.sys || !this.scene.sys.isActive) return;

        this.timeSinceAttack += dt;
        this.targetStick = Math.max(0, this.targetStick - dt);

        if (!this.lastTarget || !this.lastTarget.alive || this.distanceTo(this.lastTarget) > this.range) {
            if (this.targetStick <= 0) {
                this.lastTarget = this.findPriorityTarget(enemies);
                this.targetStick = 0.3;
            }
        }

        if (this.lastTarget) {
            const angle = Phaser.Math.Angle.Between(this.x, this.y, this.lastTarget.x, this.lastTarget.y);
            this.rotation = angle + Math.PI / 2; // 스프라이트가 위쪽을 향하고 있다고 가정
        }

        if (this.lastTarget && this.timeSinceAttack >= this.atkInterval) {
            this.shoot(projectiles, this.lastTarget);
            this.timeSinceAttack = 0;
        }
    }

    private distanceTo(e: Enemy) {
        return Math.hypot(e.x - this.x, e.y - this.y);
    }

    private findPriorityTarget(enemies: Enemy[]) {
        const inRange = enemies.filter(e => e.alive && this.distanceTo(e) <= this.range);
        if (inRange.length === 0) return undefined;
        return inRange.sort((a, b) => (b.wpIndex - a.wpIndex) || (this.distanceTo(a) - this.distanceTo(b)))[0];
    }

    private shoot(projectiles: Projectile[], target: Enemy) {
        // 씬 유효성 재확인
        // @ts-ignore
        if (!this.scene || !this.scene.sys || !this.scene.sys.isActive) return;

        this.scene.sound.play(this.fireSoundKey, { volume: 0.5 });

        const angle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);
        const offset = 20; // 영웅 크기의 절반 정도
        const fireX = this.x + Math.cos(angle) * offset;
        const fireY = this.y + Math.sin(angle) * offset;

        // 화염 효과 생성
        const fireEffect = this.scene.add.sprite(fireX, fireY, this.fireEffectKey);
        fireEffect.setRotation(this.rotation);
        fireEffect.setOrigin(0.5, 0.5);
        fireEffect.setScale(0.1); // 효과 크기 조절
        this.scene.tweens.add({
            targets: fireEffect,
            alpha: 0,
            angle: '+=180', // 180도 회전
            duration: 150, // 0.15초 동안
            ease: 'Power2',
            onComplete: () => {
                fireEffect.destroy();
            }
        });

        const p = new Projectile(this.scene, fireX, fireY, this.atk, 600, target, this.getRankBackgroundColor());
        const dx = target.x - fireX, dy = target.y - fireY;
        const dist = Math.hypot(dx, dy) || 1;
        p.vx = (dx / dist) * 600;
        p.vy = (dy / dist) * 600;
        projectiles.push(p);
    }
}
