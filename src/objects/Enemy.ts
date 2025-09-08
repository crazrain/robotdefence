import Phaser from 'phaser';
import type { Vec2 } from '../core/types';
import { GOLD_PER_HP } from '../core/constants';

export class Enemy extends Phaser.GameObjects.Arc {
    hp: number;
    maxHp: number;
    speed: number;
    wpIndex = 0;
    waypoints: Vec2[];
    alive = true;
    healthBar!: Phaser.GameObjects.Graphics;

    constructor(scene: Phaser.Scene, x: number, y: number, waypoints: Vec2[], hp: number, speed: number, wpIndexAtJoin: number) {
        super(scene, x, y, 16, 0, 360, false);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        (this.body as Phaser.Physics.Arcade.Body).setCircle(16).setOffset(-16, -16);
        this.setFillStyle(0xff4444, 1);
        this.waypoints = waypoints;
        this.hp = hp;
        this.maxHp = hp;        // 최대 체력 기록
        this.speed = speed;
        this.wpIndex = wpIndexAtJoin;

        // 체력 바 초기화
        this.healthBar = scene.add.graphics();
        this.healthBar.setDepth(1); // 몬스터보다 위에 표시되도록 z-index 설정
        this.updateHealthBar();
    }

    takeDamage(dmg: number) {
        if (!this.alive) return;
        this.hp -= dmg;
        this.updateHealthBar(); // 체력 변경 시 체력 바 업데이트
        if (this.hp <= 0) {
            this.alive = false;
            // 처치 보상 계산 및 이벤트 발행(씬에서 수신)
            const bounty = Math.max(1, Math.floor(this.maxHp * GOLD_PER_HP));
            this.scene.events.emit('enemy_killed', {
                x: this.x,
                y: this.y,
                maxHp: this.maxHp,
                bounty
            });
            this.destroy();
        }
    }

    update(dt: number) {
        if (!this.alive) return;

        const target = this.waypoints[this.wpIndex];
        const dx = target.x - this.x, dy = target.y - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 4) {
            this.wpIndex = (this.wpIndex + 1) % this.waypoints.length;
        } else {
            const vx = (dx / dist) * this.speed;
            const vy = (dy / dist) * this.speed;
            this.x += vx * dt;
            this.y += vy * dt;
            this.healthBar.setPosition(this.x, this.y - 20); // 체력 바 위치 업데이트
        }
    }

    // 몬스터 파괴 시 체력 바도 파괴
    destroy(fromScene?: boolean) {
        super.destroy(fromScene);
        this.healthBar.destroy();
    }

    private updateHealthBar() {
        this.healthBar.clear();
        const percentage = this.hp / this.maxHp;
        const color = this.getHealthBarColor(percentage);
        const barWidth = 32 * percentage; // 몬스터 너비에 맞춰 조절

        this.healthBar.fillStyle(0x000000, 0.5); // 배경
        this.healthBar.fillRect(-16, -15, 32, 5);
        this.healthBar.lineStyle(1, 0xffffff, 1); // 외곽선 추가 (흰색)
        this.healthBar.strokeRect(-16, -15, 32, 5);

        this.healthBar.fillStyle(color, 1);
        this.healthBar.fillRect(-16, -15, barWidth, 5);
    }

    private getHealthBarColor(percentage: number): number {
        if (percentage > 0.6) {
            return 0x00ff00; // 초록색
        } else if (percentage > 0.3) {
            return 0xffff00; // 노란색
        } else {
            return 0x8b0000; // 적갈색
        }
    }
}
