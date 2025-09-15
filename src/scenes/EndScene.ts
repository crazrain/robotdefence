// src/scenes/EndScene.ts
import Phaser from 'phaser';

export class EndScene extends Phaser.Scene {
    private resultText!: Phaser.GameObjects.Text;
    private reasonText!: Phaser.GameObjects.Text;
    private restartText!: Phaser.GameObjects.Text;

    constructor() {
        super('EndScene');
    }

    create(data: { didWin: boolean; reason: string }) {
        this.cameras.main.setBackgroundColor('rgba(0, 0, 0, 0.6)');

        const centerX = this.scale.width / 2;
        const centerY = this.scale.height / 2;

        this.resultText = this.add
            .text(centerX, centerY - 80, data.didWin ? '클리어!' : '게임 오버', {
                color: '#fff',
                fontSize: '36px',
                fontFamily: 'monospace',
                align: 'center',
            })
            .setOrigin(0.5);

        this.reasonText = this.add
            .text(centerX, centerY, data.reason, {
                color: '#fff',
                fontSize: '24px',
                fontFamily: 'monospace',
                align: 'center',
            })
            .setOrigin(0.5);

        this.restartText = this.add
            .text(centerX, centerY + 80, '탭(또는 스페이스/엔터)하면 재시작', {
                color: '#fff',
                fontSize: '20px',
                fontFamily: 'monospace',
                align: 'center',
            })
            .setOrigin(0.5);

        this.input.once('pointerdown', () => this.scene.start('GameScene'));
        this.input.keyboard?.once('keydown-SPACE', () => this.scene.start('GameScene'));
        this.input.keyboard?.once('keydown-ENTER', () => this.scene.start('GameScene'));
    }
}