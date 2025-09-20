import type Phaser from 'phaser';
import type { Mode } from '../core/types';

export class ModeSelector {
    overlay?: Phaser.GameObjects.Rectangle;
    btnSolo?: Phaser.GameObjects.Rectangle;
    btnDuo?: Phaser.GameObjects.Rectangle;
    labelSolo?: Phaser.GameObjects.Text;
    labelDuo?: Phaser.GameObjects.Text;

    constructor(private scene: Phaser.Scene, private onPick: (mode: Mode) => void) {}

    show() {
        const w = this.scene.scale.width, h = this.scene.scale.height;
        this.overlay = this.scene.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.5).setDepth(1000);

        this.btnSolo = this.scene.add.rectangle(w / 2 - 150, h / 2 - 21, 220, 100, 0x3a6ea5, 0.9).setDepth(1001).setInteractive();
        this.labelSolo = this.scene.add.text(this.btnSolo.x, this.btnSolo.y, '1인(SOLO)', { color: '#fff', fontSize: '26px', fontFamily: 'monospace' }).setOrigin(0.5).setDepth(1002);

        this.btnDuo = this.scene.add.rectangle(w / 2 + 150, h / 2 - 21, 220, 100, 0xa55e3a, 0.9).setDepth(1001).setInteractive();
        this.labelDuo = this.scene.add.text(this.btnDuo.x, this.btnDuo.y, '2인(DUO)', { color: '#fff', fontSize: '26px', fontFamily: 'monospace' }).setOrigin(0.5).setDepth(1002);

        const pick = (mode: Mode) => {
            this.destroy();
            this.onPick(mode);
        };

        this.btnSolo.on('pointerup', () => pick('solo'));
        this.btnDuo.on('pointerup', () => pick('duo'));
    }

    destroy() {
        this.overlay?.destroy();
        this.btnSolo?.destroy(); this.labelSolo?.destroy();
        this.btnDuo?.destroy();  this.labelDuo?.destroy();
    }
}