import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';
import { EndScene } from './scenes/EndScene';
import { GAME_WIDTH, GAME_HEIGHT } from './core/constants';

// 문제 줄 삭제했습니다.
// (Phaser.Utils.Debug as any).BANNER = false;

new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'app',
    backgroundColor: '#0e0e0e',
    // 콘솔 배너 비활성화(원하실 때)
    banner: false, // 또는 { hidePhaser: true }
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: GAME_WIDTH,
        height: GAME_HEIGHT
    },
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    },
    scene: [GameScene, EndScene]
});