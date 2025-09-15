// src/scenes/GameScene.ts
import Phaser from 'phaser';
import {
    GAME_WIDTH,
    GAME_HEIGHT,
    MAX_ALIVE,
    LOOP_RECT_BOTTOM,
    LOOP_RECT_TOP,
    WAVE_CLEAR_BASE,
    WAVE_CLEAR_GROWTH,
    HEROES_DATA,
    THEME,
    HERO_SUMMON_COST,
    HERO_SELL_RETURN_RATE,
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
import { getDefaultConfig, type GameConfig } from '../core/config';
import { RoundTimer } from '../systems/RoundTimer';
import { Hero } from '../objects/Hero';
import { GridManager } from '../systems/GridManager';
import { SpeedControlButton } from '../ui/SpeedControlButton';
import { Toast } from '../ui/Toast';
import { HeroActionPanel } from '../ui/HeroActionPanel';

const VOLUME_STORAGE_KEY = 'robot-defence-volume';

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
    gridManager!: GridManager;
    speedControlButton!: SpeedControlButton;
    heroActionPanel!: HeroActionPanel;

    private toast!: Toast;
    // 볼륨 UI 요소
    private volumeLabel?: Phaser.GameObjects.Text;
    private volumeBackground?: Phaser.GameObjects.Rectangle;
    private volumeSlider?: Phaser.GameObjects.Rectangle;
    private volumeValueText?: Phaser.GameObjects.Text;
    private volumeBorder?: Phaser.GameObjects.Graphics;

    // 볼륨 슬라이더 상수
    private readonly volumeUiX = 100; // 왼쪽 여백 100px
    private readonly volumeLabelY = 90;
    private readonly volumeSliderY = 120;
    private readonly volumeSliderWidth = 90;
    private readonly volumeSliderHeight = 8;
    private volumeSliderMinX = 0;
    private volumeSliderMaxX = 0;

    // 경제/모드
    gold = 200;
    mode: Mode = 'solo';
    private gameSpeed = 1;

    // 라운드(게임) 타임아웃
    private cfg: GameConfig = getDefaultConfig('Normal');
    private round!: RoundTimer;

    // 정리 가드 플래그
    private _cleaned = false;

    // 적 처치 보상 핸들러(해제 위해 필드로 유지)
    private enemyKilledHandler = (payload: { x: number; y: number; maxHp: number; bounty: number }) => {
        this.gold += payload.bounty;
        const t = this.add // 골드 획득 텍스트
            .text(payload.x, payload.y - 18, `+${payload.bounty}`, {
                color: THEME.warning,
                fontSize: '18px',
                fontFamily: THEME.font
            })
            .setOrigin(0.5)
            .setDepth(20);
        this.tweens.add({ targets: t, y: t.y - 20, alpha: 0, duration: 500, onComplete: () => t.destroy() });
    };

    constructor() {
        super('GameScene');
    }

    preload() {
        // HEROES_DATA 배열을 순회하며 모든 영웅 이미지를 로드합니다.
        HEROES_DATA.forEach(hero => {
            this.load.image(hero.imageKey, hero.assetPath);
            this.load.audio(hero.imageKey + '_sound', hero.fireSound);
            this.load.image(hero.imageKey + '_effect', hero.fireEffect);
        });
        // 합성 이펙트용 이미지
        this.load.image('star_particle', 'assets/images/star_particle.png');
    }

    create() {
        // 새 사이클 시작 초기화
        this._cleaned = false;
        this.gold = 200;
        this.gameSpeed = 1;
        this.resetRuntimeArrays();

        this.cameras.main.setBackgroundColor(THEME.background);

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

        // 토스트 메시지 유틸리티
        this.toast = new Toast(this);

        // 시스템
        this.spawner = new Spawner(this, this.waypointsTop, this.waypointsBottom);
        this.waves = new WaveController(
            this,
            this.spawner,
            this.cfg,
            (reason) => this.endGame(false, reason),
            () => {},
            () => this.winGame(),
            (waveIndex) => this.grantWaveClearGold(waveIndex) // 웨이브 클리어 보상
        );
        this.gridManager = new GridManager(this);
        this.heroActionPanel = new HeroActionPanel(
            this,
            (hero) => this.upgradeHero(hero),
            (hero) => this.sellHero(hero),
            (hero) => this.combineHero(hero)
        );


        // 적 처치 보상 수신
        this.events.on('enemy_killed', this.enemyKilledHandler);

        // 모드 선택 → 웨이브 시작
        this.modeSelector = new ModeSelector(this, (m) => {
            this.mode = m;
            this.waves.start(this.mode, 0);
            this.summonButton = new SummonButton(this, () => {
                if (this.gold >= HERO_SUMMON_COST) {
                    if (this.gridManager.trySummonHero()) {
                        const lastSummonedHero = this.heroes[this.heroes.length - 1];
                        this.onHeroSummoned();
                    }
                } else {
                    this.toast.show(`골드가 부족합니다! (필요: ${HERO_SUMMON_COST})`, THEME.danger);
                }
            });
            this.summonButton.create();
        });
        this.modeSelector.show();

        this.speedControlButton = new SpeedControlButton(this, GAME_WIDTH - 20, this.volumeSliderY);
        this.events.on('speedChanged', (speed: number) => {
            this.gameSpeed = speed;
        });

        // 볼륨 슬라이더 UI 추가
        this.volumeLabel = this.add.text(this.volumeUiX, this.volumeLabelY, 'Volume:', { color: THEME.text, fontSize: '18px', fontFamily: THEME.font }).setOrigin(0, 0.5).setDepth(10); // Origin(0, 0.5)로 왼쪽 정렬
        this.volumeValueText = this.add.text(this.volumeUiX + 75, this.volumeLabelY, `${Math.round(this.sound.volume * 100)}%`, { color: THEME.text, fontSize: '18px', fontFamily: THEME.font }).setOrigin(0, 0.5).setDepth(10); // 위치 조정
        this.volumeBackground = this.add.rectangle(this.volumeUiX, this.volumeSliderY, this.volumeSliderWidth, this.volumeSliderHeight, THEME.neutral).setDepth(10);
        this.volumeBorder = this.add.graphics().setDepth(10); // 외곽선 추가
        this.volumeBorder.lineStyle(2, parseInt(THEME.neutral_dark.substring(1), 16), 1); // 외곽선 스타일
        this.volumeBorder.strokeRect(this.volumeUiX - this.volumeSliderWidth, this.volumeSliderY - this.volumeSliderHeight / 2, this.volumeSliderWidth * 2, this.volumeSliderHeight);

        this.volumeSlider = this.add.rectangle(this.volumeUiX, this.volumeSliderY, this.volumeSliderWidth, this.volumeSliderHeight, parseInt(THEME.primary.substring(1), 16)).setDepth(11);
        this.volumeSlider.setInteractive();

        // 드래그 범위 계산
        this.volumeSliderMinX = this.volumeUiX - this.volumeSliderWidth / 2;
        this.volumeSliderMaxX = this.volumeUiX + this.volumeSliderWidth / 2;

        // localStorage에서 볼륨 로드, 없으면 기본값 0.5 사용
        const savedVolume = localStorage.getItem(VOLUME_STORAGE_KEY);
        this.sound.volume = savedVolume ? parseFloat(savedVolume) : 0.5;

        // 슬라이더 및 텍스트 초기 위치/값 설정
        this.volumeSlider.x = this.volumeSliderMinX + (this.sound.volume * this.volumeSliderWidth); // 슬라이더 위치 초기화
        this.volumeValueText.setText(`${Math.round(this.sound.volume * 100)}%`); // 초기 볼륨 수치 업데이트

        this.input.setDraggable(this.volumeSlider);

        this.volumeSlider.on('drag', (pointer: Phaser.Input.Pointer, dragX: number) => {
            const newX = Phaser.Math.Clamp(dragX, this.volumeSliderMinX, this.volumeSliderMaxX);
            this.volumeSlider!.x = newX;
            this.sound.volume = (newX - this.volumeSliderMinX) / this.volumeSliderWidth;
            this.volumeValueText!.setText(`${Math.round(this.sound.volume * 100)}%`); // 볼륨 수치 업데이트
        });

        // 드래그가 끝나면 localStorage에 저장
        this.volumeSlider.on('dragend', () => {
            localStorage.setItem(VOLUME_STORAGE_KEY, this.sound.volume.toString());
        });

        // 라이프사이클 훅(자동 정리)
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanup());
        this.events.once(Phaser.Scenes.Events.DESTROY, () => this.cleanup(true));
    }

    update(_: number, delta: number) {
        const dt = (delta / 1000) * this.gameSpeed;

        // 라운드 타이머
        this.round.update(dt);
        if (this.round.expired) {
            this.endGame(false, '라운드 제한 시간 초과');
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

        this.gridManager.update();

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

    // ===== 보상/토스트 =====

    private grantWaveClearGold(waveIndex: number) {
        const bonus = Math.max(1, Math.floor(WAVE_CLEAR_BASE * Math.pow(1 + WAVE_CLEAR_GROWTH, waveIndex)));
        this.gold += bonus;
        this.toast.show(`웨이브 클리어 보상 +${bonus}`, THEME.success);
    }

    // GridManager가 호출할 콜백
    public onHeroSummoned() {
        this.gold -= HERO_SUMMON_COST;
        this.toast.show(`영웅 소환! (-${HERO_SUMMON_COST}G)`, THEME.primary);
    }

    private upgradeHero(hero: Hero) {
        // TODO: 업그레이드 비용 계산 및 골드 차감 로직
        console.log(`${hero.type} 영웅 업그레이드 시도`);
        this.toast.show('업그레이드 기능은 준비 중입니다.', THEME.warning);
        this.heroActionPanel.hide();
    }

    private sellHero(hero: Hero) {
        const sellPrice = hero.getSellPrice();

        this.gold += sellPrice;
        this.toast.show(`${hero.rank}등급 영웅 판매 (+${sellPrice}G)`, THEME.success);
        this.gridManager.removeHero(hero);
        this.gridManager.clearSelection(); // 판매 후 선택 상태 해제
        this.heroActionPanel.hide();
    }

    private combineHero(hero: Hero) {
        if (hero.cell) {
            this.gridManager.checkForCombination(hero.cell);
            this.gridManager.clearSelection(); // 합성 후 선택 상태 해제
        }
        this.heroActionPanel.hide();
    }


    private endGame(didWin: boolean, reason: string) {
        this.scene.start('EndScene', { didWin, reason });
    }

    private winGame() {
        this.endGame(true, '모든 웨이브를 막아냈습니다!');
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
        this.events.off('speedChanged');
        this.input.keyboard?.removeAllListeners();

        // 타이머/트윈
        this.tweens.killAll();
        this.time.removeAllEvents();

        // 런타임 배열/오브젝트
        this.resetRuntimeArrays();
        this.gridManager.cleanup(hard);

        // 오버레이/UI
        this.summonButton?.container.destroy(); // SummonButton 컨테이너 파괴 추가
        this.speedControlButton?.destroy();
        this.volumeLabel?.destroy();
        this.volumeBackground?.destroy();
        this.volumeSlider?.destroy();
        this.volumeValueText?.destroy();
        this.heroActionPanel?.destroy();
    }
}
