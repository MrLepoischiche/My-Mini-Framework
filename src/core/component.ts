import { globalStore } from '../state/store';
import { VirtualElement } from './types';
import { createElement } from '../dom/render';
import { deepEqual } from '../utils/equality';

export interface ComponentLifecycle {
    mount(container: HTMLElement): void;
    unmount(): void;
    update(newProps?: any): void;
}

export class ReactiveComponent implements ComponentLifecycle {
    private subscriptions: (() => void)[] = [];
    private container: HTMLElement | null = null;
    private props: any;
    private isMounted = false;
    
    constructor(
        private statePaths: string[],
        private renderFn: (props: any) => VirtualElement,
        initialProps: any = {},
        private shouldUpdate?: (newValue: any, oldValue: any, path: string) => boolean
    ) {
        this.props = initialProps;
    }
    
    mount(container: HTMLElement): void {
        if (this.isMounted) {
            console.warn('Component already mounted');
            return;
        }
        
        this.container = container;
        this.isMounted = true;
        this.subscribeToState();
        this.render();
    }
    
    unmount(): void {
        if (!this.isMounted) return;
        
        this.subscriptions.forEach(unsub => unsub());
        this.subscriptions = [];
        this.container = null;
        this.isMounted = false;
    }
    
    update(newProps: any): void {
        if (!this.isMounted) return;
        
        if (!deepEqual(this.props, newProps)) {
            this.props = newProps;
            this.render();
        }
    }

    // Méthode d'égalité (peut être surchargée)
    protected equals(oldValue: any, newValue: any): boolean {
        return oldValue === newValue;
    }
    
    protected subscribeToState(): void {
        this.statePaths.forEach(path => {
            let lastValue: any = globalStore.getValueByPath(path);
            
            const unsubscribe = globalStore.subscribeTo(path, (newValue: any) => {
                if (this.isMounted) {
                    if (this.shouldUpdate) {
                        if (this.shouldUpdate(newValue, lastValue, path)) {
                            lastValue = newValue;
                            this.render();
                        }
                    } else {
                        this.render();
                    }

                    lastValue = newValue;
                }
            });
            this.subscriptions.push(unsubscribe);
        });
    }
    
    private render(): void {
        if (!this.container || !this.isMounted) return;
        
        try {
            const vdom = this.renderFn(this.props);
            this.container.innerHTML = '';
            this.container.appendChild(createElement(vdom));
        } catch (error) {
            console.error('Error rendering component:', error);
        }
    }
}