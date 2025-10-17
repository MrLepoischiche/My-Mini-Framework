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
12. [Game Development](#game-development)

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
├── game/           # Game development modules
│   ├── math.ts     # Vector2, collision detection
│   ├── time.ts     # Timer, Scheduler, DeltaTime
│   ├── input.ts    # Keyboard and mouse tracking
│   ├── animation.ts # Tweening and easing functions
│   ├── loop.ts     # Fixed/variable timestep game loop
│   ├── entity.ts   # Entity-component system with physics
│   └── network.ts  # Multiplayer networking (WebSocket)
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

## Game Development

The framework includes a comprehensive suite of game development modules for creating 2D games, from simple prototypes to multiplayer networked games.

### Architecture

The game modules are organized into three levels:

**Level 1 - Foundation**:
- `game/math.ts`: Vector2 operations and collision detection
- `game/time.ts`: Timers, scheduling, and delta time management

**Level 2 - Core Systems**:
- `game/input.ts`: Keyboard and mouse input tracking
- `game/animation.ts`: Tweening system with easing functions
- `game/loop.ts`: Fixed/variable timestep game loop

**Level 3 - High-level Features**:
- `game/entity.ts`: Entity-component system with physics
- `game/network.ts`: Multiplayer networking with WebSocket

All modules are:
- **Zero dependencies**: No external game libraries required
- **Tree-shakeable**: Import only what you need
- **TypeScript-first**: Full type safety
- **Modular**: Use independently or together
- **Framework-integrated**: Works seamlessly with reactive state management

### Game Math

Vector2 operations and collision detection for 2D games.

```ts
import { Vector2, aabbCollision, circleCollision } from './src/index';

// Create vectors
const position = new Vector2(10, 20);
const velocity = new Vector2(5, 0);

// Vector operations
position.add(velocity);           // Addition
position.subtract(velocity);      // Subtraction
position.multiply(2);             // Scalar multiplication
position.normalize();             // Normalize to unit vector

// Vector utilities
const length = position.magnitude();
const dot = position.dot(velocity);
const distance = position.distanceTo(new Vector2(100, 100));
const angle = position.angle();

// Interpolation
position.lerp(new Vector2(100, 100), 0.1);  // Smooth movement

// Collision detection
const box1 = { x: 0, y: 0, width: 50, height: 50 };
const box2 = { x: 25, y: 25, width: 50, height: 50 };
if (aabbCollision(box1, box2)) {
    console.log('Collision detected!');
}

const circle1 = { x: 0, y: 0, radius: 25 };
const circle2 = { x: 40, y: 0, radius: 25 };
if (circleCollision(circle1, circle2)) {
    console.log('Circles overlap!');
}

// Utility functions
import { clamp, lerp, randomRange, randomInt } from './src/index';

const health = clamp(playerHealth, 0, 100);
const smoothValue = lerp(current, target, 0.1);
const randomSpeed = randomRange(5, 10);
```

**Available Functions**:
- Vector2 operations: `add`, `subtract`, `multiply`, `divide`, `normalize`
- Vector utilities: `magnitude`, `dot`, `distanceTo`, `angle`, `rotate`, `lerp`, `limit`
- Collision: `aabbCollision`, `circleCollision`, `circleAABBCollision`
- Math utilities: `clamp`, `lerp`, `randomRange`, `randomInt`, `degToRad`, `radToDeg`

### Game Time

Timers, stopwatches, and delta time for frame-independent movement.

```ts
import { Timer, Scheduler, DeltaTime, wait, formatTime } from './src/index';

// Timer (stopwatch with callbacks)
const cooldown = new Timer(3000, () => console.log('Ready!'));
cooldown.start();
cooldown.update();  // Call in game loop

const progress = cooldown.getProgress();  // 0 to 1
const remaining = cooldown.getRemaining();  // ms left

// Scheduler (pauseable delays)
const scheduler = new Scheduler();
const taskId = scheduler.delay(() => spawnEnemy(), 5000);
scheduler.pause();   // Pause all tasks
scheduler.resume();  // Resume all tasks
scheduler.cancel(taskId);  // Cancel specific task

// Repeating tasks
const repeatId = scheduler.repeat(() => updateAI(), 100);

// Delta time (frame-independent movement)
const deltaTime = new DeltaTime();

function gameLoop() {
    const dt = deltaTime.update();  // Time since last frame (ms)

    // Frame-independent movement
    player.x += velocity * deltaTime.getDeltaSeconds();

    // Slow motion effect
    deltaTime.setTimeScale(0.5);  // Half speed

    const fps = deltaTime.getFPS();
}

// Utilities
await wait(1000);  // Async delay
const timeStr = formatTime(125000);  // "02:05"
const timestamp = timestamp();  // performance.now()
```

**Classes**:
- `Timer`: Stopwatch with pause/resume and completion callbacks
- `Scheduler`: Task scheduler with pause/resume support
- `DeltaTime`: Frame-independent timing with time scaling

### Game Input

Keyboard and mouse state tracking optimized for games.

```ts
import { getInputManager } from './src/index';

const input = getInputManager();

function gameLoop() {
    input.update();  // Call once per frame

    // Keyboard - continuous state
    if (input.isKeyDown('ArrowLeft')) {
        player.x -= 5;
    }
    if (input.isKeyDown('ArrowRight')) {
        player.x += 5;
    }
    if (input.isKeyDown(' ')) {  // Spacebar
        player.jump();
    }

    // Keyboard - single press detection
    if (input.wasKeyPressed('e')) {
        interact();  // Only triggers once per press
    }
    if (input.wasKeyReleased('Shift')) {
        stopSprinting();
    }

    // Mouse position
    const mousePos = input.getMousePosition();
    aimAt(mousePos.x, mousePos.y);

    // Mouse buttons
    if (input.isMouseButtonDown(0)) {  // Left button
        shoot();
    }
    if (input.wasMouseButtonPressed(2)) {  // Right button
        placeObject();
    }

    // Mouse wheel
    const wheel = input.getMouseWheel();
    if (wheel !== 0) {
        zoom += wheel * 0.1;
    }
}

// Cleanup
input.destroy();
```

**API**:
- Keyboard: `isKeyDown(key)`, `wasKeyPressed(key)`, `wasKeyReleased(key)`
- Mouse position: `getMousePosition()` returns `{x, y}`
- Mouse buttons: `isMouseButtonDown(button)`, `wasMouseButtonPressed(button)`, `wasMouseButtonReleased(button)`
- Mouse wheel: `getMouseWheel()` returns delta value

### Game Animation

Tweening system with 22 easing functions for smooth animations.

```ts
import {
    Tween, TweenSequence, getTweenManager, Easing, animate
} from './src/index';

// Simple tween
const obj = { x: 0 };
const tween = new Tween(obj, 'x', 0, 100, 1000, Easing.easeOutQuad);
tween.onComplete(() => console.log('Done!'))
     .start();

// Update tweens in game loop
function gameLoop() {
    getTweenManager().update();
}

// Tween sequence (chain animations)
const sequence = new TweenSequence()
    .add(new Tween(player, 'x', 0, 100, 500, Easing.easeInQuad))
    .add(new Tween(player, 'y', 0, 50, 300, Easing.easeOutBounce))
    .add(new Tween(player, 'alpha', 1, 0, 200, Easing.linear))
    .start();

sequence.pause();
sequence.resume();

// Promise-based animation
await animate(0, 100, 1000, Easing.easeInOutQuad)
    .then(value => console.log('Final value:', value));

// Practical examples
// Smooth camera follow
new Tween(camera, 'x', camera.x, player.x, 500, Easing.easeOutQuad).start();

// Health bar animation
new Tween(healthBar, 'width', currentWidth, targetWidth, 300, Easing.easeOutCubic).start();

// UI fade in
new Tween(menu, 'opacity', 0, 1, 400, Easing.easeInOutQuad).start();
```

**Available Easing Functions**:
- Linear: `linear`
- Quadratic: `easeInQuad`, `easeOutQuad`, `easeInOutQuad`
- Cubic: `easeInCubic`, `easeOutCubic`, `easeInOutCubic`
- Quartic: `easeInQuart`, `easeOutQuart`, `easeInOutQuart`
- Exponential: `easeInExpo`, `easeOutExpo`, `easeInOutExpo`
- Sine: `easeInSine`, `easeOutSine`, `easeInOutSine`
- Circular: `easeInCirc`, `easeOutCirc`, `easeInOutCirc`
- Elastic: `easeInElastic`, `easeOutElastic`, `easeInOutElastic`

### Game Loop

Fixed timestep for physics and variable timestep for rendering.

```ts
import { getGameLoop } from './src/index';

const gameLoop = getGameLoop();

// Configure the loop
gameLoop.start({
    onInit: () => {
        // Initialize game resources
        loadAssets();
        setupPlayers();
    },

    onUpdate: (deltaMs) => {
        // Variable timestep update (rendering, input, animation)
        getInputManager().update();
        getTweenManager().update();
        updateCamera(deltaMs);
    },

    onFixedUpdate: (fixedDelta) => {
        // Fixed timestep update (physics simulation)
        // fixedDelta is always 16.67ms (60Hz) by default
        updatePhysics(fixedDelta);
        getEntityManager().fixedUpdate(fixedDelta);
    },

    onRender: () => {
        // Rendering
        clearCanvas();
        getEntityManager().render(ctx);
        renderUI();
    },

    onDestroy: () => {
        // Cleanup resources
        unloadAssets();
    }
});

// Control the loop
gameLoop.pause();
gameLoop.resume();
gameLoop.stop();

// FPS and statistics
const fps = gameLoop.getFPS();
const frameCount = gameLoop.getFrameCount();

// Configure fixed timestep (default: 60 FPS)
gameLoop.setFixedDelta(16.67);  // 60 FPS
gameLoop.setFixedDelta(8.33);   // 120 FPS
```

**Key Concepts**:
- **Fixed Timestep**: Physics updates at constant rate (deterministic)
- **Variable Timestep**: Rendering adapts to frame rate
- **Lifecycle Hooks**: Clean separation of concerns
- **Pause/Resume**: Full control over game execution

### Game Entity

Entity-component system with built-in physics and collision.

```ts
import { Entity, EntityManager, getEntityManager } from './src/index';

// Create custom entity class
class Player extends Entity {
    constructor(x: number, y: number) {
        super({
            position: new Vector2(x, y),
            velocity: new Vector2(0, 0),
            mass: 1,
            drag: 0.98,
            collisionShape: { type: 'circle', radius: 20 },
            tags: ['player']
        });
    }

    onInit() {
        console.log('Player spawned');
    }

    onUpdate(deltaMs: number) {
        // Custom update logic
        if (getInputManager().isKeyDown('ArrowRight')) {
            this.velocity.x = 5;
        }
    }

    onCollision(other: Entity) {
        if (other.hasTag('enemy')) {
            this.takeDamage(10);
        }
    }

    onDestroy() {
        console.log('Player destroyed');
    }
}

// Entity management
const manager = getEntityManager();
const player = new Player(100, 100);
manager.add(player);

// Physics
player.applyForce(new Vector2(100, 0));  // Apply force
player.applyVelocity(16.67);  // Update position based on physics

// Component system
class HealthComponent implements EntityComponent {
    constructor(public entity: Entity, private maxHealth: number) {}

    update(deltaMs: number) {
        // Update component logic
    }

    render(ctx?: CanvasRenderingContext2D) {
        // Render health bar
    }

    destroy() {
        // Cleanup
    }
}

player.addComponent('health', new HealthComponent(player, 100));
const health = player.getComponent<HealthComponent>('health');

// Querying
const players = manager.getByTag('player');
const enemy = manager.getById('enemy_1');
const allEntities = manager.getAll();

// Batch operations in game loop
manager.update(deltaMs);        // Update all active entities
manager.fixedUpdate(16.67);     // Physics update
manager.render(ctx);            // Render all visible entities
manager.checkCollisions();      // Detect and resolve collisions

// Collision detection
if (player.checkCollision(enemy)) {
    console.log('Collision!');
}

// Transform and state
player.active = false;    // Disable updates
player.visible = false;   // Hide entity
player.rotation += 0.1;   // Rotate
player.scale.set(2, 2);   // Scale up
```

**Features**:
- Transform: position, velocity, acceleration, rotation, scale
- Physics: force application, Euler integration, drag
- Collision: AABB and Circle shapes with automatic detection
- Components: Pluggable component architecture
- Lifecycle: onInit, onUpdate, onFixedUpdate, onRender, onDestroy, onCollision
- Query: By tag, by ID, get all
- Batch operations: Update, render, and collision for all entities

### Game Network

WebSocket-based multiplayer networking with state synchronization.

```ts
import {
    getNetworkManager,
    calculateStateDelta,
    applyStateDelta,
    interpolateStates,
    type EntityState
} from './src/index';

const network = getNetworkManager();

// Connect to server
network.connect({
    url: 'ws://localhost:8080',
    autoReconnect: true,
    reconnectDelay: 1000,
    pingInterval: 5000,

    onOpen: () => {
        console.log('Connected to server');
        network.send('JOIN', { playerName: 'Player1' });
    },

    onClose: () => {
        console.log('Disconnected');
    },

    onError: (event) => {
        console.error('Connection error:', event);
    }
});

// Send messages
network.send('INPUT', { keys: pressedKeys, mouse: mousePos });
network.send('CHAT', { message: 'Hello!' }, 0, true);  // With ACK

// Message handlers
network.on('STATE_UPDATE', (message) => {
    const serverState = message.data;
    updateGameState(serverState);
});

network.on('PLAYER_JOINED', (message) => {
    const player = message.data;
    spawnPlayer(player);
});

// State synchronization
let previousState: EntityState = {
    id: 'player1',
    position: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    rotation: 0
};

function sendPlayerState(player: Entity) {
    const currentState: EntityState = {
        id: player.id,
        position: { x: player.position.x, y: player.position.y },
        velocity: { x: player.velocity.x, y: player.velocity.y },
        rotation: player.rotation
    };

    // Delta compression (only send changes)
    const delta = calculateStateDelta(previousState, currentState);
    if (delta) {
        network.send('STATE_UPDATE', delta);
        previousState = currentState;
    }
}

// Apply received state
function receivePlayerState(delta: StateDelta) {
    const newState = applyStateDelta(playerState, delta);
    playerState = newState;
}

// Client-side prediction with interpolation
function smoothPlayerMovement(fromState: EntityState, toState: EntityState, t: number) {
    const interpolated = interpolateStates(fromState, toState, t);
    player.position.set(interpolated.position.x, interpolated.position.y);
    player.rotation = interpolated.rotation || 0;
}

// Connection status
if (network.isConnected()) {
    const latency = network.getLatency();
    console.log(`Ping: ${latency?.current}ms`);
}

// Cleanup
network.disconnect();
```

**Features**:
- WebSocket wrapper with auto-reconnect
- Message queue with priority
- Acknowledgment system for reliable messages
- Latency tracking (ping/pong, RTT measurement)
- State synchronization utilities:
  - `calculateStateDelta`: Delta compression
  - `applyStateDelta`: Apply deltas to state
  - `interpolateStates`: Smooth client-side prediction
- Event-based message routing

### Complete Game Example

Here's a simple game using all modules together:

```ts
import {
    getGameLoop, getInputManager, getEntityManager, getTweenManager,
    Vector2, Entity, Tween, Easing
} from './src/index';

// Player entity
class Player extends Entity {
    constructor() {
        super({
            position: new Vector2(400, 300),
            velocity: new Vector2(0, 0),
            collisionShape: { type: 'circle', radius: 20 },
            tags: ['player']
        });
    }

    onUpdate(deltaMs: number) {
        const input = getInputManager();
        const speed = 5;

        // Movement
        this.velocity.set(0, 0);
        if (input.isKeyDown('ArrowLeft')) this.velocity.x = -speed;
        if (input.isKeyDown('ArrowRight')) this.velocity.x = speed;
        if (input.isKeyDown('ArrowUp')) this.velocity.y = -speed;
        if (input.isKeyDown('ArrowDown')) this.velocity.y = speed;

        // Shoot
        if (input.wasKeyPressed(' ')) {
            this.shoot();
        }
    }

    shoot() {
        const bullet = new Bullet(this.position.x, this.position.y);
        getEntityManager().add(bullet);
    }

    onCollision(other: Entity) {
        if (other.hasTag('enemy')) {
            // Damage animation
            new Tween(this, 'scale', 1, 1.2, 100, Easing.easeOutQuad)
                .onComplete(() => {
                    new Tween(this, 'scale', 1.2, 1, 100, Easing.easeInQuad).start();
                })
                .start();
        }
    }
}

// Game initialization
const player = new Player();
getEntityManager().add(player);

// Start game loop
getGameLoop().start({
    onInit: () => {
        console.log('Game started!');
    },

    onUpdate: (deltaMs) => {
        getInputManager().update();
        getTweenManager().update();
        getEntityManager().update(deltaMs);
    },

    onFixedUpdate: (fixedDelta) => {
        getEntityManager().fixedUpdate(fixedDelta);
        getEntityManager().checkCollisions();
    },

    onRender: () => {
        const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
        const ctx = canvas.getContext('2d')!;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        getEntityManager().render(ctx);
    }
});
```

### Game Module Best Practices

**✅ Do**:
- Use fixed timestep for physics (`onFixedUpdate`)
- Use variable timestep for rendering and input (`onUpdate`)
- Call `update()` once per frame on singleton managers
- Use delta compression for network state updates
- Tag entities for efficient querying
- Use component architecture for reusable behaviors
- Leverage delta time for frame-independent movement

**❌ Don't**:
- Mix physics logic with rendering logic
- Forget to call `update()` on managers in the game loop
- Create entities without collision shapes if they need collision
- Send full state every frame (use delta compression)
- Query entities every frame (cache results when possible)
- Use tweening for physics-based movement

**Integration with Framework State**:
```ts
// Game state in framework store
setState({
    score: 0,
    health: 100,
    gameOver: false
});

// Update from game loop
function onPlayerDeath() {
    setState({ gameOver: true });
    getGameLoop().pause();
}

// React to state changes in UI
const gameUI = () => div(
    h1(`Score: ${getState('score')}`),
    div(`Health: ${getState('health')}`),
    getState('gameOver') ? div('Game Over!') : null
);
```

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

### Game Modules
- **Math**: `Vector2`, `aabbCollision`, `circleCollision`, `circleAABBCollision`, `clamp`, `lerp`, `randomRange`, `randomInt`
- **Time**: `Timer`, `Scheduler`, `DeltaTime`, `wait`, `formatTime`, `timestamp`
- **Input**: `getInputManager()`, `InputManager` (keyboard/mouse tracking)
- **Animation**: `Tween`, `TweenSequence`, `getTweenManager()`, `Easing`, `animate()`
- **Loop**: `getGameLoop()`, `GameLoop` (fixed/variable timestep)
- **Entity**: `Entity`, `EntityComponent`, `getEntityManager()`, `EntityManager`
- **Network**: `NetworkClient`, `getNetworkManager()`, `calculateStateDelta`, `applyStateDelta`, `interpolateStates`
