import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, MAX_ALIVE, SUMMON_COST } from '../core/constants';
import { buildLoopWaypoints } from '../core/Path';
import type { Mode } from '../core/types';
import { Enemy } from '../objects/Enemy';
import { Unit } from '../objects/Unit';
import { Projectile } from '../objects/Projectile';
import { HUD } from '../ui/HUD';
import { ModeSelector } from '../ui/ModeSelector';
import { SummonButton } from '../ui/SummonButton';
import { Spawner } from '../systems/Spawner';
import { WaveController } from '../systems/WaveController';

export class GameScene extends Phaser.Scene {
    waypoints = buildLoopWaypoints();

    enemies: Enemy[] = [];
    units: Unit[] = [];
    projectiles: Projectile[] = [];

    hud!: HUD;
    modeSelector!: ModeSelector;
    spawner!: Spawner;
    waves!: WaveController;

    gold = 200;
    mode: Mode = 'solo';

    constructor() { super('GameScene'); }

    create() {
        this.cameras.main.setBackgroundColor('#101018');

        // 경로 디버그 라인
        for (let i = 0; i < this.waypoints.length; i++) {
            const a = this.waypoints[i];
            const b = this.waypoints[(i + 1) % this.waypoints.length];
            const line = this.add.line(0, 0, a.x, a.y, b.x, b.y, 0x333355).setOrigin(0);
            line.setLineWidth(3);
        }

        // HUD
        this.hud = new HUD(this);
        this.hud.create();

        // 시스템
        this.spawner = new Spawner(this, this.waypoints);
        this.waves = new WaveController(
            this,
            this.spawner,
            (reason) => this.gameOver(reason),
            () => {},            // wave change hook(필요시 연출 추가 지점)
            () => this.winGame()
        );

        // 모드 선택 오버레이
        this.modeSelector = new ModeSelector(this, (m) => {
            this.mode = m;
            this.waves.start(this.mode, 0);
        });
        this.modeSelector.show();

        // 소환 버튼(정적 임포트로 변경)
        new SummonButton(this, () => this.trySummonUnit()).create();
    }

    update(_: number, delta: number) {
        const dt = delta / 1000;

        // 유닛
        for (const u of this.units) u.update(dt, this.enemies, this.projectiles);

        // 적
        for (const e of this.enemies) e.update(dt);
        this.enemies = this.enemies.filter(e => e.alive);

        // 투사체
        this.projectiles = this.projectiles.filter(p => p.alive);
        for (const p of this.projectiles) p.update(dt);

        // 웨이브
        this.waves.update(dt, this.mode, this.enemies);

        // HUD
        this.hud.update(this.gold, this.units.length, this.enemies.length, MAX_ALIVE, this.waves, this.mode);
    }

    private trySummonUnit() {
        if (this.gold < SUMMON_COST) {
            this.toast('골드가 부족합니다', '#ff7777');
            return;
        }
        this.gold -= SUMMON_COST;
        const x = Phaser.Math.Between(160, GAME_WIDTH - 160);
        const y = Phaser.Math.Between(420, GAME_HEIGHT - 420);
        const unit = new Unit(this, x, y, 20, 0.6, 180);
        unit.setDepth(5);
        this.units.push(unit);

        const fx = this.add.circle(x, y, 4, 0x99ddff).setAlpha(0.8);
        this.tweens.add({ targets: fx, radius: 40, alpha: 0, duration: 250, onComplete: () => fx.destroy() });
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
        const txt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, `게임 오버\n${reason}\n탭하면 재시작`, {
            color: '#fff', fontSize: '32px', fontFamily: 'monospace', align: 'center'
        }).setOrigin(0.5).setDepth(1001);

        this.input.once('pointerdown', () => {
            bg.destroy(); txt.destroy();
            this.scene.restart(); // 초기화
        });
    }

    private winGame() {
        this.scene.pause();
        const bg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 560, 300, 0x000000, 0.7).setDepth(1000);
        const txt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '클리어!\n탭하면 재시작', {
            color: '#fff', fontSize: '36px', fontFamily: 'monospace', align: 'center'
        }).setOrigin(0.5).setDepth(1001);

        this.input.once('pointerdown', () => {
            bg.destroy(); txt.destroy();
            this.scene.restart();
        });
    }
}