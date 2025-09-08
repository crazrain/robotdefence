// src/objects/Hero.ts

import { Unit } from './Unit';
import Phaser from 'phaser';

export class Hero extends Unit {
    constructor(scene: Phaser.Scene, x: number, y: number, atk: number, atkInterval: number, range: number) {
        super(scene, x, y, atk, atkInterval, range);
        this.setFillStyle(0xffd700, 1); // Gold color for the hero
        this.setInteractive();
    }
}
