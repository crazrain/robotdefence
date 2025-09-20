export const GAME_WIDTH = 720;
export const GAME_HEIGHT = 1280;

// === 테마 색상 ===
export const THEME = {
    background: '#101018',
    text: '#ffffff',
    text_light: '#bbbbbb',
    primary: '#4caf50',
    success: '#77ff77',
    warning: '#ffeb3b',
    danger: '#ff5252',
    neutral: '#333333',
    neutral_dark: '#888888',
    font: 'monospace',
};

export const MAX_ALIVE = 100;
export const BASE_HP = 100;

// 보상
export const GOLD_PER_HP = 0.05;
export const WAVE_CLEAR_BASE = 50;
export const WAVE_CLEAR_GROWTH = 0.2;

export const HERO_SUMMON_COST = 100;

// 영웅 판매/업그레이드
export const HERO_SELL_RETURN_RATE = 0.5; // 판매 시 가치 반환 비율

// 하단 루프 사각형
export const LOOP_RECT_BOTTOM = {
    left: 100, right: 620, top: 680, bottom: 980
};

// 상단 루프 사각형(참고용/2P 예정)
export const LOOP_RECT_TOP = {
    left: 100, right: 620, top: 260, bottom: 560
};

// 스폰 자리(네트워크 대비용)
export const SEAT = {
    top:   { x: LOOP_RECT_TOP.left,    y: LOOP_RECT_TOP.top - 80 },
    bottom:{ x: LOOP_RECT_BOTTOM.left, y: LOOP_RECT_BOTTOM.bottom + 80 }
};

export const MAX_HEROES = 20;

// 하단 그리드 설정(정밀 정렬용)
export const GRID_PARAMS = {
    cols: 6,          // 열 수
    rows: 3,          // 행 수
    paddingX: 24,     // 사각형 안쪽 여백(좌우)
    paddingY: 24,     // 사각형 안쪽 여백(상하)
    gapX: 0,          // 셀 사이 가로 간격(선호: 0)
    gapY: 0           // 셀 사이 세로 간격(선호: 0)
};

// 근접 영웅 기본(예시)
export const MELEE_DEFAULT = {
    atk: 35,
    atkInterval: 0.45,
    range: 80     // 짧은 사거리(셀 1~1.5칸 정도)
};

export const HERO_MOVE_RANGE = 100; // 영웅 이동 가능 거리 (그리드 셀 기준)

// Hero
export interface HeroData {
  id: number;
  name: string;
  imageKey: string; // 코드에서 사용할 이미지 별명
  assetPath: string; // 실제 이미지 파일 경로
  fireEffect: string; // 포 효과
  fireSound: string; // 포 소리 경로
  type: HeroType;
  atkInterval: number;
  range: number;
}

// 모든 영웅의 데이터를 담는 배열
export const HEROES_DATA: HeroData[] = [
  {
    id: 0,
    name: 'Warrior',
    imageKey: 'Basic1',
    assetPath: 'assets/images/Basic1.png',
    fireEffect: 'assets/images/Basic_Effect.png',
    fireSound: 'assets/sounds/Basic_Sound.mp3',
    type: 'TypeA',
    atkInterval: 0.5,
    range: 200,
  },
  {
    id: 1,
    name: 'Knight',
    imageKey: 'Basic2',
    assetPath: 'assets/images/Basic2.png',
    fireEffect: 'assets/images/Basic_Effect.png',
    fireSound: 'assets/sounds/Basic_Sound.mp3',
    type: 'TypeA',
    atkInterval: 0.52,
    range: 190,
  },
  {
    id: 2,
    name: 'Paladin',
    imageKey: 'Basic3',
    assetPath: 'assets/images/Basic3.png',
    fireEffect: 'assets/images/Basic_Effect.png',
    fireSound: 'assets/sounds/Basic_Sound.mp3',
    type: 'TypeA',
    atkInterval: 0.48,
    range: 210,
  },
  {
    id: 3,
    name: 'Mage',
    imageKey: 'Rare1',
    assetPath: 'assets/images/Rare1.png',
    fireEffect: 'assets/images/Rare_Effect.png',
    fireSound: 'assets/sounds/Rare_Sound.mp3',
    type: 'TypeB',
    atkInterval: 0.45,
    range: 220,
  },
  {
    id: 4,
    name: 'Sorcerer',
    imageKey: 'Rare2',
    assetPath: 'assets/images/Rare2.png',
    fireEffect: 'assets/images/Rare_Effect.png',
    fireSound: 'assets/sounds/Rare_Sound.mp3',
    type: 'TypeB',
    atkInterval: 0.43,
    range: 230,
  },
  {
    id: 5,
    name: 'Warlock',
    imageKey: 'Rare3',
    assetPath: 'assets/images/Rare3.png',
    fireEffect: 'assets/images/Rare_Effect.png',
    fireSound: 'assets/sounds/Rare_Sound.mp3',
    type: 'TypeB',
    atkInterval: 0.47,
    range: 210,
  },
  {
    id: 6,
    name: 'Archer',
    imageKey: 'Epic1',
    assetPath: 'assets/images/Epic1.png',
    fireEffect: 'assets/images/Epic_Effect.png',
    fireSound: 'assets/sounds/Epic_Sound.mp3',
    type: 'TypeC',
    atkInterval: 0.4,
    range: 240,
  },
  {
    id: 7,
    name: 'Hunter',
    imageKey: 'Epic2',
    assetPath: 'assets/images/Epic2.png',
    fireEffect: 'assets/images/Epic_Effect.png',
    fireSound: 'assets/sounds/Epic_Sound.mp3',
    type: 'TypeC',
    atkInterval: 0.42,
    range: 230,
  },
  {
    id: 8,
    name: 'Ranger',
    imageKey: 'Epic3',
    assetPath: 'assets/images/Epic3.png',
    fireEffect: 'assets/images/Epic_Effect.png',
    fireSound: 'assets/sounds/Epic_Sound.mp3',
    type: 'TypeC',
    atkInterval: 0.38,
    range: 250,
  },
  {
    id: 9,
    name: 'Crusader',
    imageKey: 'Legendary1',
    assetPath: 'assets/images/Legendary1.png',
    fireEffect: 'assets/images/Legendary_Effect.png',
    fireSound: 'assets/sounds/Legendary_Sound.mp3',
    type: 'TypeD',
    atkInterval: 0.35,
    range: 260,
  },
  {
    id: 10,
    name: 'Guardian',
    imageKey: 'Legendary2',
    assetPath: 'assets/images/Legendary2.png',
    fireEffect: 'assets/images/Legendary_Effect.png',
    fireSound: 'assets/sounds/Legendary_Sound.mp3',
    type: 'TypeD',
    atkInterval: 0.37,
    range: 250,
  },
  {
    id: 11,
    name: 'Templar',
    imageKey: 'Legendary3',
    assetPath: 'assets/images/Legendary3.png',
    fireEffect: 'assets/images/Legendary_Effect.png',
    fireSound: 'assets/sounds/Legendary_Sound.mp3',
    type: 'TypeD',
    atkInterval: 0.33,
    range: 270,
  },
  {
    id: 12,
    name: 'Dragon',
    imageKey: 'Mythical1',
    assetPath: 'assets/images/Mythical1.png',
    fireEffect: 'assets/images/Mythical_Effect.png',
    fireSound: 'assets/sounds/Mythical_Sound.mp3',
    type: 'TypeE',
    atkInterval: 0.3,
    range: 280,
  },
  {
    id: 13,
    name: 'Phoenix',
    imageKey: 'Mythical2',
    assetPath: 'assets/images/Mythical2.png',
    fireEffect: 'assets/images/Mythical_Effect.png',
    fireSound: 'assets/sounds/Mythical_Sound.mp3',
    type: 'TypeE',
    atkInterval: 0.28,
    range: 300,
  },
  {
    id: 14,
    name: 'Titan',
    imageKey: 'Mythical3',
    assetPath: 'assets/images/Mythical3.png',
    fireEffect: 'assets/images/Mythical_Effect.png',
    fireSound: 'assets/sounds/Mythical_Sound.mp3',
    type: 'TypeE',
    atkInterval: 0.32,
    range: 260,
  },
];