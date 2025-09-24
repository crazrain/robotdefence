// src/systems/WaveController.ts (핵심만 발췌)
import type { GameConfig } from '../core/config';
import type { WaveDef, WaveRuntime, Mode } from '../core/types';
import { Spawner } from './Spawner';
import { Waves } from '../data/waves';
import { MAX_ALIVE } from '../core/constants';
import { Enemy } from '../objects/Enemy';

export class WaveController {
    waves: WaveDef[] = Waves;
    rt!: WaveRuntime;
    spawner: Spawner;
    cfg: GameConfig;
    onGameOver: (reason: string) => void;
    onWaveChange: () => void;
    onWin: () => void;
    onWaveCleared: (waveIndex: number) => void;

    constructor(
        private scene: Phaser.Scene,
        spawner: Spawner,
        cfg: GameConfig,
        onGameOver: (reason: string) => void,
        onWaveChange: () => void,
        onWin: () => void,
        onWaveCleared: (waveIndex: number) => void
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

        // 초기 간격 계산
        const interval = this.computeBottomInterval(w, 0); // 진행률 0에서 시작

        this.rt = {
            index,
            timeLeft: w.durationSeconds,
            topToSpawn: 0,
            bottomToSpawn: w.bottomCount,
            spawnIntervalTop: 0,
            spawnIntervalBottom: interval,
            spawnTimerTop: 0,
            spawnTimerBottom: 0,
        };

        this.onWaveChange();

        if (w.isBoss) {
            this.scene.events.emit('boss_wave_start');
        }
    }

    update(dt: number, _mode: Mode, enemies: Enemy[]) {
        if (!this.rt) return;
        const w = this.waves[this.rt.index];

        this.rt.timeLeft = Math.max(0, this.rt.timeLeft - dt);

        if (w.isBoss) {
            if (this.rt.bottomToSpawn > 0) {
                this.spawner.spawnBottom(w, enemies, { x: 0, y: 0 });
                this.rt.bottomToSpawn--;
            }
        } else {
            // 진행률(0~1): 웨이브 경과에 따른 간격 재계산(곡선 적용)
            const progress = this.waves[this.rt.index].durationSeconds > 0
                ? 1 - (this.rt.timeLeft / this.waves[this.rt.index].durationSeconds)
                : 1;
            this.rt.spawnIntervalBottom = this.computeBottomInterval(w, progress);

            // 스폰 타이밍(지터/배치)
            if (this.rt.bottomToSpawn > 0 && this.rt.spawnIntervalBottom > 0) {
                this.rt.spawnTimerBottom += dt;
                while (this.rt.bottomToSpawn > 0 && this.rt.spawnTimerBottom >= this.rt.spawnIntervalBottom) {
                    // 지터 적용(틱마다 소량 변동)
                    const jitter = (w.spawnJitter ?? 0);
                    const jittered = this.rt.spawnIntervalBottom + (jitter ? (Math.random() * 2 - 1) * jitter : 0);
                    // 다음 사이클 타이머 보정
                    this.rt.spawnTimerBottom -= Math.max(0.05, jittered); // 최소 0.05초 캡

                    // 배치 스폰
                    const batch = Math.max(1, w.batchSize ?? 1);
                    for (let i = 0; i < batch && this.rt.bottomToSpawn > 0; i++) {
                        // 배치 내 오프셋 추가
                        const offset = { x: (Math.random() - 0.5) * 20, y: (Math.random() - 0.5) * 20 };
                        this.spawner.spawnBottom(w, enemies, offset);
                        this.rt.bottomToSpawn--;
                    }
                }
            }
        }

        // 패배/클리어 판정
        if (enemies.length >= MAX_ALIVE) {
            this.onGameOver('적이 너무 많이 쌓였습니다(100 마리).');
            return;
        }

        const allSpawned = this.rt.bottomToSpawn === 0;

        // 웨이브 시간 종료 정책
        const isLastWave = this.rt.index === this.waves.length - 1;
        if (this.rt.timeLeft <= 0) {
            if (w.isBoss) {
                this.onGameOver('보스 웨이브 시간 초과!');
                return;
            }
            if (!isLastWave) { // 마지막 웨이브가 아닐 때만 시간 종료로 클리어
                this.onWaveCleared(this.rt.index);
                this.nextOrWin(_mode);
                return;
            }
        }

        // 스폰 완료 후 전멸 시 조기 진행
        if (allSpawned && enemies.length === 0) {
            this.onWaveCleared(this.rt.index);
            this.nextOrWin(_mode);
        }
    }

    private computeBottomInterval(w: WaveDef, progress01: number): number {
        // 0) 보스 웨이브는 즉시 스폰
        if (w.isBoss) {
            return 0;
        }

        // 1) 웨이브가 명시한 고정 간격 우선
        if (w.spawnIntervalBottom && w.spawnIntervalBottom > 0) {
            return Math.max(0.05, w.spawnIntervalBottom * (this.cfg.spawnIntervalScale ?? 1));
        }

        // 2) 곡선 기반(진행률에 따라 변화)
        if (w.pacingCurve) {
            // 기본(auto) 간격(= duration / count)에서 시작
            const base = (w.bottomCount > 0 ? w.durationSeconds / w.bottomCount : 1.5);
            const scaledBase = base * (this.cfg.spawnIntervalScale ?? 1);

            // 가감속 곡선
            const t = Phaser.Math.Clamp(progress01, 0, 1);
            let factor = 1;
            switch (w.pacingCurve) {
                case 'easeIn':  // 점점 빠르게: 초반 느리게 → 후반 짧은 간격
                    factor = 1 - t * 0.5; // 1 → 0.5
                    break;
                case 'easeOut': // 점점 느리게: 초반 빠르게 → 후반 긴 간격
                    factor = 0.5 + t * 0.5; // 0.5 → 1
                    break;
                case 'linear':
                default:
                    factor = 1;
                    break;
            }
            return Math.max(0.05, scaledBase * factor);
        }

        // 3) 기본(auto) 간격
        const auto = (w.bottomCount > 0 ? w.durationSeconds / w.bottomCount : 1.5);
        return Math.max(0.05, auto * (this.cfg.spawnIntervalScale ?? 1));
    }

    private nextOrWin(mode: Mode) {
        if (this.rt.index < this.waves.length - 1) this.start(mode, this.rt.index + 1);
        else this.onWin();
    }
}