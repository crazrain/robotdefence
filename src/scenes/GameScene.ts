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
    MAX_HEROES
} from '../core/constants';
import { buildBottomLoop, buildTopLoop } from '../core/Path';
import type { Mode } from '../core/types';
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
    pickRandomFreeCell,
    keyOf,
    worldToCell,
    cellToWorld
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
    spawner!: Spawner;
    waves!: WaveController;

    // 경제/모드
    gold = 200;
    mode: Mode = 'solo';

    // 그리드(정밀 정렬)
    private gridGfx?: Phaser.GameObjects.Graphics;
    private gridDebug = true;
    private gridMetrics!: GridMetrics;
    private gridCells: GridCell[] = [];
    private occupied = new Set<string>(); // "col,row"

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
        });
        this.modeSelector.show();

        // 유닛 소환(그리드 스냅)
        new SummonButton(this, () => this.trySummonHero()).create();

        // 디버그 격자 시각화
        if (this.gridDebug) {
            this.gridGfx = this.add.graphics().setDepth(2);
            this.drawGridDebug();
        }

        // 라이프사이클 훅(자동 정리)
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanup());
        this.events.once(Phaser.Scenes.Events.DESTROY, () => this.cleanup(true));

        // 드래그 앤 드롭
        this.input.on('dragstart', (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) => {
            if (gameObject instanceof Hero) {
                const cell = worldToCell(gameObject.x, gameObject.y, this.gridMetrics);
                if (cell) {
                    this.occupied.delete(keyOf(cell.col, cell.row));
                }
            }
        });

        this.input.on('drag', (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject, dragX: number, dragY: number) => {
            if (gameObject instanceof Hero) {
                gameObject.x = dragX;
                gameObject.y = dragY;
            }
        });

        this.input.on('dragend', (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.GameObject) => {
            if (gameObject instanceof Hero) {
                const cell = worldToCell(gameObject.x, gameObject.y, this.gridMetrics);
                if (cell && !this.occupied.has(keyOf(cell.col, cell.row))) {
                    const { x, y } = cellToWorld(cell.col, cell.row, this.gridMetrics);
                    gameObject.x = x;
                    gameObject.y = y;
                    this.occupied.add(keyOf(cell.col, cell.row));
                } else {
                    // 이전 위치로 복귀
                    const pick = pickRandomFreeCell(this.gridCells, this.occupied);
                    if (pick) {
                        gameObject.x = pick.x;
                        gameObject.y = pick.y;
                        this.occupied.add(keyOf(pick.col, pick.row));
                    }
                }
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
        this.occupied.clear();
    }

    private trySummonHero() {
        console.log('trySummonHero 호출됨');
        if (this.heroes.length >= MAX_HEROES) {
            this.toast(`영웅은 ${MAX_HEROES}명까지 소환할 수 있습니다`, '#ff7777');
            console.log('MAX_HEROES 제한에 걸림');
            return;
        }
        if (this.gold < SUMMON_COST) {
            this.toast('골드가 부족합니다', '#ff7777');
            console.log('골드 부족');
            return;
        }
        const pick = pickRandomFreeCell(this.gridCells, this.occupied);
        if (!pick) {
            this.toast('배치 가능한 자리가 없습니다', '#ff7777');
            console.log('배치 가능한 자리가 없음');
            return;
        }

        this.gold -= SUMMON_COST;
        console.log('골드 차감됨:', this.gold);

        const newHero = new Hero(this, pick.x, pick.y, 30, 0.5, 200);
        newHero.setDepth(5);
        this.heroes.push(newHero);
        this.occupied.add(keyOf(pick.col, pick.row));
        console.log('새 영웅 생성 및 배열에 추가됨:', newHero);
        console.log('occupied 셀:', keyOf(pick.col, pick.row));

        const fx = this.add.circle(pick.x, pick.y, 4, 0x99ddff).setAlpha(0.8);
        this.tweens.add({ targets: fx, radius: 40, alpha: 0, duration: 250, onComplete: () => fx.destroy() });
        console.log('소환 효과 추가됨');
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

        // 그래픽 리소스(최종 해제)
        if (hard) {
            this.gridGfx?.destroy();
        }
    }
}