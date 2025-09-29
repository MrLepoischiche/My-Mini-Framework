import { createElement } from '../../src/dom/render';
import {
    ReactiveComponent,

    div,
    h1,
    a,
    input,
    ul,
    li,
    button,
    span,
    label,

    VirtualElement,

    globalStore,
    setState,
    getState,

    generateId
} from '../../src/index';
import { createStatePath } from '../../src/state/store';

// ------------- Types pour TodoMVC -------------

interface Todo {
    id: string;
    text: string;
    completed: boolean;
}

function todoEqual(a: Todo | undefined, b: Todo | undefined): boolean {
    if (!a && !b) return true;
    if (!a || !b) return false;
    return a.id === b.id && a.text === b.text && a.completed === b.completed;
}

type Filter = 'all' | 'active' | 'completed';

interface TodoState {
    todos: Todo[];
    filter: Filter;
    editingId: string | null;
}

// État initial
setState<TodoState>({
    todos: [],
    filter: 'all',
    editingId: null
});

// Composant TodoItem réactif
class TodoItemComponent extends ReactiveComponent {
    constructor(todoId: string) {
        const todos = getCurrentState().todos;
        const todoIndex = todos.findIndex(t => t.id === todoId);

        if (todoIndex === -1) {
            super(
                [`todos`],
                (props) => this.renderTodo(props),
                { todoId },
                (newValue: any, oldValue: any, path: string) => {
                    if (!oldValue) return true; // Premier rendu

                    // Si le chemin est 'todos', on a la liste complète
                    if (path === 'todos') {
                        const newTodos = newValue as Todo[];
                        const oldTodos = oldValue as Todo[];
                        const newTodo = newTodos?.find(t => t.id === todoId);
                        const oldTodo = oldTodos?.find(t => t.id === todoId);
                        return !todoEqual(newTodo, oldTodo);
                    }

                    // Pour les autres chemins, comparer directement les valeurs
                    return newValue !== oldValue;
                }
            );
        } else {
            const paths = [
                `todos[${todoIndex}].text`,
                `todos[${todoIndex}].completed`,
                'editingId'
            ];

            super(
                paths,
                (props) => this.renderTodo(props),
                { todoId },
                (newValue: any, oldValue: any, path: string) => {
                    if (!oldValue) return true; // Premier rendu

                    // Si le chemin est 'todos', on a la liste complète
                    if (path === 'todos') {
                        const newTodos = newValue as Todo[];
                        const oldTodos = oldValue as Todo[];
                        const newTodo = newTodos?.find(t => t.id === todoId);
                        const oldTodo = oldTodos?.find(t => t.id === todoId);
                        return !todoEqual(newTodo, oldTodo);
                    }

                    // Pour les autres chemins, comparer directement les valeurs
                    return newValue !== oldValue;
                }
            );
        }

        this.equals = (oldTodos: Todo[], newTodos: Todo[]) => {
            const oldTodo = oldTodos?.find(t => t.id === todoId);
            const newTodo = newTodos?.find(t => t.id === todoId);

            return todoEqual(oldTodo, newTodo);
        };
    }

    private renderTodo(props: { todoId: string }): VirtualElement {
        const state = getCurrentState();
        const todo = state.todos.find(t => t.id === props.todoId);
        
        if (!todo) {
            console.log(`Todo ${props.todoId} not found, rendering empty`);
            return div(); // Todo supprimée
        }
        
        console.log(`Rendering TodoItem ${todo.id}`);
        const isEditing = state.editingId === todo.id;

        if (isEditing) {
            return li({ 
                key: todo.id,
                class: ['completed', 'editing'].filter(cls => 
                    (cls === 'completed' && todo.completed) || cls === 'editing'
                ) 
            },
                input({
                    class: 'edit',
                    value: todo.text,
                    autofocus: true,
                    onBlur: (e: Event) => {
                        saveEdit(todo.id, (e.target as HTMLInputElement).value);
                    },
                    onKeyUp: (e: KeyboardEvent) => {
                        if (e.key === 'Enter') {
                            saveEdit(todo.id, (e.target as HTMLInputElement).value);
                        } else if (e.key === 'Escape') {
                            cancelEdit();
                        }
                    }
                })
            );
        }

        return li({ 
            key: todo.id, 
            class: todo.completed ? 'completed' : '' 
        },
            div({ class: 'view' },
                input({
                    class: 'toggle',
                    type: 'checkbox',
                    checked: todo.completed,
                    onChange: () => toggleTodo(todo.id)
                }),
                label({
                    onDblClick: () => startEditing(todo.id)
                }, todo.text),
                button({
                    class: 'destroy',
                    onClick: () => deleteTodo(todo.id)
                })
            )
        );
    }
}

// Gestionnaire de la liste des todos
class TodoListManager {
    private todoComponents = new Map<string, TodoItemComponent>();
    private listContainer: HTMLElement;
    private unsubscribe: (() => void) | null = null;
    
    constructor(container: HTMLElement) {
        this.listContainer = container;
        this.subscribeToTodoChanges();
    }
    
    private subscribeToTodoChanges(): void {
        // S'abonner aux changements de todos
        const todosUnsubscribe = globalStore.subscribeTo('todos', () => {
            const todos = getFilteredTodos();
            this.updateTodoList(todos);
        });
        
        // S'abonner aux changements de filtre
        const filterUnsubscribe = globalStore.subscribeTo('filter', () => {
            const todos = getFilteredTodos();
            this.updateTodoList(todos);
        });
        
        // Combiner les deux unsubscribe functions
        this.unsubscribe = () => {
            todosUnsubscribe();
            filterUnsubscribe();
        };
        
        // Rendu initial
        const todos = getFilteredTodos();
        this.updateTodoList(todos);
    }

    private updateTodoList(todos: Todo[]): void {
        // Supprimer les composants des todos qui n'existent plus
        this.todoComponents.forEach((component, id) => {
            if (!todos.find(t => t.id === id)) {
                component.unmount();
                this.todoComponents.delete(id);
                // Supprimer le container DOM
                const containers = this.listContainer.querySelectorAll(`[data-todo-id="${id}"]`);
                containers.forEach(container => container.remove());
            }
        });
        
        // Ajouter les nouveaux todos
        todos.forEach(todo => {
            if (!this.todoComponents.has(todo.id)) {
                const container = document.createElement('div');
                container.setAttribute('data-todo-id', todo.id);
                this.listContainer.appendChild(container);
                
                const component = new TodoItemComponent(todo.id);
                component.mount(container);
                this.todoComponents.set(todo.id, component);
            }
        });
    }
    
    destroy(): void {
        this.todoComponents.forEach(component => component.unmount());
        this.todoComponents.clear();
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }
}

// Gestionnaire principal de l'application TodoMVC
class TodoAppManager {
    private listManager: TodoListManager | null = null;
    private footerUnsubscribe: (() => void) | null = null;
    
    constructor(private container: HTMLElement) {}
    
    // Initialiser l'application complète
    initialize(): void {
        this.createStaticStructure();
    
        const listContainer = document.getElementById('todo-list-container')!;
        this.listManager = new TodoListManager(listContainer);
        
        // S'abonner aux changements pour mettre à jour footer et toggle-all
        this.footerUnsubscribe = globalStore.subscribeTo('todos', () => {
            this.updateFooter();
            this.updateToggleAllState();
        });

        const filterUnsubscribe = globalStore.subscribeTo('filter', () => {
            this.updateFooter();
        });

        // Stocker les deux unsubscribe
        this.footerUnsubscribe = () => {
            if (this.footerUnsubscribe) this.footerUnsubscribe();
            if (filterUnsubscribe) filterUnsubscribe();
        };
        
        // Mise à jour initiale
        this.updateFooter();
        this.updateToggleAllState();
    }

    // Créer les éléments interactifs (input, toggle-all)
    private createInteractiveElements(): void {
        console.log('Creating interactive elements...');
    
        // Input principal
        const newTodoContainer = document.getElementById('new-todo-container')!;
        console.log('newTodoContainer found:', newTodoContainer);
        
        const newTodoInput = input({
            class: 'new-todo',
            placeholder: 'What needs to be done?',
            autofocus: true,
            onKeyUp: (e: KeyboardEvent) => {
                console.log('KeyUp event triggered');
                this.handleNewTodoInput(e);
            }
        });
        newTodoContainer.appendChild(createElement(newTodoInput));
        
        // Toggle all
        const toggleContainer = document.getElementById('toggle-all-container')!;
        console.log('toggleContainer found:', toggleContainer);
        
        const toggleAllElements = div(
            input({
                id: 'toggle-all',
                class: 'toggle-all',
                type: 'checkbox',
                onChange: () => {
                    console.log('Toggle all clicked');
                    this.handleToggleAll();
                }
            }),
            label({ for: 'toggle-all' }, 'Mark all as complete')
        );
        toggleContainer.appendChild(createElement(toggleAllElements));
    }


    // Créer la structure HTML de base
    private createStaticStructure(): void {
        this.container.innerHTML = `
            <div class="header">
                <h1>todos</h1>
                <div id="new-todo-container"></div>
            </div>
            <div class="main">
                <div id="toggle-all-container"></div>
                <ul class="todo-list" id="todo-list-container"></ul>
            </div>
            <div class="footer" id="footer-container"></div>
        `;
        
        this.createInteractiveElements();
    }
    
    // Mettre à jour l'état du toggle-all
    private updateToggleAllState(): void {
        const toggleAllCheckbox = this.container.querySelector('#toggle-all') as HTMLInputElement;
        const visibleTodos = getFilteredTodos();
        
        if (visibleTodos.length === 0) {
            toggleAllCheckbox.style.display = 'none';
        } else {
            toggleAllCheckbox.style.display = 'block';
            toggleAllCheckbox.checked = visibleTodos.every(todo => todo.completed);
        }
    }

    // Gérer l'ajout d'une nouvelle todo via l'input principal
    private handleNewTodoInput(event: KeyboardEvent): void {
        if (event.key !== 'Enter' || !(event.target instanceof HTMLInputElement)) return;
        
        const input = event.target as HTMLInputElement;
        const text = input.value.trim();

        if (text.length > 0) {
            addTodo(text);
        }

        input.value = '';
    }
    
    // Gérer le toggle-all
    private handleToggleAll(): void {
        const state = getCurrentState();
        const visibleTodos = getFilteredTodos(state);
        
        const allVisibleCompleted = visibleTodos.length > 0 && visibleTodos.every(todo => todo.completed);
        const newCompletedState = !allVisibleCompleted;
        
        console.log('All visible completed:', allVisibleCompleted, 'New state:', newCompletedState);
        
        const newTodos = state.todos.map(todo => {
            return { ...todo, completed: newCompletedState };
        });
        
        updateState({ todos: newTodos });
    }
    
    // Mettre à jour le footer (compteur + filtres + clear)
    private updateFooter(): void {
        const state = getCurrentState();
        const footerContainer = document.getElementById('footer-container') as HTMLElement;

        if (state.todos.length === 0) {
            footerContainer.innerHTML = '';
            return;
        }

        const activeTodoCount = state.todos.filter(todo => !todo.completed).length;
        const completedTodoCount = state.todos.length - activeTodoCount;
        
        const footerContent = div(
            span({ class: 'todo-count' },
                `${activeTodoCount} item${activeTodoCount !== 1 ? 's' : ''} left`
            ),
            ul({ class: 'filters' },
                li(a({ 
                    href: '#/', 
                    class: state.filter === 'all' ? 'selected' : '',
                    onClick: (e: Event) => {
                        console.log('All filter clicked');
                        e.preventDefault();
                        setFilter('all' as Filter);
                    }
                }, 'All')),
                li(a({ 
                    href: '#/active', 
                    class: state.filter === 'active' ? 'selected' : '',
                    onClick: (e: Event) => {
                        console.log('Active filter clicked');
                        e.preventDefault();
                        setFilter('active' as Filter);
                    }
                }, 'Active')),
                li(a({ 
                    href: '#/completed', 
                    class: state.filter === 'completed' ? 'selected' : '',
                    onClick: (e: Event) => {
                        console.log('Completed filter clicked');
                        e.preventDefault();
                        setFilter('completed' as Filter);
                    }
                }, 'Completed'))
            ),
            completedTodoCount > 0 ? button({
                class: 'clear-completed',
                onClick: () => {
                    console.log('Clear completed clicked');
                    clearCompleted();
                }
            }, 'Clear completed') : null
        );
        
        footerContainer.innerHTML = '';
        footerContainer.appendChild(createElement(footerContent));
    }
    
    // Nettoyer les ressources
    destroy(): void {
        this.listManager?.destroy();
        this.footerUnsubscribe?.();

        this.listManager = null;
        this.footerUnsubscribe = null;
    }
}

// -----------------------------------------------

// ------------ Fonctions utilitaires ------------

// Récupérer l'état
function getCurrentState(): TodoState {
    return getState() as TodoState;
}

// Modifier l'état
function updateState(updates: Partial<TodoState>): void {
    setState({
        ...getCurrentState(),
        ...updates
    });
}

// -----------------------------------------------

// ------------------- Actions -------------------

// Ajouter une todo
function addTodo(text: string): void {
    if (!text.trim().length) return;

    const newTodo: Todo = {
        id: generateId(),
        text,
        completed: false
    };

    const currentState = getCurrentState();
    updateState({ todos: [...currentState.todos, newTodo] });
}

// Basculer l'état d'une todo
function toggleTodo(id: string): void {
    const currentTodos = getCurrentState().todos;
    const newTodos = currentTodos.map(todo => {
        if (todo.id === id) {
            return { ...todo, completed: !todo.completed };
        }
        return todo;
    });
    
    updateState({ todos: newTodos });
}

// Supprimer une todo
function deleteTodo(id: string): void {
    const currentTodos = getCurrentState().todos;
    const newTodos = currentTodos.filter(todo => todo.id !== id);
    
    updateState({ todos: newTodos });
}

// Changer le filtre
function setFilter(filter: Filter): void {
    updateState({ filter });
}

// Obtenir les todos filtrées
function getFilteredTodos(state?: TodoState): Todo[] {
    if (!state) state = getCurrentState();

    const todos = state.todos;
    const filter = state.filter;
    return (todos.filter(todo => {
        if (filter === 'all') return true;
        if (filter === 'active') return !todo.completed;
        if (filter === 'completed') return todo.completed;
        return true;
    }));
}

// Démarrer l'édition d'une todo
function startEditing(id: string): void {
    setState({ editingId: id });
}

// Sauvegarder les modifications
function saveEdit(id: string, newText: string): void {
    const trimmedText = newText.trim();
    
    if (trimmedText === '') {
        deleteTodo(id);
        return;
    }

    const currentTodos = getCurrentState().todos;
    const newTodos = currentTodos.map(todo => {
        if (todo.id === id) {
            return { ...todo, text: trimmedText };
        }
        return todo;
    });

    updateState({ todos: newTodos, editingId: null });
}

// Supprimer toutes les todos complétées
function clearCompleted(): void {
    const currentTodos = getCurrentState().todos;
    const newTodos = currentTodos.filter(todo => !todo.completed);
    
    updateState({ todos: newTodos });
}

// Annuler l'édition
function cancelEdit(): void {
    setState({ editingId: null });
}

// -----------------------------------------------

// Initialiser l'application TodoMVC
const appManager = new TodoAppManager(document.getElementById('todo-app')!);
appManager.initialize();