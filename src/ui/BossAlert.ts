import Phaser from 'phaser';

export class BossAlert extends Phaser.GameObjects.Container {
    constructor(scene: Phaser.Scene) {
        super(scene);

        const width = 400;
        const height = 100;
        const x = scene.cameras.main.width / 2;
        const y = scene.cameras.main.height / 2;

        this.setPosition(x, y);
        this.setDepth(100); // Make sure it's on top

        const graphics = scene.add.graphics();
        graphics.fillStyle(0x110000, 0.8); // Dark red, semi-transparent
        graphics.fillRoundedRect(-width / 2, -height / 2, width, height, 16);
        graphics.lineStyle(3, 0xff0000, 1); // Bright red border
        graphics.strokeRoundedRect(-width / 2, -height / 2, width, height, 16);

        const text = scene.add.text(0, 0, '보스 출현', {
            fontSize: '48px',
            fontFamily: 'Arial',
            color: '#ffffff',
            fontStyle: 'bold',
            shadow: {
                offsetX: 2,
                offsetY: 2,
                color: '#000000',
                blur: 4,
                stroke: true,
                fill: true
            }
        }).setOrigin(0.5);

        this.add([graphics, text]);
        scene.add.existing(this);
    }

    show() {
        this.setScale(0);
        this.setAlpha(0);

        this.scene.tweens.add({
            targets: this,
            scale: 1,
            alpha: 1,
            ease: 'Back.easeOut', // A bit of bounce
            duration: 500,
            onComplete: () => {
                this.scene.time.delayedCall(1500, () => { // Show for 1.5 seconds
                    this.scene.tweens.add({
                        targets: this,
                        scale: 0,
                        alpha: 0,
                        ease: 'Back.easeIn',
                        duration: 500,
                        onComplete: () => {
                            this.destroy();
                        }
                    });
                });
            }
        });
    }
}