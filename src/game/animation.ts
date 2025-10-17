/**
 * Game Animation System - Tweening and easing functions
 * Dependencies: math.ts (lerp), time.ts (timing)
 */

import { lerp } from './math';
import { now, pow, sqrt, sin, cos, PI, min } from './utils';

// Types & Easing
export type EasingFunction = (t: number) => number;

export const Easing = {
    linear: (t: number): number => t,
    easeInQuad: (t: number): number => t * t,
    easeOutQuad: (t: number): number => t * (2 - t),
    easeInOutQuad: (t: number): number => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    easeInCubic: (t: number): number => t * t * t,
    easeOutCubic: (t: number): number => (--t) * t * t + 1,
    easeInOutCubic: (t: number): number => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
    easeInQuart: (t: number): number => t * t * t * t,
    easeOutQuart: (t: number): number => 1 - (--t) * t * t * t,
    easeInOutQuart: (t: number): number => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,
    easeInExpo: (t: number): number => t === 0 ? 0 : pow(2, 10 * (t - 1)),
    easeOutExpo: (t: number): number => t === 1 ? 1 : 1 - pow(2, -10 * t),
    easeInOutExpo: (t: number): number => !t || t === 1 ? t : t < 0.5 ? pow(2, 20 * t - 10) / 2 : (2 - pow(2, -20 * t + 10)) / 2,
    easeInSine: (t: number): number => 1 - cos((t * PI) / 2),
    easeOutSine: (t: number): number => sin((t * PI) / 2),
    easeInOutSine: (t: number): number => -(cos(PI * t) - 1) / 2,
    easeInCirc: (t: number): number => 1 - sqrt(1 - t * t),
    easeOutCirc: (t: number): number => sqrt(1 - (--t) * t),
    easeInOutCirc: (t: number): number => t < 0.5 ? (1 - sqrt(1 - 4 * t * t)) / 2 : (sqrt(1 - (-2 * t + 2) * (-2 * t + 2)) + 1) / 2,
    easeInElastic: (t: number): number => !t || t === 1 ? t : -pow(2, 10 * t - 10) * sin((t * 10 - 10.75) * ((2 * PI) / 3)),
    easeOutElastic: (t: number): number => !t || t === 1 ? t : pow(2, -10 * t) * sin((t * 10 - 0.75) * ((2 * PI) / 3)) + 1,
    easeInOutElastic: (t: number): number => !t || t === 1 ? t : t < 0.5 ? -(pow(2, 20 * t - 10) * sin((20 * t - 11.125) * ((2 * PI) / 4.5))) / 2 : (pow(2, -20 * t + 10) * sin((20 * t - 11.125) * ((2 * PI) / 4.5))) / 2 + 1,
};

// Tween
export interface TweenOptions<T> {
    target: T;
    property: keyof T;
    to: number;
    duration: number;
    easing?: EasingFunction;
    onUpdate?: (value: number) => void;
    onComplete?: () => void;
}

export class Tween<T = any> {
    private target: T;
    private property: keyof T;
    private from: number;
    private to: number;
    private duration: number;
    private easing: EasingFunction;
    private onUpdate?: (value: number) => void;
    private onComplete?: () => void;
    private startTime = 0;
    private pausedAt = 0;
    private pausedTotal = 0;
    private running = false;
    private completed = false;

    constructor(options: TweenOptions<T>) {
        this.target = options.target;
        this.property = options.property;
        this.from = (this.target[this.property] as unknown as number) || 0;
        this.to = options.to;
        this.duration = options.duration;
        this.easing = options.easing || Easing.linear;
        this.onUpdate = options.onUpdate;
        this.onComplete = options.onComplete;
    }

    start(): this {
        this.startTime = now();
        this.pausedTotal = 0;
        this.pausedAt = 0;
        this.running = true;
        this.completed = false;
        this.from = (this.target[this.property] as unknown as number) || 0;
        return this;
    }
    stop(): this { this.running = false; this.pausedAt = 0; return this; }
    pause(): this { if (this.running && !this.pausedAt) this.pausedAt = now(); return this; }
    resume(): this { if (this.pausedAt) { this.pausedTotal += now() - this.pausedAt; this.pausedAt = 0; } return this; }
    reset(): this { return this.stop().start(); }

    update(_deltaMs: number = 0): boolean {
        if (!this.running || this.pausedAt || this.completed) return false;
        const elapsed = now() - this.startTime - this.pausedTotal;
        const progress = min(1, elapsed / this.duration);
        const t = this.easing(progress);
        const value = lerp(this.from, this.to, t);
        (this.target[this.property] as unknown as number) = value;
        this.onUpdate?.(value);
        if (progress >= 1) {
            this.completed = true;
            this.running = false;
            this.onComplete?.();
            return true;
        }
        return false;
    }

    isRunning(): boolean { return this.running && !this.pausedAt; }
    isComplete(): boolean { return this.completed; }
    getProgress(): number {
        if (this.completed) return 1;
        if (!this.running) return 0;
        const elapsed = now() - this.startTime - this.pausedTotal;
        return min(1, elapsed / this.duration);
    }
}

// Sequence
export class TweenSequence {
    private tweens: Tween[] = [];
    private parallelGroups: Tween[][] = [];
    private currentIndex = 0;
    private running = false;

    add(tween: Tween): this { this.tweens.push(tween); return this; }
    addParallel(...tweens: Tween[]): this { this.parallelGroups.push(tweens); this.tweens.push(...tweens); return this; }
    start(): this {
        this.currentIndex = 0;
        this.running = true;
        if (this.tweens.length > 0) this.tweens[0].start();
        return this;
    }
    stop(): this { this.running = false; this.tweens.forEach(t => t.stop()); return this; }
    update(deltaMs: number = 0): boolean {
        if (!this.running || this.currentIndex >= this.tweens.length) {
            this.running = false;
            return true;
        }
        const currentTween = this.tweens[this.currentIndex];
        const isComplete = currentTween.update(deltaMs);
        if (isComplete) {
            this.currentIndex++;
            if (this.currentIndex < this.tweens.length) {
                this.tweens[this.currentIndex].start();
            } else {
                this.running = false;
                return true;
            }
        }
        return false;
    }
    isRunning(): boolean { return this.running; }
}

// Manager
export class TweenManager {
    private tweens = new Set<Tween>();
    private sequences = new Set<TweenSequence>();

    add(tween: Tween): Tween { this.tweens.add(tween); return tween; }
    addSequence(sequence: TweenSequence): TweenSequence { this.sequences.add(sequence); return sequence; }
    remove(tween: Tween): void { this.tweens.delete(tween); }
    removeSequence(sequence: TweenSequence): void { this.sequences.delete(sequence); }
    update(deltaMs: number = 0): void {
        this.tweens.forEach(tween => { if (tween.update(deltaMs)) this.tweens.delete(tween); });
        this.sequences.forEach(seq => { if (seq.update(deltaMs)) this.sequences.delete(seq); });
    }
    clear(): void {
        this.tweens.forEach(t => t.stop());
        this.sequences.forEach(s => s.stop());
        this.tweens.clear();
        this.sequences.clear();
    }
    getTweenCount(): number { return this.tweens.size; }
    getSequenceCount(): number { return this.sequences.size; }
}

// Singleton
let manager: TweenManager | null = null;
export const getTweenManager = (): TweenManager => manager ?? (manager = new TweenManager());
export const destroyTweenManager = (): void => { manager?.clear(); manager = null; };

// Utilities
export function tween<T>(options: TweenOptions<T>): Tween<T> {
    const t = new Tween(options);
    getTweenManager().add(t);
    t.start();
    return t;
}
export function animate(from: number, to: number, duration: number, easing: EasingFunction = Easing.linear): Promise<number> {
    return new Promise(resolve => {
        const obj = { value: from };
        tween({ target: obj, property: 'value', to, duration, easing, onComplete: () => resolve(obj.value) });
    });
}
