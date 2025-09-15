// src/ui/SpeedControlButton.ts
import Phaser from 'phaser';
import { THEME } from '../core/constants';

export class SpeedControlButton extends Phaser.GameObjects.Container {
    private speeds: number[] = [1, 2, 3, 4];
    private speedButtons: Phaser.GameObjects.Container[] = [];
    private currentSpeed: number = 1;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y);

        this.createButtons();
        this.updateButtonStates();

        scene.add.existing(this);
    }

    private createButtons() {
        const buttonWidth = 40;
        const buttonHeight = 30;
        const spacing = 45;

        this.speeds.forEach((speed, index) => {
            const buttonContainer = this.scene.add.container((index - (this.speeds.length - 1) / 2) * spacing, 0);

            const background = this.scene.add.graphics();
            const text = this.scene.add.text(0, 0, `${speed}x`, {
                fontFamily: THEME.font,
                fontSize: '16px',
                color: THEME.text,
            }).setOrigin(0.5);

            buttonContainer.add([background, text]);
            buttonContainer.setSize(buttonWidth, buttonHeight);
            buttonContainer.setData('speed', speed);
            buttonContainer.setData('background', background);
            buttonContainer.setInteractive({ useHandCursor: true })
                .on('pointerdown', () => this.setSpeed(speed));

            this.add(buttonContainer);
            this.speedButtons.push(buttonContainer);
        });
    }

    private setSpeed(newSpeed: number) {
        this.currentSpeed = newSpeed;
        this.updateButtonStates();
        this.scene.events.emit('speedChanged', newSpeed);
    }

    private updateButtonStates() {
        this.speedButtons.forEach(button => {
            const speed = button.getData('speed') as number;
            const background = button.getData('background') as Phaser.GameObjects.Graphics;
            const color = (speed === this.currentSpeed) ? THEME.primary : THEME.neutral;

            background.clear();
            background.fillStyle(parseInt(color.substring(1), 16), 1);
            background.fillRoundedRect(-button.width / 2, -button.height / 2, button.width, button.height, 8);
        });
    }
}
