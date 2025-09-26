// src/systems/UpgradeManager.ts
import { GameScene } from '../scenes/GameScene';
import { RarityGroup } from '../core/types';
import { PERMANENT_UPGRADE_CONFIG, getRarityGroup } from '../core/config';
import { THEME } from '../core/constants';

export class UpgradeManager {
    public permanentUpgradeLevels: Record<RarityGroup, number> = {
        NormalRare: 0,
        Epic: 0,
        LegendaryMythical: 0,
    };
    public summonLevel: number = 1;

    constructor(private scene: GameScene) {}

    getUpgradeInfos() {
        const infos: any = {};
        for (const key in this.permanentUpgradeLevels) {
            const rarityGroup = key as RarityGroup;
            const level = this.permanentUpgradeLevels[rarityGroup];
            const config = PERMANENT_UPGRADE_CONFIG[rarityGroup];
            const cost = config.baseCost + config.costIncrease * level;
            infos[rarityGroup] = { level, cost };
        }
        return infos;
    }

    handlePermanentUpgrade(rarityGroup: RarityGroup) {
        const level = this.permanentUpgradeLevels[rarityGroup];
        const config = PERMANENT_UPGRADE_CONFIG[rarityGroup];
        const cost = config.baseCost + config.costIncrease * level;

        if (this.scene.economyManager.spendGold(cost)) {
            this.permanentUpgradeLevels[rarityGroup]++;
            this.scene.uiManager.toast.show(`${rarityGroup} 등급 업그레이드! (레벨 ${this.permanentUpgradeLevels[rarityGroup]})`, THEME.success);

            this.scene.entityManager.heroes.forEach(hero => {
                if (getRarityGroup(hero.getGrade()) === rarityGroup) {
                    hero.updateAttackWithPermanentUpgrade(this.permanentUpgradeLevels[rarityGroup]);
                }
            });

            this.scene.uiManager.upgradePanel.updateInfo(this.getUpgradeInfos());
        } else {
            this.scene.uiManager.toast.show(`골드가 부족합니다! (필요: ${cost})`, THEME.danger);
        }
    }
    
    reset() {
        this.permanentUpgradeLevels = {
            NormalRare: 0,
            Epic: 0,
            LegendaryMythical: 0,
        };
    }
}
