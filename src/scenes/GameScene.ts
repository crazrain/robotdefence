import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, MAX_ALIVE, SUMMON_COST, LOOP_RECT_BOTTOM, LOOP_RECT_TOP, WAVE_CLEAR_BASE, WAVE_CLEAR_GROWTH } from '../core/constants';
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
import { Grid } from '../core/Grid';
import { getDefaultConfig, type GameConfig } from '../core/config';
import { RoundTimer } from '../systems/RoundTimer';

export class GameScene extends Phaser.Scene {
    waypointsTop = buildTopLoop();
    waypointsBottom = buildBottomLoop();

    enemies: Enemy[] = [];
    units: Unit[] = [];
    projectiles: Projectile[] = [];

    hud!: HUD;
    modeSelector!: ModeSelector;
    spawner!: Spawner;
    waves!: WaveController;

    gold = 200;
    mode: Mode = 'solo';

    private gridGfx?: Phaser.GameObjects.Graphics;
    private gridDebug = true;
    private bottomCells = Grid.buildBottomCells();
    private occupied = new Set<string>();

    private cfg: GameConfig = getDefaultConfig('Normal');
    private round!: RoundTimer;

    constructor() { super('GameScene'); }

    create() {
        this.cameras.main.setBackgroundColor('#101018');

        // 루프 디버그(생략 가능)
        for (let i = 0; i < this.waypointsTop.length; i++) {
            const a = this.waypointsTop[i];
            const b = this.waypointsTop[(i + 1) % this.waypointsTop.length];
            this.add.line(0, 0, a.x, a.y, b.x, b.y, 0x224488).setOrigin(0).setLineWidth(3);
        }
        for (let i = 0; i < this.waypointsBottom.length; i++) {
            const a = this.waypointsBottom[i];
            const b = this.waypointsBottom[(i + 1) % this.waypointsBottom.length];
            this.add.line(0, 0, a.x, a.y, b.x, b.y, 0x334455).setOrigin(0).setLineWidth(3);
        }

        // 라운드 타이머
        this.cfg = getDefaultConfig('Normal');
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
            (waveIndex) => this.grantWaveClearGold(waveIndex)   // ← 웨이브 클리어 보상
        );

        // 적 처치 이벤트 수신 → 골드 지급
        this.events.on('enemy_killed', (payload: { x: number; y: number; maxHp: number; bounty: number }) => {
            this.gold += payload.bounty;
            // 작은 +골드 이펙트
            const t = this.add.text(payload.x, payload.y - 18, `+${payload.bounty}`, {
                color: '#ffd54f', fontSize: '18px', fontFamily: 'monospace'
            }).setOrigin(0.5).setDepth(20);
            this.tweens.add({ targets: t, y: t.y - 20, alpha: 0, duration: 500, onComplete: () => t.destroy() });
        });

        // 모드 선택 → 웨이브 시작
        this.modeSelector = new ModeSelector(this, (m) => {
            this.mode = m;
            this.waves.start(this.mode, 0);
        });
        this.modeSelector.show();

        // 소환 버튼(유닛: 격자 스냅)
        new SummonButton(this, () => this.trySummonUnitOnGrid()).create();

        // 디버그 격자
        if (this.gridDebug) {
            this.gridGfx = this.add.graphics().setDepth(2);
            this.drawGridDebug();
        }
    }

    update(_: number, delta: number) {
        const dt = delta / 1000;

        // 라운드 타이머
        this.round.update(dt);
        if (this.round.expired) {
            this.gameOver('라운드 제한 시간 초과');
            return;
        }

        // 유닛/적/투사체
        for (const u of this.units) u.update(dt, this.enemies, this.projectiles);
        for (const e of this.enemies) e.update(dt);
        this.enemies = this.enemies.filter(e => e.alive);
        this.projectiles = this.projectiles.filter(p => p.alive);
        for (const p of this.projectiles) p.update(dt);

        // 웨이브
        this.waves.update(dt, this.mode, this.enemies);

        // HUD
        this.hud.update(this.gold, this.units.length, this.enemies.length, MAX_ALIVE, this.waves, this.mode, this.round.remaining);
    }

    // 웨이브 클리어 보상 계산/지급
    private grantWaveClearGold(waveIndex: number) {
        const bonus = Math.max(
            1,
            Math.floor(WAVE_CLEAR_BASE * Math.pow(1 + WAVE_CLEAR_GROWTH, waveIndex))
        );
        this.gold += bonus;
        this.toast(`웨이브 클리어 보상 +${bonus}`, '#77ff77');
    }

    // 격자 스냅 유닛 소환
    private trySummonUnitOnGrid() {
        if (this.gold < SUMMON_COST) {
            this.toast('골드가 부족합니다', '#ff7777');
            return;
        }
        const freeCells = this.bottomCells.filter(c => !this.occupied.has(`${c.col},${c.row}`));
        if (freeCells.length === 0) {
            this.toast('배치 가능한 자리가 없습니다', '#ff7777');
            return;
        }
        const pick = freeCells[(Math.random() * freeCells.length) | 0];
        const key = `${pick.col},${pick.row}`;

        this.gold -= SUMMON_COST;
        const unit = new Unit(this, pick.x, pick.y, 20, 0.6, 180);
        unit.setDepth(5);
        this.units.push(unit);
        this.occupied.add(key);

        const fx = this.add.circle(pick.x, pick.y, 4, 0x99ddff).setAlpha(0.8);
        this.tweens.add({ targets: fx, radius: 40, alpha: 0, duration: 250, onComplete: () => fx.destroy() });
    }

    private drawGridDebug() {
        if (!this.gridGfx) return;
        this.gridGfx.clear();
        const b = LOOP_RECT_BOTTOM;
        this.gridGfx.lineStyle(2, 0x66aa66, 0.8).strokeRect(b.left, b.top, b.right - b.left, b.bottom - b.top);
        const t = LOOP_RECT_TOP;
        this.gridGfx.lineStyle(2, 0x6688aa, 0.5).strokeRect(t.left, t.top, t.right - t.left, t.bottom - t.top);

        const size = Grid.CELL_SIZE;
        this.gridGfx.lineStyle(1, 0x336633, 0.5);
        for (const c of this.bottomCells) {
            this.gridGfx.strokeRect(c.x - size / 2, c.y - size / 2, size, size);
        }
    }

    private toast(msg: string, color = '#ffeb3b') {
        const t = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 220, msg, {
            color, fontSize: '22px', fontFamily: 'monospace'
        }).setOrigin(0.5).setAlpha(0);
        this.tweens.add({
            targets: t, alpha: 1, y: t.y - 20, duration: 200, onComplete: () => {
                this.time.delayedCall(700, () => {
                    this.tweens.add({ targets: t, alpha: 0, y: t.y - 10, duration: 200, onComplete: () => t.destroy() });
                });
            }
        });
    }

    private gameOver(reason: string) {
        this.scene.pause();

        const bg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 560, 360, 0x000000, 0.7).setDepth(1000);
        const txt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2,
            `게임 오버\n${reason}\n탭(또는 스페이스)하면 재시작`,
            { color: '#fff', fontSize: '32px', fontFamily: 'monospace', align: 'center' }
        ).setOrigin(0.5).setDepth(1001);

        const restart = () => {
            // 리스너 해제
            this.input.manager.events.off('pointerdown', restart);
            this.input.keyboard?.off('keydown-SPACE', restart);
            this.input.keyboard?.off('keydown-ENTER', restart);

            bg.destroy();
            txt.destroy();

            this.scene.restart();
        };

        // 전역 InputManager의 EventEmitter에 바인딩
        this.input.manager.events.once('pointerdown', restart);
        this.input.keyboard?.once('keydown-SPACE', restart);
        this.input.keyboard?.once('keydown-ENTER', restart);
    }

    private winGame() {
        this.scene.pause();

        const bg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 560, 300, 0x000000, 0.7).setDepth(1000);
        const txt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2,
            '클리어!\n탭(또는 스페이스)하면 재시작',
            { color: '#fff', fontSize: '36px', fontFamily: 'monospace', align: 'center' }
        ).setOrigin(0.5).setDepth(1001);

        const restart = () => {
            this.input.manager.events.off('pointerdown', restart);
            this.input.keyboard?.off('keydown-SPACE', restart);
            this.input.keyboard?.off('keydown-ENTER', restart);

            bg.destroy();
            txt.destroy();

            this.scene.restart();
        };

        this.input.manager.events.once('pointerdown', restart);
        this.input.keyboard?.once('keydown-SPACE', restart);
        this.input.keyboard?.once('keydown-ENTER', restart);
    }
}