import { VirtualElement, ElementChild, ElementProps } from '../core/types';
import { registerEventHandler } from '../events/handler';
import { globalStore } from '../state/store';
import { generateId } from '../utils/id';

// Type pour une fonction qui crée un élément virtuel
type ComponentFunction = () => VirtualElement;

// Variable pour stocker le dernier rendu (pour le re-rendering automatique)
let lastRender: { createComponent: ComponentFunction; container: HTMLElement } | null = null;
let unsubscribe: (() => void) | null = null;

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
    if (typeof elementOrFunction === 'function') {
        renderElement(elementOrFunction(), container);
    } else {
        // Si on reçoit un élément direct, on ne fait pas de re-render automatique
        renderElement(elementOrFunction, container);
        return;
    }

    if (lastRender && unsubscribe) {
        unsubscribe();
        unsubscribe = null;
    }

    lastRender = { createComponent: elementOrFunction, container };

    unsubscribe = globalStore.subscribe(() => {
        rerender();
    });
}

// Fonction pour re-render l'application
function rerender(): void {
    if (lastRender) {
        renderElement(lastRender.createComponent(), lastRender.container);
    }
}

// Fonction pour convertir un VirtualElement en HTMLElement
export function createElement(vElement: VirtualElement): HTMLElement {
    const element = document.createElement(vElement.tag);
    applyProps(element, vElement.props);
    vElement.children.forEach(child => appendChild(element, child));
    return element;
}

// Fonction pour appliquer les props à un élément HTML
function applyProps(element: HTMLElement, props: ElementProps): void {
    for (const [key, value] of Object.entries(props)) {
        if (key.startsWith('on')) {
            const eventType = key.slice(2).toLowerCase();
            const id = element.id || '';
            if (!id) {
                element.id = generateId();
            }
            const eventId = registerEventHandler(element.id, eventType, value);
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

// Convertir un objet style en string CSS
function styleObjectToString(styleObj: Record<string, string | number>): string {
    if (!styleObj) return '';

    const styles = Object.entries(styleObj).map(([key, value]) => {
        return `${camelToKebab(key)}: ${value}`;
    });
    return styles.join('; ');
}

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