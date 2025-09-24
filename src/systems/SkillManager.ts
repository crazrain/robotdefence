// src/systems/SkillManager.ts
import { GameScene } from '../scenes/GameScene';
import { Hero } from '../objects/Hero';
import { THEME } from '../core/constants';
import { SKILLS_DATA } from '../data/skillData';

const SKILL_UPGRADE_COST = 500;

export class SkillManager {
    constructor(private scene: GameScene) {}

    upgradeSkill(hero: Hero, skillId: string) {
        const skill = hero.skills.find(s => s.skillId === skillId);
        if (!skill) return;

        const skillData = SKILLS_DATA.find(s => s.id === skillId);
        if (!skillData) return;

        if (skill.level >= skillData.maxLevel) {
            this.scene.uiManager.toast.show('이미 최고 레벨 스킬입니다.', THEME.danger);
            return;
        }

        if (this.scene.economyManager.spendGold(SKILL_UPGRADE_COST)) {
            hero.levelUpSkill(skillId);
            this.scene.uiManager.toast.show(`${skillData.name} 스킬 레벨 업! (레벨 ${skill.level})`, THEME.success);
        } else {
            this.scene.uiManager.toast.show(`골드가 부족합니다! (필요: ${SKILL_UPGRADE_COST})`, THEME.danger);
        }
    }
}
