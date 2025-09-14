// src/scenes/GameScene.ts
import Phaser from 'phaser';
import {
    GAME_WIDTH,
    GAME_HEIGHT,
    MAX_ALIVE,
    SUMMON_COST,
    LOOP_RECT_BOTTOM,
    LOOP_RECT_TOP,
    WAVE_CLEAR_BASE,
    WAVE_CLEAR_GROWTH,
    MAX_HEROES,
    HERO_MOVE_RANGE // HERO_MOVE_RANGE 임포트 추가
} from '../core/constants';
import { buildBottomLoop, buildTopLoop } from '../core/Path';
import type { Mode, HeroType } from '../core/types'; // HeroType 임포트 추가
import { Enemy } from '../objects/Enemy';
import { Unit } from '../objects/Unit';
import { Projectile } from '../objects/Projectile';
import { HUD } from '../ui/HUD';
import { ModeSelector } from '../ui/ModeSelector';
import { SummonButton } from '../ui/SummonButton';
import { Spawner } from '../systems/Spawner';
import { WaveController } from '../systems/WaveController';
import {
    buildBottomGrid,
    type GridCell,
    type GridMetrics,
    keyOf,
    worldToCell,
    cellToWorld,
    addHeroToCell, // 추가
    removeHeroFromCell, // 추가
    isCellFull, // 추가
    isCellEmpty, // 추가
    isCellFullWithType, // 추가
    MAX_HEROES_PER_CELL // 추가
} from '../core/Grid';
import { getDefaultConfig, type GameConfig } from '../core/config';
import { RoundTimer } from '../systems/RoundTimer';
import { Hero } from '../objects/Hero';

export class GameScene extends Phaser.Scene {
    // 경로(상·하 루프)
    waypointsTop = buildTopLoop();
    waypointsBottom = buildBottomLoop();

    // 런타임 목록
    enemies: Enemy[] = [];
    units: Unit[] = [];
    projectiles: Projectile[] = [];
    heroes: Hero[] = [];

    // 시스템/뷰
    hud!: HUD;
    modeSelector!: ModeSelector;
    summonButton!: SummonButton;
    spawner!: Spawner;
    waves!: WaveController;

    // 경제/모드
    gold = 200;
    mode: Mode = 'solo';

    // 그리드(정밀 정렬)
    private gridGfx?: Phaser.GameObjects.Graphics;
    private cellGfx?: Phaser.GameObjects.Graphics; // cellGfx 추가
    private rangeGfx?: Phaser.GameObjects.Graphics;
    private movableCellsGfx?: Phaser.GameObjects.Graphics; // movableCellsGfx 추가
    private movableCellRects: Phaser.GameObjects.Rectangle[] = []; // 이동 가능한 셀을 나타내는 사각형들
    private selectedCell: GridCell | null = null;
    private selectedHero: Hero | null = null;
    private gridDebug = true;
    private gridMetrics!: GridMetrics;
    private gridCells: GridCell[] = [];
    // private occupied = new Set<string>(); // "col,row" - 제거됨

    // 라운드(게임) 타임아웃
    private cfg: GameConfig = getDefaultConfig('Normal');
    private round!: RoundTimer;

    // 재시작 처리(씬 pause 미사용: 내부 정지 플래그)
    private halted = false;
    private restartBlocker?: Phaser.GameObjects.Rectangle;
    private restartText?: Phaser.GameObjects.Text;

    // 정리 가드 플래그
    private _cleaned = false;

    // 적 처치 보상 핸들러(해제 위해 필드로 유지)
    private enemyKilledHandler = (payload: { x: number; y: number; maxHp: number; bounty: number }) => {
        this.gold += payload.bounty;
        const t = this.add
            .text(payload.x, payload.y - 18, `+${payload.bounty}`, {
                color: '#ffd54f',
                fontSize: '18px',
                fontFamily: 'monospace'
            })
            .setOrigin(0.5)
            .setDepth(20);
        this.tweens.add({ targets: t, y: t.y - 20, alpha: 0, duration: 500, onComplete: () => t.destroy() });
    };

    constructor() {
        super('GameScene');
    }

    create() {
        // 새 사이클 시작 초기화
        this._cleaned = false;
        this.halted = false;
        this.gold = 200;
        this.resetPlacementGrid();
        this.resetRuntimeArrays();

        this.cameras.main.setBackgroundColor('#101018');

        // 경로 디버그(상단 루프)
        for (let i = 0; i < this.waypointsTop.length; i++) {
            const a = this.waypointsTop[i];
            const b = this.waypointsTop[(i + 1) % this.waypointsTop.length];
            this.add.line(0, 0, a.x, a.y, b.x, b.y, 0x224488).setOrigin(0).setLineWidth(3);
        }
        // 경로 디버그(하단 루프)
        for (let i = 0; i < this.waypointsBottom.length; i++) {
            const a = this.waypointsBottom[i];
            const b = this.waypointsBottom[(i + 1) % this.waypointsBottom.length];
            this.add.line(0, 0, a.x, a.y, b.x, b.y, 0x334455).setOrigin(0).setLineWidth(3);
        }

        // 라운드 타이머(난이도 적용)
        this.cfg = getDefaultConfig('Normal'); // 난이도 선택 UI 연동 가능
        this.round = new RoundTimer(this.cfg.roundTimeLimitSec);
        this.round.start();

        // HUD
        this.hud = new HUD(this);
        this.hud.create();

        // 시스템
        this.spawner = new Spawner(this, this.waypointsTop, this.waypointsBottom);
        this.waves = new WaveController(
            this,
            this.spawner,
            this.cfg,
            (reason) => this.gameOver(reason),
            () => {},
            () => this.winGame(),
            (waveIndex) => this.grantWaveClearGold(waveIndex) // 웨이브 클리어 보상
        );

        // 적 처치 보상 수신
        this.events.on('enemy_killed', this.enemyKilledHandler);

        // 모드 선택 → 웨이브 시작
        this.modeSelector = new ModeSelector(this, (m) => {
            this.mode = m;
            this.waves.start(this.mode, 0);
            // 모드 선택 완료 후 소환 버튼 생성 및 활성화
            this.summonButton = new SummonButton(this, () => this.trySummonHero());
            this.summonButton.create();
        });
        this.modeSelector.show();

        // 유닛 소환(그리드 스냅)
        // new SummonButton(this, () => this.trySummonHero()).create(); // 이 줄은 제거됨

        // 디버그 격자 시각화
        if (this.gridDebug) {
            this.gridGfx = this.add.graphics().setDepth(2);
            this.drawGridDebug();
        }
        // 셀 배경 그래픽 초기화
        this.cellGfx = this.add.graphics().setDepth(1);
        // 사거리 표시 그래픽 초기화
        this.rangeGfx = this.add.graphics({ lineStyle: { width: 2, color: 0x00ffff, alpha: 0.5 } }).setDepth(10);

        // 라이프사이클 훅(자동 정리)
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanup());
        this.events.once(Phaser.Scenes.Events.DESTROY, () => this.cleanup(true));

        // 드래그 앤 드롭 (주석 처리된 부분은 변경하지 않음)
        // this.input.on('dragstart', (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) => {
        //     if (gameObject instanceof Hero) {
        //         const cell = worldToCell(gameObject.x, gameObject.y, this.gridMetrics);
        //         if (cell) {
        //             this.occupied.delete(keyOf(cell.col, cell.row));
        //         }
        //     }
        // });

        // this.input.on('drag', (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject, dragX: number, dragY: number) => {
        //     if (gameObject instanceof Hero) {
        //         gameObject.x = dragX;
        //         gameObject.y = dragY;
        //         this.drawRangeDisplay(gameObject);
        //     }
        // });

        // this.input.on('dragend', (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) => {
        //     if (gameObject instanceof Hero) {
        //         const cell = worldToCell(gameObject.x, gameObject.y, this.gridMetrics);
        //         if (cell && !this.occupied.has(keyOf(cell.col, cell.row))) {
        //             const { x, y } = cellToWorld(cell.col, cell.row, this.gridMetrics);
        //             gameObject.x = x;
        //             gameObject.y = y;
        //             this.occupied.add(keyOf(cell.col, cell.row));
        //         } else {
        //             // 이전 위치로 복귀
        //             const pick = pickRandomFreeCell(this.gridCells, this.occupied);
        //             if (pick) {
        //                 gameObject.x = pick.x;
        //                 gameObject.y = pick.y;
        //                 this.occupied.add(keyOf(pick.col, pick.row));
        //             }
        //         }
        //         // 드래그 종료 후에도 선택된 영웅이면 사거리 원 유지
        //         if (this.selectedHero === gameObject) {
        //             this.drawRangeDisplay(gameObject);
        //         }
        //     }
        // });

        // 포인터 다운 이벤트 처리 (영웅 선택 및 이동)
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            const clickedGameObjects = this.input.manager.hitTest(pointer, this.children.list, this.cameras.main);
            const clickedHero = clickedGameObjects.find(obj => obj instanceof Hero) as Hero | undefined;

            // 1. 영웅이 선택된 상태일 때의 로직
            if (this.selectedCell && this.selectedHero) {
                const clickedCellCoords = worldToCell(pointer.worldX, pointer.worldY, this.gridMetrics);

                // 그리드 밖을 클릭했거나, 유효하지 않은 셀이면 선택 해제
                if (!clickedCellCoords) {
                    this.clearRangeDisplay();
                    return;
                }
                const targetCell = this.gridCells.find(c => c.col === clickedCellCoords.col && c.row === clickedCellCoords.row);
                if (!targetCell) {
                    this.clearRangeDisplay();
                    return;
                }

                // 이미 선택된 셀을 다시 클릭하면 선택 해제
                if (targetCell === this.selectedCell) {
                    this.clearRangeDisplay();
                    return;
                }

                // 이동 가능한 셀인지 확인
                const movableCells = this.calculateMovableCells(this.selectedCell, this.selectedCell.occupiedHeroes.length);
                const isMovable = movableCells.some(cell => cell.col === targetCell.col && cell.row === targetCell.row);

                if (isMovable) {
                    // 이동/교환 로직 (기존과 동일)
                    const oldCell = this.selectedCell;
                    const { x: oldCellCenterX, y: oldCellCenterY } = cellToWorld(oldCell.col, oldCell.row, this.gridMetrics);
                    const { x: targetCellCenterX, y: targetCellCenterY } = cellToWorld(targetCell.col, targetCell.row, this.gridMetrics);

                    if (isCellEmpty(targetCell)) { // 단순 이동
                        const heroesToMove = [...oldCell.occupiedHeroes];
                        oldCell.occupiedHeroes.length = 0;
                        heroesToMove.forEach(hero => addHeroToCell(targetCell, hero));
                        targetCell.occupiedHeroes.forEach((heroInCell, idx) => {
                            const { x: targetX, y: targetY } = Hero.calculateTargetPositionInCell(idx, targetCell.occupiedHeroes.length, targetCellCenterX, targetCellCenterY);
                            this.tweens.add({ targets: heroInCell, x: targetX, y: targetY, duration: 300, ease: 'Power2' });
                        });
                    } else { // 셀 교환
                        const heroesInOldCell = [...oldCell.occupiedHeroes];
                        const heroesInTargetCell = [...targetCell.occupiedHeroes];
                        oldCell.occupiedHeroes.length = 0;
                        targetCell.occupiedHeroes.length = 0;
                        heroesInTargetCell.forEach(hero => addHeroToCell(oldCell, hero));
                        heroesInOldCell.forEach(hero => addHeroToCell(targetCell, hero));
                        oldCell.occupiedHeroes.forEach((heroInCell, idx) => {
                            const { x: targetX, y: targetY } = Hero.calculateTargetPositionInCell(idx, oldCell.occupiedHeroes.length, oldCellCenterX, oldCellCenterY);
                            this.tweens.add({ targets: heroInCell, x: targetX, y: targetY, duration: 300, ease: 'Power2' });
                        });
                        targetCell.occupiedHeroes.forEach((heroInCell, idx) => {
                            const { x: targetX, y: targetY } = Hero.calculateTargetPositionInCell(idx, targetCell.occupiedHeroes.length, targetCellCenterX, targetCellCenterY);
                            this.tweens.add({ targets: heroInCell, x: targetX, y: targetY, duration: 300, ease: 'Power2' });
                        });
                    }
                    this.selectedCell = targetCell; // 새로운 셀을 선택된 셀로 업데이트
                    this.drawMovableCells(); // 새로운 위치에서 이동 가능 셀 다시 그리기
                } else {
                    // 이동 불가능한 셀을 클릭하면 선택 해제
                    this.clearRangeDisplay();
                }
            // 2. 선택된 영웅이 없고, 영웅을 클릭했을 때
            } else if (clickedHero) {
                const clickedCellCoords = worldToCell(clickedHero.x, clickedHero.y, this.gridMetrics);
                if (!clickedCellCoords) return;
                const clickedCell = this.gridCells.find(c => c.col === clickedCellCoords.col && c.row === clickedCellCoords.row);
                if (!clickedCell) return;

                this.selectedCell = clickedCell;
                this.selectedHero = clickedHero;
                this.drawRangeDisplay(clickedHero);
                this.drawMovableCells();
            // 3. 선택된 영웅이 없고, 영웅이 아닌 곳을 클릭했을 때
            } else {
                this.clearRangeDisplay();
            }
        });
    }

    update(_: number, delta: number) {
        // 전투 정지 상태면 로직 스킵(입력은 살아 있음)
        if (this.halted) return;

        const dt = delta / 1000;

        // 라운드 타이머
        this.round.update(dt);
        if (this.round.expired) {
            this.gameOver('라운드 제한 시간 초과');
            return;
        }

        // 유닛/적/투사체
        for (const u of this.units) u.update(dt, this.enemies, this.projectiles);
        for (const hero of this.heroes) {
            hero.update(dt, this.enemies, this.projectiles);
        }
        for (const e of this.enemies) e.update(dt);
        this.enemies = this.enemies.filter((e) => e.alive);
        this.projectiles = this.projectiles.filter((p) => p.alive);
        for (const p of this.projectiles) p.update(dt);

        if (this.selectedHero) {
            this.drawRangeDisplay(this.selectedHero);
        }

        // 웨이브
        this.waves.update(dt, this.mode, this.enemies);

        // HUD
        this.hud.update(
            this.gold,
            this.units.length + this.heroes.length,
            this.enemies.length,
            MAX_ALIVE,
            this.waves,
            this.mode,
            this.round.remaining
        );
    }

    // ===== 배치/그리드 =====

    private resetPlacementGrid() {
        const built = buildBottomGrid();
        this.gridMetrics = built.metrics;
        this.gridCells = built.cells;
        // this.occupied.clear(); // 제거됨
        this.gridCells.forEach(cell => cell.occupiedHeroes = []); // 각 셀의 occupiedHeroes 초기화
        this.cellGfx?.clear(); // 셀 배경색 초기화
    }

    private trySummonHero() {
        if (this.heroes.length >= MAX_HEROES) {
            this.toast(`영웅은 ${MAX_HEROES}명까지 소환할 수 있습니다`, '#ff7777');
            return;
        }
        if (this.gold < SUMMON_COST) {
            this.toast('골드가 부족합니다', '#ff7777');
            return;
        }

        // 영웅 종류를 임의로 선택 (나중에 소환 버튼에 따라 선택하도록 변경 가능)
        const heroTypes: HeroType[] = ['TypeA', 'TypeB', 'TypeC', 'TypeD', 'TypeE'];
        const randomHeroType = heroTypes[(Math.random() * heroTypes.length) | 0];

        // 배치 가능한 셀 찾기
        let targetCell: GridCell | null = null;
        // 임시 Hero 객체를 생성하여 addHeroToCell의 유효성 검사에 사용
        const tempHeroForValidation = { type: randomHeroType } as Hero;

        // 1. 먼저 선택된 영웅 타입과 동일한 영웅이 MAX_HEROES_PER_CELL 미만으로 있는 셀을 찾습니다.
        for (const cell of this.gridCells) {
            if (cell.occupiedHeroes.length > 0 && cell.occupiedHeroes[0].type === randomHeroType && cell.occupiedHeroes.length < MAX_HEROES_PER_CELL) {
                // 해당 셀에 영웅을 추가할 수 있는지 addHeroToCell로 확인
                if (addHeroToCell(cell, tempHeroForValidation)) {
                    targetCell = cell;
                    removeHeroFromCell(cell, tempHeroForValidation); // 유효성 검사 후 임시로 추가된 영웅은 제거
                    break;
                }
            }
        }

        // 2. 만약 1번 조건에 맞는 셀이 없다면, 비어있는 셀을 찾습니다.
        if (!targetCell) {
            for (const cell of this.gridCells) {
                if (isCellEmpty(cell)) {
                    // 해당 셀에 영웅을 추가할 수 있는지 addHeroToCell로 확인
                    if (addHeroToCell(cell, tempHeroForValidation)) {
                        targetCell = cell;
                        removeHeroFromCell(cell, tempHeroForValidation); // 유효성 검사 후 임시로 추가된 영웅은 제거
                        break;
                    }
                }
            }
        }

        if (!targetCell) {
            this.toast('배치 가능한 자리가 없습니다', '#ff7777');
            return;
        }

        this.gold -= SUMMON_COST;

        const { x: targetCellCenterX, y: targetCellCenterY } = cellToWorld(targetCell.col, targetCell.row, this.gridMetrics);
        const newHero = new Hero(this, targetCellCenterX, targetCellCenterY, 30, 0.5, 200, randomHeroType); // HeroType 인자 추가
        newHero.setDepth(5);
        this.heroes.push(newHero);

        // 실제 영웅 객체를 셀에 추가
        addHeroToCell(targetCell, newHero);

        // 셀 배경색 업데이트
        this.drawCellBackground(targetCell);

        // 새 셀에 있는 영웅들의 최종 목표 위치 계산
        targetCell.occupiedHeroes.forEach((heroInCell, idx) => {
            const { x: targetX, y: targetY } = Hero.calculateTargetPositionInCell(idx, targetCell.occupiedHeroes.length, targetCellCenterX, targetCellCenterY);
            this.tweens.add({
                targets: heroInCell,
                x: targetX,
                y: targetY,
                duration: 300,
                ease: 'Power2',
            });
        });

        const fx = this.add.circle(targetCellCenterX, targetCellCenterY, 4, 0x99ddff).setAlpha(0.8);
        this.tweens.add({ targets: fx, radius: 40, alpha: 0, duration: 250, onComplete: () => fx.destroy() });
    }

    private drawGridDebug() {
        if (!this.gridGfx) return;
        this.gridGfx.clear();

        // 하단 사각형 윤곽
        const b = LOOP_RECT_BOTTOM;
        this.gridGfx.lineStyle(2, 0x66aa66, 0.8).strokeRect(b.left, b.top, b.right - b.left, b.bottom - b.top);

        // 상단 박스(참고)
        const t = LOOP_RECT_TOP;
        this.gridGfx.lineStyle(2, 0x6688aa, 0.5).strokeRect(t.left, t.top, t.right - t.left, t.bottom - t.top);

        // 내부 격자 라인(정밀)
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

        // 셀 배경색 그리기
        this.gridCells.forEach(cell => this.drawCellBackground(cell));
    }

    private drawCellBackground(cell: GridCell) {
        if (!this.cellGfx) return;
        
        const { x, y } = cellToWorld(cell.col, cell.row, this.gridMetrics);
        const cellW = this.gridMetrics.cellW;
        const cellH = this.gridMetrics.cellH;

        if (cell.occupiedHeroes.length > 0) {
            const hero = cell.occupiedHeroes[0]; // 셀의 첫 번째 영웅을 기준으로 등급 색상 결정
            const color = hero.getRankBackgroundColor();
            this.cellGfx.fillStyle(color, 0.3); // 등급 색상으로 채우기
            this.cellGfx.fillRect(x - cellW / 2, y - cellH / 2, cellW, cellH);
        } else {
            // 영웅이 없으면 투명하게 지움
            this.cellGfx.fillStyle(0x000000, 0); // 투명한 검은색으로 채워서 지우는 효과
            this.cellGfx.fillRect(x - cellW / 2, y - cellH / 2, cellW, cellH);
        }
    }

    private drawRangeDisplay(hero: Hero) {
        if (!this.rangeGfx) {
            this.rangeGfx = this.add.graphics({ lineStyle: { width: 2, color: 0x00ffff, alpha: 0.5 } }).setDepth(10);
        }
        this.rangeGfx.clear();
        // 선택된 셀의 모든 영웅의 사거리를 표시 (가장 큰 사거리를 가진 영웅을 기준으로 할 수도 있음)
        // 여기서는 첫 번째 영웅의 사거리를 기준으로 표시합니다.
        this.rangeGfx.strokeCircle(hero.x, hero.y, hero.range);
    }

    private clearRangeDisplay() {
        if (this.rangeGfx) {
            this.rangeGfx.clear();
        }
        this.selectedCell = null;
        this.selectedHero = null; // 선택된 영웅 해제
        this.clearMovableCells(); // 사거리 표시 지울 때 이동 가능 셀도 지움
    }

    // ===== 영웅 이동 관련 =====

    private calculateMovableCells(currentCell: GridCell, selectedHeroCount: number): GridCell[] {
        const currentCellCoords = { col: currentCell.col, row: currentCell.row };

        const movable: GridCell[] = [];
        const range = HERO_MOVE_RANGE;

        for (const cell of this.gridCells) {
            const distance = Math.abs(cell.col - currentCellCoords.col) + Math.abs(cell.row - currentCellCoords.row);
            // 이동 가능한 범위 내에 있고, 선택된 셀 자신이 아니라면 이동 가능 셀로 간주
            if (distance <= range && !(cell.col === currentCellCoords.col && cell.row === currentCellCoords.row)) {
                movable.push(cell);
            }
        }
        return movable;
    }

    private drawMovableCells() {
        this.clearMovableCells(); // 기존 표시 제거

        if (!this.selectedCell) return;

        const movableCells = this.calculateMovableCells(this.selectedCell, this.selectedCell.occupiedHeroes.length);
        const cellW = this.gridMetrics.cellW;
        const cellH = this.gridMetrics.cellH;

        for (const cell of movableCells) {
            const { x, y } = cellToWorld(cell.col, cell.row, this.gridMetrics);
            const rect = this.add.rectangle(x, y, cellW, cellH, 0x00ff00, 0.2)
                .setStrokeStyle(2, 0x00ff00, 0.8)
                .setDepth(3);
            this.movableCellRects.push(rect);
            this.tweens.add({
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

    // ===== 보상/토스트 =====

    private grantWaveClearGold(waveIndex: number) {
        const bonus = Math.max(1, Math.floor(WAVE_CLEAR_BASE * Math.pow(1 + WAVE_CLEAR_GROWTH, waveIndex)));
        this.gold += bonus;
        this.toast(`웨이브 클리어 보상 +${bonus}`, '#77ff77');
    }

    private toast(msg: string, color = '#ffeb3b') {
        const t = this.add
            .text(GAME_WIDTH / 2, GAME_HEIGHT - 220, msg, { color, fontSize: '22px', fontFamily: 'monospace' })
            .setOrigin(0.5)
            .setAlpha(0);
        this.tweens.add({
            targets: t,
            alpha: 1,
            y: t.y - 20,
            duration: 200,
            onComplete: () => {
                this.time.delayedCall(700, () => {
                    this.tweens.add({ targets: t, alpha: 0, y: t.y - 10, duration: 200, onComplete: () => t.destroy() });
                });
            }
        });
    }

    // ===== 재시작(내부 정지 플래그, pause 미사용) =====

    private bindRestartOnce() {
        this.restartBlocker?.once('pointerdown', () => this.doRestart());
        this.input.keyboard?.once('keydown-SPACE', () => this.doRestart());
        this.input.keyboard?.once('keydown-ENTER', () => this.doRestart());
    }

    private doRestart() {
        // cleanup 호출(리스너/타이머/배열/오버레이 정리)
        this.cleanup();
        this._cleaned = false; // 다음 사이클에서 다시 초기화 가능

        // 기본 상태 재설정(안전)
        this.halted = false;
        this.gold = 200;
        this.resetPlacementGrid();
        this.resetRuntimeArrays();

        this.scene.restart(); // → SHUTDOWN → 새 create()
    }

    private gameOver(reason: string) {
        this.halted = true;

        this.restartBlocker = this.add
            .rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 0x000000, 0.6)
            .setDepth(10)
            .setInteractive();

        this.restartText = this.add
            .text(
                this.scale.width / 2,
                this.scale.height / 2,
                `게임 오버\n${reason}\n탭(또는 스페이스/엔터)하면 재시작`,
                { color: '#fff', fontSize: '32px', fontFamily: 'monospace', align: 'center' }
            )
            .setOrigin(0.5)
            .setDepth(11);

        this.tweens.pauseAll();
        this.bindRestartOnce();
    }

    private winGame() {
        this.halted = true;

        this.restartBlocker = this.add
            .rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 0x000000, 0.6)
            .setDepth(10)
            .setInteractive();

        this.restartText = this.add
            .text(
                this.scale.width / 2,
                this.scale.height / 2,
                '클리어!\n탭(또는 스페이스/엔터)하면 재시작',
                { color: '#fff', fontSize: '36px', fontFamily: 'monospace', align: 'center' }
            )
            .setOrigin(0.5)
            .setDepth(11);

        this.tweens.pauseAll();
        this.bindRestartOnce();
    }

    // ===== 정리 유틸 =====

    private resetRuntimeArrays() {
        this.units.forEach((u) => u.destroy());
        this.enemies.forEach((e) => e.destroy());
        this.projectiles.forEach((p) => p.destroy());
        this.heroes.forEach(h => h.destroy());
        this.units.length = 0;
        this.enemies.length = 0;
        this.projectiles.length = 0;
        this.heroes.length = 0;
        this.selectedHero = null;
        this.selectedCell = null;
    }

    private cleanup(hard = false) {
        if (this._cleaned) return;
        this._cleaned = true;

        // 이벤트/입력
        this.events.off('enemy_killed', this.enemyKilledHandler);
        this.input.keyboard?.removeAllListeners();

        // 타이머/트윈
        this.tweens.killAll();
        this.time.removeAllEvents();

        // 런타임 배열/오브젝트
        this.resetRuntimeArrays();

        // 오버레이/UI
        this.restartBlocker?.destroy();
        this.restartText?.destroy();
        this.summonButton?.container.destroy(); // SummonButton 컨테이너 파괴 추가

        // 그래픽 리소스(최종 해제)
        if (hard) {
            this.gridGfx?.destroy();
            this.cellGfx?.destroy(); // cellGfx 파괴 추가
            this.rangeGfx = undefined;
            this.movableCellsGfx?.destroy(); // movableCellsGfx 파괴 추가
            this.movableCellRects.forEach(rect => rect.destroy()); // movableCellRects 파괴 추가
            this.movableCellRects.length = 0;
        }
    }
}
