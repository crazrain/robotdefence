// src/ui/HeroActionPanel.ts
import Phaser from 'phaser';
import { THEME } from '../core/constants';
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
    private combineButtonContainer!: Phaser.GameObjects.Container;

    private onUpgrade: (hero: Hero) => void;
    private onSell: (hero: Hero) => void;
    private onCombine: (hero: Hero) => void;

    constructor(scene: Phaser.Scene, onUpgrade: (hero: Hero) => void, onSell: (hero: Hero) => void, onCombine: (hero: Hero) => void) {
        this.scene = scene;
        this.onUpgrade = onUpgrade;
        this.onSell = onSell;
        this.onCombine = onCombine;

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

        const { container: combineButton } = this.createButton('합성', 100, 0, () => {
            if (this.hero) this.onCombine(this.hero);
        });
        this.combineButtonContainer = combineButton;

        this.upgradeButtonContainer = upgradeButton;
        this.upgradeButtonText = upgradeText;
        this.sellButtonContainer = sellButton;
        this.sellButtonText = sellText;

        this.container.add([this.background, upgradeButton, sellButton, combineButton]);
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
        const sellPrice = hero.getSellPrice();

        const isRank5 = hero.rank >= 5; // 5등급 (최고 등급)
        const isRank4 = hero.rank === 4; // 4등급

        // 합성 가능 여부 확인: 같은 등급의 영웅 3명이 한 셀에 있고, 최고 등급이 아닐 때
        const canCombine = hero.cell && hero.cell.occupiedHeroes.length === 3 && !isRank5 && !isRank4 && hero.cell.occupiedHeroes.every(h => h.rank === hero.rank);

        this.background.clear(); // 이전 배경 지우기

        if (canCombine) {
            // 3개 버튼: 업그레이드, 판매, 합성
            this.upgradeButtonContainer.setVisible(true).setPosition(-100, 0);
            this.sellButtonContainer.setVisible(true).setPosition(0, 0);
            this.combineButtonContainer.setVisible(true).setPosition(100, 0);

            this.background.fillStyle(0x000000, 0.7);
            this.background.fillRoundedRect(-150, -40, 300, 80, 10); // 넓은 배경
            this.background.lineStyle(2, 0xffffff, 0.5);
            this.background.strokeRoundedRect(-150, -40, 300, 80, 10);
        } else if (isRank5) {
            // 5등급: '업그레이드' 버튼만 표시 (판매 불가)
            this.upgradeButtonContainer.setVisible(true).setPosition(0, 0);
            this.sellButtonContainer.setVisible(false);
            this.combineButtonContainer.setVisible(false);

            this.background.fillStyle(0x000000, 0.7);
            this.background.fillRoundedRect(-50, -40, 100, 80, 10); // 작은 배경
            this.background.lineStyle(2, 0xffffff, 0.5);
            this.background.strokeRoundedRect(-50, -40, 100, 80, 10);
        } else {
            // 1~4등급 (합성 불가 시): '업그레이드', '판매' 버튼 표시
            this.upgradeButtonContainer.setVisible(true).setPosition(-50, 0);
            this.sellButtonContainer.setVisible(true).setPosition(50, 0);
            this.combineButtonContainer.setVisible(false);

            this.background.fillStyle(0x000000, 0.7);
            this.background.fillRoundedRect(-100, -40, 200, 80, 10); // 중간 크기 배경
            this.background.lineStyle(2, 0xffffff, 0.5);
            this.background.strokeRoundedRect(-100, -40, 200, 80, 10);
        }

        // 버튼 텍스트는 항상 업데이트
        this.upgradeButtonText.setText(`업그레이드\n(준비중)`);
        this.sellButtonText.setText(`판매\n(+${sellPrice}G)`);
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