# Mini Framework

A lightweight JavaScript framework with Virtual DOM, reactive state management, custom event system, routing, and advanced performance features.

## Table of Contents

1. [Installation](#installation)
2. [Architecture](#architecture)
3. [Quick Start](#quick-start)
4. [Core API](#core-api)
5. [State Management](#state-management)
6. [Reactive Components](#reactive-components)
7. [Event Handling](#event-handling)
8. [Performance Optimization](#performance-optimization)
9. [Lazy Loading](#lazy-loading)
10. [Routing](#routing)
11. [Examples](#examples)

## Installation
```bash
# Clone the project
git clone https://github.com/MrLepoischiche/My-Mini-Framework.git
cd mini-framework

# Install dependencies
npm i

# Run the TodoMVC example
npm run todomvc
```

## Architecture

### Overview

The framework is organized into independent modules that work together to provide a cohesive development experience.

```
src/
├── core/           # Framework core
│   ├── types.ts    # TypeScript definitions
│   ├── element.ts  # Element creation (div, h1, etc.)
│   ├── component.ts # Reactive components
│   ├── memo.ts     # Memoization and optimization
│   └── lazy.ts     # Lazy loading and code splitting
├── dom/            # DOM management
│   └── render.ts   # Virtual DOM and diffing algorithm
├── state/          # State management
│   └── store.ts    # Global reactive store with batching
├── events/         # Event system
│   └── handler.ts  # Global delegation with event pooling
├── router/         # Routing
│   ├── hash.ts     # Hash-based router
│   └── lazy.ts     # Lazy router with preloading
├── utils/          # Utilities
│   ├── id.ts       # Unique ID generation
│   ├── equality.ts # Comparison functions
│   └── pathBuilder.ts # State path builder
└── index.ts        # Entry point
```

### Key Concepts

#### Virtual DOM with Diffing
The framework uses a virtual DOM representation with an optimized diffing algorithm:
```ts
// Virtual element structure
interface VirtualElement {
    tag: string;           // 'div', 'h1', etc.
    props: ElementProps;   // Attributes and events
    children: ElementChild[]; // Children (text or other elements)
    key?: string;          // Unique key for diffing
}
```

**Diffing Algorithm**: Only modified elements are re-rendered, not the entire application.
**Key System**: Elements with the same key are reused instead of being recreated.

#### Unidirectional Data Flow
```
State → Virtual DOM → Diffing → Real DOM
  ↑                               ↓
setState()/setBatchedState()  User Events
```

#### Inversion of Control
Unlike a library where you call functions, the framework takes control:
- Library: `library.doSomething()`
- Framework: The framework calls your component functions automatically

### Application Lifecycle
1. Initialization: render(app, container)
2. Virtual DOM Creation: Your component functions are called
3. Diffing: Comparison with previous Virtual DOM
4. DOM Rendering: Only modified elements are updated
5. Events: The delegation system captures interactions
6. State Change: setState()/setBatchedState() triggers a new cycle
7. Optimized Re-render: Diffing algorithm + memoization

### Design Principles
- Simplicity: Minimal and intuitive API
- Performance: Diffing, memoization, batching, event pooling
- Reactivity: Automatic DOM updates
- Modularity: Each feature is isolated
- Type Safety: Full TypeScript support
- Optimization: Lazy loading and code splitting

## Quick Start
```ts
import { div, h1, button, render, setState, getState } from './src/index';

// Initialize state
setState({ count: 0 });

// Create a reactive application
const app = () => div(
    h1(`Counter: ${getState('count')}`),
    button({
        onClick: () => setState({ count: getState('count') + 1 })
    }, 'Increment')
);

// Render the application
render(app, document.getElementById('app')!);
```

## Core API

### Element Creation
The framework provides functions to create HTML elements declaratively:
```ts
// Simple elements
div('Text content')
h1('Main title')
p('Paragraph')

// With attributes
div({ class: 'container', id: 'main' }, 'Content')
input({ type: 'text', placeholder: 'Type here...' })

// With events
button({ onClick: () => alert('Clicked!') }, 'Click')

// Nested elements
div({ class: 'card' },
    h2('Card title'),
    p('Description'),
    button({ onClick: handleClick }, 'Action')
)

// With keys for optimization
div({ key: 'unique-id' }, 'Content')
```

### Supported Elements
```ts
div, h1, h2, h3, h4, h5, h6, p, button, input, ul, li, span, label, form, header, footer, section, nav, a, img, strong, table, thead, tbody, tr, th, td, select, option, textarea, br, hr
```

### Advanced Props

#### Object Styles
```ts
div({
    style: {
        backgroundColor: 'blue',
        fontSize: '16px',
        textAlign: 'center'
    }
}, 'Styled text')
```

#### Array Classes
```ts
div({
    class: ['btn', 'btn-primary', isActive && 'active'].filter(Boolean)
}, 'Button')
```

#### Boolean Attributes
```ts
input({ type: 'checkbox', checked: true, disabled: false })
```

#### Keys for Optimization
```ts
// Elements with the same key are reused
ul(
    todos.map(todo =>
        li({ key: todo.id }, todo.text)
    )
)
```

## State Management

State management is handled by a global reactive Store with batching support.

### Basic API
```ts
import { getState, setState, setBatchedState } from './src/index';

// Initialize state
setState({ count: 0, user: { name: 'John' } });

// Read state
const count = getState('count');
const fullState = getState();

// Modify state (immediate update)
setState({ count: count + 1 });

// Modify state (batched update)
// Optimized for bulk operations
setBatchedState({
    todos: newTodos,
    filter: 'all'
});
```

### Update Batching

The framework supports two update modes:

**setState()**: Immediate update
- Notifies listeners immediately
- Ideal for quick individual updates

**setBatchedState()**: Batched update
- Uses `requestAnimationFrame` to group updates
- Combines multiple changes into a single render
- **Recommended for**:
  - Modifying multiple state properties at once
  - Bulk operations (toggle all, clear completed)
  - Better performance with large lists

```ts
// Example: Toggle all todos
const toggleAll = () => {
    const newTodos = todos.map(todo => ({
        ...todo,
        completed: !todo.completed
    }));

    // Batching = One re-render instead of one per todo
    setBatchedState({ todos: newTodos });
};
```

### Nested State Paths

The Store supports nested paths:
```ts
setState({ user: { profile: { name: 'John', age: 30 } } });

// Access by path
const name = globalStore.getValueByPath('user.profile.name');

// Subscribe to a specific path
const unsubscribe = globalStore.subscribeTo('user.profile.name', (newValue) => {
    console.log('Name changed:', newValue);
});
```

### PathBuilder (Type-safe paths)
```ts
import { createStatePath } from './src/index';

// Create type-safe paths
const userPath = createStatePath().user.profile.name;
const todosPath = createStatePath().todos;

// Subscribe with type safety
globalStore.subscribeToPath(userPath, (name) => {
    console.log('Name:', name);
});
```

## Reactive Components

Reactive components automatically re-render when state changes.

### ReactiveComponent Class
```ts
import { ReactiveComponent, VirtualElement, div, span } from './src/index';

class CounterComponent extends ReactiveComponent {
    constructor() {
        super(
            ['count'],  // State paths to watch
            () => this.render(),
            {}  // Initial props
        );
    }

    private render(): VirtualElement {
        const count = getState('count');
        return div(
            span(`Count: ${count}`),
            button({
                onClick: () => setState({ count: count + 1 })
            }, 'Increment')
        );
    }
}

// Usage
const counter = new CounterComponent();
counter.mount(document.getElementById('counter-container')!);
```

### Lifecycle Methods
```ts
class MyComponent extends ReactiveComponent {
    mount(container: HTMLElement): void {
        // Called when component is mounted
        super.mount(container);
        console.log('Component mounted');
    }

    unmount(): void {
        // Called to cleanup resources
        console.log('Component unmounting');
        super.unmount();
    }

    update(newProps: any): void {
        // Called to update props
        super.update(newProps);
    }
}
```

## Event Handling

The framework implements an optimized event system with global delegation and event pooling.

### How It Works

**Global Delegation**: A single listener on `document` captures all events
**Event Pooling**: Event object reuse to reduce memory allocation

### Event Syntax
```ts
// Supported events (prefixed with 'on')
button({ onClick: handleClick }, 'Click')
input({ onInput: handleInput, onFocus: handleFocus })
div({ onMouseOver: handleHover })
```

### System Advantages
- **Performance**: One global listener instead of one per element
- **Memory**: Event pooling reduces allocations
- **Flexibility**: Automatic handling of dynamic elements

```ts
// Example with multiple event types
const form = div({ class: 'form' },
    input({
        type: 'text',
        placeholder: 'Your name',
        onInput: (e) => setState({ name: e.target.value }),
        onFocus: () => console.log('Input focus'),
        onBlur: () => console.log('Input blur')
    }),
    button({
        onClick: (e) => {
            e.preventDefault();
            submitForm();
        },
        onMouseOver: () => setState({ hovering: true }),
        onMouseOut: () => setState({ hovering: false })
    }, 'Submit')
);
```

## Performance Optimization

The framework offers several optimization techniques.

### Memoization

#### memo() - Memoize Functions
```ts
import { memo } from './src/index';

// Memoize a pure function
const expensiveCalculation = memo((a, b) => {
    console.log('Computing...');
    return a * b * 1000;
});

expensiveCalculation(5, 10); // Computing... 50000
expensiveCalculation(5, 10); // 50000 (from cache)
```

#### useCallback() - Memoize Event Handlers
```ts
import { useCallback } from './src/index';

class MyComponent extends ReactiveComponent {
    private handleClick = useCallback((id: string) => {
        deleteTodo(id);
    }, []); // Dependencies

    private render() {
        return button({
            onClick: () => this.handleClick(todo.id)
        }, 'Delete');
    }
}
```

#### memoizeReactiveComponent() - Memoize Components
```ts
import { memoizeReactiveComponent } from './src/index';

class TodoItem extends ReactiveComponent {
    constructor(todoId: string) {
        super(['todos'], () => this.render(todoId), {});
    }
    // ...
}

// Create a memoized version
const MemoizedTodoItem = memoizeReactiveComponent(
    TodoItem,
    (prevArgs, nextArgs) => prevArgs[0] === nextArgs[0]
);

// Components with the same todoId will be reused
const item1 = new MemoizedTodoItem('todo-1');
const item2 = new MemoizedTodoItem('todo-1'); // Reuses item1
```

### Diffing Algorithm

The diffing algorithm minimizes DOM manipulations:

```ts
// Before: Full re-render
// <ul>
//   <li>Item 1</li>
//   <li>Item 2</li>
// </ul>

// After: Only modified element is updated
// <ul>
//   <li>Item 1</li>
//   <li>Item 2 - MODIFIED</li> <- Only this element is re-rendered
// </ul>
```

**Use keys** to optimize diffing:
```ts
// Without keys: All elements are recreated
ul(
    items.map(item => li(item.text))
)

// With keys: Unchanged elements are reused
ul(
    items.map(item => li({ key: item.id }, item.text))
)
```

### Equality Functions

```ts
import { shallowEqual, deepEqual } from './src/index';

// Shallow comparison (references)
shallowEqual([1, 2], [1, 2]); // false (different arrays)
shallowEqual(obj1, obj1); // true (same reference)

// Deep comparison (values)
deepEqual([1, 2], [1, 2]); // true
deepEqual({ a: 1 }, { a: 1 }); // true
```

## Lazy Loading

The framework supports lazy loading and code splitting.

### LazyComponent

⚠️ **Important Note on LazyReactiveComponent**:
The `LazyReactiveComponent` class currently has limitations:
- Automatically subscribes to `'router.loadingState'` (may not exist)
- Checks `'user.preferences'` (may not exist)
- Internal state changes don't trigger re-renders
- Too complex for components that load instantly

**Recommendation**: Use `ReactiveComponent` directly for simple components. `LazyReactiveComponent` is intended for real async imports (actual code splitting).

### Correct Usage (ReactiveComponent)

```ts
import { ReactiveComponent } from './src/index';

// Simple and functional reactive component
class StatsComponent extends ReactiveComponent {
    constructor() {
        super(
            ['todos'],
            () => this.renderStats(),
            {}
        );
    }

    private renderStats() {
        const todos = getState('todos');
        const active = todos.filter(t => !t.completed).length;
        return span(`${active} items left`);
    }
}

const stats = new StatsComponent();
stats.mount(container);
```

### LazyComponent (for real code splitting)

```ts
import { LazyComponent } from './src/index';

// Lazy loading with real dynamic import
const lazyModule = new LazyComponent(
    () => import('./heavy-component').then(m => m.default),
    {
        fallback: { tag: 'div', props: {}, children: ['Loading...'] },
        onError: { tag: 'div', props: {}, children: ['Error loading'] }
    }
);

// Load and render
await lazyModule.load();
const element = lazyModule.render(props);
```

## Routing

The framework includes an advanced routing system with lazy loading.

### Basic Hash Router

```ts
import { registerRoute, initRouter, navigateTo } from './src/index';

// Register routes
registerRoute('', () => div('Home page'));
registerRoute('about', () => div('About'));
registerRoute('contact', () => div('Contact'));

// Initialize the router
initRouter(); // Automatically looks for #router-outlet
```

### Lazy Router

The lazy router supports deferred route loading:

```ts
import { registerLazyRoute, navigateToLazy, preloadRoute } from './src/index';

// Register lazy routes
registerLazyRoute('/',
    () => Promise.resolve(() => div('Home')),
    { preload: true }
);

registerLazyRoute('/dashboard',
    () => import('./views/dashboard').then(m => m.default),
    { preload: false }
);

// Lazy navigation
await navigateToLazy('/dashboard');

// Manual preload
await preloadRoute('/dashboard');
```

### Preloading Strategies

The framework offers three preloading strategies:

#### 1. Hover Preloading
```ts
import { enableHoverPreloading } from './src/index';

// Preload when user hovers over a link
enableHoverPreloading();
// Routes load as soon as the user hovers over links
```

#### 2. Visible Preloading
```ts
import { enableVisiblePreloading } from './src/index';

// Preload when links become visible
enableVisiblePreloading();
// Uses IntersectionObserver to detect visibility
```

#### 3. Idle Preloading
```ts
import { enableIdlePreloading } from './src/index';

// Preload during browser idle time
enableIdlePreloading();
// Uses requestIdleCallback to load routes in the background
```

### Combining Strategies

```ts
// Optimal configuration
registerLazyRoute('/', homeLoader, { preload: true });  // Main route
registerLazyRoute('/about', aboutLoader, { preload: false });
registerLazyRoute('/contact', contactLoader, { preload: false });

// Preload the initial route
preloadRoute(window.location.hash.slice(1) || '/');

// Enable hover + idle preloading
enableHoverPreloading();  // Preload on hover
enableIdlePreloading();   // Preload the rest during idle time
```

### Navigation

```ts
// Programmatic navigation
navigateTo('about'); // Synchronous
await navigateToLazy('/dashboard'); // Asynchronous with lazy loading

// Navigation via links
a({
    href: '#/about',
    onClick: (e) => {
        e.preventDefault();
        navigateToLazy('/about');
    }
}, 'About')
```

### Integration with State Management

```ts
// Route components can use state
registerLazyRoute('/counter', () => Promise.resolve(() => {
    const count = getState('count') || 0;
    return div(
        h1(`Counter: ${count}`),
        button({
            onClick: () => setState({ count: count + 1 })
        }, '+1')
    );
}));
```

## Examples

### Example 1: Counter with Memoization
```ts
import { div, h1, button, render, setState, getState, useCallback } from './src/index';

// Initial state
setState({ count: 0 });

// Memoized event handlers
const increment = useCallback(() =>
    setState({ count: getState('count') + 1 }),
[]);

const decrement = useCallback(() =>
    setState({ count: getState('count') - 1 }),
[]);

const reset = useCallback(() =>
    setState({ count: 0 }),
[]);

// Application
const counterApp = () => div(
    h1(`Counter: ${getState('count')}`),
    div(
        button({ onClick: decrement }, '-'),
        button({ onClick: increment }, '+'),
        button({ onClick: reset }, 'Reset')
    )
);

render(counterApp, document.getElementById('app')!);
```

### Example 2: Optimized List with Keys
```ts
import { div, ul, li, button, setState, getState, generateId } from './src/index';

setState({ todos: [] });

const addTodo = (text) => {
    const todos = getState('todos');
    setState({
        todos: [...todos, { id: generateId(), text, completed: false }]
    });
};

const removeTodo = (id) => {
    const todos = getState('todos');
    setState({
        todos: todos.filter(t => t.id !== id)
    });
};

const todoApp = () => {
    const todos = getState('todos');

    return div(
        button({ onClick: () => addTodo('New todo') }, 'Add Todo'),
        ul(
            // Use keys to optimize diffing
            ...todos.map(todo =>
                li({ key: todo.id },
                    todo.text,
                    button({
                        onClick: () => removeTodo(todo.id)
                    }, 'Delete')
                )
            )
        )
    );
};
```

### Example 3: Application with Lazy Routing
```ts
import {
    registerLazyRoute,
    navigateToLazy,
    enableHoverPreloading,
    enableIdlePreloading
} from './src/index';

// Lazy routes
registerLazyRoute('/',
    () => Promise.resolve(() => div(h1('Home'), p('Welcome!'))),
    { preload: true }
);

registerLazyRoute('/products',
    () => Promise.resolve(() => {
        const products = getState('products') || [];
        return div(
            h1('Products'),
            ul(...products.map(p => li(p.name)))
        );
    }),
    { preload: false }
);

// Enable preloading strategies
enableHoverPreloading();
enableIdlePreloading();

// Navigation
const app = () => div(
    nav(
        a({
            href: '#/',
            onClick: (e) => { e.preventDefault(); navigateToLazy('/'); }
        }, 'Home'),
        a({
            href: '#/products',
            onClick: (e) => { e.preventDefault(); navigateToLazy('/products'); }
        }, 'Products')
    ),
    div({ id: 'router-outlet' })
);
```

### Example 4: Reactive Component with Batching
```ts
import { ReactiveComponent, setBatchedState } from './src/index';

class TodoListComponent extends ReactiveComponent {
    constructor() {
        super(['todos', 'filter'], () => this.render(), {});
    }

    private toggleAll() {
        const todos = getState('todos');
        const allCompleted = todos.every(t => t.completed);

        // Batching: One re-render for all changes
        setBatchedState({
            todos: todos.map(t => ({ ...t, completed: !allCompleted }))
        });
    }

    private render() {
        const todos = getState('todos');
        const filter = getState('filter');

        const filtered = todos.filter(t => {
            if (filter === 'active') return !t.completed;
            if (filter === 'completed') return t.completed;
            return true;
        });

        return div(
            button({ onClick: () => this.toggleAll() }, 'Toggle All'),
            ul(
                ...filtered.map(todo =>
                    li({ key: todo.id }, todo.text)
                )
            )
        );
    }
}
```

### TodoMVC - Complete Example

The complete TodoMVC implementation in `examples/todomvc/` demonstrates:

**Basic Features**:
- Complex state management with object arrays
- Multiple events (click, input, keyup, dblclick)
- Data filtering and manipulation
- Inline editing with focus management

**Advanced Optimizations**:
- ✅ **Memoization**: `memoizeReactiveComponent` for TodoItems
- ✅ **useCallback**: Memoized event handlers
- ✅ **Batched Updates**: `setBatchedState` for toggle all and clear completed
- ✅ **Reactive Components**: Self-updating components for stats, filters, toggle-all
- ✅ **Lazy Router**: Lazy routes for filters with preloading
- ✅ **Preloading Strategies**: Hover and idle preloading enabled
- ✅ **Diffing Algorithm**: Keys on all list elements
- ✅ **Event Pooling**: Optimized global delegation system

**Maintained Class Structure**:
- `TodoItemComponent`: Reactive component for each todo
- `TodoListManager`: Manages the todo list
- `TodoAppManager`: Main application manager

To run the example:
```bash
npm run todomvc
```

### Resources
- TodoMVC Specification: todomvc.com
- TodoMVC CSS: Automatically included in the example
- Tests: Test all features in the TodoMVC example

## Performance Tips

### ✅ Do
- Use `setBatchedState()` for bulk operations
- Add `key` to list elements
- Memoize reactive components with `memoizeReactiveComponent()`
- Memoize event handlers with `useCallback()`
- Use `ReactiveComponent` for stateful components
- Enable preloading strategies for routing

### ❌ Don't
- Modify state in loops without batching
- Forget `key` on dynamic lists
- Recreate event handlers on every render
- Use `LazyReactiveComponent` for simple components
- Load all routes immediately

## API Reference Summary

### Core
- `div, h1, ..., button, input`: Element creation
- `render(component, container)`: Initial render

### State
- `getState(key?)`: Read state
- `setState(updates)`: Immediate update
- `setBatchedState(updates)`: Batched update
- `globalStore`: Global store instance

### Components
- `ReactiveComponent`: Base class for reactive components
- `memoizeReactiveComponent(Class, compareFn)`: Memoize a component

### Performance
- `memo(fn, compareFn?)`: Memoize a function
- `useCallback(fn, deps)`: Memoize an event handler
- `shallowEqual(a, b)`: Shallow comparison
- `deepEqual(a, b)`: Deep comparison

### Routing
- `registerRoute(path, component)`: Standard route
- `registerLazyRoute(path, loader, options)`: Lazy route
- `navigateTo(path)`: Synchronous navigation
- `navigateToLazy(path)`: Asynchronous navigation
- `preloadRoute(path)`: Manual preload
- `enableHoverPreloading()`: Hover preload
- `enableVisiblePreloading()`: Visibility preload
- `enableIdlePreloading()`: Idle time preload
- `initRouter()`: Initialize the router

### Utils
- `generateId()`: Generate a unique ID
- `createStatePath()`: Type-safe path builder
