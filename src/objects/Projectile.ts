import Phaser from 'phaser';
import { Enemy } from './Enemy';

export class Projectile extends Phaser.GameObjects.Image {
    dmg: number;
    speed: number;
    vx = 0;
    vy = 0;
    alive = true;
    target?: Enemy;

    constructor(scene: Phaser.Scene, x: number, y: number, dmg: number, speed: number, target: Enemy | undefined, textureKey: string, color?: number) {
        super(scene, x, y, textureKey);
        
        if (!scene.textures.exists(textureKey)) {
            const graphics = scene.add.graphics();
            graphics.fillStyle(color || 0xffffff, 1);
            graphics.fillCircle(0, 0, 6);
            graphics.generateTexture(textureKey, 12, 12);
            graphics.destroy();
        }

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setScale(0.3);

        this.dmg = dmg;
        this.speed = speed;
        this.target = target;
    }

    update(dt: number) {
        if (!this.alive) return;
        if (this.target && this.target.alive) {
            const dx = this.target.x - this.x, dy = this.target.y - this.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 8) {
                this.target.takeDamage(this.dmg);
                this.alive = false;
                this.destroy();
                return;
            }
            this.vx = (dx / dist) * this.speed;
            this.vy = (dy / dist) * this.speed;

            this.rotation = Math.atan2(this.vy, this.vx) + Math.PI / 2;
        }
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        if (this.x < -50 || this.x > 800 || this.y < -50 || this.y > 1400) {
            this.alive = false;
            this.destroy();
        }
    }
}
