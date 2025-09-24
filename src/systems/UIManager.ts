// src/systems/UIManager.ts
import Phaser from 'phaser';
import { GameScene } from '../scenes/GameScene';
import { HUD } from '../ui/HUD';
import { ModeSelector } from '../ui/ModeSelector';
import { SummonButton } from '../ui/SummonButton';
import { SpeedControlButton } from '../ui/SpeedControlButton';
import { Toast } from '../ui/Toast';
import { HeroActionPanel } from '../ui/HeroActionPanel';
import { UpgradeButton } from '../ui/UpgradeButton';
import { UpgradePanel } from '../ui/UpgradePanel';
import { BossAlert } from '../ui/BossAlert';
import { GAME_WIDTH, GAME_HEIGHT, THEME } from '../core/constants';
import { GAME_VERSION } from '../core/version';
import { RarityGroup } from '../core/types';
import { HERO_SUMMON_COST } from '../data/heroData';

const VOLUME_STORAGE_KEY = 'robot-defence-volume';

export class UIManager {
    public hud!: HUD;
    public modeSelector!: ModeSelector;
    public summonButton!: SummonButton;
    public speedControlButton!: SpeedControlButton;
    public heroActionPanel!: HeroActionPanel;
    public upgradeButton!: UpgradeButton;
    public upgradePanel!: UpgradePanel;
    public toast!: Toast;

    private volumeLabel?: Phaser.GameObjects.Text;
    private volumeBackground?: Phaser.GameObjects.Rectangle;
    private volumeSlider?: Phaser.GameObjects.Rectangle;
    private volumeValueText?: Phaser.GameObjects.Text;
    private volumeBorder?: Phaser.GameObjects.Graphics;

    private readonly volumeUiX = 100;
    private readonly volumeLabelY = 90;
    private readonly volumeSliderY = 120;
    private readonly volumeSliderWidth = 90;
    private readonly volumeSliderHeight = 20;
    private volumeSliderMinX = 0;
    private volumeSliderMaxX = 0;

    constructor(private scene: GameScene) {}

    create() {
        this.scene.cameras.main.setBackgroundColor(THEME.background);

        this.scene.add.text(GAME_WIDTH - 10, GAME_HEIGHT - 10, `v${GAME_VERSION}`, {
            fontSize: '12px',
            color: THEME.text,
            fontFamily: THEME.font
        }).setOrigin(1, 1).setDepth(100);

        this.hud = new HUD(this.scene);
        this.hud.create();

        this.toast = new Toast(this.scene);

        this.heroActionPanel = new HeroActionPanel(
            this.scene,
            (hero) => this.scene.heroManager.sellHero(hero),
            (hero) => this.scene.heroManager.combineHero(hero)
        );

        this.scene.events.on('boss_wave_start', () => {
            const bossAlert = new BossAlert(this.scene);
            bossAlert.show();
        });

        this.modeSelector = new ModeSelector(this.scene, (m) => {
            this.scene.gameStateManager.mode = m;
            this.scene.waves.start(m, 0);
            
            this.summonButton = new SummonButton(this.scene, () => {
                if (this.scene.economyManager.getGold() >= HERO_SUMMON_COST) {
                    if (this.scene.gridManager.trySummonHero()) {
                        this.scene.economyManager.onHeroSummoned();
                    }
                } else {
                    this.toast.show(`골드가 부족합니다! (필요: ${HERO_SUMMON_COST})`, THEME.danger);
                }
            });
            this.summonButton.create();

            this.upgradeButton = new UpgradeButton(this.scene, () => {
                if (this.upgradePanel.isVisible()) {
                    this.upgradePanel.hide();
                } else {
                    this.upgradePanel.show(this.scene.upgradeManager.getUpgradeInfos());
                }
            });
            this.upgradeButton.create();
        });
        this.modeSelector.show();

        this.upgradePanel = new UpgradePanel(this.scene, (rarityGroup) => {
            this.scene.upgradeManager.handlePermanentUpgrade(rarityGroup);
        });

        this.speedControlButton = new SpeedControlButton(this.scene, GAME_WIDTH - 20, this.volumeSliderY);
        
        this.createVolumeSlider();
    }

    private createVolumeSlider() {
        this.volumeLabel = this.scene.add.text(this.volumeUiX, this.volumeLabelY, 'Volume:', { color: THEME.text, fontSize: '18px', fontFamily: THEME.font }).setOrigin(0, 0.5).setDepth(10);
        this.volumeValueText = this.scene.add.text(this.volumeUiX + 75, this.volumeLabelY, `${Math.round(this.scene.sound.volume * 100)}%`, { color: THEME.text, fontSize: '18px', fontFamily: THEME.font }).setOrigin(0, 0.5).setDepth(10);
        this.volumeBackground = this.scene.add.rectangle(this.volumeUiX, this.volumeSliderY, this.volumeSliderWidth, this.volumeSliderHeight, THEME.neutral).setDepth(10);
        this.volumeBorder = this.scene.add.graphics().setDepth(10);
        this.volumeBorder.lineStyle(2, parseInt(THEME.neutral_dark.substring(1), 16), 1);
        this.volumeBorder.strokeRect(this.volumeUiX - this.volumeSliderWidth, this.volumeSliderY - this.volumeSliderHeight / 2, this.volumeSliderWidth * 2, this.volumeSliderHeight);

        this.volumeSlider = this.scene.add.rectangle(this.volumeUiX, this.volumeSliderY, this.volumeSliderWidth, this.volumeSliderHeight, parseInt(THEME.primary.substring(1), 16)).setDepth(11);
        this.volumeSlider.setInteractive();

        this.volumeSliderMinX = this.volumeUiX - this.volumeSliderWidth / 2;
        this.volumeSliderMaxX = this.volumeUiX + this.volumeSliderWidth / 2;

        const savedVolume = localStorage.getItem(VOLUME_STORAGE_KEY);
        this.scene.sound.volume = savedVolume ? parseFloat(savedVolume) : 0.5;

        this.volumeSlider.x = this.volumeSliderMinX + (this.scene.sound.volume * this.volumeSliderWidth);
        this.volumeValueText.setText(`${Math.round(this.scene.sound.volume * 100)}%`);

        this.scene.input.setDraggable(this.volumeSlider);

        this.volumeSlider.on('drag', (pointer: Phaser.Input.Pointer, dragX: number) => {
            const newX = Phaser.Math.Clamp(dragX, this.volumeSliderMinX, this.volumeSliderMaxX);
            this.volumeSlider!.x = newX;
            this.scene.sound.volume = (newX - this.volumeSliderMinX) / this.volumeSliderWidth;
            this.volumeValueText!.setText(`${Math.round(this.scene.sound.volume * 100)}%`);
        });

        this.volumeSlider.on('dragend', () => {
            localStorage.setItem(VOLUME_STORAGE_KEY, this.scene.sound.volume.toString());
        });
    }
    
    update() {
        this.hud.update(
            this.scene.economyManager.getGold(),
            this.scene.entityManager.units.length + this.scene.entityManager.heroes.length,
            this.scene.entityManager.enemies.length,
            this.scene.waves.MAX_ALIVE,
            this.scene.waves,
            this.scene.gameStateManager.mode
        );
    }

    cleanup() {
        this.summonButton?.container.destroy();
        this.upgradeButton?.container.destroy();
        this.upgradePanel?.hide();
        this.speedControlButton?.destroy();
        this.volumeLabel?.destroy();
        this.volumeBackground?.destroy();
        this.volumeSlider?.destroy();
        this.volumeValueText?.destroy();
        this.heroActionPanel?.destroy();
    }
}
