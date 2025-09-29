/**
 * Lazy Loading Extensions for Hash Router
 * Extends existing router with lazy loading capabilities
 */

import { VirtualElement } from '../core/types';
import { LazyComponentLoader, LazyRoute, LoadingState } from '../core/lazy';
import { registerRoute as baseRegisterRoute, navigateTo as baseNavigateTo } from './hash';
import { globalStore } from '../state/store';

// ==================== ROUTER EXTENSIONS ====================

const lazyRoutes = new Map<string, LazyRoute>();
const preloadedComponents = new Map<string, any>();
const ROUTER_STATE_PATH = 'router.loadingState';

// Initialize router state in global store
globalStore.setState({ router: { loadingState: LoadingState.IDLE } });

// Register a lazy route
export function registerLazyRoute(
    path: string,
    lazyComponent: LazyComponentLoader,
    options?: {
        preload?: boolean;
        fallback?: VirtualElement;
    }
): void {
    const route: LazyRoute = {
        path,
        lazyComponent,
        preload: options?.preload || false,
        suspense: options?.fallback ? { fallback: options.fallback } : undefined
    };

    lazyRoutes.set(path, route);

    // Register with base router - must return VirtualElement synchronously
    baseRegisterRoute(path, () => {
        updateLoadingState(LoadingState.LOADING);

        // Check if component is already preloaded
        if (preloadedComponents.has(path)) {
            updateLoadingState(LoadingState.LOADED);
            const component = preloadedComponents.get(path)!;
            return component({});
        }

        // If not preloaded, start loading and show fallback
        lazyComponent()
            .then((component) => {
                preloadedComponents.set(path, component);
                updateLoadingState(LoadingState.LOADED);
                // Trigger re-render by navigating again
                setTimeout(() => baseNavigateTo(path), 0);
            })
            .catch((error) => {
                updateLoadingState(LoadingState.ERROR);
                console.error(`Error loading component for route ${path}:`, error);
            });

        // Return fallback or loading element while component loads
        const fallback = options?.fallback || {
            tag: 'div',
            props: { class: 'lazy-loading' },
            children: ['Loading...']
        };

        return fallback;
    });

    if (options?.preload) {
        preloadRoute(path).catch(err => {
            console.error(`Error preloading route ${path}:`, err);
        });
    }
}

// Navigate with lazy loading support
export async function navigateToLazy(path: string): Promise<void> {
    updateLoadingState(LoadingState.LOADING);

    try {
        const route = lazyRoutes.get(path);
        if (!route) {
            throw new Error(`Route not found: ${path}`);
        }

        if (!preloadedComponents.has(path) && route.lazyComponent) {
            const component = await route.lazyComponent();
            preloadedComponents.set(path, component);
        }

        baseNavigateTo(path);
        updateLoadingState(LoadingState.LOADED);
    } catch (error) {
        updateLoadingState(LoadingState.ERROR);
        console.error(`Error navigating to route ${path}:`, error);
        throw error;
    }
}

// Preload a route without navigating
export function preloadRoute(path: string): Promise<void> {
    return new Promise(async (resolve, reject) => {
        const route = lazyRoutes.get(path);
        if (!route) {
            return reject(new Error(`Route not found: ${path}`));
        }

        if (!preloadedComponents.has(path) && route.lazyComponent) {
            try {
                const component = await route.lazyComponent();
                preloadedComponents.set(path, component);
                resolve();
            } catch (error) {
                console.error(`Error preloading component for route ${path}:`, error);
                resolve(); // Resolve anyway to avoid blocking
            }
        } else {
            resolve(); // Already preloaded
        }
    });
}

// Get current loading state
export function getRouterLoadingState(): LoadingState {
    return globalStore.getValueByPath(ROUTER_STATE_PATH) as LoadingState || LoadingState.IDLE;
}

// Subscribe to loading state changes
export function onRouterLoadingStateChange(callback: (state: LoadingState) => void): () => void {
    return globalStore.subscribeTo(ROUTER_STATE_PATH, callback);
}

// ==================== PRELOADING STRATEGIES ====================

export function enableHoverPreloading(): void {
    const links = document.querySelectorAll('a[href^="#/"]');
    links.forEach(link => {
        const path = link.getAttribute('href')?.substring(1); // Remove leading '#'
        if (path && lazyRoutes.has(path)) {
            const onMouseEnter = () => {
                preloadRoute(path).catch(err => {
                    console.error(`Error preloading route ${path} on hover:`, err);
                });
            };
            link.addEventListener('mouseenter', onMouseEnter);
            // Store listener for potential cleanup (not implemented here)
        }
    });

    // MutationObserver to handle dynamically added links
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node instanceof HTMLElement) {
                    const newLinks = node.querySelectorAll('a[href^="#/"]');
                    newLinks.forEach(link => {
                        const path = link.getAttribute('href')?.substring(1);
                        if (path && lazyRoutes.has(path)) {
                            const onMouseEnter = () => {
                                preloadRoute(path).catch(err => {
                                    console.error(`Error preloading route ${path} on hover:`, err);
                                });
                            };
                            link.addEventListener('mouseenter', onMouseEnter);
                            // Store listener for potential cleanup (not implemented here)
                        }
                    });
                }
            });
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

export function enableVisiblePreloading(): void {
    // Create intersection observer to watch for route links
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting && entry.target instanceof HTMLElement) {
                const link = entry.target as HTMLAnchorElement;
                const path = link.getAttribute('href')?.substring(1); // Remove leading '#'

                if (path && lazyRoutes.has(path)) {
                    preloadRoute(path)
                        .catch((error) => {
                            console.warn(`Failed to visible preload route ${path}:`, error);
                        });

                    // Unobserve after preloading to avoid duplicate loads
                    observer.unobserve(link);
                }
            }
        });
    }, {
        rootMargin: '50px' // Start preloading when link is 50px away from viewport
    });

    // Observe existing links
    const existingLinks = document.querySelectorAll('a[href^="#/"]');
    existingLinks.forEach(link => {
        const path = link.getAttribute('href')?.substring(1);
        if (path && lazyRoutes.has(path)) {
            observer.observe(link);
        }
    });

    // MutationObserver to handle dynamically added links
    const mutationObserver = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node instanceof HTMLElement) {
                    // Check if the node itself is a route link
                    if (node.tagName === 'A' && node.getAttribute('href')?.startsWith('#/')) {
                        const path = node.getAttribute('href')?.substring(1);
                        if (path && lazyRoutes.has(path)) {
                            observer.observe(node);
                        }
                    }

                    // Check for nested route links
                    const newLinks = node.querySelectorAll('a[href^="#/"]');
                    newLinks.forEach(link => {
                        const path = link.getAttribute('href')?.substring(1);
                        if (path && lazyRoutes.has(path)) {
                            observer.observe(link);
                        }
                    });
                }
            });
        });
    });

    mutationObserver.observe(document.body, {
        childList: true,
        subtree: true
    });
}

export function enableIdlePreloading(): void {
    const allRoutes = Array.from(lazyRoutes.entries());

    // Sort routes to prioritize those marked for preload
    const sortedRoutes = allRoutes.sort((a, b) => {
        const routeA = a[1];
        const routeB = b[1];
        if (routeA.preload && !routeB.preload) return -1;
        if (!routeA.preload && routeB.preload) return 1;
        return 0;
    });

    let currentIndex = 0;

    function preloadNext() {
        if (currentIndex >= sortedRoutes.length) return;

        const [path] = sortedRoutes[currentIndex];
        currentIndex++;

        // Skip if already preloaded
        if (preloadedComponents.has(path)) {
            // Schedule next preload
            if (currentIndex < sortedRoutes.length) {
                requestIdleCallback(preloadNext);
            }
            return;
        }

        preloadRoute(path)
            .catch((error) => {
                console.warn(`Failed to idle preload route ${path}:`, error);
            })
            .finally(() => {
                // Schedule next preload
                if (currentIndex < sortedRoutes.length) {
                    requestIdleCallback(preloadNext);
                }
            });
    }

    // Start the idle preloading chain
    if (sortedRoutes.length > 0) {
        requestIdleCallback(preloadNext);
    }
}

// ==================== UTILITIES ====================

function updateLoadingState(newState: LoadingState): void {
    globalStore.setBatchedState({
        router: {
            ...globalStore.getValueByPath('router'),
            loadingState: newState
        }
    });
}

// Clear preload cache
export function clearPreloadCache(): void {
    preloadedComponents.clear();
}