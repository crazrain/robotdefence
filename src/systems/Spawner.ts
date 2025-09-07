import type Phaser from 'phaser';
import type { WaveDef } from '../core/types';
import { Enemy } from '../objects/Enemy';
import { BASE_HP, SEAT } from '../core/constants';
import type { Vec2 } from '../core/types';

// 몬스터 스폰은 격자를 사용하지 않습니다.
// 아래(P1) 자리(SEAT.bottom)에서 시작해 하단 루프 waypointsBottom으로 합류합니다.
export class Spawner {
    constructor(
        private scene: Phaser.Scene,
        private waypointsTop: Vec2[],     // 상단 루프(현재 사용 안 함)
        private waypointsBottom: Vec2[]   // 하단 루프
    ) {}

    // 네트워크 2인용 대비(현재는 호출하지 않음)
    spawnTop(w: WaveDef, enemies: Enemy[]) {
        const hp = Math.floor(BASE_HP * w.hpScale);
        // 상단 자리에서 시작, 첫 타겟은 상단 루프의 좌상(인덱스 0)
        const e = new Enemy(this.scene, SEAT.top.x, SEAT.top.y, this.waypointsTop, hp, w.speed, 0);
        enemies.push(e);
    }

    // 아래(P1) 자리에서 스폰 → 하단 루프 사용
    spawnBottom(w: WaveDef, enemies: Enemy[]) {
        const hp = Math.floor(BASE_HP * w.hpScale);
        // 아래 자리에서 시작, 첫 타겟은 하단 루프의 좌상(인덱스 0)
        const e = new Enemy(this.scene, SEAT.bottom.x, SEAT.bottom.y, this.waypointsBottom, hp, w.speed, 0);
        enemies.push(e);
    }
}