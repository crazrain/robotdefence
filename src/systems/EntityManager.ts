// src/systems/EntityManager.ts
import { GameScene } from '../scenes/GameScene';
import { Enemy } from '../objects/Enemy';
import { Unit } from '../objects/Unit';
import { Projectile } from '../objects/Projectile';
import { Hero } from '../objects/Hero';

export class EntityManager {
    public enemies: Enemy[] = [];
    public units: Unit[] = [];
    public projectiles: Projectile[] = [];
    public heroes: Hero[] = [];

    constructor(private scene: GameScene) {}

    update(dt: number) {
        for (const u of this.units) u.update(dt, this.enemies, this.projectiles);
        for (const hero of this.heroes) {
            hero.update(dt, this.enemies, this.projectiles);
        }
        // Loop backwards to allow for safe removal during iteration
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(dt);
            if (!enemy.alive) {
                this.enemies.splice(i, 1);
            }
        }

        // Do the same for projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            projectile.update(dt);
            if (!projectile.alive) {
                this.projectiles.splice(i, 1);
            }
        }
    }

    reset() {
        this.units.forEach((u) => u.destroy());
        this.enemies.forEach((e) => e.destroy());
        this.projectiles.forEach((p) => p.destroy());
        this.heroes.forEach(h => h.destroy());
        this.units.length = 0;
        this.enemies.length = 0;
        this.projectiles.length = 0;
        this.heroes.length = 0;
    }

    addHero(hero: Hero) {
        this.heroes.push(hero);
    }

    removeHero(hero: Hero) {
        const index = this.heroes.indexOf(hero);
        if (index > -1) {
            this.heroes.splice(index, 1);
        }
        hero.destroy();
    }
}
