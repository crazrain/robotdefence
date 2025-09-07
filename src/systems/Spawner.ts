import type Phaser from 'phaser';
import type { WaveDef } from '../core/types';
import { Enemy } from '../objects/Enemy';
import { BASE_HP, SEAT } from '../core/constants';
import type { Vec2 } from '../core/types';

export class Spawner {
    constructor(private scene: Phaser.Scene, private waypoints: Vec2[]) {}

    spawnTop(w: WaveDef, enemies: Enemy[]) {
        const hp = Math.floor(BASE_HP * w.hpScale);
        const e = new Enemy(this.scene, SEAT.top.x, SEAT.top.y, this.waypoints, hp, w.speed, 0 /* 좌상 */);
        enemies.push(e);
    }

    spawnBottom(w: WaveDef, enemies: Enemy[]) {
        const hp = Math.floor(BASE_HP * w.hpScale);
        const e = new Enemy(this.scene, SEAT.bottom.x, SEAT.bottom.y, this.waypoints, hp, w.speed, 1 /* 좌하 */);
        enemies.push(e);
    }
}