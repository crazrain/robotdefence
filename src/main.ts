import Phaser from 'phaser';
import { PlayScene } from './scenes/PlayScene';

const width = 720;
const height = 1280;

new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'app',
    backgroundColor: '#0e0e0e',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width,
        height
    },
    physics: {
        default: 'arcade',
        arcade: { debug: false }
    },
    scene: [PlayScene]
});