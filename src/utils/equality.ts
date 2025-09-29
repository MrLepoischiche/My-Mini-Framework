// Fonction de base pour la comparaison avec paramètre de profondeur
function equalBase(a: any, b: any, deep: boolean): boolean {
    if (a === b) return true;
    
    if (typeof a !== typeof b || a == null || b == null) {
        return false;
    }
    
    if (typeof a !== 'object') {
        return a === b;
    }
    
    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) return false;
        
        return a.every((item, index) => 
            deep ? equalBase(item, b[index], true) : item === b[index]
        );
    }
    
    if (Array.isArray(a) || Array.isArray(b)) {
        return false;
    }
    
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) return false;
    
    return keysA.every(key => 
        keysB.includes(key) && 
        (deep ? equalBase(a[key], b[key], true) : a[key] === b[key])
    );
}

// APIs publiques
export function shallowEqual(a: any, b: any): boolean {
    return equalBase(a, b, false);
}

export function deepEqual(a: any, b: any): boolean {
    return equalBase(a, b, true);
}