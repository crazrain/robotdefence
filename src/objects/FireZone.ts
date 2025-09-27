// src/objects/FireZone.ts
import Phaser from 'phaser';
import { Enemy } from './Enemy';
import { EntityManager } from '../systems/EntityManager';

export class FireZone extends Phaser.GameObjects.Zone {
    private duration: number;
    private damage: number;
    private tickInterval: number;
    private entityManager: EntityManager;
    private graphic: Phaser.GameObjects.Graphics;
    private damageTimer: Phaser.Time.TimerEvent;

    constructor(
        scene: Phaser.Scene,
        x: number,
        y: number,
        radius: number,
        duration: number,
        damage: number,
        tickInterval: number,
        entityManager: EntityManager
    ) {
        super(scene, x, y, radius * 2, radius * 2);
        scene.add.existing(this);
        scene.physics.add.existing(this, true); // true for static

        this.duration = duration * 1000;
        this.damage = damage;
        this.tickInterval = tickInterval;
        this.entityManager = entityManager;

        this.graphic = scene.add.graphics();
        this.drawZone(radius);

        // Destroy the zone after its duration
        scene.time.delayedCall(this.duration, () => {
            this.destroy();
        });

        // Apply damage periodically
        this.damageTimer = scene.time.addEvent({
            delay: this.tickInterval,
            callback: this.applyDamage,
            callbackScope: this,
            loop: true,
        });
    }

    private drawZone(radius: number) {
        this.graphic.clear();
        this.graphic.fillStyle(0xff0000, 0.3);
        this.graphic.fillCircle(this.x, this.y, radius);
    }

    private applyDamage() {
        const enemies = this.entityManager.enemies;
        for (const enemy of enemies) {
            if (Phaser.Geom.Intersects.CircleToRectangle(
                new Phaser.Geom.Circle(this.x, this.y, this.width / 2),
                enemy.getBounds()
            )) {
                enemy.takeDamage(this.damage);
            }
        }
    }

    destroy(fromScene?: boolean) {
        this.damageTimer.destroy();
        this.graphic.destroy();
        super.destroy(fromScene);
    }
}
