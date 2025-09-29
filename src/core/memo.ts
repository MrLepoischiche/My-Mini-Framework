import { VirtualElement } from "./types";
import { shallowEqual } from "../utils/equality";

// Interface pour stocker les informations de mémoïsation
interface MemoizedComponent {
    lastProps: any;
    lastResult: VirtualElement;
    component: (...args: any[]) => VirtualElement;
}

// Cache pour les composants mémoïsés
const memoCache = new Map<Function, MemoizedComponent>();
// Cache pour les composants réactifs
const reactiveComponentCache = new WeakMap<Function, { lastProps: any; lastResult: any }>();

// Cache pour les gestionnaires d'événements mémoïsés
const handlerCache = new WeakMap<Function, { deps: any[], handler: Function }>();
let handlerIdCounter = 0;
const handlerIds = new WeakMap<Function, number>();


// -----------------------------------------------


// Fonction de mémoïsation pour les composants
export function memo<T extends any[]>(
    component: (...args: T) => VirtualElement,
    areEqual?: (prevArgs: T, nextArgs: T) => boolean
): (...args: T) => VirtualElement {
    return (...args: T) => {
        const cached = memoCache.get(component);
        
        if (cached && (areEqual ? areEqual(cached.lastProps, args) : shallowEqual(cached.lastProps, args))) {
            // Marquer le résultat comme étant du cache
            return {
                ...cached.lastResult,
                __memoized: true,
                __memoKey: JSON.stringify(args) // Clé pour identifier le cache
            };
        }
        
        const result = component(...args);
        memoCache.set(component, {
            lastProps: args,
            lastResult: result,
            component
        });
        
        return result;
    };
}

// Hook pour mémoïser les fonctions (similaire à React.useCallback)
export function useCallback<T extends Function>(
    callback: T,
    deps: any[]
): T {
    if (!handlerIds.has(callback)) {
        handlerIds.set(callback, handlerIdCounter++);
    }

    const cached = handlerCache.get(callback);

    if (cached && shallowEqual(cached.deps, deps)) {
        return cached.handler as T;
    }

    handlerCache.set(callback, { deps, handler: callback });
    return callback;
}

// Mémoisation pour ReactiveComponent
export function memoizeReactiveComponent<T extends any[]>(
    componentClass: new (...args: T) => any,
    areEqual?: (prevArgs: T, nextArgs: T) => boolean
): (new (...args: T) => any) {
    return class extends componentClass {
        constructor(...args: T) {
            const cached = reactiveComponentCache.get(componentClass);
            
            if (cached && (areEqual ? areEqual(cached.lastProps, args) : shallowEqual(cached.lastProps, args))) {
                return cached.lastResult;
            }
            
            super(...args);
            reactiveComponentCache.set(componentClass, {
                lastProps: args,
                lastResult: this
            });
        }
    };
}