import { VirtualElement } from "./types";
import { shallowEqual } from "../utils/equality";

// Interface pour stocker les informations de mémoïsation (générique)
interface MemoizedFunction<R = any> {
    lastProps: any;
    lastResult: R;
    func: (...args: any[]) => R;
}

// Cache pour les fonctions mémoïsées (générique)
const memoCache = new Map<Function, MemoizedFunction>();
// Cache pour les composants réactifs
const reactiveComponentCache = new WeakMap<Function, { lastProps: any; lastResult: any }>();

// Cache pour les gestionnaires d'événements mémoïsés
const handlerCache = new WeakMap<Function, { deps: any[], handler: Function }>();
let handlerIdCounter = 0;
const handlerIds = new WeakMap<Function, number>();


// -----------------------------------------------


// Fonction de mémoïsation générique (peut mémoïser n'importe quelle fonction)
export function memo<T extends any[], R>(
    func: (...args: T) => R,
    areEqual?: (prevArgs: T, nextArgs: T) => boolean
): (...args: T) => R {
    return (...args: T) => {
        const cached = memoCache.get(func);

        if (cached && (areEqual ? areEqual(cached.lastProps, args) : shallowEqual(cached.lastProps, args))) {
            // Retourner le résultat du cache
            // Si c'est un VirtualElement, on peut ajouter des métadonnées
            if (cached.lastResult && typeof cached.lastResult === 'object' && 'tag' in cached.lastResult) {
                return {
                    ...cached.lastResult as any,
                    __memoized: true,
                    __memoKey: JSON.stringify(args)
                } as R;
            }
            return cached.lastResult;
        }

        const result = func(...args);
        memoCache.set(func, {
            lastProps: args,
            lastResult: result,
            func
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