// src/systems/EconomyManager.ts
import { GameScene } from '../scenes/GameScene';
import { THEME, WAVE_CLEAR_BASE, WAVE_CLEAR_GROWTH } from '../core/constants';
import { HERO_SUMMON_COST } from '../data/heroData';
import { Toast } from '../ui/Toast';

export class EconomyManager {
    public gold: number = 200;
    private toast: Toast;

    constructor(private scene: GameScene) {
        this.toast = new Toast(scene);
        this.scene.events.on('enemy_killed', this.handleEnemyKilled, this);
    }

    private handleEnemyKilled(payload: { x: number; y: number; maxHp: number; bounty: number }) {
        this.addGold(payload.bounty);
        const t = this.scene.add
            .text(payload.x, payload.y - 18, `+${payload.bounty}`, {
                color: THEME.warning,
                fontSize: '18px',
                fontFamily: THEME.font
            })
            .setOrigin(0.5)
            .setDepth(20);
        this.scene.tweens.add({ targets: t, y: t.y - 20, alpha: 0, duration: 500, onComplete: () => t.destroy() });
    }

    grantWaveClearGold(waveIndex: number) {
        const bonus = Math.max(1, Math.floor(WAVE_CLEAR_BASE * Math.pow(1 + WAVE_CLEAR_GROWTH, waveIndex)));
        this.addGold(bonus);
        this.toast.show(`웨이브 클리어 보상 +${bonus}`, THEME.success);
    }

    onHeroSummoned() {
        this.spendGold(HERO_SUMMON_COST);
        this.toast.show(`영웅 소환! (-${HERO_SUMMON_COST}G)`, THEME.primary);
    }
    
    addGold(amount: number) {
        this.gold += amount;
    }

    spendGold(amount: number): boolean {
        if (this.gold >= amount) {
            this.gold -= amount;
            return true;
        }
        return false;
    }

    getGold(): number {
        return this.gold;
    }
    
    reset() {
        this.gold = 200;
    }

    cleanup() {
        this.scene.events.off('enemy_killed', this.handleEnemyKilled, this);
    }
}
