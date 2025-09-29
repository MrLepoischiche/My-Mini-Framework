export class PathBuilder<T> {
    constructor(private basePath: string = '') {}
    
    // Accéder à une propriété
    prop<K extends keyof T>(key: K): PathBuilder<T[K]> {
        const newPath = this.basePath ? `${this.basePath}.${String(key)}` : String(key);
        return new PathBuilder<T[K]>(newPath);
    }
    
    // Accéder à un index d'array
    index(i: number): PathBuilder<T extends (infer U)[] ? U : never> {
        const newPath = `${this.basePath}[${i}]`;
        return new PathBuilder<T extends (infer U)[] ? U : never>(newPath);
    }
    
    // Obtenir le chemin final
    path(): string {
        return this.basePath;
    }
}

// Fonction utilitaire pour commencer
export function path<T>(): PathBuilder<T> {
    return new PathBuilder<T>();
}