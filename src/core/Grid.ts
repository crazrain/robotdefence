import { LOOP_RECT_BOTTOM, GRID_PARAMS } from './constants';

export type GridCell = { col: number; row: number; x: number; y: number };
export type GridMetrics = {
    originX: number; originY: number;   // 좌상단 시작점
    cellW: number; cellH: number;       // 셀 크기
    cols: number; rows: number;
};

/**
 * 하단 사각형 내부에 격자를 정확히 채웁니다.
 * - padding과 gap을 고려해 균등 분할
 * - 각 셀의 "중앙 좌표(x,y)"를 반환(스냅 시 사용)
 */
export function buildBottomGrid(): { metrics: GridMetrics; cells: GridCell[] } {
    const { left, right, top, bottom } = LOOP_RECT_BOTTOM;
    const { cols, rows, paddingX, paddingY, gapX, gapY } = GRID_PARAMS;

    const innerW = (right - left) - paddingX * 2;
    const innerH = (bottom - top) - paddingY * 2;

    // 셀 너비/높이 계산(간격 포함 모델)
    // 총 가용 폭/높이에서 (cols-1)*gap을 빼고 나머지를 cols로 나눕니다.
    const cellW = (innerW - (cols - 1) * gapX) / cols;
    const cellH = (innerH - (rows - 1) * gapY) / rows;

    const originX = left + paddingX;
    const originY = top + paddingY;

    const metrics: GridMetrics = { originX, originY, cellW, cellH, cols, rows };

    const cells: GridCell[] = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const cx = originX + c * (cellW + gapX) + cellW / 2;
            const cy = originY + r * (cellH + gapY) + cellH / 2;
            cells.push({ col: c, row: r, x: cx, y: cy });
        }
    }
    return { metrics, cells };
}

export function pickRandomFreeCell(cells: GridCell[], occupied: Set<string>): GridCell | null {
    const free = cells.filter(c => !occupied.has(keyOf(c.col, c.row)));
    if (free.length === 0) return null;
    return free[(Math.random() * free.length) | 0];
}

export function keyOf(col: number, row: number) {
    return `${col},${row}`;
}

// 월드 좌표 → 셀 인덱스(가까운 셀)
export function worldToCell(x: number, y: number, m: GridMetrics): { col: number; row: number } | null {
    const rx = x - m.originX;
    const ry = y - m.originY;
    const totalW = m.cols * m.cellW + (m.cols - 1) * 0;
    const totalH = m.rows * m.cellH + (m.rows - 1) * 0;
    if (rx < 0 || ry < 0 || rx > totalW || ry > totalH) return null;
    const col = Math.min(m.cols - 1, Math.max(0, Math.floor(rx / m.cellW)));
    const row = Math.min(m.rows - 1, Math.max(0, Math.floor(ry / m.cellH)));
    return { col, row };
}

// 셀 인덱스 → 월드 중앙 좌표
export function cellToWorld(col: number, row: number, m: GridMetrics): { x: number; y: number } {
    const x = m.originX + col * m.cellW + m.cellW / 2;
    const y = m.originY + row * m.cellH + m.cellH / 2;
    return { x, y };
}