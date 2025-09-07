export class RoundTimer {
    total: number;
    remaining: number;
    running = false;

    constructor(seconds: number) {
        this.total = Math.max(0, seconds);
        this.remaining = this.total;
    }

    start() { this.running = true; }
    pause() { this.running = false; }
    resume() { this.running = true; }

    reset(seconds?: number) {
        if (typeof seconds === 'number') {
            this.total = Math.max(0, seconds);
        }
        this.remaining = this.total;
        this.running = false;
    }

    update(dt: number) {
        if (!this.running || this.remaining <= 0) return;
        this.remaining = Math.max(0, this.remaining - dt);
    }

    get expired() { return this.remaining <= 0; }
}