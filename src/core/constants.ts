export const GAME_WIDTH = 720;
export const GAME_HEIGHT = 1280;

export const MAX_ALIVE = 100;           // 필드 적 한계
export const BASE_HP = 100;             // 웨이브 체력 기준
export const SUMMON_COST = 100;         // 유닛 소환 비용

// 언덕(사각 루프) 코너 좌표
export const LOOP_RECT = {
    left: 100, right: 620, top: 260, bottom: 980
};

// 자리(스폰 구멍): 위(P2), 아래(P1)
export const SEAT = {
    top:   { x: LOOP_RECT.left, y: LOOP_RECT.top - 80 },
    bottom:{ x: LOOP_RECT.left, y: LOOP_RECT.bottom + 80 }
};