import type Phaser from 'phaser';
import type { WaveController } from '../systems/WaveController';
import type { Mode } from '../core/types';

export class HUD {
    hudText!: Phaser.GameObjects.Text;
    waveText!: Phaser.GameObjects.Text;

    constructor(private scene: Phaser.Scene) {}

    create() {
        this.hudText = this.scene.add.text(20, 20, '', { color: '#ffffff', fontFamily: 'monospace', fontSize: '24px' });
        this.waveText = this.scene.add.text(360, 20, '', { color: '#ffffff', fontFamily: 'monospace', fontSize: '24px' }).setOrigin(0.5, 0);
    }

    update(gold: number, unitCount: number, enemyCount: number, maxAlive: number, wc: WaveController | undefined, mode: Mode) {
        this.hudText.setText(`Gold ${gold}   Units ${unitCount}   Enemies ${enemyCount}/${maxAlive}`);
        if (wc && wc.rt) {
            const waveNum = wc.rt.index + 1;
            const total = wc.waves.length;
            this.waveText.setText(`WAVE ${waveNum}/${total}   남은 시간 ${wc.rt.timeLeft.toFixed(1)}s   모드: ${mode === 'solo' ? '1인' : '2인'}`);
        }
    }
}