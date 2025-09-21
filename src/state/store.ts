// Type pour les listeners de changement d'état
type StateListener<T> = (newState: T, oldState: T) => void;

// Classe Store pour gérer l'état réactif
export class Store<T = any> {
    private state: T;
    private listeners: StateListener<T>[] = [];

    constructor(initialState: T) {
        this.state = initialState;
    }

    // Obtenir l'état actuel
    getState(): T {
        return this.state;
    }

    // Modifier l'état et notifier les listeners
    setState(newState: Partial<T> | ((prevState: T) => T)): void {
        const oldState = this.state;
        
        if (typeof newState === 'function') {
            this.state = newState(oldState);
        } else {
            this.state = { ...oldState, ...newState };
        }

        this.listeners.forEach(listener => listener(this.state, oldState));
    }

    // S'abonner aux changements d'état
    subscribe(listener: StateListener<T>): () => void {
        this.listeners.push(listener);

        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }
}

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