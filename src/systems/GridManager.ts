// src/systems/GridManager.ts
import Phaser from 'phaser';
import { GameScene } from '../scenes/GameScene';
import {
    buildBottomGrid,
    type GridCell,
    type GridMetrics,
    worldToCell,
    cellToWorld,
    addHeroToCell,
    removeHeroFromCell,
    isCellEmpty,
    isCellFull,
    MAX_HEROES_PER_CELL
} from '../core/Grid';
import { Hero } from '../objects/Hero';
import { HERO_MOVE_RANGE, MAX_HEROES, THEME } from '../core/constants';
import { HEROES_DATA, HERO_SUMMON_COST } from '../data/heroData';
import type { Grade, HeroType } from '../core/types';
import { getRarityGroup } from '../core/config';

export class GridManager {
    private scene: GameScene;
    private gridGfx?: Phaser.GameObjects.Graphics;
    private cellGfx?: Phaser.GameObjects.Graphics;
    private rangeGfx?: Phaser.GameObjects.Graphics;
    private movableCellsGfx?: Phaser.GameObjects.Graphics;
    private movableCellRects: Phaser.GameObjects.Rectangle[] = [];
    private selectedCell: GridCell | null = null;
    private selectedHero: Hero | null = null;
    private gridDebug = true;
    private gridMetrics!: GridMetrics;
    private gridCells: GridCell[] = [];
    private _cachedProbabilities: number[] = [];
    private _cachedSummonLevel = -1; // 캐시되지 않았음을 나타내는 초기값

    constructor(scene: GameScene) {
        this.scene = scene;
        this.initialize();
    }

    private initialize() {
        const built = buildBottomGrid();
        this.gridMetrics = built.metrics;
        this.gridCells = built.cells;
        this.gridCells.forEach(cell => cell.occupiedHeroes = []);

        if (this.gridDebug) {
            this.gridGfx = this.scene.add.graphics().setDepth(2);
            this.drawGridDebug();
        }
        this.cellGfx = this.scene.add.graphics().setDepth(1);
        this.rangeGfx = this.scene.add.graphics({ lineStyle: { width: 2, color: 0x00ffff, alpha: 0.5 } }).setDepth(10);

        this.scene.input.on('pointerdown', this.handlePointerDown.bind(this));
    }

    public reset() {
        const built = buildBottomGrid();
        this.gridMetrics = built.metrics;
        this.gridCells = built.cells;
        this.gridCells.forEach(cell => cell.occupiedHeroes = []);
        this.cellGfx?.clear();
        this.selectedCell = null;
        this.selectedHero = null;
    }

    private getGradeFromHeroType(heroType: string): Grade {
        switch (heroType) {
            case 'TypeA': return 'Basic';
            case 'TypeB': return 'Rare';
            case 'TypeC': return 'Epic';
            case 'TypeD': return 'Legendary';
            case 'TypeE': return 'Mythical';
            default: return 'Basic';
        }
    }

    public trySummonHero() {
        if (this.scene.heroes.length >= MAX_HEROES) {
            this.scene.toast.show(`영웅은 ${MAX_HEROES}명까지 소환할 수 있습니다`, THEME.danger);
            return false;
        }

        const randomHeroGradeType = this.getRandomHeroTypeByWeight();

        const heroesOfSameGrade = HEROES_DATA.filter(h => h.type === randomHeroGradeType);
        if (heroesOfSameGrade.length === 0) {
            console.error(`No heroes found for type: ${randomHeroGradeType}`);
            return false;
        }
        const randomHeroData = Phaser.Math.RND.pick(heroesOfSameGrade);

        const preferredCells = this.gridCells.filter(cell =>
            !isCellEmpty(cell) &&
            !isCellFull(cell) &&
            cell.occupiedHeroes[0].imageKey === randomHeroData.imageKey
        );
        const fallbackCells = this.gridCells.filter(isCellEmpty);
        const cellsToTry = [...preferredCells, ...fallbackCells];

        for (const targetCell of cellsToTry) {
            const { x: targetCellCenterX, y: targetCellCenterY } = cellToWorld(targetCell.col, targetCell.row, this.gridMetrics);
            
            const grade = this.getGradeFromHeroType(randomHeroData.type);
            const rarityGroup = getRarityGroup(grade);
            const permanentUpgradeLevel = this.scene.permanentUpgradeLevels[rarityGroup];
            const newHero = new Hero(this.scene, targetCellCenterX, targetCellCenterY, randomHeroData.imageKey, permanentUpgradeLevel);

            if (addHeroToCell(targetCell, newHero)) {
                newHero.setDepth(5);
                this.scene.heroes.push(newHero);
                newHero.cell = targetCell;
                this.redrawAllCellBackgrounds();
                this.repositionHeroesInCell(targetCell);

                const fx = this.scene.add.circle(targetCellCenterX, targetCellCenterY, 4, 0x99ddff).setAlpha(0.8);
                this.scene.tweens.add({ targets: fx, radius: 40, alpha: 0, duration: 250, onComplete: () => fx.destroy() });

                return true;
            } else {
                newHero.destroy();
            }
        }

        this.scene.toast.show('배치 가능한 자리가 없습니다', THEME.danger);
        return false;
    }

    private handlePointerDown(pointer: Phaser.Input.Pointer) {
        const clickedGameObjects = this.scene.input.manager.hitTest(pointer, this.scene.children.list, this.scene.cameras.main);
        const clickedHero = clickedGameObjects.find(obj => obj instanceof Hero) as Hero | undefined;

        if (this.scene.heroActionPanel.isVisible() && !clickedHero) {
            this.scene.heroActionPanel.hide();
        }
        if (this.selectedCell && this.selectedHero) {
            const clickedCellCoords = worldToCell(pointer.worldX, pointer.worldY, this.gridMetrics);

            if (!clickedCellCoords) {
                this.clearSelection();
                return;
            }
            const targetCell = this.gridCells.find(c => c.col === clickedCellCoords.col && c.row === clickedCellCoords.row);
            if (!targetCell) {
                this.clearSelection();
                return;
            }

            if (targetCell === this.selectedCell) {
                this.clearSelection();
                return;
            }

            const movableCells = this.calculateMovableCells(this.selectedCell);
            const isMovable = movableCells.some(cell => cell.col === targetCell.col && cell.row === targetCell.row);

            if (isMovable) {
                this.moveOrSwapHeroes(this.selectedCell, targetCell);
                this.clearSelection();
            } else {
                this.clearSelection();
            }
        } else if (clickedHero) {
            const clickedCellCoords = worldToCell(clickedHero.x, clickedHero.y, this.gridMetrics);
            if (!clickedCellCoords) return;
            const clickedCell = this.gridCells.find(c => c.col === clickedCellCoords.col && c.row === clickedCellCoords.row);
            if (!clickedCell) return;

            this.selectedCell = clickedCell;
            this.selectedHero = clickedHero;
            this.drawRangeDisplay(clickedHero);
            this.drawMovableCells();
            this.scene.heroActionPanel.show(clickedHero);
        } else {
            this.clearSelection();
        }
    }
    
    private moveOrSwapHeroes(oldCell: GridCell, targetCell: GridCell) {
        const { x: oldCellCenterX, y: oldCellCenterY } = cellToWorld(oldCell.col, oldCell.row, this.gridMetrics);
        const { x: targetCellCenterX, y: targetCellCenterY } = cellToWorld(targetCell.col, targetCell.row, this.gridMetrics);
        
        if (isCellEmpty(targetCell)) { // Simple move
            const heroesToMove = [...oldCell.occupiedHeroes];
            oldCell.occupiedHeroes.length = 0;
            heroesToMove.forEach(hero => {
                addHeroToCell(targetCell, hero);
                hero.cell = targetCell;
            });
            targetCell.occupiedHeroes.forEach((heroInCell, idx) => {
                const { x: targetX, y: targetY } = Hero.calculateTargetPositionInCell(idx, targetCell.occupiedHeroes.length, targetCellCenterX, targetCellCenterY);
                this.scene.tweens.add({ targets: heroInCell, x: targetX, y: targetY, duration: 300, ease: 'Power2' });
            });
        } else { // Swap cells
            const heroesInOldCell = [...oldCell.occupiedHeroes];
            const heroesInTargetCell = [...targetCell.occupiedHeroes];
            oldCell.occupiedHeroes.length = 0;
            targetCell.occupiedHeroes.length = 0;
            heroesInTargetCell.forEach(hero => {
                addHeroToCell(oldCell, hero);
                hero.cell = oldCell;
            });
            heroesInOldCell.forEach(hero => {
                addHeroToCell(targetCell, hero);
                hero.cell = targetCell;
            });
            oldCell.occupiedHeroes.forEach((heroInCell, idx) => {
                const { x: targetX, y: targetY } = Hero.calculateTargetPositionInCell(idx, oldCell.occupiedHeroes.length, oldCellCenterX, oldCellCenterY);
                this.scene.tweens.add({ targets: heroInCell, x: targetX, y: targetY, duration: 300, ease: 'Power2' });
            });
            targetCell.occupiedHeroes.forEach((heroInCell, idx) => {
                const { x: targetX, y: targetY } = Hero.calculateTargetPositionInCell(idx, targetCell.occupiedHeroes.length, targetCellCenterX, targetCellCenterY);
                this.scene.tweens.add({ targets: heroInCell, x: targetX, y: targetY, duration: 300, ease: 'Power2' });
            });
        }
        this.redrawAllCellBackgrounds();
    }

    public removeHero(heroToRemove: Hero) {
        const cell = this.gridCells.find(c => c.occupiedHeroes.includes(heroToRemove));
        if (cell) {
            removeHeroFromCell(cell, heroToRemove);
            heroToRemove.cell = null;
            this.redrawAllCellBackgrounds();

            const { x: cellCenterX, y: cellCenterY } = cellToWorld(cell.col, cell.row, this.gridMetrics);
            cell.occupiedHeroes.forEach((heroInCell, idx) => {
                const { x: targetX, y: targetY } = Hero.calculateTargetPositionInCell(idx, cell.occupiedHeroes.length, cellCenterX, cellCenterY);
                this.scene.tweens.add({ targets: heroInCell, x: targetX, y: targetY, duration: 300, ease: 'Power2' });
            });
        }
        heroToRemove.destroy();
        this.scene.heroes = this.scene.heroes.filter(h => h !== heroToRemove);
    }
    public checkForCombination(cell: GridCell) {
        if (cell.occupiedHeroes.length < 3) return;

        const firstHero = cell.occupiedHeroes[0];
        const rankToCombine = firstHero.rank;
        const imageKeyToCombine = firstHero.imageKey;

        if (rankToCombine >= 5) return;

        const allSameType = cell.occupiedHeroes.every(h => h.imageKey === imageKeyToCombine);

        if (cell.occupiedHeroes.length === 3 && allSameType) {
            const heroesToCombine = [...cell.occupiedHeroes];

            heroesToCombine.forEach(h => {
                this.scene.heroes = this.scene.heroes.filter(sceneHero => sceneHero !== h);
                h.destroy();
            });
            cell.occupiedHeroes.length = 0;

            const nextRank = rankToCombine + 1;
            const heroTypes: HeroType[] = ['TypeA', 'TypeB', 'TypeC', 'TypeD', 'TypeE'];
            const nextHeroType = heroTypes[nextRank - 1];

            const heroesOfNextGrade = HEROES_DATA.filter(h => h.type === nextHeroType);
            if (heroesOfNextGrade.length === 0) {
                console.error(`No heroes found for next type: ${nextHeroType}`);
                return;
            }
            const nextHeroData = Phaser.Math.RND.pick(heroesOfNextGrade);

            const preferredCell = this.gridCells.find(c =>
                !isCellEmpty(c) &&
                !isCellFull(c) &&
                c.occupiedHeroes[0].imageKey === nextHeroData.imageKey
            );

            const finalCell = preferredCell || cell;

            const { x: finalCellCenterX, y: finalCellCenterY } = cellToWorld(finalCell.col, finalCell.row, this.gridMetrics);
            
            const nextGrade = this.getGradeFromHeroType(nextHeroData.type);
            const nextRarityGroup = getRarityGroup(nextGrade);
            const nextPermanentUpgradeLevel = this.scene.permanentUpgradeLevels[nextRarityGroup];
            const newHero = new Hero(this.scene, finalCellCenterX, finalCellCenterY, nextHeroData.imageKey, nextPermanentUpgradeLevel);

            newHero.setDepth(5);
            this.scene.heroes.push(newHero);
            addHeroToCell(finalCell, newHero);
            newHero.cell = finalCell;
            this.repositionHeroesInCell(finalCell);

            const fx = this.scene.add.image(finalCellCenterX, finalCellCenterY, 'star_particle');
            fx.setDepth(10).setScale(0);

            this.scene.tweens.add({
                targets: fx,
                scale: 1.5,
                angle: 360,
                alpha: 0,
                duration: 500,
                ease: 'Power2',
                onComplete: () => fx.destroy()
            });

            this.scene.toast.show(`${rankToCombine}등급 ➡️ ${nextRank}등급 합성!`, THEME.success);

            this.redrawAllCellBackgrounds();

        }
    }

    private getRandomHeroTypeByWeight(): HeroType {
        if (this.scene.summonLevel !== this._cachedSummonLevel) {
            this.recalculateProbabilities();
        }

        const heroTypes: HeroType[] = ['TypeA', 'TypeB', 'TypeC', 'TypeD', 'TypeE'];
        const totalProbability = this._cachedProbabilities.reduce((sum, prob) => sum + prob, 0);
        let randomValue = Math.random() * totalProbability;

        for (let i = 0; i < this._cachedProbabilities.length; i++) {
            if (randomValue < this._cachedProbabilities[i]) {
                return heroTypes[i];
            }
            randomValue -= this._cachedProbabilities[i];
        }

        return heroTypes[0];
    }

    private recalculateProbabilities() {
        this._cachedSummonLevel = this.scene.summonLevel;

        const heroTypes: HeroType[] = ['TypeA', 'TypeB', 'TypeC', 'TypeD', 'TypeE'];

        const baseProbabilities = [78.7, 20, 1, 0.25, 0.05];

        const probabilities = [...baseProbabilities];
        const shiftAmount = (this._cachedSummonLevel > 1) ? (this._cachedSummonLevel - 1) * 0.5 : 0;

        if (shiftAmount > 0) {
            const amountFromRank1 = Math.min(probabilities[0], shiftAmount * 0.7);
            const amountFromRank2 = Math.min(probabilities[1], shiftAmount * 0.3);
            const totalShiftAmount = amountFromRank1 + amountFromRank2;

            probabilities[0] -= amountFromRank1;
            probabilities[1] -= amountFromRank2;

            const ratioSum = 20 + 5 + 1;
            probabilities[2] += totalShiftAmount * (20 / ratioSum);
            probabilities[3] += totalShiftAmount * (5 / ratioSum);
            probabilities[4] += totalShiftAmount * (1 / ratioSum);
        }

        this._cachedProbabilities = probabilities;

        console.log(`Probabilities recalculated for Summon Level: ${this._cachedSummonLevel}`);
        console.table({
            'Rank 1 (%)': probabilities[0].toFixed(2),
            'Rank 2 (%)': probabilities[1].toFixed(2),
            'Rank 3 (%)': probabilities[2].toFixed(2),
            'Rank 4 (%)': probabilities[3].toFixed(2),
            'Rank 5 (%)': probabilities[4].toFixed(2),
        });
    }

    private repositionHeroesInCell(cell: GridCell) {
        const { x: cellCenterX, y: cellCenterY } = cellToWorld(cell.col, cell.row, this.gridMetrics);
        cell.occupiedHeroes.forEach((heroInCell, idx) => {
            const { x: targetX, y: targetY } = Hero.calculateTargetPositionInCell(idx, cell.occupiedHeroes.length, cellCenterX, cellCenterY);
            this.scene.tweens.add({
                targets: heroInCell,
                x: targetX,
                y: targetY,
                duration: 300,
                ease: 'Power2',
            });
        });
    }

    private drawGridDebug() {
        if (!this.gridGfx) return;
        this.gridGfx.clear();
        const m = this.gridMetrics;
        const left = m.originX;
        const top = m.originY;
        const right = m.originX + m.cols * m.cellW;
        const bottom = m.originY + m.rows * m.cellH;

        this.gridGfx.lineStyle(1, 0x2d5a2d, 0.5);
        for (let c = 0; c <= m.cols; c++) {
            const x = left + c * m.cellW;
            this.gridGfx.lineBetween(x, top, x, bottom);
        }
        for (let r = 0; r <= m.rows; r++) {
            const y = top + r * m.cellH;
            this.gridGfx.lineBetween(left, y, right, y);
        }
        this.redrawAllCellBackgrounds();
    }

    private redrawAllCellBackgrounds() {
        if (!this.cellGfx) return;
        this.cellGfx.clear();
        for (const cell of this.gridCells) {
            if (cell.occupiedHeroes.length > 0) {
                const { x, y } = cellToWorld(cell.col, cell.row, this.gridMetrics);
                const cellW = this.gridMetrics.cellW;
                const cellH = this.gridMetrics.cellH;
                const hero = cell.occupiedHeroes[0];
                const color = hero.getRankBackgroundColor();
                this.cellGfx.fillStyle(color, 0.3);
                this.cellGfx.fillRect(x - cellW / 2, y - cellH / 2, cellW, cellH);
            }
        }
    }

    public update() {
        if (this.selectedHero) {
            this.drawRangeDisplay(this.selectedHero);
        }
    }

    private drawRangeDisplay(hero: Hero) {
        if (!this.rangeGfx) return;
        this.rangeGfx.clear();
        this.rangeGfx.strokeCircle(hero.x, hero.y, hero.range);
    }

    private clearSelection() {
        this.rangeGfx?.clear();
        this.selectedCell = null;
        this.selectedHero = null;
        this.clearMovableCells();
        this.scene.heroActionPanel.hide();
    }

    private calculateMovableCells(currentCell: GridCell): GridCell[] {
        const movable: GridCell[] = [];
        const range = HERO_MOVE_RANGE;

        for (const cell of this.gridCells) {
            const distance = Math.abs(cell.col - currentCell.col) + Math.abs(cell.row - currentCell.row);
            if (distance > 0 && distance <= range) {
                movable.push(cell);
            }
        }
        return movable;
    }

    private drawMovableCells() {
        this.clearMovableCells();
        if (!this.selectedCell) return;

        const movableCells = this.calculateMovableCells(this.selectedCell);
        const cellW = this.gridMetrics.cellW;
        const cellH = this.gridMetrics.cellH;

        for (const cell of movableCells) {
            const { x, y } = cellToWorld(cell.col, cell.row, this.gridMetrics);
            const rect = this.scene.add.rectangle(x, y, cellW, cellH, 0x00ff00, 0.2)
                .setStrokeStyle(2, 0x00ff00, 0.8)
                .setDepth(3);
            this.movableCellRects.push(rect);
            this.scene.tweens.add({
                targets: rect,
                alpha: { from: 0.2, to: 0.5 },
                duration: 500,
                yoyo: true,
                repeat: -1
            });
        }
    }

    private clearMovableCells() {
        this.movableCellRects.forEach(rect => rect.destroy());
        this.movableCellRects.length = 0;
    }
    
    public cleanup(hard = false) {
        this.clearMovableCells();
        this.rangeGfx?.clear();
        this.cellGfx?.clear();
        this.selectedCell = null;
        this.selectedHero = null;

        if (hard) {
            this.gridGfx?.destroy();
            this.cellGfx?.destroy();
            this.rangeGfx?.destroy();
            this.movableCellsGfx?.destroy();
        }
    }
}