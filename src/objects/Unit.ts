import Phaser from 'phaser';
import { Enemy } from './Enemy';
import { Projectile } from './Projectile';

export class Unit extends Phaser.GameObjects.Arc {
    range: number;
    atk: number;
    atkInterval: number;
    timeSinceAttack = 0;
    lastTarget?: Enemy;
    targetStick = 0;

    constructor(scene: Phaser.Scene, x: number, y: number, atk: number, atkInterval: number, range: number) {
        super(scene, x, y, 14, 0, 360, false);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setFillStyle(0x66ccff, 1);
        this.range = range;
        this.atk = atk;
        this.atkInterval = atkInterval;
    }

    update(dt: number, enemies: Enemy[], projectiles: Projectile[]) {
        this.timeSinceAttack += dt;
        this.targetStick = Math.max(0, this.targetStick - dt);

        if (!this.lastTarget || !this.lastTarget.alive || this.distanceTo(this.lastTarget) > this.range) {
            if (this.targetStick <= 0) {
                this.lastTarget = this.findPriorityTarget(enemies);
                this.targetStick = 0.3;
            }
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
        const p = new Projectile(this.scene, this.x, this.y, this.atk, 600, target);
        const dx = target.x - this.x, dy = target.y - this.y;
        const dist = Math.hypot(dx, dy) || 1;
        p.vx = (dx / dist) * 600;
        p.vy = (dy / dist) * 600;
        projectiles.push(p);
    }
}