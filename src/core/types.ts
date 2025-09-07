export type Vec2 = { x: number; y: number };
export type Mode = 'solo' | 'duo';

export type WaveDef = {
    durationSeconds: number;
    topCount: number;     // P2(위) 자리 수
    bottomCount: number;  // P1(아래) 자리 수
    hpScale: number;
    speed: number;
};

export type WaveRuntime = {
    index: number;
    timeLeft: number;
    topToSpawn: number;
    bottomToSpawn: number;
    spawnIntervalTop: number;
    spawnIntervalBottom: number;
    spawnTimerTop: number;
    spawnTimerBottom: number;
};