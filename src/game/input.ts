/**
 * Game Input Manager - Keyboard and mouse state tracking
 * Uses dedicated event system optimized for game input
 */

import { Vector2 } from './math';

type InputState = { down: boolean; pressed: boolean; released: boolean };

export type AxisKeyConfig = {
    up: string[];
    down: string[];
    left: string[];
    right: string[];
};

export class InputManager {
    private keys = new Map<string, InputState>();
    private mouse = { buttons: [this.newState(), this.newState(), this.newState()], pos: new Vector2(), delta: new Vector2() };
    private actions = new Map<string, string[]>();
    private axisKeys: AxisKeyConfig = {
        up: ['w', 'arrowup', 'z'],        // QWERTY W + AZERTY Z
        down: ['s', 'arrowdown'],
        left: ['a', 'arrowleft', 'q'],    // QWERTY A + AZERTY Q
        right: ['d', 'arrowright']
    };

    private newState(): InputState { return { down: false, pressed: false, released: false }; }
    private getOrCreate(key: string): InputState {
        if (!this.keys.has(key)) this.keys.set(key, this.newState());
        return this.keys.get(key)!;
    }

    private normalizeKey(key: string): string { return key === ' ' ? 'space' : key.toLowerCase(); }
    private onKeyDown = (e: KeyboardEvent): void => {
        const key = this.normalizeKey(e.key), state = this.getOrCreate(key);
        if (!state.down) state.pressed = true;
        state.down = true;
    };
    private onKeyUp = (e: KeyboardEvent): void => {
        const key = this.normalizeKey(e.key), state = this.getOrCreate(key);
        state.down = false;
        state.released = true;
    };
    private onMouseDown = (e: MouseEvent): void => {
        if (e.button < 3) {
            const state = this.mouse.buttons[e.button];
            if (!state.down) state.pressed = true;
            state.down = true;
        }
    };
    private onMouseUp = (e: MouseEvent): void => {
        if (e.button < 3) {
            this.mouse.buttons[e.button].down = false;
            this.mouse.buttons[e.button].released = true;
        }
    };
    private onMouseMove = (e: MouseEvent): void => {
        this.mouse.delta.set(e.clientX - this.mouse.pos.x, e.clientY - this.mouse.pos.y);
        this.mouse.pos.set(e.clientX, e.clientY);
    };

    constructor() {
        document.addEventListener('keydown', this.onKeyDown);
        document.addEventListener('keyup', this.onKeyUp);
        document.addEventListener('mousedown', this.onMouseDown);
        document.addEventListener('mouseup', this.onMouseUp);
        document.addEventListener('mousemove', this.onMouseMove);
    }

    update(): void {
        this.keys.forEach(state => { state.pressed = state.released = false; });
        this.mouse.buttons.forEach(state => { state.pressed = state.released = false; });
        this.mouse.delta.set(0, 0);
    }

    isKeyDown(key: string): boolean { return this.keys.get(key.toLowerCase())?.down ?? false; }
    isKeyPressed(key: string): boolean { return this.keys.get(key.toLowerCase())?.pressed ?? false; }
    isKeyReleased(key: string): boolean { return this.keys.get(key.toLowerCase())?.released ?? false; }
    getMousePosition(): Vector2 { return this.mouse.pos.clone(); }
    getMouseDelta(): Vector2 { return this.mouse.delta.clone(); }
    isMouseButtonDown(btn: number): boolean { return this.mouse.buttons[btn]?.down ?? false; }
    isMouseButtonPressed(btn: number): boolean { return this.mouse.buttons[btn]?.pressed ?? false; }
    isMouseButtonReleased(btn: number): boolean { return this.mouse.buttons[btn]?.released ?? false; }
    mapAction(name: string, keys: string[]): void { this.actions.set(name, keys.map(k => k.toLowerCase())); }
    isActionDown(name: string): boolean { return this.actions.get(name)?.some(k => this.isKeyDown(k)) ?? false; }
    isActionPressed(name: string): boolean { return this.actions.get(name)?.some(k => this.isKeyPressed(k)) ?? false; }
    isActionReleased(name: string): boolean { return this.actions.get(name)?.some(k => this.isKeyReleased(k)) ?? false; }
    getAxis(axis: 'horizontal' | 'vertical'): number {
        if (axis === 'horizontal') {
            const right = this.axisKeys.right.some(k => this.isKeyDown(k)) ? 1 : 0;
            const left = this.axisKeys.left.some(k => this.isKeyDown(k)) ? 1 : 0;
            return right - left;
        }
        const down = this.axisKeys.down.some(k => this.isKeyDown(k)) ? 1 : 0;
        const up = this.axisKeys.up.some(k => this.isKeyDown(k)) ? 1 : 0;
        return down - up;
    }
    setAxisKeys(config: Partial<AxisKeyConfig>): void { Object.assign(this.axisKeys, config); }
    getAxisKeys(): AxisKeyConfig { return { ...this.axisKeys }; }
    clear(): void { this.keys.clear(); this.mouse.buttons.forEach(s => s.down = s.pressed = s.released = false); }
    destroy(): void {
        document.removeEventListener('keydown', this.onKeyDown);
        document.removeEventListener('keyup', this.onKeyUp);
        document.removeEventListener('mousedown', this.onMouseDown);
        document.removeEventListener('mouseup', this.onMouseUp);
        document.removeEventListener('mousemove', this.onMouseMove);
        this.clear();
    }
}

// Singleton
let input: InputManager | null = null;
export const getInput = (): InputManager => input ?? (input = new InputManager());
export const destroyInput = (): void => { input?.destroy(); input = null; };
