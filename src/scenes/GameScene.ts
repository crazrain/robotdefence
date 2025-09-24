// src/scenes/GameScene.ts
import Phaser from 'phaser';
import { buildBottomLoop, buildTopLoop } from '../core/Path';
import { HEROES_DATA } from '../data/heroData';
import { MAX_ALIVE } from '../core/constants';
import { Spawner } from '../systems/Spawner';
import { WaveController } from '../systems/WaveController';
import { getDefaultConfig, type GameConfig } from '../core/config';
import { GridManager } from '../systems/GridManager';
import { EntityManager } from '../systems/EntityManager';
import { EconomyManager } from '../systems/EconomyManager';
import { GameStateManager } from '../systems/GameStateManager';
import { UIManager } from '../systems/UIManager';
import { HeroManager } from '../systems/HeroManager';
import { UpgradeManager } from '../systems/UpgradeManager';
import { SkillManager } from '../systems/SkillManager';

export class GameScene extends Phaser.Scene {
    // 경로
    public waypointsTop = buildTopLoop();
    public waypointsBottom = buildBottomLoop();

    // 시스템
    public entityManager!: EntityManager;
    public economyManager!: EconomyManager;
    public gameStateManager!: GameStateManager;
    public uiManager!: UIManager;
    public heroManager!: HeroManager;
    public upgradeManager!: UpgradeManager;
    public gridManager!: GridManager;
    public spawner!: Spawner;
    public waves!: WaveController;

    private cfg: GameConfig = getDefaultConfig('Normal');

    constructor() {
        super('GameScene');
    }

    preload() {
        HEROES_DATA.forEach(hero => {
            this.load.image(hero.imageKey, hero.assetPath);
            this.load.audio(hero.imageKey + '_sound', hero.fireSound);
            this.load.image(hero.imageKey + '_effect', hero.fireEffect);
        });
        this.load.image('BasicFire', 'assets/images/BasicFire.png');
        this.load.image('RareFire', 'assets/images/RareFire.png');
        this.load.image('EpicFire', 'assets/images/EpicFire.png');
        this.load.image('LegendaryFire', 'assets/images/LegendaryFire.png');
        this.load.image('star_particle', 'assets/images/star_particle.png');
    }

    create() {
        // 시스템 초기화
        this.gameStateManager = new GameStateManager(this);
        this.entityManager = new EntityManager(this);
        this.economyManager = new EconomyManager(this);
        this.upgradeManager = new UpgradeManager(this);
        this.heroManager = new HeroManager(this);
        this.skillManager = new SkillManager(this);
        this.gridManager = new GridManager(this);
        this.spawner = new Spawner(this, this.waypointsTop, this.waypointsBottom);
        this.waves = new WaveController(
            this,
            this.spawner,
            this.cfg,
            (reason) => this.gameStateManager.endGame(false, reason),
            () => {},
            () => this.gameStateManager.winGame(),
            (waveIndex) => this.economyManager.grantWaveClearGold(waveIndex),
            MAX_ALIVE
        );
        this.uiManager = new UIManager(this);

        // 전역 사운드 제한 설정
        this.sound.maxAudio = 15; // 최대 15개의 사운드 동시 재생 허용

        // 초기 상태 리셋
        this.reset();

        // UI 생성
        this.uiManager.create();

        // 디버그 경로
        this.drawDebugPaths();
    }

    update(_: number, delta: number) {
        const dt = (delta / 1000) * this.gameStateManager.gameSpeed;

        this.entityManager.update(dt);
        this.gridManager.update();
        this.waves.update(dt, this.gameStateManager.mode, this.entityManager.enemies);
        this.uiManager.update();
    }

    private drawDebugPaths() {
        for (let i = 0; i < this.waypointsTop.length; i++) {
            const a = this.waypointsTop[i];
            const b = this.waypointsTop[(i + 1) % this.waypointsTop.length];
            this.add.line(0, 0, a.x, a.y, b.x, b.y, 0x224488).setOrigin(0).setLineWidth(3);
        }
        for (let i = 0; i < this.waypointsBottom.length; i++) {
            const a = this.waypointsBottom[i];
            const b = this.waypointsBottom[(i + 1) % this.waypointsBottom.length];
            this.add.line(0, 0, a.x, a.y, b.x, b.y, 0x334455).setOrigin(0).setLineWidth(3);
        }
    }

    private reset() {
        this.gameStateManager.reset();
        this.entityManager.reset();
        this.economyManager.reset();
        this.upgradeManager.reset();
        this.gridManager.cleanup(false);
    }

    private cleanup(hard = false) {
        this.gameStateManager.cleanup(hard);
        this.economyManager.cleanup();
        this.uiManager.cleanup();
        this.entityManager.reset();
        this.gridManager.cleanup(hard);
    }
}