// src/ui/Toast.ts
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../core/constants';

export class Toast {
    private scene: Phaser.Scene;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    public show(msg: string, color = '#ffeb3b') {
        const toastText = this.scene.add
            .text(GAME_WIDTH / 2, GAME_HEIGHT - 220, msg, {
                color,
                fontSize: '22px',
                fontFamily: 'monospace',
            })
            .setOrigin(0.5)
            .setAlpha(0);

        this.scene.tweens.add({
            targets: toastText,
            alpha: 1,
            y: toastText.y - 20,
            duration: 200,
            onComplete: () => {
                this.scene.time.delayedCall(700, () => {
                    this.scene.tweens.add({ targets: toastText, alpha: 0, y: toastText.y - 10, duration: 200, onComplete: () => toastText.destroy() });
                });
            }
        });
    }
}