/**
 * Compact Lazy Loading, Code Splitting & Suspense System
 */

import { ElementProps, VirtualElement } from './types';
import { generateId } from '../utils/id';
import { memo, useCallback } from './memo';
import { deepEqual } from '../utils/equality';
import { ReactiveComponent } from './component';
import { globalStore } from '../state/store';

// ==================== TYPES ====================

export type Component<P = any> = (props: P) => VirtualElement;
export type LazyComponentLoader<P = any> = () => Promise<Component<P>>;
export type LazyModuleLoader<T = any> = () => Promise<{ default: T } | T>;

export enum LoadingState { IDLE = 'idle', LOADING = 'loading', LOADED = 'loaded', ERROR = 'error', TIMEOUT = 'timeout' }

export interface SuspenseProps {
    fallback: ElementProps;
    children: VirtualElement | VirtualElement[];
    onError?: (error: Error) => ElementProps;
    timeout?: number;
}

export interface LazyConfig {
    retryAttempts?: number;
    retryDelay?: number;
    timeout?: number;
    preloadStrategy?: 'none' | 'hover' | 'visible' | 'idle';
}

export interface LazyRoute {
    path: string;
    component?: () => VirtualElement;
    lazyComponent?: LazyComponentLoader;
    preload?: boolean;
    suspense?: Partial<SuspenseProps>;
}

// ==================== CONFIG & CACHE ====================

const defaultConfig: LazyConfig = { retryAttempts: 3, retryDelay: 1000, timeout: 30000, preloadStrategy: 'none' };
let globalConfig = { ...defaultConfig };
const moduleCache = new Map<string, any>();
const loadingPromises = new Map<string, Promise<any>>();

export function configureLazy(config: Partial<LazyConfig>): void {
    globalConfig = { ...defaultConfig, ...config };
    if (globalConfig.retryAttempts! < 0) globalConfig.retryAttempts = 0;
    if (globalConfig.retryDelay! < 0) globalConfig.retryDelay = 0;
    if (globalConfig.timeout! <= 0) globalConfig.timeout = defaultConfig.timeout;
    moduleCache.clear();
    loadingPromises.clear();
}

// =================== LAZY COMPONENTS ===================

export class LazyComponent<P = any> {
    private loadPromise: Promise<Component<P>> | null = null;
    private loadedComponent: Component<P> | null = null;
    private memoizedComponent: Component<P> | null = null;
    private state: LoadingState = LoadingState.IDLE;
    private error: Error | null = null;
    private memoizedRender = memo((props: P, state: LoadingState) => this.renderInternal(props, state));

    constructor(
        private loader: LazyComponentLoader<P>,
        private options?: { fallback?: ElementProps; onError?: ElementProps }
    ) {
        this.loader = useCallback(loader, []);
    }

    async load(): Promise<Component<P>> {
        if (this.loadedComponent && this.memoizedComponent) return this.memoizedComponent;
        if (this.loadPromise) return this.loadPromise;

        this.state = LoadingState.LOADING;
        this.loadPromise = new Promise<Component<P>>((resolve, reject) => {
            let attempts = 0;
            const attemptLoad = () => {
                attempts++;
                const timeoutId = setTimeout(() => {
                    this.state = LoadingState.TIMEOUT;
                    this.error = new Error('Loading timed out');
                    this.loadPromise = null;
                    reject(this.error);
                }, globalConfig.timeout);

                this.loader()
                    .then((component) => {
                        clearTimeout(timeoutId);
                        this.loadedComponent = component;
                        this.memoizedComponent = memo(component, (prevProps, nextProps) =>
                            deepEqual(prevProps, nextProps));
                        this.state = LoadingState.LOADED;
                        this.loadPromise = null;
                        resolve(this.memoizedComponent);
                    })
                    .catch((err) => {
                        clearTimeout(timeoutId);
                        if (attempts < (globalConfig.retryAttempts || 0) + 1) {
                            setTimeout(attemptLoad, globalConfig.retryDelay);
                        } else {
                            this.state = LoadingState.ERROR;
                            this.error = err;
                            this.loadPromise = null;
                            reject(err);
                        }
                    });
            };
            attemptLoad();
        });
        return this.loadPromise;
    }

    render(props: P): VirtualElement {
        return this.memoizedRender(props, this.state);
    }

    private renderInternal(props: P, state: LoadingState): VirtualElement {
        const fallbackEl = this.options?.fallback || { tag: 'div', props: {}, children: ['Loading...'] };
        const errorEl = this.options?.onError || { tag: 'div', props: {}, children: [`Error: ${this.error?.message}`] };

        switch (state) {
            case LoadingState.IDLE:
                this.load().catch(() => {});
                return { tag: fallbackEl.tag || 'div', props: fallbackEl.props || {}, children: fallbackEl.children || [] };
            case LoadingState.LOADING:
                return { tag: fallbackEl.tag || 'div', props: fallbackEl.props || {}, children: fallbackEl.children || [] };
            case LoadingState.LOADED:
                if (this.memoizedComponent) return this.memoizedComponent(props);
                if (this.loadedComponent) return this.loadedComponent(props);
                this.state = LoadingState.ERROR;
                this.error = new Error('Component not loaded');
                return { tag: errorEl.tag || 'div', props: errorEl.props || {}, children: errorEl.children || [] };
            case LoadingState.ERROR:
            case LoadingState.TIMEOUT:
                return { tag: errorEl.tag || 'div', props: errorEl.props || {}, children: errorEl.children || [] };
            default:
                return { tag: 'div', props: {}, children: ['Unknown state'] };
        }
    }

    getState(): LoadingState { return this.state; }
    isLoaded(): boolean { return this.state === LoadingState.LOADED; }
}

export class LazyReactiveComponent<P = any> extends ReactiveComponent {
    private lazyComponent: LazyComponent<P>;
    private preloadOnMount: boolean = false;
    private cleanupTimer: number | null = null;
    private lastAccessTime = Date.now();

    constructor(
        loader: LazyComponentLoader<P>,
        statePaths: string[],
        initialProps: P = {} as P,
        options?: {
            fallback?: ElementProps;
            onError?: ElementProps;
            preloadOnMount?: boolean;
            autoCleanup?: boolean;
            cleanupDelay?: number;
        }
    ) {
        super(
            [...statePaths, 'router.loadingState'],
            (props: P) => this.renderWithState(props),
            initialProps
        );

        this.lazyComponent = new LazyComponent(loader, options);
        this.preloadOnMount = options?.preloadOnMount || false;

        if (options?.autoCleanup !== false) {
            this.setupAutoCleanup(options?.cleanupDelay || 300000); // 5 minutes default
        }
    }

    private renderWithState(props: P): VirtualElement {
        this.lastAccessTime = Date.now();
        this.scheduleCleanup();

        const routerState = globalStore.getValueByPath('router.loadingState') as LoadingState;
        const lazyState = this.lazyComponent.getState();

        // Enhanced rendering with router state awareness
        if (routerState === LoadingState.LOADING && lazyState === LoadingState.IDLE) {
            // Router is loading, show enhanced loading state
            return {
                tag: 'div',
                props: { class: 'lazy-reactive-loading' },
                children: ['Loading route...']
            };
        }

        return this.lazyComponent.render(props);
    }

    mount(container: HTMLElement): void {
        super.mount(container);

        if (this.preloadOnMount && this.shouldPreload()) {
            this.lazyComponent.load().catch(console.warn);
        }
    }

    unmount(): void {
        super.unmount();
        this.cleanup();
    }

    private shouldPreload(): boolean {
        const userPreferences = globalStore.getValueByPath('user.preferences');
        return userPreferences?.enablePreloading !== false;
    }

    private setupAutoCleanup(cleanupDelay: number): void {
        this.cleanupTimer = window.setTimeout(() => {
            if (Date.now() - this.lastAccessTime > cleanupDelay) {
                this.cleanup();
            }
        }, cleanupDelay);
    }

    private scheduleCleanup(): void {
        if (this.cleanupTimer) {
            clearTimeout(this.cleanupTimer);
        }
        this.setupAutoCleanup(300000); // Reset cleanup timer
    }

    private cleanup(): void {
        if (this.cleanupTimer) {
            clearTimeout(this.cleanupTimer);
            this.cleanupTimer = null;
        }

        // Clear loaded component from memory if not used recently
        if (this.lazyComponent.isLoaded() && Date.now() - this.lastAccessTime > 300000) {
            (this.lazyComponent as any).loadedComponent = null;
            (this.lazyComponent as any).memoizedComponent = null;
            (this.lazyComponent as any).state = LoadingState.IDLE;
        }
    }

    // Public API for controlling lazy loading
    async preload(): Promise<void> {
        await this.lazyComponent.load();
    }

    getLoadingState(): LoadingState {
        return this.lazyComponent.getState();
    }

    isLoaded(): boolean {
        return this.lazyComponent.isLoaded();
    }
}

// ==================== SUSPENSE BOUNDARY ====================

export class SuspenseBoundary {
    private state: LoadingState = LoadingState.IDLE;
    private error: Error | null = null;
    private loadingPromises = new Set<Promise<any>>();
    private timeoutId: number | null = null;

    constructor(private props: SuspenseProps) {}

    addPromise(promise: Promise<any>): void {
        this.loadingPromises.add(promise);
        if (this.loadingPromises.size === 1) this.state = LoadingState.LOADING;
        if (this.props.timeout && !this.timeoutId) {
            this.timeoutId = window.setTimeout(() => this.handleTimeout(), this.props.timeout);
        }
        promise.then(() => this.removePromise(promise)).catch((error) => this.handleError(error));
    }

    removePromise(promise: Promise<any>): void {
        this.loadingPromises.delete(promise);
        if (this.loadingPromises.size === 0) {
            this.state = LoadingState.LOADED;
            if (this.timeoutId) { clearTimeout(this.timeoutId); this.timeoutId = null; }
        }
    }

    private handleTimeout(): void {
        this.state = LoadingState.TIMEOUT;
        this.error = new Error('Loading timed out');
        if (this.timeoutId) { clearTimeout(this.timeoutId); this.timeoutId = null; }
    }

    private handleError(error: Error): void {
        this.state = LoadingState.ERROR;
        this.error = error;
        if (this.timeoutId) { clearTimeout(this.timeoutId); this.timeoutId = null; }
    }

    render(): VirtualElement {
        switch (this.state) {
            case LoadingState.LOADING:
                const fallback = this.props.fallback;
                return { tag: fallback.tag || 'div', props: fallback.props || {}, children: fallback.children || [] };
            case LoadingState.ERROR:
                if (this.props.onError) {
                    const errorElement = this.props.onError(this.error!);
                    return { tag: errorElement.tag || 'div', props: errorElement.props || {}, children: errorElement.children || [] };
                }
                return { tag: 'div', props: {}, children: [`Error: ${this.error?.message}`] };
            case LoadingState.TIMEOUT:
                return { tag: 'div', props: {}, children: ['Error: Loading timed out'] };
            case LoadingState.LOADED:
            case LoadingState.IDLE:
                return Array.isArray(this.props.children)
                    ? { tag: 'div', props: {}, children: this.props.children }
                    : this.props.children;
            default:
                return { tag: 'div', props: {}, children: ['Error: Unknown state'] };
        }
    }

    reset(): void {
        this.state = LoadingState.IDLE;
        this.error = null;
        if (this.timeoutId) { clearTimeout(this.timeoutId); this.timeoutId = null; }
        this.loadingPromises.clear();
    }
}

// ==================== CODE SPLITTING ====================

export async function dynamicImport<T = any>(importFn: () => Promise<T>, options?: { id?: string; retryAttempts?: number }): Promise<T> {
    const memoizedImportFn = useCallback(importFn, []);
    if (options?.id) {
        if (moduleCache.has(options.id)) return moduleCache.get(options.id);
        if (loadingPromises.has(options.id)) return loadingPromises.get(options.id)!;
    }

    const promise = new Promise<T>((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = options?.retryAttempts ?? (globalConfig.retryAttempts || 0);
        const attemptLoad = () => {
            attempts++;
            memoizedImportFn()
                .then((module) => {
                    if (options?.id) { moduleCache.set(options.id, module); loadingPromises.delete(options.id); }
                    resolve(module);
                })
                .catch((err) => {
                    if (attempts <= maxAttempts) {
                        setTimeout(attemptLoad, globalConfig.retryDelay);
                    } else {
                        if (options?.id) loadingPromises.delete(options.id);
                        reject(err);
                    }
                });
        };
        attemptLoad();
    });

    if (options?.id) { loadingPromises.set(options.id, promise); moduleCache.set(options.id, promise); }
    return promise;
}

export function preload<T = any>(loader: () => Promise<T>): Promise<T> {
    return dynamicImport(loader, { id: generateId() });
}

export function clearCache(id?: string): void {
    if (id) { moduleCache.delete(id); loadingPromises.delete(id); }
    else { moduleCache.clear(); loadingPromises.clear(); }
}

// ==================== LOADING MANAGER ====================

export class LoadingManager {
    private loadingItems = new Map<string, Promise<any>>();
    private onLoadingChange?: (isLoading: boolean) => void;

    constructor(options?: { onLoadingChange?: (isLoading: boolean) => void }) {
        this.onLoadingChange = options?.onLoadingChange;
    }

    addLoading(id: string, promise: Promise<any>): Promise<any> {
        this.loadingItems.set(id, promise);
        if (this.loadingItems.size === 1 && this.onLoadingChange) this.onLoadingChange(true);
        promise.finally(() => {
            this.loadingItems.delete(id);
            if (!this.isLoading() && this.onLoadingChange) this.onLoadingChange(false);
        });
        return promise;
    }

    isLoading(): boolean { return this.loadingItems.size > 0; }
    clear(): void { this.loadingItems.clear(); if (this.onLoadingChange) this.onLoadingChange(false); }
}

// ==================== ROUTER EXTENSIONS ====================

export class LazyRouterExtension {
    private lazyRoutes: LazyRoute[] = [];
    private currentLoadingState: LoadingState = LoadingState.IDLE;
    private preloadedComponents = new Map<string, any>();

    registerLazyRoute(path: string, lazyComponent: LazyComponentLoader, options?: { preload?: boolean; suspense?: Partial<SuspenseProps> }): void {
        const route: LazyRoute = { path, lazyComponent, preload: options?.preload || false, suspense: options?.suspense };
        this.lazyRoutes.push(route);
        if (route.preload) this.preloadRoute(path).catch(() => {});
    }

    async navigateToLazy(path: string): Promise<void> {
        const route = this.lazyRoutes.find(r => r.path === path);
        if (!route) throw new Error(`Route not found: ${path}`);

        this.currentLoadingState = LoadingState.LOADING;
        try {
            let component: any;
            if (this.preloadedComponents.has(path)) {
                component = this.preloadedComponents.get(path);
            } else if (route.lazyComponent) {
                component = await route.lazyComponent();
                this.preloadedComponents.set(path, component);
            } else if (route.component) {
                component = route.component;
            } else {
                throw new Error(`No component defined for route: ${path}`);
            }
            this.currentLoadingState = LoadingState.LOADED;
        } catch (error) {
            this.currentLoadingState = LoadingState.ERROR;
            throw error;
        }
    }

    async preloadRoute(path: string): Promise<void> {
        const route = this.lazyRoutes.find(r => r.path === path);
        if (route && route.lazyComponent && !this.preloadedComponents.has(path)) {
            try {
                const component = await route.lazyComponent();
                this.preloadedComponents.set(path, component);
            } catch (error) {
                console.error(`Failed to preload route ${path}:`, error);
            }
        }
    }

    getLoadingState(): LoadingState { return this.currentLoadingState; }
}

// ==================== FACTORY FUNCTIONS ====================

export function lazy<P = any>(loader: LazyComponentLoader<P>, options?: { fallback?: ElementProps; onError?: ElementProps }): LazyComponent<P> {
    return new LazyComponent(loader, options);
}

export function lazyReactive<P>(
    loader: LazyComponentLoader<P>,
    statePaths: string[],
    options?: {
        fallback?: ElementProps;
        onError?: ElementProps;
        preloadOnMount?: boolean;
        autoCleanup?: boolean;
        cleanupDelay?: number;
        initialProps?: P;
    }
): LazyReactiveComponent<P> {
    return new LazyReactiveComponent(
        loader,
        statePaths,
        options?.initialProps || {} as P,
        options
    );
}

export function createMemoizedLazyComponent<P = any>(
    loader: LazyComponentLoader<P>,
    options?: { fallback?: ElementProps; onError?: ElementProps; compareProps?: (prevProps: P, nextProps: P) => boolean }
): LazyComponent<P> {
    const component = new LazyComponent(loader, options);
    if (options?.compareProps) {
        (component as any).memoizedRender = memo(
            (component as any).renderInternal.bind(component),
            (prevArgs, nextArgs) => options.compareProps!(prevArgs[0], nextArgs[0])
        );
    }
    return component;
}

export function Suspense(props: SuspenseProps): Component {
    const boundary = new SuspenseBoundary(props);
    return (): VirtualElement => {
        const lazyChildren = Array.isArray(props.children)
            ? props.children.filter(child => child instanceof LazyComponent)
            : (props.children instanceof LazyComponent) ? [props.children] : [];
        lazyChildren.forEach(child => boundary.addPromise(child.load()));
        return boundary.render();
    };
}

export function withSuspense<P = any>(WrappedComponent: Component<P>, suspenseProps: Omit<SuspenseProps, 'children'>): Component<P> {
    const memoizedWrappedComponent = memo(WrappedComponent);
    return memo((props: P) => {
        const suspenseComponent = Suspense({ ...suspenseProps, children: memoizedWrappedComponent(props) });
        return suspenseComponent({});
    });
}

// ==================== GLOBAL INSTANCES ====================

export const globalLoadingManager = new LoadingManager();
export const lazyRouterExtension = new LazyRouterExtension();

// ==================== UTILITIES ====================

export function createMemoizedLoader<T = any>(loaderFn: () => Promise<T>, dependencies: any[] = []): () => Promise<T> {
    return useCallback(loaderFn, dependencies);
}

export function createLazyComponent<P = any>(
    loader: LazyComponentLoader<P>,
    options?: {
        fallback?: ElementProps;
        onError?: ElementProps;
        compareProps?: (prevProps: P, nextProps: P) => boolean;
        loaderDependencies?: any[];
    }
): LazyComponent<P> {
    const memoizedLoader = options?.loaderDependencies ? createMemoizedLoader(loader, options.loaderDependencies) : loader;
    return createMemoizedLazyComponent(memoizedLoader, {
        fallback: options?.fallback,
        onError: options?.onError,
        compareProps: options?.compareProps
    });
}

export function createReactiveComponent<P = any>(
    loader: LazyComponentLoader<P>,
    statePaths: string[],
    options?: {
        fallback?: ElementProps;
        onError?: ElementProps;
        preloadOnMount?: boolean;
        autoCleanup?: boolean;
        cleanupDelay?: number;
        initialProps?: P;
        loaderDependencies?: any[];
        compareProps?: (prevProps: P, nextProps: P) => boolean;
    }
): LazyReactiveComponent<P> {
    const memoizedLoader = options?.loaderDependencies ? createMemoizedLoader(loader, options.loaderDependencies) : loader;

    // Create the reactive component with optimized loader
    const component = new LazyReactiveComponent(
        memoizedLoader,
        statePaths,
        options?.initialProps || {} as P,
        {
            fallback: options?.fallback,
            onError: options?.onError,
            preloadOnMount: options?.preloadOnMount,
            autoCleanup: options?.autoCleanup,
            cleanupDelay: options?.cleanupDelay
        }
    );

    // Apply custom comparison if provided
    if (options?.compareProps) {
        const lazyComp = (component as any).lazyComponent;
        lazyComp.memoizedRender = memo(
            lazyComp.renderInternal.bind(lazyComp),
            (prevArgs, nextArgs) => options.compareProps!(prevArgs[0], nextArgs[0])
        );
    }

    return component;
}