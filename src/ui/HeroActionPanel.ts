// src/ui/HeroActionPanel.ts
import Phaser from 'phaser';
import { THEME, HERO_SUMMON_COST, HERO_SELL_BASE_RETURN_RATE, HERO_SELL_RANK_BONUS_RATE } from '../core/constants';
import { Hero } from '../objects/Hero';

export class HeroActionPanel {
    private scene: Phaser.Scene;
    private container: Phaser.GameObjects.Container;
    private hero: Hero | null = null;

    private upgradeButtonText!: Phaser.GameObjects.Text;
    private upgradeButtonContainer!: Phaser.GameObjects.Container;
    private sellButtonText!: Phaser.GameObjects.Text;
    private sellButtonContainer!: Phaser.GameObjects.Container;
    private background!: Phaser.GameObjects.Graphics;

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
        this.background = this.scene.add.graphics();
        this.background.fillStyle(0x000000, 0.7);
        this.background.fillRoundedRect(-100, -40, 200, 80, 10);
        this.background.lineStyle(2, 0xffffff, 0.5);
        this.background.strokeRoundedRect(-100, -40, 200, 80, 10);

        const { container: upgradeButton, text: upgradeText } = this.createButton('업그레이드', -50, 0, () => {
            if (this.hero) this.onUpgrade(this.hero);
        });
        const { container: sellButton, text: sellText } = this.createButton('판매', 50, 0, () => {
            if (this.hero) this.onSell(this.hero);
        });

        this.upgradeButtonContainer = upgradeButton;
        this.upgradeButtonText = upgradeText;
        this.sellButtonContainer = sellButton;
        this.sellButtonText = sellText;

        this.container.add([this.background, upgradeButton, sellButton]);
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

        const buttonText = this.scene.add.text(0, 0, text, {
            fontFamily: THEME.font,
            fontSize: '16px',
            color: THEME.text,
            align: 'center', // 텍스트를 중앙 정렬
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

        const isMaxRank = hero.rank >= 5; // 최고 등급 확인

        this.background.clear(); // 이전 배경 지우기

        if (isMaxRank) {
            // 최고 등급: 판매 버튼 숨기고, 업그레이드 버튼을 중앙으로 이동, 패널 크기 축소
            this.sellButtonContainer.setVisible(false);
            this.upgradeButtonContainer.setVisible(true).setPosition(0, 0); // 중앙으로
            this.upgradeButtonText.setText(`업그레이드\n(준비중)`);

            this.background.fillStyle(0x000000, 0.7);
            this.background.fillRoundedRect(-50, -40, 100, 80, 10); // 작은 배경
            this.background.lineStyle(2, 0xffffff, 0.5);
            this.background.strokeRoundedRect(-50, -40, 100, 80, 10);
        } else {
            // 일반 등급: 모든 버튼 표시 및 원래 위치/크기로 설정
            this.sellButtonContainer.setVisible(true);
            this.upgradeButtonContainer.setVisible(true).setPosition(-50, 0); // 원래 위치로
            this.upgradeButtonText.setText(`업그레이드\n(준비중)`);
            this.sellButtonText.setText(`판매\n(+${sellPrice}G)`);

            this.background.fillStyle(0x000000, 0.7);
            this.background.fillRoundedRect(-100, -40, 200, 80, 10); // 원래 배경
            this.background.lineStyle(2, 0xffffff, 0.5);
            this.background.strokeRoundedRect(-100, -40, 200, 80, 10);
        }
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