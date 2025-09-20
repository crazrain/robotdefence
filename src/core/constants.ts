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

import { HERO_SUMMON_COST, HERO_SELL_RETURN_RATE } from '../data/heroData';

// 영웅 구매 및 판매 비율은 heroData에서 가져옵니다

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

