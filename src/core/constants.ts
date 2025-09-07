export const GAME_WIDTH = 720;
export const GAME_HEIGHT = 1280;

export const MAX_ALIVE = 100;           // 필드 적 한계
export const BASE_HP = 100;             // 웨이브 체력 기준
export const SUMMON_COST = 100;         // 유닛 소환 비용

// 보상 관련(원하시는 값으로 조정 가능)
export const GOLD_PER_HP = 1;        // 적 1 최대 HP 당 골드(예: HP 200 → 10골드)
export const WAVE_CLEAR_BASE = 80;      // 웨이브 클리어 기본 보상
export const WAVE_CLEAR_GROWTH = 0.3;   // 웨이브당 30% 증가(지수 성장)

// 아래(하단) 루프 사각형
export const LOOP_RECT_BOTTOM = {
    left: 100, right: 620, top: 680, bottom: 980
};

// 위(상단) 루프 사각형
export const LOOP_RECT_TOP = {
    left: 100, right: 620, top: 260, bottom: 560
};

// 자리(스폰 구멍): 위(P2), 아래(P1) — 각 루프의 좌상 꼭짓점 바깥
export const SEAT = {
    top:   { x: LOOP_RECT_TOP.left,    y: LOOP_RECT_TOP.top - 80 },
    bottom:{ x: LOOP_RECT_BOTTOM.left, y: LOOP_RECT_BOTTOM.bottom + 80 }
};