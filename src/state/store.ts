// Types pour les listeners de changement d'état
type StateListener<T> = (newState: T, oldState: T) => void;
type PathListener = (newValue: any, oldValue: any) => void;

// Classe Store pour gérer l'état réactif
export class Store<T = any> {
    private state: T;
    private listeners: StateListener<T>[] = [];
    private pathListeners = new Map<string, PathListener[]>();

    // Propriétés pour batching
    private pendingUpdate = false;
    private pendingChanges = new Set<string>();
    private rafId: number | null = null;
    private batchOldState: T | null = null;
    private batchNewState: T | null = null;

    constructor(initialState: T) {
        this.state = initialState;
    }

    // Obtenir l'état actuel
    getState(): T {
        return this.state;
    }

    // Dans Store, rendez cette méthode publique
    public getValueByPath(path: string): any {
        return this.getValueByPathAndObject(this.state, path);
    }

    // Obtenir une valeur dans l'état par son chemin (ex: "user.name")
    private getValueByPathAndObject(obj: any, path: string): any {
        return path.split('.').reduce((current, key) => {
            if (key.includes('[') && key.includes(']')) {
                const [arrayKey, indexStr] = key.split('[');
                const index = parseInt(indexStr.replace(']', ''));
                return current?.[arrayKey]?.[index];
            }
            return current?.[key];
        }, obj);
    }

    // Notifier les listeners abonnés aux chemins spécifiques
    private notifyPathListeners(oldState: T, newState: T): void {
        this.pathListeners.forEach((listeners, path) => {
            const oldValue = this.getValueByPathAndObject(oldState, path);
            const newValue = this.getValueByPathAndObject(newState, path);
            
            if (oldValue !== newValue) {
                listeners.forEach(listener => listener(newValue, oldValue));
            }
        });
    }

    // Détecter quels chemins ont changé
    private detectChangedPaths(oldState: T, newState: T): string[] {
        const changedPaths: string[] = [];
        
        for (const key in newState) {
            if (oldState[key] !== newState[key]) {
                changedPaths.push(key);
            }
        }
        
        return changedPaths;
    }

    // Exécuter toutes les mises à jour en une fois
    private flushUpdates(): void {
        this.pendingChanges.forEach(path => {
            const listeners = this.pathListeners.get(path);
            if (listeners) {
                const oldValue = this.getValueByPathAndObject(this.batchOldState!, path);
                const newValue = this.getValueByPathAndObject(this.batchNewState!, path);
                listeners.forEach(listener => listener(newValue, oldValue));
            }
        });

        this.listeners.forEach(listener => listener(this.batchNewState!, this.batchOldState!));

        this.pendingUpdate = false;
        this.pendingChanges.clear();
        this.rafId = null;
        this.batchOldState = null;
        this.batchNewState = null;
    }

    // Planifier une mise à jour batchée
    private scheduleBatchUpdate(oldState: T, newState: T): void {
        if (!this.pendingUpdate) {
            this.batchOldState = oldState;
        }
        this.batchNewState = newState;

        const changedPaths = this.detectChangedPaths(oldState, newState);
        changedPaths.forEach(path => this.pendingChanges.add(path));

        if (!this.pendingUpdate) {
            this.pendingUpdate = true;
            this.rafId = requestAnimationFrame(() => {
                this.flushUpdates();
            });
        }
    }

    // Forcer l'exécution immédiate des updates (utile pour les tests)
    flushSync(): void {
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.flushUpdates();
        }
    }

    // Notification immédiate des listeners
    private notifyListeners(oldState: T, newState: T): void {
        this.notifyPathListeners(oldState, newState);
        this.listeners.forEach(listener => listener(newState, oldState));
    }

    // Modifier l'état immédiatement
    setState(newState: Partial<T> | ((prevState: T) => T)): void {
        const oldState = { ...this.state };
        
        if (typeof newState === 'function') {
            this.state = newState(oldState);
        } else {
            this.state = { ...oldState, ...newState };
        }

        this.notifyListeners(oldState, this.state);
    }

    // Modifier l'état pour batch updates
    setBatchedState(newState: Partial<T> | ((prevState: T) => T)): void {
        const oldState = { ...this.state };
        
        if (typeof newState === 'function') {
            this.state = newState(oldState);
        } else {
            this.state = { ...oldState, ...newState };
        }

        this.scheduleBatchUpdate(oldState, this.state);
    }

    // S'abonner aux changements d'état
    subscribe(listener: StateListener<T>): () => void {
        this.listeners.push(listener);

        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    // S'abonner à un chemin spécifique dans l'état
    subscribeTo(path: string, listener: PathListener): () => void {
        if (!this.pathListeners.has(path)) {
            this.pathListeners.set(path, []);
        }
        this.pathListeners.get(path)!.push(listener);
        
        return () => {
            const listeners = this.pathListeners.get(path);
            if (listeners) {
                const index = listeners.indexOf(listener);
                if (index > -1) listeners.splice(index, 1);
            }
        };
    }
}

// ------------ Fonctions utilitaires ------------

// Détecter les changements entre deux états (shallow comparison)
function detectChanges<T>(oldState: T, newState: T): string[] {
    const changedKeys: string[] = [];
    
    // Comparer chaque clé du nouvel état
    for (const key in newState) {
        if (oldState[key] !== newState[key]) {
            changedKeys.push(key);
            
            // Si c'est un array, détecter quels éléments ont changé
            if (Array.isArray(oldState[key]) && Array.isArray(newState[key])) {
                const oldArray = oldState[key] as any[];
                const newArray = newState[key] as any[];
                
                // Comparer chaque élément par référence
                for (let i = 0; i < Math.max(oldArray.length, newArray.length); i++) {
                    if (oldArray[i] !== newArray[i]) {
                        changedKeys.push(`${key}[${i}]`);
                    }
                }
            }
        }
    }
    
    return changedKeys;
}

// -----------------------------------------------

// Instance globale du store (store unique comme convenu)
export const globalStore = new Store<Record<string, any>>({});

export function getState() : any;
export function getState<T = any>(key: string): T;
export function getState(key?: string) {
    const state = globalStore.getState();
    return key ? state[key] : state;
}

export function setState<T>(newState: Partial<T> | ((prevState: T) => T)) {
    globalStore.setState(newState);
}

export function setBatchedState<T>(newState: Partial<T> | ((prevState: T) => T)) {
    globalStore.setBatchedState(newState);
}