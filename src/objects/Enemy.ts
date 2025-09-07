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
    }

    takeDamage(dmg: number) {
        if (!this.alive) return;
        this.hp -= dmg;
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
        }
    }
}