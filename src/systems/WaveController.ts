import type Phaser from 'phaser';
import type { Mode, WaveDef, WaveRuntime } from '../core/types';
import { Waves } from '../data/waves';
import { MAX_ALIVE } from '../core/constants';
import { Spawner } from './Spawner';
import { Enemy } from '../objects/Enemy';
import type { GameConfig } from '../core/config';

export class WaveController {
    waves: WaveDef[] = Waves;
    rt!: WaveRuntime;
    spawner: Spawner;
    onGameOver: (reason: string) => void;
    onWaveChange: () => void;
    onWin: () => void;
    onWaveCleared: (waveIndex: number) => void; // ← 추가
    cfg: GameConfig;

    constructor(
        private scene: Phaser.Scene,
        spawner: Spawner,
        cfg: GameConfig,
        onGameOver: (reason: string) => void,
        onWaveChange: () => void,
        onWin: () => void,
        onWaveCleared: (waveIndex: number) => void      // ← 추가
    ) {
        this.spawner = spawner;
        this.cfg = cfg;
        this.onGameOver = onGameOver;
        this.onWaveChange = onWaveChange;
        this.onWin = onWin;
        this.onWaveCleared = onWaveCleared;
    }

    start(_mode: Mode, index = 0) {
        const base = this.waves[index];
        const w: WaveDef = {
            ...base,
            durationSeconds: Math.max(1, base.durationSeconds * (this.cfg.waveDurationScale ?? 1))
        };
        this.rt = {
            index,
            timeLeft: w.durationSeconds,
            topToSpawn: 0, // 현재 요구사항: P1(하단)만 스폰
            bottomToSpawn: w.bottomCount,
            spawnIntervalTop: 0,
            spawnIntervalBottom: w.bottomCount > 0 ? w.durationSeconds / w.bottomCount : 0,
            spawnTimerTop: 0,
            spawnTimerBottom: 0,
        };
        this.onWaveChange();
    }

    update(dt: number, _mode: Mode, enemies: Enemy[]) {
        if (!this.rt) return;
        const w = this.waves[this.rt.index];
        this.rt.timeLeft = Math.max(0, this.rt.timeLeft - dt);

        // 하단(P1) 스폰
        if (this.rt.bottomToSpawn > 0 && this.rt.spawnIntervalBottom > 0) {
            this.rt.spawnTimerBottom += dt;
            while (this.rt.bottomToSpawn > 0 && this.rt.spawnTimerBottom >= this.rt.spawnIntervalBottom) {
                this.rt.spawnTimerBottom -= this.rt.spawnIntervalBottom;
                this.spawner.spawnBottom(w, enemies);
                this.rt.bottomToSpawn--;
            }
        }

        // 과포화 패배
        if (enemies.length >= MAX_ALIVE) {
            this.onGameOver('적이 너무 많이 쌓였습니다(100 마리).');
            return;
        }

        const allSpawned = this.rt.bottomToSpawn === 0;

        // 웨이브 시간 만료 정책
        if (this.rt.timeLeft <= 0) {
            if (this.cfg.useWaveTimeoutFail) {
                if (enemies.length > 0) {
                    this.onGameOver('웨이브 제한 시간 내에 처치하지 못했습니다.');
                    return;
                }
                this.onWaveCleared(this.rt.index); // ← 보상 트리거
                this.nextOrWin(_mode);
                return;
            }
            // useWaveTimeoutFail=false: 스폰 종료 후 전멸 시에만 진행
            if (allSpawned && enemies.length === 0) {
                this.onWaveCleared(this.rt.index); // ← 보상 트리거
                this.nextOrWin(_mode);
            }
            return;
        }

        // 스폰 완료 후 전멸 시 조기 진행
        if (allSpawned && enemies.length === 0) {
            this.onWaveCleared(this.rt.index); // ← 보상 트리거
            this.nextOrWin(_mode);
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