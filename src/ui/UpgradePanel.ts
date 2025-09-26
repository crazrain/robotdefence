import Phaser from 'phaser';
import { THEME } from '../core/constants';
import { RarityGroup } from '../core/types';
import { GameScene } from '../scenes/GameScene';

type UpgradeInfo = {
    level: number;
    cost: number;
};

export class UpgradePanel {
    private container: Phaser.GameObjects.Container;
    private background: Phaser.GameObjects.Graphics;

    constructor(
        private scene: GameScene,
        private onUpgrade: (rarityGroup: RarityGroup) => void
    ) {
        this.container = this.scene.add.container(this.scene.scale.width / 2, this.scene.scale.height / 2);
        this.container.setDepth(30).setVisible(false);

        this.background = this.scene.add.graphics();
        this.container.add(this.background);

        this.createPanel();
    }

    private createPanel() {
        this.background.fillStyle(0x111111, 0.9);
        this.background.fillRoundedRect(-250, -150, 500, 300, 15);
        this.background.lineStyle(2, 0xffffff, 0.5);
        this.background.strokeRoundedRect(-250, -150, 500, 300, 15);

        const title = this.scene.add.text(0, -120, '영구 능력치 업그레이드', {
            fontFamily: THEME.font,
            fontSize: '24px',
            color: THEME.text,
        }).setOrigin(0.5);
        this.container.add(title);

        const closeButton = this.scene.add.text(230, -130, 'X', {
            fontFamily: THEME.font,
            fontSize: '24px',
            color: THEME.text,
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        closeButton.on('pointerdown', () => this.hide());
        this.container.add(closeButton);

        this.createUpgradeButton('NormalRare', '노멀 ~ 레어', -50);
        this.createUpgradeButton('Epic', '영웅', 20);
        this.createUpgradeButton('LegendaryMythical', '전설 ~ 신화', 90);
    }

    private createUpgradeButton(rarityGroup: RarityGroup, text: string, y: number) {
        const buttonContainer = this.scene.add.container(0, y);
        this.container.add(buttonContainer);

        const buttonBg = this.scene.add.graphics();
        buttonContainer.add(buttonBg);

        const buttonText = this.scene.add.text(0, -10, text, {
            fontFamily: THEME.font,
            fontSize: '20px',
            color: THEME.text,
            align: 'center',
        }).setOrigin(0.5);
        buttonContainer.add(buttonText);

        const infoText = this.scene.add.text(0, 20, '', {
            fontFamily: THEME.font,
            fontSize: '16px',
            color: THEME.text,
            align: 'center',
        }).setOrigin(0.5);
        buttonContainer.add(infoText);

        buttonContainer.setData('infoText', infoText);
        buttonContainer.setData('rarityGroup', rarityGroup);

        const buttonWidth = 400;
        const buttonHeight = 60;

        buttonBg.fillStyle(parseInt(THEME.neutral.substring(1), 16), 1);
        buttonBg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 8);

        buttonContainer.setSize(buttonWidth, buttonHeight);
        buttonContainer.setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                this.onUpgrade(rarityGroup);
            })
            .on('pointerover', () => buttonBg.fillStyle(parseInt(THEME.neutral_dark.substring(1), 16), 1).fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 8))
            .on('pointerout', () => buttonBg.fillStyle(parseInt(THEME.neutral.substring(1), 16), 1).fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 8));
    }

    public updateInfo(upgradeInfos: Record<RarityGroup, UpgradeInfo & { isMax: boolean }>) {
        this.container.each((child: Phaser.GameObjects.GameObject) => {
            if (child instanceof Phaser.GameObjects.Container && child.getData('rarityGroup')) {
                const buttonContainer = child;
                const rarityGroup = buttonContainer.getData('rarityGroup') as RarityGroup;
                const info = upgradeInfos[rarityGroup];
                const infoText = buttonContainer.getData('infoText') as Phaser.GameObjects.Text;
                const buttonBg = buttonContainer.getAt(0) as Phaser.GameObjects.Graphics;
                const buttonWidth = 400;
                const buttonHeight = 60;

                if (info.isMax) {
                    infoText.setText('레벨: MAX');
                    buttonContainer.disableInteractive();
                    buttonBg.fillStyle(0x555555, 0.8);
                    buttonBg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 8);
                } else {
                    infoText.setText(`레벨: ${info.level} | 비용: ${info.cost}G`);
                    buttonContainer.setInteractive({ useHandCursor: true });
                    buttonBg.fillStyle(parseInt(THEME.neutral.substring(1), 16), 1);
                    buttonBg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 8);
                }
            }
        });
    }

    public show(upgradeInfos: Record<RarityGroup, UpgradeInfo>) {
        this.container.setVisible(true);
        this.scene.time.delayedCall(1, () => {
            this.updateInfo(upgradeInfos);
        });
    }

    public hide() {
        this.container.setVisible(false);
    }

    public isVisible(): boolean {
        return this.container.visible;
    }
}
