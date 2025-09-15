// src/ui/HeroActionPanel.ts
import Phaser from 'phaser';
import { THEME, HERO_SUMMON_COST, HERO_SELL_BASE_RETURN_RATE, HERO_SELL_RANK_BONUS_RATE } from '../core/constants';
import { Hero } from '../objects/Hero';

export class HeroActionPanel {
    private scene: Phaser.Scene;
    private container: Phaser.GameObjects.Container;
    private hero: Hero | null = null;

    private upgradeButtonText!: Phaser.GameObjects.Text;
    private sellButtonText!: Phaser.GameObjects.Text;

    private onUpgrade: (hero: Hero) => void;
    private onSell: (hero: Hero) => void;

    constructor(scene: Phaser.Scene, onUpgrade: (hero: Hero) => void, onSell: (hero: Hero) => void) {
        this.scene = scene;
        this.onUpgrade = onUpgrade;
        this.onSell = onSell;

        this.container = this.scene.add.container(0, 0);
        this.container.setDepth(20).setVisible(false);

        this.createPanel();
    }

    private createPanel() {
        const background = this.scene.add.graphics();
        background.fillStyle(0x000000, 0.7);
        background.fillRoundedRect(-100, -40, 200, 80, 10);
        background.lineStyle(2, 0xffffff, 0.5);
        background.strokeRoundedRect(-100, -40, 200, 80, 10);

        const { container: upgradeButton, text: upgradeText } = this.createButton('업그레이드', -50, 0, () => {
            if (this.hero) this.onUpgrade(this.hero);
        });
        const { container: sellButton, text: sellText } = this.createButton('판매', 50, 0, () => {
            if (this.hero) this.onSell(this.hero);
        });

        this.upgradeButtonText = upgradeText;
        this.sellButtonText = sellText;

        this.container.add([background, upgradeButton, sellButton]);
    }

    private createButton(text: string, x: number, y: number, onClick: () => void): {
        container: Phaser.GameObjects.Container,
        text: Phaser.GameObjects.Text
    } {
        const buttonContainer = this.scene.add.container(x, y);
        const buttonWidth = 80;
        const buttonHeight = 50;

        const buttonBg = this.scene.add.graphics();
        buttonBg.fillStyle(parseInt(THEME.neutral.substring(1), 16), 1);
        buttonBg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 8);

        const buttonText = this.scene.add.text(0, -8, text, {
            fontFamily: THEME.font,
            fontSize: '16px',
            color: THEME.text,
        }).setOrigin(0.5);

        buttonContainer.add([buttonBg, buttonText]);
        buttonContainer.setSize(buttonWidth, buttonHeight);
        buttonContainer.setInteractive({ useHandCursor: true })
            .on('pointerdown', (pointer: Phaser.Input.Pointer, localX: number, localY: number, event: Phaser.Types.Input.EventData) => {
                event.stopPropagation(); // 이벤트 버블링 방지
                onClick();
            })
            .on('pointerover', () => buttonBg.fillStyle(parseInt(THEME.neutral_dark.substring(1), 16), 1).fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 8))
            .on('pointerout', () => buttonBg.fillStyle(parseInt(THEME.neutral.substring(1), 16), 1).fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 8));

        return { container: buttonContainer, text: buttonText };
    }

    public show(hero: Hero) {
        this.hero = hero;
        this.container.setPosition(hero.x, hero.y - 60);
        this.container.setVisible(true);

        // 판매 가격 계산 및 텍스트 업데이트
        const baseSellPrice = HERO_SUMMON_COST * HERO_SELL_BASE_RETURN_RATE;
        const rankBonus = HERO_SUMMON_COST * HERO_SELL_RANK_BONUS_RATE * (hero.rank - 1);
        const sellPrice = Math.floor(baseSellPrice + rankBonus);

        this.sellButtonText.setText(`판매\n(+${sellPrice}G)`);
        this.upgradeButtonText.setText(`업그레이드\n(준비중)`);
    }

    public hide() {
        this.hero = null;
        this.container.setVisible(false);
    }

    public isVisible(): boolean {
        return this.container.visible;
    }

    public destroy() {
        this.container.destroy();
    }
}