// src/ui/SpeedControlButton.ts
import Phaser from 'phaser';

export class SpeedControlButton extends Phaser.GameObjects.Container {
    private speed = 1;
    private speedText: Phaser.GameObjects.Text;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y);

        const buttonWidth = 120;
        const buttonHeight = 40;

        const background = scene.add.rectangle(0, 0, buttonWidth, buttonHeight, 0x000000, 0.5);
        background.setStrokeStyle(2, 0xffffff);

        this.speedText = scene.add.text(0, 0, `Speed: x${this.speed}`, {
            fontSize: '18px',
            fontFamily: 'monospace',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.add([background, this.speedText]);
        this.setSize(buttonWidth, buttonHeight);
        this.setInteractive();

        this.on('pointerdown', this.toggleSpeed, this);

        scene.add.existing(this);
    }

    private toggleSpeed() {
        this.speed = this.speed === 1 ? 2 : 1;
        this.speedText.setText(`Speed: x${this.speed}`);
        this.scene.events.emit('speedChanged', this.speed);
    }

    public destroy(fromScene?: boolean) {
        super.destroy(fromScene);
    }
}
