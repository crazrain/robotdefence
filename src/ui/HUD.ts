import type Phaser from 'phaser';
import type { WaveController } from '../systems/WaveController';
import type { Mode } from '../core/types';
import { THEME } from '../core/constants';

export class HUD {
    bg?: Phaser.GameObjects.Rectangle;
    line1!: Phaser.GameObjects.Text;
    line2!: Phaser.GameObjects.Text;

    constructor(private scene: Phaser.Scene) {}

    create() {
        this.bg = this.scene.add.rectangle(0, 0, this.scene.scale.width, 70, THEME.background, 0.5)
            .setOrigin(0, 0)
            .setDepth(5);

        this.line1 = this.scene.add.text(16, 12, '', {
            color: THEME.text,
            fontFamily: THEME.font,
            fontSize: '22px',
            align: 'left'
        }).setDepth(6);

        this.line2 = this.scene.add.text(16, 40, '', {
            color: THEME.warning,
            fontFamily: THEME.font,
            fontSize: '20px'
        }).setDepth(6);
    }

    update(
        gold: number,
        unitCount: number,
        enemyCount: number,
        maxAlive: number,
        wc: WaveController | undefined,
        mode: Mode
    ) {
        this.line1.setText(`Gold ${gold}   Units ${unitCount}   Enemies ${enemyCount}/${maxAlive}`);
        if (wc && wc.rt) {
            const waveNum = wc.rt.index + 1;
            const total = wc.waves.length;
            this.line2.setText(`Wave ${waveNum}/${total}  남은시간(웨이브) ${wc.rt.timeLeft.toFixed(1)}s  모드 ${mode === 'solo' ? '1인' : '2인'}`);
        } else {
            this.line2.setText('');
        }
    }
}