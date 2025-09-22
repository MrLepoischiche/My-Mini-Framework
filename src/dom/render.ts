import { VirtualElement, ElementChild, ElementProps } from '../core/types';
import { registerEventHandler, removeEventHandler } from '../events/handler';
import { globalStore } from '../state/store';
import { generateId } from '../utils/id';

// -------------- Types & Interfaces --------------

// Type pour une fonction qui crée un élément virtuel
type ComponentFunction = () => VirtualElement;

// Structure pour les enfants avec et sans clés
interface KeyedChildren {
    withKeys: Array<{ key: string; child: ElementChild; index: number }>;
    withoutKeys: Array<{ child: ElementChild; index: number }>;
}

// ------------------------------------------------

// -------------- Variables globales --------------

// Dernier rendu (pour le re-rendering automatique)
let lastRender: { createComponent: ComponentFunction; container: HTMLElement } | null = null;
// Dernier Virtual DOM rendu
let lastVirtualDOM: VirtualElement | null = null;
// Fonction de désabonnement
let unsubscribe: (() => void) | null = null;
// Flag indiquant si l'application re-rend actuellement
let isRerendering = false;

// -------------------------------------------------

// ------------- Fonctions utilitaires -------------

// Convertir camelCase en kebab-case
function camelToKebab(str: string): string {
    if (!str) return '';

    return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

// Convertir un tableau de classes en string
function classArrayToString(classes: (string | undefined | null | false)[]): string {
    if (!classes) return '';

    return classes.filter(Boolean).join(' ');
}

// Convertir un objet style en string CSS
function styleObjectToString(styleObj: Record<string, string | number>): string {
    if (!styleObj) return '';

    const styles = Object.entries(styleObj).map(([key, value]) => {
        return `${camelToKebab(key)}: ${value}`;
    });
    return styles.join('; ');
}

// Fonction pour appliquer un seul prop à un élément HTML
function applySingleProp(element: HTMLElement, key: string, value: any): void {
    if (key.startsWith('on')) {
        const eventType = key.slice(2).toLowerCase();
        const id = element.id || '';
        if (!id) {
            element.id = generateId();
        }
        const eventId = registerEventHandler(eventType, value);
        // Stocker par type d'événement
        element.dataset[`event${eventType.charAt(0).toUpperCase() + eventType.slice(1)}Id`] = eventId;
    } else if (key === 'style' && typeof value === 'object' && value !== null) {
        element.setAttribute('style', styleObjectToString(value as Record<string, string | number>));
    } else if (key === 'class' && Array.isArray(value)) {
        element.setAttribute('class', classArrayToString(value as (string | undefined | null | false)[]));
    } else if (key === 'checked' || key === 'selected' || key === 'disabled') {
        if (value) {
            element.setAttribute(key, key);
        } else {
            element.removeAttribute(key);
        }
    } else {
        element.setAttribute(key, String(value));
    }
}

// Fonction pour appliquer les props à un élément HTML
function applyProps(element: HTMLElement, props: ElementProps): void {
    for (const [key, value] of Object.entries(props)) {
        applySingleProp(element, key, value);
    }
}

// Fonction pour ajouter un enfant à un élément
function appendChild(parent: HTMLElement, child: ElementChild): void {
    if (child === null || child === undefined) return;
    
    if (typeof child === 'string' || typeof child === 'number') {
        const textNode = document.createTextNode(String(child));
        parent.appendChild(textNode);
        return;
    }
    
    if (child instanceof Object && 'tag' in child) {
        const childElement = createElement(child);
        parent.appendChild(childElement);
        return;
    }
}

// Fonction pour re-render l'application
function rerender(): void {
    if (lastRender && !isRerendering) {
        isRerendering = true;
        
        const currentVirtualDOM = lastRender.createComponent();
        
        if (lastVirtualDOM) {
            const existingElement = lastRender.container.firstElementChild as HTMLElement;
            if (existingElement) {
                diffAndPatch(existingElement, lastVirtualDOM, currentVirtualDOM);
            } else {
                renderElement(currentVirtualDOM, lastRender.container);
            }
        } else {
            renderElement(currentVirtualDOM, lastRender.container);
        }
        
        lastVirtualDOM = currentVirtualDOM;
        isRerendering = false;
    }
}

// Fonction pour comparer et patcher deux Virtual DOM
function diffAndPatch(domNode: HTMLElement, oldVNode: VirtualElement, newVNode: VirtualElement): void {
    // Cas 1: Tags différents (remplacement complet)
    if (oldVNode.tag !== newVNode.tag) {
        const newElement = createElement(newVNode);
        if (domNode.parentNode && newElement) {
            domNode.parentNode.replaceChild(newElement, domNode);
        }
        return;
    }

    // Cas 2: Même tag (mise à jour)
    diffProps(domNode, oldVNode.props, newVNode.props);
    diffChildren(domNode, oldVNode.children, newVNode.children);
}

// Fonction pour comparer les props de deux éléments
function diffProps(domNode: HTMLElement, oldProps: ElementProps, newProps: ElementProps): void {
    // 1. Supprimer les props qui n'existent plus
    for (const key in oldProps) {
        if (!(key in newProps)) {
            if (key.startsWith('on')) {
                // Supprimer l'événement spécifique
                const eventType = key.slice(2).toLowerCase();
                const eventIdKey = `event${eventType.charAt(0).toUpperCase() + eventType.slice(1)}Id`;
                const eventId = domNode.dataset[eventIdKey];
                if (eventId) {
                    removeEventHandler(eventId);
                    delete domNode.dataset[eventIdKey];
                }
            } else {
                domNode.removeAttribute(key);
            }
        }
    }
    // 2. Ajouter/modifier les nouvelles props
    for (const key in newProps) {
        const newValue = newProps[key];
        const oldValue = oldProps[key];
        
        if (newValue !== oldValue) {
            // Pour les événements, supprimer l'ancien avant d'ajouter le nouveau
            if (key.startsWith('on') && oldValue) {
                const eventType = key.slice(2).toLowerCase();
                const eventIdKey = `event${eventType.charAt(0).toUpperCase() + eventType.slice(1)}Id`;
                const oldEventId = domNode.dataset[eventIdKey];
                if (oldEventId) {
                    removeEventHandler(oldEventId);
                }
            }
            
            applySingleProp(domNode, key, newValue);
        }
    }
}

// Fonction pour créer un noeud DOM depuis un enfant virtuel
function createDomChild(child: ElementChild): Node {
    if (typeof child === 'string' || typeof child === 'number') {
        return document.createTextNode(String(child));
    } else if (child && typeof child === 'object' && 'tag' in child) {
        return createElement(child);
    }

    return document.createTextNode('');
}

// Fonction pour mettre à jour un enfant existant
function updateChild(parent: HTMLElement, domChild: ChildNode, oldChild: ElementChild, newChild: ElementChild): void {
    // Même type de contenu texte
    if ((typeof oldChild === 'string' || typeof oldChild === 'number') && 
        (typeof newChild === 'string' || typeof newChild === 'number')) {
        if (String(oldChild) !== String(newChild)) {
            domChild.textContent = String(newChild);
        }
    }
    // Deux éléments virtuels
    else if (oldChild && typeof oldChild === 'object' && 'tag' in oldChild &&
             newChild && typeof newChild === 'object' && 'tag' in newChild) {
        diffAndPatch(domChild as HTMLElement, oldChild, newChild);
    }
    // Types différents - remplacement complet
    else {
        const newDomChild = createDomChild(newChild);
        parent.replaceChild(newDomChild, domChild);
    }
}

// Séparer les enfants avec et sans keys
function extractKeyedChildren(children: ElementChild[]): KeyedChildren {
    const withKeys: Array<{ key: string; child: ElementChild; index: number }> = [];
    const withoutKeys: Array<{ child: ElementChild; index: number }> = [];
    
    children.forEach((child, index) => {
        if (child && typeof child === 'object' && 'props' in child && child.props.key !== undefined) {
            withKeys.push({ key: String(child.props.key), child, index });
        } else {
            withoutKeys.push({ child, index });
        }
    });
    
    return { withKeys, withoutKeys };
}

// Diff avec gestion des keys
function diffChildrenWithKeys(
    domNode: HTMLElement, 
    oldKeyed: KeyedChildren, 
    newKeyed: KeyedChildren
): void {
    // Créer une map des anciens éléments par key
    const oldKeyMap = new Map<string, { child: ElementChild; domIndex: number }>();
    oldKeyed.withKeys.forEach(({ key, child, index }) => {
        oldKeyMap.set(key, { child, domIndex: index });
    });

    // Suivre les nœuds DOM utilisés pour éviter les doublons
    const usedDomNodes = new Set<number>();
    let insertionIndex = 0;

    // Traiter les nouveaux éléments avec keys
    newKeyed.withKeys.forEach(({ key, child: newChild, index: newIndex }) => {
        const oldItem = oldKeyMap.get(key);
        
        if (oldItem && !usedDomNodes.has(oldItem.domIndex)) {
            // Element existant avec même key - mettre à jour et déplacer si nécessaire
            const domChild = domNode.childNodes[oldItem.domIndex];
            
            if (typeof oldItem.child === 'object' && typeof newChild === 'object' &&
                oldItem.child && 'tag' in oldItem.child && newChild && 'tag' in newChild) {
                updateChild(domNode, domChild, oldItem.child, newChild);
            }
            
            // Déplacer le nœud à la bonne position si nécessaire
            if (oldItem.domIndex !== insertionIndex) {
                domNode.insertBefore(domChild, domNode.childNodes[insertionIndex]);
            }
            
            usedDomNodes.add(oldItem.domIndex);
        } else {
            // Nouvel élément - créer et insérer
            const newDomChild = createDomChild(newChild);
            if (insertionIndex >= domNode.childNodes.length) {
                domNode.appendChild(newDomChild);
            } else {
                domNode.insertBefore(newDomChild, domNode.childNodes[insertionIndex]);
            }
        }
        
        insertionIndex++;
    });

    // Gérer les éléments sans keys
    newKeyed.withoutKeys.forEach(({ child: newChild }) => {
        const newDomChild = createDomChild(newChild);
        if (insertionIndex >= domNode.childNodes.length) {
            domNode.appendChild(newDomChild);
        } else {
            domNode.insertBefore(newDomChild, domNode.childNodes[insertionIndex]);
        }
        insertionIndex++;
    });

    // Supprimer les nœuds excédentaires à la fin
    while (domNode.childNodes.length > insertionIndex) {
        const lastChild = domNode.lastChild!;
        domNode.removeChild(lastChild);
    }
}

// Fallback sans keys (votre algorithme actuel)
function diffChildrenByIndex(domNode: HTMLElement, oldChildren: ElementChild[], newChildren: ElementChild[]): void {
    const maxLength = Math.max(oldChildren.length, newChildren.length);
    
    for (let i = 0; i < maxLength; i++) {
        const oldChild = oldChildren[i];
        const newChild = newChildren[i];
        const domChild = domNode.childNodes[i];

        if (newChild === undefined || newChild === null) {
            if (domChild) {
                domNode.removeChild(domChild);
            }
        } else if (oldChild === undefined || oldChild === null) {
            const newDomChild = createDomChild(newChild);
            domNode.appendChild(newDomChild);
        } else {
            updateChild(domNode, domChild, oldChild, newChild);
        }
    }
}

// Fonction pour comparer et patcher les enfants
function diffChildren(domNode: HTMLElement, oldChildren: ElementChild[], newChildren: ElementChild[]): void {
    const oldKeyedChildren = extractKeyedChildren(oldChildren);
    const newKeyedChildren = extractKeyedChildren(newChildren);
    
    // Si pas de keys, utiliser l'ancien algorithme simple
    if (oldKeyedChildren.withKeys.length === 0 && newKeyedChildren.withKeys.length === 0) {
        diffChildrenByIndex(domNode, oldChildren, newChildren);
        return;
    }
    
    // Algorithme avec keys
    diffChildrenWithKeys(domNode, oldKeyedChildren, newKeyedChildren);
}

// -------------------------------------------------

// Fonction pour rendre un élément virtuel dans un conteneur
export function renderElement(element: VirtualElement, container: HTMLElement): void {
    container.innerHTML = '';
    const domElement = createElement(element);
    container.appendChild(domElement);
}

// Fonction de rendu principale
export function render(createComponent: ComponentFunction, container: HTMLElement): void;
export function render(element: VirtualElement, container: HTMLElement): void;
export function render(
    elementOrFunction: VirtualElement | ComponentFunction, 
    container: HTMLElement
): void {
    const currentVirtualDOM = typeof elementOrFunction === 'function' ? elementOrFunction() : elementOrFunction;

    if (lastVirtualDOM && typeof elementOrFunction === 'function') {
        const existingElement = container.firstElementChild as HTMLElement | null;
        if (existingElement) {
            diffAndPatch(existingElement, lastVirtualDOM, currentVirtualDOM);
        } else {
            // Pas d'élément existant, rendu complet
            renderElement(currentVirtualDOM, container);
        }
    } else {
        // Premier rendu ou élément statique
        renderElement(currentVirtualDOM, container);
    }

    // Sauvegarder pour le prochain diff (seulement pour les fonctions)
    if (typeof elementOrFunction === 'function') {
        lastVirtualDOM = currentVirtualDOM;
    }

    // Gestion des listeners (votre code existant)
    if (typeof elementOrFunction === 'function') {
        if (unsubscribe) {
            unsubscribe();
            unsubscribe = null;
        }

        lastRender = { createComponent: elementOrFunction, container };

        unsubscribe = globalStore.subscribe(() => {
            rerender();
        });
    }
}

// Fonction pour convertir un VirtualElement en HTMLElement
export function createElement(vElement: VirtualElement): HTMLElement {
    const element = document.createElement(vElement.tag);
    applyProps(element, vElement.props);
    vElement.children.forEach(child => appendChild(element, child));
    return element;
}