import type Phaser from 'phaser';

export class SummonButton {
    container!: Phaser.GameObjects.Container;
    bg!: Phaser.GameObjects.Rectangle;
    label!: Phaser.GameObjects.Text;

    constructor(private scene: Phaser.Scene, private onClick: () => void) {}

    create() {
        const x = this.scene.scale.width / 2, y = this.scene.scale.height - 140;
        this.container = this.scene.add.container(x, y);
        this.bg = this.scene.add.rectangle(0, 0, 320, 72, 0x2a7a2a);
        this.label = this.scene.add.text(0, 0, '소환(100골드)', { color: '#ffffff', fontSize: '24px', fontFamily: 'monospace' }).setOrigin(0.5);
        this.container.add([this.bg, this.label]);

        this.bg.setInteractive(new Phaser.Geom.Rectangle(-160, -36, 320, 72), Phaser.Geom.Rectangle.Contains);
        this.label.setInteractive();

        const press = () => this.bg.setFillStyle(0x236923);
        const release = () => this.bg.setFillStyle(0x2a7a2a);

        const click = () => {
            this.onClick();
            this.scene.tweens.add({ targets: this.container, scale: 0.97, duration: 60, yoyo: true });
        };

        this.bg.on('pointerdown', press);
        this.bg.on('pointerup', () => { release(); click(); });
        this.bg.on('pointerout', release);
        this.label.on('pointerdown', press);
        this.label.on('pointerup', () => { release(); click(); });
        this.label.on('pointerout', release);
    }
}