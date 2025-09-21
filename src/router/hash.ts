import { VirtualElement } from '../core/types';
import { renderElement } from '../dom/render';
import { globalStore } from '../state/store';

interface Route {
    path: string;
    component: () => VirtualElement;
}

const routes: Route[] = [];
let currentPath = '';
let observer: MutationObserver | null = null;

export function registerRoute(path: string, component: () => VirtualElement): void {
    const existingRouteIndex = routes.findIndex(r => r.path === path);
    
    if (existingRouteIndex !== -1) {
        routes[existingRouteIndex].component = component;
    } else {
        routes.push({ path, component });
    }
}

export function initRouter(): void {
    window.addEventListener('hashchange', handleRouteChange);
    
    // Observer pour détecter quand router-outlet est recréé
    observer = new MutationObserver(() => {
        const outlet = document.getElementById('router-outlet');
        if (outlet && !outlet.hasChildNodes()) {
            // Le router-outlet vient d'être recréé et est vide
            handleRouteChange();
        }
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // S'abonner aux changements d'état
    globalStore.subscribe(() => {
        // Petit délai pour que le DOM se mette à jour
        setTimeout(handleRouteChange, 0);
    });
    
    handleRouteChange();
}

export function navigateTo(path: string): void {
    window.location.hash = path;
}

function handleRouteChange(): void {
    currentPath = getCurrentPath();
    
    const container = document.getElementById('router-outlet');
    if (!container) {
        return;
    }
    
    const route = routes.find(r => r.path === currentPath);

    if (route) {
        const element = route.component();
        renderElement(element, container);
    } else {
        container.innerHTML = '<p>404 - Not Found</p>';
    }
}

function getCurrentPath(): string {
    return window.location.hash.slice(1);
}