export type Difficulty = 'Normal' | 'Hard' | 'Extreme';

export interface GameConfig {
    difficulty: Difficulty;
    roundTimeLimitSec: number;     // 라운드(게임) 전체 제한 시간
    useWaveTimeoutFail: boolean;   // 웨이브 시간 초과 시 패배 처리 여부(기본 false)
    waveDurationScale: number;     // 웨이브 시간 스케일(페이싱만 영향)
}

export function getDefaultConfig(difficulty: Difficulty = 'Normal'): GameConfig {
    switch (difficulty) {
        case 'Hard':
            return {
                difficulty,
                roundTimeLimitSec: 300,   // 5분
                useWaveTimeoutFail: false,
                waveDurationScale: 0.95
            };
        case 'Extreme':
            return {
                difficulty,
                roundTimeLimitSec: 240,   // 4분
                useWaveTimeoutFail: false,
                waveDurationScale: 0.9
            };
        case 'Normal':
        default:
            return {
                difficulty: 'Normal',
                roundTimeLimitSec: 360,   // 6분
                useWaveTimeoutFail: false,
                waveDurationScale: 1.0
            };
    }
}