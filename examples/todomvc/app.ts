import { generateId } from '../../src/utils/id';
import { div, h1, a, input, ul, li, button, span, label, render, setState, getState } from '../../src/index';

// ------------- Types pour TodoMVC -------------
interface Todo {
    id: string;
    text: string;
    completed: boolean;
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
    updateState({todos: (getCurrentState()).todos.map(todo => 
            todo.id === id ? {
                ...todo, completed: !todo.completed
            }
            : todo)
    });
}

// Supprimer une todo
function deleteTodo(id: string): void {
    updateState({ todos: (getCurrentState()).todos.filter(todo => todo.id !== id) });
}

// Changer le filtre
function setFilter(filter: Filter): void {
    updateState({ filter });
}

// Obtenir les todos filtrées
function getFilteredTodos(): Todo[] {
    const todos = (getState() as TodoState).todos;
    const filter = (getState() as TodoState).filter;
    return (todos.filter(todo => {
        if (filter === 'all') return true;
        if (filter === 'active') return !todo.completed;
        if (filter === 'completed') return todo.completed;
        return true;
    }));
}

// Supprimer toutes les todos complétées
function clearCompleted(): void {
    setState({
        ...getCurrentState(),
        todos: (getCurrentState()).todos.filter(todo => !todo.completed)
    })
}

// Démarrer l'édition d'une todo
function startEditing(id: string): void {
    setState({ editingId: id });
}

// Sauvegarder les modifications
function saveEdit(id: string, newText: string): void {
    if (newText.trim() === '') {
        deleteTodo(id);
        return;
    }

    updateState({ todos: (getCurrentState()).todos.map(todo => 
        todo.id === id ? { ...todo, text: newText.trim() } : todo
    ), editingId: null });
}

// Annuler l'édition
function cancelEdit(): void {
    setState({ editingId: null });
}

// -----------------------------------------------

// ------------------ Composants ------------------

function TodoHeader() {
    return div({ class: 'header' },
        h1('todos'),
        input({
            class: 'new-todo',
            placeholder: 'What needs to be done?',
            autofocus: true,
            onKeyUp: (e: KeyboardEvent) => {
                if (e.key === 'Enter' && e.target) {
                    const target = e.target as HTMLInputElement;
                    addTodo(target.value);
                    target.value = '';
                }
            }
        })
    );
}

function TodoList() {
    const todos = getFilteredTodos();

    if (todos.length === 0) {
        return div();
    }

    return div({ class: 'main' },
        input({
            id: 'toggle-all',
            class: 'toggle-all',
            type: 'checkbox',
            checked: todos.every(todo => todo.completed),
            onChange: () => {
                const allCompleted = todos.every(todo => todo.completed);
                todos.forEach(todo => {
                    if (todo.completed !== !allCompleted) {
                        toggleTodo(todo.id);
                    }
                });
            }
        }),
        label({ 
            for: 'toggle-all',
            class: 'toggle-all-label'
        }, 'Mark all as complete'),

        ul({ class: 'todo-list' },
            ...todos.map(todo => TodoItem(todo))
        )
    );
}

function TodoItem(todo: Todo) {
    const state = getCurrentState();
    const isEditing = state.editingId === todo.id;

    if (isEditing) {
        return li({ class: ['completed', 'editing'].filter(cls => 
            (cls === 'completed' && todo.completed) || cls === 'editing'
        ) },
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
    ));
}

function TodoFooter() {
    // Filtres et statistiques
    const state = getCurrentState();
    const activeTodoCount = state.todos.filter(todo => !todo.completed).length;
    const completedTodoCount = state.todos.length - activeTodoCount;

    if (state.todos.length === 0) {
        return div();
    }

    return div({ class: 'footer' },
        span({ class: 'todo-count' },
            `${activeTodoCount} item${activeTodoCount !== 1 ? 's' : ''} left`
        ),

        ul({ class: 'filters' },
            li({},
                a({
                    href: '#/',
                    class: state.filter === 'all' ? 'selected' : '',
                    onClick: (e: Event) => {
                        e.preventDefault();
                        setFilter('all');
                    }
                }, 'All')
            ),
            li({},
                a({
                    href: '#/active',
                    class: state.filter === 'active' ? 'selected' : '',
                    onClick: (e: Event) => {
                        e.preventDefault();
                        setFilter('active');
                    }
                }, 'Active')
            ),
            li({},
                a({
                    href: '#/completed',
                    class: state.filter === 'completed' ? 'selected' : '',
                    onClick: (e: Event) => {
                        e.preventDefault();
                        setFilter('completed');
                    }
                }, 'Completed')
            )
        ),

        completedTodoCount > 0 ? button({
            class: 'clear-completed',
            onClick: clearCompleted
        }, 'Clear completed') : null
    );
}

// Composant principal de l'application TodoMVC
export default function TodoApp() {
    return div(
        TodoHeader(),
        TodoList(),
        TodoFooter()
    );
}

render(TodoApp, document.getElementById('todo-app')!);