import { generateId } from '../utils/id';

// Type pour un handler d'événement avec métadonnées
interface EventHandler {
    id: string;
    handler: (event: Event) => void;
    eventType: string;
}

// Registre global des handlers
const eventRegistry = new Map<string, EventHandler>();
let isInitialized = false;

// Liste des types d'événements supportés
const SUPPORTED_EVENTS = [
    'click', 'dblclick', 'mousedown', 'mouseup', 'mouseover', 'mouseout',
    'input', 'change', 'submit', 'reset', 'focus', 'blur',
    'keydown', 'keyup', 'keypress',
    'scroll', 'resize', 'load'
];


// Initialiser le système de délégation globale
export function initializeEventSystem(): void {
    if (isInitialized) return;

    // Ajouter un écouteur global pour tous les événements supportés
    SUPPORTED_EVENTS.forEach(eventType => {
        document.addEventListener(eventType, dispatchEvent);
    });

    isInitialized = true;
}

// Enregistrer un handler d'événement
export function registerEventHandler(
    eventType: string, 
    handler: (event: Event) => void
): string {
    const id = generateId();
    eventRegistry.set(id, { id, handler, eventType });
    initializeEventSystem();
    return id;
}

// Supprimer un handler d'événement
export function removeEventHandler(eventId: string): void {
    const handler = eventRegistry.get(eventId);
    if (handler) {
        eventRegistry.delete(eventId);
    }
}

// Helper pour supprimer tous les événements d'un élément
export function removeElementEventHandlers(element: HTMLElement): void {
    for (const key in element.dataset) {
        if (key.startsWith('event') && key.endsWith('Id')) {
            const eventId = element.dataset[key];
            if (eventId && eventRegistry.has(eventId)) {
                removeEventHandler(eventId);
            }
        }
    }
}

// Dispatcher un événement vers le bon handler
function dispatchEvent(event: Event): void {
    let target = event.target as HTMLElement;

    while (target) {
        const eventIdKey = `event${event.type.charAt(0).toUpperCase() + event.type.slice(1)}Id`;
        const eventId = target.dataset[eventIdKey];
        if (eventId) {
            const handler = eventRegistry.get(eventId);
            if (handler && handler.eventType === event.type) {
                handler.handler(event);
            }
        }
        target = target.parentElement as HTMLElement;
    }
}