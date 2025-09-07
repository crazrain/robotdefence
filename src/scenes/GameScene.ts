import Phaser from 'phaser';
import {
    GAME_WIDTH,
    GAME_HEIGHT,
    MAX_ALIVE,
    SUMMON_COST,
    LOOP_RECT_BOTTOM,
    LOOP_RECT_TOP,
    WAVE_CLEAR_BASE,
    WAVE_CLEAR_GROWTH
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
import { Grid } from '../core/Grid';
import { getDefaultConfig, type GameConfig } from '../core/config';
import { RoundTimer } from '../systems/RoundTimer';

export class GameScene extends Phaser.Scene {
    // 경로(상·하 루프)
    waypointsTop = buildTopLoop();
    waypointsBottom = buildBottomLoop();

    // 런타임 배열
    enemies: Enemy[] = [];
    units: Unit[] = [];
    projectiles: Projectile[] = [];

    // 시스템/뷰
    hud!: HUD;
    modeSelector!: ModeSelector;
    spawner!: Spawner;
    waves!: WaveController;

    // 경제/모드
    gold = 200;
    mode: Mode = 'solo';

    // 격자(유닛 배치용)
    private gridGfx?: Phaser.GameObjects.Graphics;
    private gridDebug = true;
    private bottomCells = Grid.buildBottomCells();
    private occupied = new Set<string>(); // "col,row"

    // 라운드(게임) 타임아웃
    private cfg: GameConfig = getDefaultConfig('Normal');
    private round!: RoundTimer;

    // 재시작 처리(씬 pause 없이 내부 정지 플래그 사용)
    private halted = false; // 전투 루프 정지
    private restartBlocker?: Phaser.GameObjects.Rectangle;
    private restartText?: Phaser.GameObjects.Text;

    private enemyKilledHandler = (payload: { x: number; y: number; maxHp: number; bounty: number }) => {
        this.gold += payload.bounty;
        const t = this.add.text(payload.x, payload.y - 18, `+${payload.bounty}`, {
            color: '#ffd54f', fontSize: '18px', fontFamily: 'monospace'
        }).setOrigin(0.5).setDepth(20);
        this.tweens.add({ targets: t, y: t.y - 20, alpha: 0, duration: 500, onComplete: () => t.destroy() });
    };

    constructor() {
        super('GameScene');
    }

    create() {
        this.cameras.main.setBackgroundColor('#101018');

        // 중요: 재시작 시에도 항상 초기화
        this.resetPlacementGrid();
        this.resetRuntimeArrays();
        this.gold = 200;          // 필요 시 초기 골드도 여기서 재설정
        this.halted = false;      // 내부 정지 해제

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
        this.cfg = getDefaultConfig('Normal'); // 필요 시 난이도 선택 UI 연결
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
            (waveIndex) => this.grantWaveClearGold(waveIndex)
        );

        // 적 처치 보상 수신
        this.events.on('enemy_killed', (payload: { x: number; y: number; maxHp: number; bounty: number }) => {
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
        });

        // 모드 선택 → 웨이브 시작
        this.modeSelector = new ModeSelector(this, (m) => {
            this.mode = m;
            this.waves.start(this.mode, 0);
        });
        this.modeSelector.show();

        // 유닛 소환(격자 스냅)
        new SummonButton(this, () => this.trySummonUnitOnGrid()).create();

        // 디버그 격자 시각화
        if (this.gridDebug) {
            this.gridGfx = this.add.graphics().setDepth(2);
            this.drawGridDebug();
        }

        this.events.on('enemy_killed', this.enemyKilledHandler);

        // 씬 종료/파괴 시 정리
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanup());
        this.events.once(Phaser.Scenes.Events.DESTROY, () => this.cleanup(true));

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.resetRuntimeArrays();
            this.occupied.clear();
            this.input.keyboard?.removeAllListeners();
            this.tweens.killAll();
            this.time.removeAllEvents();
        });

        this.events.once(Phaser.Scenes.Events.DESTROY, () => {
            this.gridGfx?.destroy();
            this.restartBlocker?.destroy();
            this.restartText?.destroy();
        });
    }

    private cleanup(hard = false) {
        // 이벤트 해제
        this.events.off('enemy_killed', this.enemyKilledHandler);

        // 입력 리스너(재시작 오버레이 키 바인딩 등) 해제
        this.input.keyboard?.removeAllListeners();

        // 타이머/트윈 정리
        this.tweens.killAll();
        this.time.removeAllEvents();

        // 배열 참조 제거(이전 씬 인스턴스에서 남았을 수 있는 콜백 방지)
        this.enemies.length = 0;
        this.units.length = 0;
        this.projectiles.length = 0;

        // 오버레이 정리
        this.restartBlocker?.destroy();
        this.restartText?.destroy();

        if (hard) {
            this.gridGfx?.destroy();
            this.occupied.clear();
        }

        this.gridGfx?.destroy();
        this.restartBlocker?.destroy();
        this.restartText?.destroy();
    }

    update(_: number, delta: number) {
        // 전투 정지 상태라면 로직 스킵(입력은 살려둠)
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
        for (const e of this.enemies) e.update(dt);
        this.enemies = this.enemies.filter((e) => e.alive);
        this.projectiles = this.projectiles.filter((p) => p.alive);
        for (const p of this.projectiles) p.update(dt);

        // 웨이브
        this.waves.update(dt, this.mode, this.enemies);

        // HUD
        this.hud.update(
            this.gold,
            this.units.length,
            this.enemies.length,
            MAX_ALIVE,
            this.waves,
            this.mode,
            this.round.remaining
        );
    }

    // 웨이브 클리어 보상
    private grantWaveClearGold(waveIndex: number) {
        const bonus = Math.max(1, Math.floor(WAVE_CLEAR_BASE * Math.pow(1 + WAVE_CLEAR_GROWTH, waveIndex)));
        this.gold += bonus;
        this.toast(`웨이브 클리어 보상 +${bonus}`, '#77ff77');
    }

    // 격자 스냅 유닛 소환
    private trySummonUnitOnGrid() {
        if (this.gold < SUMMON_COST) {
            this.toast('골드가 부족합니다', '#ff7777');
            return;
        }
        const free = this.bottomCells.filter((c) => !this.occupied.has(`${c.col},${c.row}`));
        if (free.length === 0) {
            this.toast('배치 가능한 자리가 없습니다', '#ff7777');
            return;
        }
        const pick = free[(Math.random() * free.length) | 0];
        const key = `${pick.col},${pick.row}`;

        this.gold -= SUMMON_COST;
        const unit = new Unit(this, pick.x, pick.y, 20, 0.6, 180);
        unit.setDepth(5);
        this.units.push(unit);
        this.occupied.add(key);

        const fx = this.add.circle(pick.x, pick.y, 4, 0x99ddff).setAlpha(0.8);
        this.tweens.add({ targets: fx, radius: 40, alpha: 0, duration: 250, onComplete: () => fx.destroy() });
    }

    // 디버그 격자 그리기
    private drawGridDebug() {
        if (!this.gridGfx) return;
        this.gridGfx.clear();

        // 하단 박스
        const b = LOOP_RECT_BOTTOM;
        this.gridGfx.lineStyle(2, 0x66aa66, 0.8).strokeRect(b.left, b.top, b.right - b.left, b.bottom - b.top);

        // 상단 박스(참고)
        const t = LOOP_RECT_TOP;
        this.gridGfx.lineStyle(2, 0x6688aa, 0.5).strokeRect(t.left, t.top, t.right - t.left, t.bottom - t.top);

        // 셀
        const size = Grid.CELL_SIZE;
        this.gridGfx.lineStyle(1, 0x336633, 0.5);
        for (const c of this.bottomCells) {
            this.gridGfx.strokeRect(c.x - size / 2, c.y - size / 2, size, size);
        }
    }

    // 토스트 메시지
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

    // 재시작 바인딩/수행(씬 pause 미사용)
    private bindRestartOnce() {
        this.restartBlocker?.once('pointerdown', () => this.doRestart());
        this.input.keyboard?.once('keydown-SPACE', () => this.doRestart());
        this.input.keyboard?.once('keydown-ENTER', () => this.doRestart());
    }

    private doRestart() {
        // 오버레이/리스너 정리
        this.restartBlocker?.removeInteractive();
        this.restartBlocker?.destroy();
        this.restartText?.destroy();
        this.tweens.killAll();
        this.time.removeAllEvents();

        // 중요: 격자/런타임 배열/경제 상태 초기화
        this.resetPlacementGrid();
        this.resetRuntimeArrays();
        this.gold = 200;
        this.halted = false;

        this.scene.restart();
    }

    // 게임 오버 화면(내부 정지만, 입력은 살려둠)
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

        // 연출 일시정지(선택)
        this.tweens.pauseAll();

        this.bindRestartOnce();
    }

    // 클리어 화면(내부 정지만)
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

    private resetPlacementGrid() {
        // 격자 목록 다시 구성(하단 사각형 내 유효 셀)
        this.bottomCells = Grid.buildBottomCells();
        // 점유 상태 초기화
        this.occupied.clear();
    }

    private resetRuntimeArrays() {
        // 남아있을 수 있는 오브젝트 정리
        this.units.forEach(u => u.destroy());
        this.enemies.forEach(e => e.destroy());
        this.projectiles.forEach(p => p.destroy());

        this.units.length = 0;
        this.enemies.length = 0;
        this.projectiles.length = 0;
    }
}
