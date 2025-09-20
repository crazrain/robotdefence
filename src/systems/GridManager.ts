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

    public trySummonHero() {
        if (this.scene.heroes.length >= MAX_HEROES) {
            this.scene.toast.show(`영웅은 ${MAX_HEROES}명까지 소환할 수 있습니다`, THEME.danger);
            return false;
        }

        // 가중치에 따라 영웅 등급(타입)을 결정합니다.
        const randomHeroGradeType = this.getRandomHeroTypeByWeight();

        // 해당 등급의 모든 영웅을 찾습니다.
        const heroesOfSameGrade = HEROES_DATA.filter(h => h.type === randomHeroGradeType);
        if (heroesOfSameGrade.length === 0) {
            console.error(`No heroes found for type: ${randomHeroGradeType}`);
            return false;
        }
        // 해당 등급 내에서 무작위 영웅 하나를 선택합니다.
        const randomHeroData = Phaser.Math.RND.pick(heroesOfSameGrade);

        // 1. 배치 우선순위 정의: 같은 종류가 있는 셀 > 비어있는 셀
        const preferredCells = this.gridCells.filter(cell =>
            !isCellEmpty(cell) &&
            !isCellFull(cell) &&
            cell.occupiedHeroes[0].imageKey === randomHeroData.imageKey
        );
        const fallbackCells = this.gridCells.filter(isCellEmpty);
        const cellsToTry = [...preferredCells, ...fallbackCells];

        // 2. 우선순위에 따라 배치 시도
        for (const targetCell of cellsToTry) {
            const { x: targetCellCenterX, y: targetCellCenterY } = cellToWorld(targetCell.col, targetCell.row, this.gridMetrics);
            const newHero = new Hero(this.scene, targetCellCenterX, targetCellCenterY, randomHeroData.imageKey);

            // Grid.ts의 addHeroToCell 로직으로 배치 가능 여부 최종 확인
            if (addHeroToCell(targetCell, newHero)) {
                newHero.setDepth(5);
                this.scene.heroes.push(newHero);
                newHero.cell = targetCell;
                this.redrawAllCellBackgrounds();
                this.repositionHeroesInCell(targetCell);

                const fx = this.scene.add.circle(targetCellCenterX, targetCellCenterY, 4, 0x99ddff).setAlpha(0.8);
                this.scene.tweens.add({ targets: fx, radius: 40, alpha: 0, duration: 250, onComplete: () => fx.destroy() });

                return true; // 배치 성공
            } else {
                // 로직상 이곳에 오면 안되지만, 안전을 위해 임시 생성된 영웅 파괴
                newHero.destroy();
            }
        }

        // 3. 모든 셀에 배치 실패
        this.scene.toast.show('배치 가능한 자리가 없습니다', THEME.danger);
        return false;
    }

    private handlePointerDown(pointer: Phaser.Input.Pointer) {
        const clickedGameObjects = this.scene.input.manager.hitTest(pointer, this.scene.children.list, this.scene.cameras.main);
        const clickedHero = clickedGameObjects.find(obj => obj instanceof Hero) as Hero | undefined;

        // 액션 패널이 보이는 상태에서 다른 곳을 클릭하면 패널을 숨김
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
            this.scene.heroActionPanel.show(clickedHero); // 액션 패널 표시
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
                hero.cell = targetCell; // Hero의 cell 정보 업데이트
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
                hero.cell = oldCell; // Hero의 cell 정보 업데이트
            });
            heroesInOldCell.forEach(hero => {
                addHeroToCell(targetCell, hero);
                hero.cell = targetCell; // Hero의 cell 정보 업데이트
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
            heroToRemove.cell = null; // Hero의 cell 정보 제거
            this.redrawAllCellBackgrounds();

            // 남은 영웅들 위치 재조정
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

        if (rankToCombine >= 5) return; // 최고 등급은 합성 불가

        const allSameType = cell.occupiedHeroes.every(h => h.imageKey === imageKeyToCombine);

        if (cell.occupiedHeroes.length === 3 && allSameType) {
            const heroesToCombine = [...cell.occupiedHeroes];

            // 기존 영웅들 제거
            heroesToCombine.forEach(h => {
                this.scene.heroes = this.scene.heroes.filter(sceneHero => sceneHero !== h);
                h.destroy();
            });
            cell.occupiedHeroes.length = 0;

            // 다음 등급 영웅 생성
            const nextRank = rankToCombine + 1;
            const heroTypes: HeroType[] = ['TypeA', 'TypeB', 'TypeC', 'TypeD', 'TypeE'];
            const nextHeroType = heroTypes[nextRank - 1];

            // 상위 등급의 모든 영웅을 찾습니다.
            const heroesOfNextGrade = HEROES_DATA.filter(h => h.type === nextHeroType);
            if (heroesOfNextGrade.length === 0) {
                console.error(`No heroes found for next type: ${nextHeroType}`);
                return; // or handle error appropriately
            }
            // 상위 등급 내에서 무작위 영웅 하나를 선택합니다.
            const nextHeroData = Phaser.Math.RND.pick(heroesOfNextGrade);

            // 합성된 영웅이 들어갈 최적의 셀 찾기 (기존에 같은 타입이 있는 곳 우선)
            const preferredCell = this.gridCells.find(c =>
                !isCellEmpty(c) &&
                !isCellFull(c) &&
                c.occupiedHeroes[0].imageKey === nextHeroData.imageKey
            );

            // 선호하는 셀이 있으면 그곳에, 없으면 원래 합성이 일어난 셀에 배치
            const finalCell = preferredCell || cell;

            const { x: finalCellCenterX, y: finalCellCenterY } = cellToWorld(finalCell.col, finalCell.row, this.gridMetrics);
            const newHero = new Hero(this.scene, finalCellCenterX, finalCellCenterY, nextHeroData.imageKey);
            newHero.setDepth(5);
            this.scene.heroes.push(newHero);
            addHeroToCell(finalCell, newHero);
            newHero.cell = finalCell; // 새로 생성된 Hero에 cell 정보 할당
            this.repositionHeroesInCell(finalCell);

            // 합성 이펙트
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
        // 소환 레벨이 변경되었을 때만 확률을 다시 계산합니다.
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

        return heroTypes[0]; // Fallback
    }

    private recalculateProbabilities() {
        this._cachedSummonLevel = this.scene.summonLevel;

        const heroTypes: HeroType[] = ['TypeA', 'TypeB', 'TypeC', 'TypeD', 'TypeE'];

        // 각 등급별 기본 소환 확률 (%)
        const baseProbabilities = [78.7, 20, 1, 0.25, 0.05];

        // 소환 레벨에 따른 확률 보정
        // 레벨이 오를수록 낮은 등급의 확률을 높은 등급으로 이전시킵니다.
        const probabilities = [...baseProbabilities];
        const shiftAmount = (this._cachedSummonLevel > 1) ? (this._cachedSummonLevel - 1) * 0.5 : 0; // 레벨 1일때는 확률 이동 없음

        if (shiftAmount > 0) {
            // 1. 1, 2등급에서 확률을 가져옵니다. (7:3 비율로)
            const amountFromRank1 = Math.min(probabilities[0], shiftAmount * 0.7);
            const amountFromRank2 = Math.min(probabilities[1], shiftAmount * 0.3);
            const totalShiftAmount = amountFromRank1 + amountFromRank2;

            probabilities[0] -= amountFromRank1;
            probabilities[1] -= amountFromRank2;

            // 2. 가져온 확률을 3, 4, 5등급에 분배합니다. (20:5:1 비율로)
            const ratioSum = 20 + 5 + 1;
            probabilities[2] += totalShiftAmount * (20 / ratioSum);
            probabilities[3] += totalShiftAmount * (5 / ratioSum);
            probabilities[4] += totalShiftAmount * (1 / ratioSum);
        }

        this._cachedProbabilities = probabilities;

        // 현재 소환 레벨과 계산된 확률을 콘솔에 출력
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
