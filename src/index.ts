// Framework entry point
export * from './core/component';
export * from './core/element';
export * from './core/lazy';
export * from './core/memo';
export * from './core/types';
export { createElement, render, renderElement } from './dom/render';
export * from './events/handler';
export * from './router/hash';
export * from './router/lazy';
export * from './state/store';
export * from './utils/equality';
export * from './utils/id';
export * from './utils/pathBuilder';

// Game utilities (optional)
export * from './game/math';
export * from './game/time';
export * from './game/input';
export * from './game/animation';
export * from './game/loop';
export * from './game/entity';
export * from './game/network';