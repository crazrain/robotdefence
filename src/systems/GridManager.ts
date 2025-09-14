
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
    MAX_HEROES_PER_CELL
} from '../core/Grid';
import { Hero } from '../objects/Hero';
import { HERO_MOVE_RANGE, MAX_HEROES, SUMMON_COST } from '../core/constants';
import type { HeroType } from '../core/types';

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

    public trySummonHero() {
        if (this.scene.heroes.length >= MAX_HEROES) {
            this.scene.toast(`영웅은 ${MAX_HEROES}명까지 소환할 수 있습니다`, '#ff7777');
            return;
        }
        if (this.scene.gold < SUMMON_COST) {
            this.scene.toast('골드가 부족합니다', '#ff7777');
            return;
        }

        const heroTypes: HeroType[] = ['TypeA', 'TypeB', 'TypeC', 'TypeD', 'TypeE'];
        const randomHeroType = heroTypes[(Math.random() * heroTypes.length) | 0];

        let targetCell: GridCell | null = null;
        const tempHeroForValidation = { type: randomHeroType } as Hero;

        for (const cell of this.gridCells) {
            if (cell.occupiedHeroes.length > 0 && cell.occupiedHeroes[0].type === randomHeroType && cell.occupiedHeroes.length < MAX_HEROES_PER_CELL) {
                if (addHeroToCell(cell, tempHeroForValidation)) {
                    targetCell = cell;
                    removeHeroFromCell(cell, tempHeroForValidation);
                    break;
                }
            }
        }

        if (!targetCell) {
            for (const cell of this.gridCells) {
                if (isCellEmpty(cell)) {
                    if (addHeroToCell(cell, tempHeroForValidation)) {
                        targetCell = cell;
                        removeHeroFromCell(cell, tempHeroForValidation);
                        break;
                    }
                }
            }
        }

        if (!targetCell) {
            this.scene.toast('배치 가능한 자리가 없습니다', '#ff7777');
            return;
        }

        this.scene.gold -= SUMMON_COST;

        const { x: targetCellCenterX, y: targetCellCenterY } = cellToWorld(targetCell.col, targetCell.row, this.gridMetrics);
        const newHero = new Hero(this.scene, targetCellCenterX, targetCellCenterY, 30, 0.5, 200, randomHeroType);
        newHero.setDepth(5);
        this.scene.heroes.push(newHero);

        addHeroToCell(targetCell, newHero);
        this.redrawAllCellBackgrounds();

        targetCell.occupiedHeroes.forEach((heroInCell, idx) => {
            const { x: targetX, y: targetY } = Hero.calculateTargetPositionInCell(idx, targetCell.occupiedHeroes.length, targetCellCenterX, targetCellCenterY);
            this.scene.tweens.add({
                targets: heroInCell,
                x: targetX,
                y: targetY,
                duration: 300,
                ease: 'Power2',
            });
        });

        const fx = this.scene.add.circle(targetCellCenterX, targetCellCenterY, 4, 0x99ddff).setAlpha(0.8);
        this.scene.tweens.add({ targets: fx, radius: 40, alpha: 0, duration: 250, onComplete: () => fx.destroy() });
    }

    private handlePointerDown(pointer: Phaser.Input.Pointer) {
        const clickedGameObjects = this.scene.input.manager.hitTest(pointer, this.scene.children.list, this.scene.cameras.main);
        const clickedHero = clickedGameObjects.find(obj => obj instanceof Hero) as Hero | undefined;

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
            heroesToMove.forEach(hero => addHeroToCell(targetCell, hero));
            targetCell.occupiedHeroes.forEach((heroInCell, idx) => {
                const { x: targetX, y: targetY } = Hero.calculateTargetPositionInCell(idx, targetCell.occupiedHeroes.length, targetCellCenterX, targetCellCenterY);
                this.scene.tweens.add({ targets: heroInCell, x: targetX, y: targetY, duration: 300, ease: 'Power2' });
            });
        } else { // Swap cells
            const heroesInOldCell = [...oldCell.occupiedHeroes];
            const heroesInTargetCell = [...targetCell.occupiedHeroes];
            oldCell.occupiedHeroes.length = 0;
            targetCell.occupiedHeroes.length = 0;
            heroesInTargetCell.forEach(hero => addHeroToCell(oldCell, hero));
            heroesInOldCell.forEach(hero => addHeroToCell(targetCell, hero));
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
