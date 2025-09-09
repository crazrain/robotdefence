import { LOOP_RECT_BOTTOM, GRID_PARAMS } from './constants';
import type { HeroType, GridCell } from './types';
import type { Hero } from '../objects/Hero'; // Hero 클래스 임포트

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
            cells.push({ col: c, row: r, x: cx, y: cy, occupiedHeroes: [] }); // occupiedHeroes 초기화
        }
    }
    return { metrics, cells };
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

export const MAX_HEROES_PER_CELL = 3;

// 새로운 영웅 배치 로직
export function addHeroToCell(cell: GridCell, hero: Hero): boolean {
    // 1. 셀이 비어있는 경우
    if (cell.occupiedHeroes.length === 0) {
        cell.occupiedHeroes.push(hero);
        return true;
    }

    // 2. 이미 영웅이 있는 경우
    const existingHeroType = cell.occupiedHeroes[0].type;

    // 2-1. 다른 종류의 영웅이 이미 있는 경우 (규칙 위반)
    if (existingHeroType !== hero.type) {
        console.warn(`Cannot add ${hero.type} to cell (${cell.col},${cell.row}). It already contains ${existingHeroType} heroes.`);
        return false;
    }

    // 2-2. 같은 종류의 영웅이 아직 최대치 미만인 경우
    if (cell.occupiedHeroes.length < MAX_HEROES_PER_CELL) {
        cell.occupiedHeroes.push(hero);
        return true;
    } else {
        // 2-3. 같은 종류의 영웅이 이미 최대치인 경우
        console.warn(`Cannot add more ${hero.type} heroes to cell (${cell.col},${cell.row}). It's full.`);
        return false;
    }
}

// 셀에서 영웅을 제거하는 로직
export function removeHeroFromCell(cell: GridCell, hero: Hero): boolean {
    const index = cell.occupiedHeroes.indexOf(hero);
    if (index > -1) {
        cell.occupiedHeroes.splice(index, 1);
        return true;
    }
    return false;
}

// 셀이 가득 찼는지 확인하는 함수
export function isCellFull(cell: GridCell): boolean {
    return cell.occupiedHeroes.length === MAX_HEROES_PER_CELL;
}

// 셀이 특정 영웅 타입으로 가득 찼는지 확인하는 함수
export function isCellFullWithType(cell: GridCell, heroType: HeroType): boolean {
    return cell.occupiedHeroes.length === MAX_HEROES_PER_CELL &&
           cell.occupiedHeroes.every(h => h.type === heroType);
}

// 셀이 비어있는지 확인하는 함수
export function isCellEmpty(cell: GridCell): boolean {
    return cell.occupiedHeroes.length === 0;
}