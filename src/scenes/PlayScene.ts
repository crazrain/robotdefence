import Phaser from 'phaser';
import { Waves, type WaveDef } from '../data/waves';

type Vec2 = { x: number; y: number };
type Mode = 'solo' | 'duo';

class Enemy extends Phaser.GameObjects.Arc {
    hp: number;
    speed: number;
    wpIndex = 0;
    waypoints: Vec2[];
    alive = true;

    constructor(scene: Phaser.Scene, x: number, y: number, waypoints: Vec2[], hp: number, speed: number, wpIndexAtJoin: number) {
        super(scene, x, y, 16, 0, 360, false);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        (this.body as Phaser.Physics.Arcade.Body).setCircle(16).setOffset(-16, -16);
        this.setFillStyle(0xff4444, 1);
        this.waypoints = waypoints;
        this.hp = hp;
        this.speed = speed;
        this.wpIndex = wpIndexAtJoin; // 루프에 합류할 최초 코너 인덱스
    }

    takeDamage(dmg: number) {
        this.hp -= dmg;
        if (this.hp <= 0 && this.alive) {
            this.alive = false;
            this.destroy();
        }
    }

    update(dt: number) {
        if (!this.alive) return;

        const target = this.waypoints[this.wpIndex];
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 4) {
            // 사각 루프를 시계 방향으로 계속 순환
            this.wpIndex = (this.wpIndex + 1) % this.waypoints.length;
        } else {
            const vx = (dx / dist) * this.speed;
            const vy = (dy / dist) * this.speed;
            this.x += vx * dt;
            this.y += vy * dt;
        }
    }
}

class Projectile extends Phaser.GameObjects.Arc {
    dmg: number;
    speed: number;
    vx = 0;
    vy = 0;
    alive = true;
    target?: Enemy;

    constructor(scene: Phaser.Scene, x: number, y: number, dmg: number, speed: number, target?: Enemy) {
        super(scene, x, y, 6, 0, 360, false);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setFillStyle(0xffff66, 1);
        this.dmg = dmg;
        this.speed = speed;
        this.target = target;
    }

    update(dt: number) {
        if (!this.alive) return;

        if (this.target && this.target.alive) {
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 8) {
                this.target.takeDamage(this.dmg);
                this.alive = false;
                this.destroy();
                return;
            }
            this.vx = (dx / dist) * this.speed;
            this.vy = (dy / dist) * this.speed;
        }
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        if (this.x < -50 || this.x > 800 || this.y < -50 || this.y > 1400) {
            this.alive = false;
            this.destroy();
        }
    }
}

class Unit extends Phaser.GameObjects.Arc {
    range: number;
    atk: number;
    atkInterval: number;
    timeSinceAttack = 0;
    lastTarget?: Enemy;
    targetStick = 0;

    constructor(scene: Phaser.Scene, x: number, y: number, atk: number, atkInterval: number, range: number) {
        super(scene, x, y, 14, 0, 360, false);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setFillStyle(0x66ccff, 1);
        this.range = range;
        this.atk = atk;
        this.atkInterval = atkInterval;
    }

    update(dt: number, enemies: Enemy[], projectiles: Projectile[]) {
        this.timeSinceAttack += dt;
        this.targetStick = Math.max(0, this.targetStick - dt);

        if (!this.lastTarget || !this.lastTarget.alive || this.distanceTo(this.lastTarget) > this.range) {
            if (this.targetStick <= 0) {
                this.lastTarget = this.findPriorityTarget(enemies);
                this.targetStick = 0.3;
            }
        }

        if (this.lastTarget && this.timeSinceAttack >= this.atkInterval) {
            this.shoot(projectiles, this.lastTarget);
            this.timeSinceAttack = 0;
        }
    }

    distanceTo(e: Enemy) {
        return Math.hypot(e.x - this.x, e.y - this.y);
    }

    findPriorityTarget(enemies: Enemy[]) {
        const inRange = enemies.filter(e => e.alive && this.distanceTo(e) <= this.range);
        if (inRange.length === 0) return undefined;
        // 루프 경로 기준으로 진행도가 앞선 적 우선, 동률이면 거리 짧은 적
        return inRange.sort((a, b) => (b.wpIndex - a.wpIndex) || (this.distanceTo(a) - this.distanceTo(b)))[0];
    }

    shoot(projectiles: Projectile[], target: Enemy) {
        const p = new Projectile(this.scene, this.x, this.y, this.atk, 600, target);
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const dist = Math.hypot(dx, dy) || 1;
        p.vx = (dx / dist) * 600;
        p.vy = (dy / dist) * 600;
        projectiles.push(p);
    }
}

export class PlayScene extends Phaser.Scene {
    width = 720;
    height = 1280;

    // 언덕(사각 루프) 코너들: 좌상->좌하->우하->우상 (시계 방향)
    loopWaypoints: Vec2[] = [];
    // 자리(스폰 구멍): P2(위), P1(아래)
    seatTop!: Vec2;
    seatBottom!: Vec2;

    enemies: Enemy[] = [];
    units: Unit[] = [];
    projectiles: Projectile[] = [];

    gold = 200;

    // 모드
    mode: Mode = 'solo';

    // 웨이브
    waves: WaveDef[] = Waves;
    waveIdx = 0;
    waveTimeLeft = 0;
    topToSpawn = 0;
    bottomToSpawn = 0;
    spawnIntervalTop = 0;
    spawnIntervalBottom = 0;
    spawnTimerTop = 0;
    spawnTimerBottom = 0;
    baseHp = 100;

    // 패배 한계치
    maxAlive = 100;

    // UI
    hudText!: Phaser.GameObjects.Text;
    waveText!: Phaser.GameObjects.Text;

    // 버튼
    summonContainer!: Phaser.GameObjects.Container;
    summonBg!: Phaser.GameObjects.Rectangle;
    summonLabel!: Phaser.GameObjects.Text;

    // 시작/모드 선택 오버레이
    startOverlay?: Phaser.GameObjects.Rectangle;
    btnSolo?: Phaser.GameObjects.Rectangle;
    btnDuo?: Phaser.GameObjects.Rectangle;
    labelSolo?: Phaser.GameObjects.Text;
    labelDuo?: Phaser.GameObjects.Text;

    constructor() {
        super('PlayScene');
    }

    create() {
        this.cameras.main.setBackgroundColor('#101018');

        // 언덕 루프(사각형) 정의
        const left = 100, right = 620, top = 260, bottom = 980;
        // 좌상 -> 좌하 -> 우하 -> 우상 (시계방향)
        this.loopWaypoints = [
            { x: left,  y: top },
            { x: left,  y: bottom },
            { x: right, y: bottom },
            { x: right, y: top },
        ];
        // 자리: 위(좌상 위쪽), 아래(좌하 아래쪽). 스폰은 자리에서 시작.
        this.seatTop = { x: left, y: top - 80 };
        this.seatBottom = { x: left, y: bottom + 80 };

        // 경로/자리 디버그
        for (let i = 0; i < this.loopWaypoints.length; i++) {
            const a = this.loopWaypoints[i];
            const b = this.loopWaypoints[(i + 1) % this.loopWaypoints.length];
            const line = this.add.line(0, 0, a.x, a.y, b.x, b.y, 0x333355).setOrigin(0);
            line.setLineWidth(3);
        }
        this.add.circle(this.seatTop.x, this.seatTop.y, 8, 0x88ff88);
        this.add.circle(this.seatBottom.x, this.seatBottom.y, 8, 0x88ff88);

        // HUD
        this.hudText = this.add.text(20, 20, '', { color: '#ffffff', fontFamily: 'monospace', fontSize: '24px' });
        this.waveText = this.add.text(this.width / 2, 20, '', { color: '#ffffff', fontFamily: 'monospace', fontSize: '24px' }).setOrigin(0.5, 0);

        // 모드 선택 오버레이
        this.buildModeSelector();

        // 소환 버튼
        const btnX = this.width / 2;
        const btnY = this.height - 140;
        this.summonContainer = this.add.container(btnX, btnY);
        this.summonBg = this.add.rectangle(0, 0, 320, 72, 0x2a7a2a);
        this.summonLabel = this.add.text(0, 0, '소환(100골드)', { color: '#ffffff', fontSize: '24px', fontFamily: 'monospace' }).setOrigin(0.5);
        this.summonContainer.add([this.summonBg, this.summonLabel]);
        this.summonBg.setInteractive(new Phaser.Geom.Rectangle(-160, -36, 320, 72), Phaser.Geom.Rectangle.Contains);
        this.summonLabel.setInteractive();
        const press = () => this.summonBg.setFillStyle(0x236923);
        const release = () => this.summonBg.setFillStyle(0x2a7a2a);
        const click = () => {
            this.trySummonUnit();
            this.tweens.add({ targets: this.summonContainer, scale: 0.97, duration: 60, yoyo: true });
        };
        this.summonBg.on('pointerdown', press);
        this.summonBg.on('pointerup', () => { release(); click(); });
        this.summonBg.on('pointerout', release);
        this.summonLabel.on('pointerdown', press);
        this.summonLabel.on('pointerup', () => { release(); click(); });
        this.summonLabel.on('pointerout', release);

        this.updateHUD();
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

        // 웨이브 진행
        this.updateWave(dt);

        // 패배 조건: 필드 적 100마리 이상
        if (this.enemies.length >= this.maxAlive) {
            this.gameOver('적이 너무 많이 쌓였습니다(100 마리).');
        }

        this.updateHUD();
    }

    buildModeSelector() {
        // 반투명 배경
        this.startOverlay = this.add.rectangle(this.width / 2, this.height / 2, this.width, this.height, 0x000000, 0.5).setDepth(1000);
        // SOLO 버튼
        this.btnSolo = this.add.rectangle(this.width / 2 - 150, this.height / 2, 220, 100, 0x3a6ea5, 1).setDepth(1001).setInteractive();
        this.labelSolo = this.add.text(this.btnSolo.x, this.btnSolo.y, '1인(SOLO)', { color: '#fff', fontSize: '26px', fontFamily: 'monospace' }).setOrigin(0.5).setDepth(1002);
        // DUO 버튼
        this.btnDuo = this.add.rectangle(this.width / 2 + 150, this.height / 2, 220, 100, 0xa55e3a, 1).setDepth(1001).setInteractive();
        this.labelDuo = this.add.text(this.btnDuo.x, this.btnDuo.y, '2인(DUO)', { color: '#fff', fontSize: '26px', fontFamily: 'monospace' }).setOrigin(0.5).setDepth(1002);

        const pick = (mode: Mode) => {
            this.mode = mode;
            this.startOverlay?.destroy();
            this.btnSolo?.destroy(); this.labelSolo?.destroy();
            this.btnDuo?.destroy();  this.labelDuo?.destroy();
            this.startWave(0);
        };

        this.btnSolo.on('pointerup', () => pick('solo'));
        this.btnDuo.on('pointerup', () => pick('duo'));
    }

    // 웨이브 시작
    startWave(index: number) {
        this.waveIdx = index;
        const w = this.waves[this.waveIdx];
        this.waveTimeLeft = w.durationSeconds;

        // 모드에 따라 스폰 계획을 자리 기준으로 제한
        this.topToSpawn = (this.mode === 'duo') ? w.topCount : 0; // 1인: 위쪽 자리 스폰 금지
        this.bottomToSpawn = w.bottomCount;                       // 아래쪽 자리(P1)는 항상 사용

        // 균등 간격 스폰
        this.spawnIntervalTop = this.topToSpawn > 0 ? w.durationSeconds / this.topToSpawn : 0;
        this.spawnIntervalBottom = this.bottomToSpawn > 0 ? w.durationSeconds / this.bottomToSpawn : 0;
        this.spawnTimerTop = 0;
        this.spawnTimerBottom = 0;

        this.updateHUD();
    }

    // 웨이브 업데이트/스폰/종료 판정
    updateWave(dt: number) {
        if (this.waveIdx >= this.waves.length) return;

        const w = this.waves[this.waveIdx];
        this.waveTimeLeft = Math.max(0, this.waveTimeLeft - dt);

        // 위쪽 자리(P2) 스폰
        if (this.topToSpawn > 0 && this.spawnIntervalTop > 0) {
            this.spawnTimerTop += dt;
            while (this.topToSpawn > 0 && this.spawnTimerTop >= this.spawnIntervalTop) {
                this.spawnTimerTop -= this.spawnIntervalTop;
                this.spawnEnemyFromTop(w);
                this.topToSpawn--;
            }
        }

        // 아래쪽 자리(P1) 스폰
        if (this.bottomToSpawn > 0 && this.spawnIntervalBottom > 0) {
            this.spawnTimerBottom += dt;
            while (this.bottomToSpawn > 0 && this.spawnTimerBottom >= this.spawnIntervalBottom) {
                this.spawnTimerBottom -= this.spawnIntervalBottom;
                this.spawnEnemyFromBottom(w);
                this.bottomToSpawn--;
            }
        }

        const allSpawned = this.topToSpawn === 0 && this.bottomToSpawn === 0;

        // 시간 종료 시 판정
        if (this.waveTimeLeft <= 0) {
            if (this.enemies.length > 0) {
                this.gameOver('시간 내에 처치하지 못했습니다.');
                return;
            }
            this.nextWaveOrWin();
            return;
        }

        // 스폰 완료 후 전멸하면 다음 웨이브로 조기 진행
        if (allSpawned && this.enemies.length === 0) {
            this.nextWaveOrWin();
        }
    }

    nextWaveOrWin() {
        if (this.waveIdx < this.waves.length - 1) {
            this.startWave(this.waveIdx + 1);
        } else {
            this.winGame();
        }
    }

    // 위쪽 자리에서 내려오다 좌하 갈림길에서 오른쪽(= 시계 방향)으로 빠져 루프
    spawnEnemyFromTop(w: WaveDef) {
        const hp = Math.floor(this.baseHp * w.hpScale);
        // 위 자리에서 시작, 첫 타겟은 좌상(LT=0) → 도달 후 좌하(1)로 곧장 내려감
        const e = new Enemy(this, this.seatTop.x, this.seatTop.y, this.loopWaypoints, hp, w.speed, 0);
        this.enemies.push(e);
    }

    // 아래쪽 자리에서 올라와 좌하에서 합류 → 오른쪽으로 진행(= 시계 방향)
    spawnEnemyFromBottom(w: WaveDef) {
        const hp = Math.floor(this.baseHp * w.hpScale);
        // 아래 자리에서 시작, 첫 타겟은 좌하(LB=1)
        const e = new Enemy(this, this.seatBottom.x, this.seatBottom.y, this.loopWaypoints, hp, w.speed, 1);
        this.enemies.push(e);
    }

    updateHUD() {
        const waveNum = Math.min(this.waveIdx + 1, this.waves.length);
        this.hudText.setText(`Gold ${this.gold}   Units ${this.units.length}   Enemies ${this.enemies.length}/${this.maxAlive}`);
        if (this.waveIdx < this.waves.length) {
            this.waveText.setText(`WAVE ${waveNum}/${this.waves.length}   남은 시간 ${this.waveTimeLeft.toFixed(1)}s   모드: ${this.mode === 'solo' ? '1인' : '2인'}`);
        } else {
            this.waveText.setText(`모든 웨이브 완료`);
        }
    }

    showToast(msg: string, color = '#ffeb3b') {
        const t = this.add.text(this.width / 2, this.height - 220, msg, {
            color,
            fontSize: '22px',
            fontFamily: 'monospace'
        }).setOrigin(0.5).setAlpha(0.0);
        this.tweens.add({
            targets: t, alpha: 1, y: t.y - 20, duration: 200, onComplete: () => {
                this.time.delayedCall(700, () => {
                    this.tweens.add({ targets: t, alpha: 0, y: t.y - 10, duration: 200, onComplete: () => t.destroy() });
                });
            }
        });
    }

    trySummonUnit() {
        const cost = 100;
        if (this.gold < cost) {
            this.showToast('골드가 부족합니다', '#ff7777');
            return;
        }
        this.gold -= cost;

        // 임시 배치(격자 스냅 없이 루프 내부 영역 임의 좌표)
        const x = Phaser.Math.Between(160, this.width - 160);
        const y = Phaser.Math.Between(420, 860);

        const unit = new Unit(this, x, y, 20, 0.6, 180);
        unit.setDepth(5);
        this.units.push(unit);

        const flash = this.add.circle(x, y, 4, 0x99ddff).setAlpha(0.8);
        this.tweens.add({ targets: flash, radius: 40, alpha: 0, duration: 250, onComplete: () => flash.destroy() });

        this.showToast('소환 완료!', '#77ff77');
        this.updateHUD();
    }

    gameOver(reason: string) {
        this.scene.pause();
        const bg = this.add.rectangle(this.width / 2, this.height / 2, 560, 360, 0x000000, 0.7).setDepth(1000);
        const txt = this.add.text(this.width / 2, this.height / 2, `게임 오버\n${reason}\n탭하면 재시작`, {
            color: '#fff', fontSize: '32px', fontFamily: 'monospace', align: 'center'
        }).setOrigin(0.5).setDepth(1001);

        this.input.once('pointerdown', () => {
            this.resetGame();
            bg.destroy();
            txt.destroy();
        });
    }

    winGame() {
        this.scene.pause();
        const bg = this.add.rectangle(this.width / 2, this.height / 2, 560, 300, 0x000000, 0.7).setDepth(1000);
        const txt = this.add.text(this.width / 2, this.height / 2, `클리어!\n탭하면 재시작`, {
            color: '#fff', fontSize: '36px', fontFamily: 'monospace', align: 'center'
        }).setOrigin(0.5).setDepth(1001);

        this.input.once('pointerdown', () => {
            this.resetGame();
            bg.destroy();
            txt.destroy();
        });
    }

    resetGame() {
        this.scene.restart();
        this.gold = 200;
        this.enemies = [];
        this.units = [];
        this.projectiles = [];
        this.waveIdx = 0;
    }
}