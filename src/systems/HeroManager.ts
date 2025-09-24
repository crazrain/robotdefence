// src/systems/HeroManager.ts
import { GameScene } from '../scenes/GameScene';
import { Hero } from '../objects/Hero';
import { THEME } from '../core/constants';

export class HeroManager {
    constructor(private scene: GameScene) {}

    sellHero(hero: Hero) {
        const sellPrice = hero.getSellPrice();
        this.scene.economyManager.addGold(sellPrice);
        this.scene.uiManager.toast.show(`${hero.rank}등급 영웅 판매 (+${sellPrice}G)`, THEME.success);
        this.scene.gridManager.removeHero(hero);
        this.scene.gridManager.clearSelection();
        this.scene.uiManager.heroActionPanel.hide();
    }

    combineHero(hero: Hero) {
        if (hero.cell) {
            this.scene.gridManager.checkForCombination(hero.cell);
            this.scene.gridManager.clearSelection();
        }
        this.scene.uiManager.heroActionPanel.hide();
    }
}
