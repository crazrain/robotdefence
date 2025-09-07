import { LOOP_RECT_BOTTOM } from './constants';

export type GridCell = { col: number; row: number; x: number; y: number };

export class Grid {
    // 격자 셀 크기(px)
    static CELL_SIZE = 60;

    // 하단 사각형(LOOP_RECT_BOTTOM) 내부에서 유효한 셀들을 생성
    static buildBottomCells(): GridCell[] {
        const { left, right, top, bottom } = LOOP_RECT_BOTTOM;
        const size = Grid.CELL_SIZE;

        // 사각형 내부에 딱 맞게 셀 중앙이 들어오도록 범위를 조정
        const minX = Math.ceil((left + size / 2) / size) * size;
        const maxX = Math.floor((right - size / 2) / size) * size;
        const minY = Math.ceil((top + size / 2) / size) * size;
        const maxY = Math.floor((bottom - size / 2) / size) * size;

        const cells: GridCell[] = [];
        let row = 0;
        for (let y = minY; y <= maxY; y += size, row++) {
            let col = 0;
            for (let x = minX; x <= maxX; x += size, col++) {
                cells.push({ col, row, x, y });
            }
        }
        return cells;
    }

    // 유효 셀들 중 하나를 무작위 선택
    static pickRandomBottomCell(cells?: GridCell[]): GridCell | null {
        const list = cells ?? Grid.buildBottomCells();
        if (list.length === 0) return null;
        const idx = Math.floor(Math.random() * list.length);
        return list[idx];
    }
}