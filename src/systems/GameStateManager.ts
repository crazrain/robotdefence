// src/systems/GameStateManager.ts
import { GameScene } from '../scenes/GameScene';
import type { Mode } from '../core/types';

export class GameStateManager {
    public mode: Mode = 'solo';
    public gameSpeed: number = 1;
    private _cleaned = false;

    constructor(private scene: GameScene) {
        this.scene.events.on('speedChanged', (speed: number) => {
            this.gameSpeed = speed;
        });
        this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanup());
        this.scene.events.once(Phaser.Scenes.Events.DESTROY, () => this.cleanup(true));
    }

    endGame(didWin: boolean, reason: string) {
        this.scene.scene.start('EndScene', { didWin, reason });
    }

    winGame() {
        this.endGame(true, '모든 웨이브를 막아냈습니다!');
    }
    
    reset() {
        this._cleaned = false;
        this.gameSpeed = 1;
        this.mode = 'solo';
    }

    cleanup(hard = false) {
        if (this._cleaned) return;
        this._cleaned = true;

        this.scene.events.off('speedChanged');

        // 타이머/트윈
        this.scene.tweens.killAll();
        this.scene.time.removeAllEvents();
    }
}
