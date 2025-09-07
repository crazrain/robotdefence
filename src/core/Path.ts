import { LOOP_RECT_BOTTOM, LOOP_RECT_TOP } from './constants';
import type { Vec2 } from './types';

// 꼭짓점 순서: 좌상 → 우상 → 우하 → 좌하 (위 → 오른쪽 → 아래 → 왼쪽 순환)
function buildLoopFromRect(rect: { left: number; right: number; top: number; bottom: number; }): Vec2[] {
    const { left, right, top, bottom } = rect;
    return [
        { x: left,  y: top    }, // 0: 좌상
        { x: right, y: top    }, // 1: 우상
        { x: right, y: bottom }, // 2: 우하
        { x: left,  y: bottom }, // 3: 좌하
    ];
}

export function buildBottomLoop(): Vec2[] {
    return buildLoopFromRect(LOOP_RECT_BOTTOM);
}

export function buildTopLoop(): Vec2[] {
    return buildLoopFromRect(LOOP_RECT_TOP);
}