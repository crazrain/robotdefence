import type Phaser from 'phaser';
import type { Mode, WaveDef, WaveRuntime } from '../core/types';
import { Waves } from '../data/waves';
import { MAX_ALIVE } from '../core/constants';
import { Spawner } from './Spawner';
import { Enemy } from '../objects/Enemy';

export class WaveController {
    waves: WaveDef[] = Waves;
    rt!: WaveRuntime;
    spawner: Spawner;
    onGameOver: (reason: string) => void;
    onWaveChange: () => void;
    onWin: () => void;

    constructor(
        private scene: Phaser.Scene,
        spawner: Spawner,
        onGameOver: (reason: string) => void,
        onWaveChange: () => void,
        onWin: () => void
    ) {
        this.spawner = spawner;
        this.onGameOver = onGameOver;
        this.onWaveChange = onWaveChange;
        this.onWin = onWin;
    }

    start(mode: Mode, index = 0) {
        const w = this.waves[index];
        this.rt = {
            index,
            timeLeft: w.durationSeconds,
            topToSpawn: mode === 'duo' ? w.topCount : 0,
            bottomToSpawn: w.bottomCount,
            spawnIntervalTop: w.topCount > 0 ? w.durationSeconds / (mode === 'duo' ? w.topCount : 1) : 0,
            spawnIntervalBottom: w.bottomCount > 0 ? w.durationSeconds / w.bottomCount : 0,
            spawnTimerTop: 0,
            spawnTimerBottom: 0,
        };
        this.onWaveChange();
    }

    update(dt: number, mode: Mode, enemies: Enemy[]) {
        if (!this.rt) return;
        const w = this.waves[this.rt.index];
        this.rt.timeLeft = Math.max(0, this.rt.timeLeft - dt);

        // 스폰 타이밍
        if (this.rt.topToSpawn > 0 && this.rt.spawnIntervalTop > 0) {
            this.rt.spawnTimerTop += dt;
            while (this.rt.topToSpawn > 0 && this.rt.spawnTimerTop >= this.rt.spawnIntervalTop) {
                this.rt.spawnTimerTop -= this.rt.spawnIntervalTop;
                this.spawner.spawnTop(w, enemies);
                this.rt.topToSpawn--;
            }
        }

        if (this.rt.bottomToSpawn > 0 && this.rt.spawnIntervalBottom > 0) {
            this.rt.spawnTimerBottom += dt;
            while (this.rt.bottomToSpawn > 0 && this.rt.spawnTimerBottom >= this.rt.spawnIntervalBottom) {
                this.rt.spawnTimerBottom -= this.rt.spawnIntervalBottom;
                this.spawner.spawnBottom(w, enemies);
                this.rt.bottomToSpawn--;
            }
        }

        // 패배 조건: 필드 100 마리
        if (enemies.length >= MAX_ALIVE) {
            this.onGameOver('적이 너무 많이 쌓였습니다(100 마리).');
            return;
        }

        const allSpawned = this.rt.topToSpawn === 0 && this.rt.bottomToSpawn === 0;

        // 시간 종료
        if (this.rt.timeLeft <= 0) {
            if (enemies.length > 0) {
                this.onGameOver('시간 내에 처치하지 못했습니다.');
                return;
            }
            this.nextOrWin(mode);
            return;
        }

        // 스폰 완료 후 전멸 시 조기 진행
        if (allSpawned && enemies.length === 0) {
            this.nextOrWin(mode);
        }
    }

    private nextOrWin(mode: Mode) {
        if (this.rt.index < this.waves.length - 1) {
            this.start(mode, this.rt.index + 1);
        } else {
            this.onWin();
        }
    }
}