import { Vec2 } from './types';
import { LOOP_RECT } from './constants';

// 좌상 -> 좌하 -> 우하 -> 우상 (시계 방향)
export function buildLoopWaypoints(): Vec2[] {
    const { left, right, top, bottom } = LOOP_RECT;
    return [
        { x: left,  y: top    }, // 0: 좌상
        { x: left,  y: bottom }, // 1: 좌하
        { x: right, y: bottom }, // 2: 우하
        { x: right, y: top    }, // 3: 우상
    ];
}