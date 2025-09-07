import Phaser from 'phaser';

type Vec2 = { x: number; y: number };

class Enemy extends Phaser.GameObjects.Arc {
    hp: number;
    speed: number;
    wpIndex = 0;
    waypoints: Vec2[];
    alive = true;

    constructor(scene: Phaser.Scene, x: number, y: number, waypoints: Vec2[], hp: number, speed: number) {
        super(scene, x, y, 16, 16, 0xffffff);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        (this.body as Phaser.Physics.Arcade.Body).setCircle(16).setOffset(-16, -16);
        this.setFillStyle(0xff4444);
        this.waypoints = waypoints;
        this.hp = hp;
        this.speed = speed;
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
            this.wpIndex++;
            if (this.wpIndex >= this.waypoints.length) {
                // 목표 도달: 씬이 생명 감소 처리
                this.alive = false;
                this.destroy();
                return;
            }
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
        super(scene, x, y, 6, 6, 0xffffff);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.setFillStyle(0xffff66);
        this.dmg = dmg;
        this.speed = speed;
        this.target = target;
    }

    update(dt: number) {
        if (!this.alive) return;

        // 간단 호밍
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

        // 화면 밖 제거
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
    targetStick = 0; // 0.3초 히스테리시스

    constructor(scene: Phaser.Scene, x: number, y: number, atk: number, atkInterval: number, range: number) {
        super(scene, x, y, 14, 14, 0x66ccff);
        scene.add.existing(this);
        scene.physics.add.existing(this);
        this.range = range;
        this.atk = atk;
        this.atkInterval = atkInterval;
    }

    update(dt: number, enemies: Enemy[], projectiles: Projectile[]) {
        this.timeSinceAttack += dt;
        this.targetStick = Math.max(0, this.targetStick - dt);

        // 타깃 유지 + 재탐색
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
        // 사거리 내에서 '목표에 더 가까운' 적 우선 (웨이포인트 진행도 기반)
        const inRange = enemies.filter(e => e.alive && this.distanceTo(e) <= this.range);
        if (inRange.length === 0) return undefined;
        return inRange.sort((a, b) => b.wpIndex - a.wpIndex)[0];
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

    waypoints: Vec2[] = [];
    enemies: Enemy[] = [];
    units: Unit[] = [];
    projectiles: Projectile[] = [];

    gold = 200;
    lives = 5;
    wave = 1;
    maxConcurrentEnemies = 10;

    hudText!: Phaser.GameObjects.Text;

    // 버튼 구성요소
    summonContainer!: Phaser.GameObjects.Container;
    summonBg!: Phaser.GameObjects.Rectangle;
    summonLabel!: Phaser.GameObjects.Text;

    // 시작 오버레이(오디오 unlock)
    startOverlay?: Phaser.GameObjects.Rectangle;
    startLabel?: Phaser.GameObjects.Text;

    constructor() {
        super('PlayScene');
    }

    create() {
        this.cameras.main.setBackgroundColor('#101018');

        // 간단 경로
        this.waypoints = [
            { x: 80, y: 120 },
            { x: 640, y: 120 },
            { x: 640, y: 800 },
            { x: 680, y: 800 }
        ];

        // 경로 표시(디버그)
        for (let i = 0; i < this.waypoints.length - 1; i++) {
            const a = this.waypoints[i], b = this.waypoints[i + 1];
            const line = this.add.line(0, 0, a.x, a.y, b.x, b.y, 0x333355).setOrigin(0);
            line.setLineWidth(3);
        }
        this.waypoints.forEach(wp => this.add.circle(wp.x, wp.y, 5, 0x444488));

        // HUD
        this.hudText = this.add.text(20, 20, '', { color: '#ffffff', fontFamily: 'monospace', fontSize: '24px' });
        this.updateHUD();

        // “탭하여 시작” 오버레이(오디오 unlock)
        this.startOverlay = this.add.rectangle(this.width / 2, this.height / 2, this.width, this.height, 0x000000, 0.35).setInteractive();
        this.startLabel = this.add.text(this.width / 2, this.height / 2, '탭하여 시작', {
            color: '#fff', fontSize: '28px', fontFamily: 'monospace'
        }).setOrigin(0.5);
        this.startOverlay.once('pointerdown', async () => {
            try {
                const snd: any = this.sound;
                if (snd.locked) {
                    await snd.unlock();
                } else if (this.sound.context && this.sound.context.state !== 'running') {
                    await this.sound.context.resume();
                }
            } catch (e) {
                console.warn('오디오 잠금 해제 실패:', e);
            }
            this.startOverlay?.destroy();
            this.startLabel?.destroy();
        });

        // 소환 버튼(컨테이너로 신뢰도 향상)
        const btnX = this.width / 2;
        const btnY = this.height - 140; // 모바일 하단 UI와 간섭 피하기
