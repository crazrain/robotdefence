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
    private particleEmitter: Phaser.GameObjects.Particles.ParticleEmitter;

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

        this.particleEmitter = scene.add.particles(0, 0, 'star_particle', {
            speed: { min: 5, max: 20 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.6, end: 0 },
            lifespan: { min: 400, max: 800 },
            quantity: 2,
            blendMode: 'ADD',
            emitZone: { type: 'random', source: new Phaser.Geom.Circle(x, y, radius), quantity: 20 },
            tint: [0xff8800, 0xff0000, 0xffff00]
        });

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
                console.log(`Enemy ${enemy.id} took ${this.damage} damage from Scorched Earth.`);
            }
        }
    }

    destroy(fromScene?: boolean) {
        this.damageTimer.destroy();
        this.graphic.destroy();
        this.particleEmitter.destroy();
        super.destroy(fromScene);
    }
}
