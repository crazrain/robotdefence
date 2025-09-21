import type Phaser from 'phaser';

export class UpgradeButton {
    container!: Phaser.GameObjects.Container;
    bg!: Phaser.GameObjects.Rectangle;
    label!: Phaser.GameObjects.Text;

    constructor(private scene: Phaser.Scene, private onClick: () => void) {}

    create() {
        const x = this.scene.scale.width / 2 + 170, y = this.scene.scale.height - 140;
        this.container = this.scene.add.container(x, y);
        this.bg = this.scene.add.rectangle(0, 0, 160, 72, 0x2a2a7a);
        this.label = this.scene.add.text(0, 0, '업그레이드', { color: '#ffffff', fontSize: '24px', fontFamily: 'monospace' }).setOrigin(0.5);
        this.container.add([this.bg, this.label]);

        this.bg.setInteractive({ useHandCursor: true });

        const press = () => this.bg.setFillStyle(0x232369);
        const release = () => this.bg.setFillStyle(0x2a2a7a);

        const click = () => {
            this.onClick();
            this.scene.tweens.add({ targets: this.container, scale: 0.97, duration: 60, yoyo: true });
        };

        this.bg.on('pointerdown', press);
        this.bg.on('pointerup', () => { release(); click(); });
        this.bg.on('pointerout', release);
    }
}
