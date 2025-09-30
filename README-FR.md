# Mini Framework

Un framework JavaScript léger avec Virtual DOM, state management réactif, système d'événements custom, routing et fonctionnalités avancées de performance.

## Table des matières

1. [Installation](#installation)
2. [Architecture](#architecture)
3. [Démarrage rapide](#démarrage-rapide)
4. [API de base](#api-de-base)
5. [State Management](#state-management)
6. [Reactive Components](#reactive-components)
7. [Event Handling](#event-handling)
8. [Performance Optimization](#performance-optimization)
9. [Lazy Loading](#lazy-loading)
10. [Routing](#routing)
11. [Exemples](#exemples)

## Installation
```bash
# Cloner le projet
git clone https://github.com/MrLepoischiche/My-Mini-Framework.git
cd mini-framework

# Installer les dépendances
npm i

# Lancer l'exemple TodoMVC
npm run todomvc
```

## Architecture

### Vue d'ensemble

Le framework est organisé en modules indépendants qui travaillent ensemble pour fournir une expérience de développement cohérente.

```
src/
├── core/           # Cœur du framework
│   ├── types.ts    # Définitions TypeScript
│   ├── element.ts  # Création d'éléments (div, h1, etc.)
│   ├── component.ts # Composants réactifs
│   ├── memo.ts     # Mémoïsation et optimisation
│   └── lazy.ts     # Lazy loading et code splitting
├── dom/            # Gestion du DOM
│   └── render.ts   # Virtual DOM et algorithme de diffing
├── state/          # State management
│   └── store.ts    # Store réactif global avec batching
├── events/         # Système d'événements
│   └── handler.ts  # Délégation globale avec event pooling
├── router/         # Routing
│   ├── hash.ts     # Router basé sur hash URLs
│   └── lazy.ts     # Lazy router avec preloading
├── utils/          # Utilitaires
│   ├── id.ts       # Génération d'IDs uniques
│   ├── equality.ts # Fonctions de comparaison
│   └── pathBuilder.ts # Construction de chemins d'état
└── index.ts        # Point d'entrée
```

### Concepts clés

#### Virtual DOM avec Diffing
Le framework utilise une représentation virtuelle du DOM avec un algorithme de diffing optimisé :
```ts
// Structure d'un élément virtuel
interface VirtualElement {
    tag: string;           // 'div', 'h1', etc.
    props: ElementProps;   // Attributs et événements
    children: ElementChild[]; // Enfants (texte ou autres éléments)
    key?: string;          // Clé unique pour le diffing
}
```

**Algorithme de diffing** : Seuls les éléments modifiés sont re-rendus, pas l'application entière.
**Système de keys** : Les éléments avec la même clé sont réutilisés au lieu d'être recréés.

#### Flux de données unidirectionnel
```
État → Virtual DOM → Diffing → DOM réel
  ↑                               ↓
setState()/setBatchedState()  Événements utilisateur
```

#### Contrôle d'inversion
Contrairement à une librairie où vous appelez les fonctions, le framework prend le contrôle :
- Librairie : `library.doSomething()`
- Framework : Le framework appelle vos fonctions de composant automatiquement

### Cycle de vie d'une application
1. Initialisation : render(app, container)
2. Création Virtual DOM : Vos fonctions de composant sont appelées
3. Diffing : Comparaison avec le Virtual DOM précédent
4. Rendu DOM : Seuls les éléments modifiés sont mis à jour
5. Événements : Le système de délégation capture les interactions
6. Changement d'état : setState()/setBatchedState() déclenche un nouveau cycle
7. Re-rendu optimisé : Algorithme de diffing + mémoïsation

### Principes de conception
- Simplicité : API minimale et intuitive
- Performance : Diffing, mémoïsation, batching, event pooling
- Réactivité : Mise à jour automatique du DOM
- Modularité : Chaque fonctionnalité est isolée
- Type Safety : Support complet de TypeScript
- Optimisation : Lazy loading et code splitting

## Démarrage rapide
```ts
import { div, h1, button, render, setState, getState } from './src/index';

// Initialiser l'état
setState({ count: 0 });

// Créer une application réactive
const app = () => div(
    h1(`Compteur: ${getState('count')}`),
    button({
        onClick: () => setState({ count: getState('count') + 1 })
    }, 'Incrémenter')
);

// Rendre l'application
render(app, document.getElementById('app')!);
```

## API de base

### Création d'éléments
Le framework fournit des fonctions pour créer des éléments HTML de manière déclarative :
```ts
// Éléments simples
div('Contenu texte')
h1('Titre principal')
p('Paragraphe')

// Avec attributs
div({ class: 'container', id: 'main' }, 'Contenu')
input({ type: 'text', placeholder: 'Tapez ici...' })

// Avec événements
button({ onClick: () => alert('Cliqué!') }, 'Cliquer')

// Éléments imbriqués
div({ class: 'card' },
    h2('Titre de la carte'),
    p('Description'),
    button({ onClick: handleClick }, 'Action')
)

// Avec keys pour optimisation
div({ key: 'unique-id' }, 'Contenu')
```

### Élements supportés
```ts
div, h1, h2, h3, h4, h5, h6, p, button, input, ul, li, span, label, form, header, footer, section, nav, a, img, strong, table, thead, tbody, tr, th, td, select, option, textarea, br, hr
```

### Props avancés

#### Styles en objet
```ts
div({
    style: {
        backgroundColor: 'blue',
        fontSize: '16px',
        textAlign: 'center'
    }
}, 'Texte stylé')
```

#### Classes en tableau
```ts
div({
    class: ['btn', 'btn-primary', isActive && 'active'].filter(Boolean)
}, 'Bouton')
```

#### Attributs booléens
```ts
input({ type: 'checkbox', checked: true, disabled: false })
```

#### Keys pour optimisation
```ts
// Les éléments avec la même key sont réutilisés
ul(
    todos.map(todo =>
        li({ key: todo.id }, todo.text)
    )
)
```

## State Management

La gestion de l'état est réalisée par un Store global réactif avec support du batching.

### API de base
```ts
import { getState, setState, setBatchedState } from './src/index';

// Initialiser l'état
setState({ count: 0, user: { name: 'John' } });

// Lire l'état
const count = getState('count');
const fullState = getState();

// Modifier l'état (mise à jour immédiate)
setState({ count: count + 1 });

// Modifier l'état (mise à jour batchée)
// Optimisé pour les opérations en masse
setBatchedState({
    todos: newTodos,
    filter: 'all'
});
```

### Update Batching

Le framework supporte deux modes de mise à jour :

**setState()** : Mise à jour immédiate
- Notifie les listeners immédiatement
- Idéal pour les mises à jour individuelles rapides

**setBatchedState()** : Mise à jour batchée
- Utilise `requestAnimationFrame` pour grouper les mises à jour
- Combine plusieurs changements en un seul rendu
- **Recommandé pour** :
  - Modifier plusieurs propriétés d'état à la fois
  - Opérations en masse (toggle all, clear completed)
  - Performances accrues avec de grandes listes

```ts
// Exemple : Basculer tous les todos
const toggleAll = () => {
    const newTodos = todos.map(todo => ({
        ...todo,
        completed: !todo.completed
    }));

    // Batching = Un seul re-rendu au lieu d'un par todo
    setBatchedState({ todos: newTodos });
};
```

### Chemins d'état imbriqués

Le Store supporte les chemins imbriqués :
```ts
setState({ user: { profile: { name: 'John', age: 30 } } });

// Accès par chemin
const name = globalStore.getValueByPath('user.profile.name');

// Souscription à un chemin spécifique
const unsubscribe = globalStore.subscribeTo('user.profile.name', (newValue) => {
    console.log('Name changed:', newValue);
});
```

### PathBuilder (Type-safe paths)
```ts
import { createStatePath } from './src/index';

// Créer des chemins type-safe
const userPath = createStatePath().user.profile.name;
const todosPath = createStatePath().todos;

// Souscrire avec type safety
globalStore.subscribeToPath(userPath, (name) => {
    console.log('Name:', name);
});
```

## Reactive Components

Les composants réactifs se re-rendent automatiquement quand l'état change.

### ReactiveComponent Class
```ts
import { ReactiveComponent, VirtualElement, div, span } from './src/index';

class CounterComponent extends ReactiveComponent {
    constructor() {
        super(
            ['count'],  // Chemins d'état à surveiller
            () => this.render(),
            {}  // Props initiaux
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

// Utilisation
const counter = new CounterComponent();
counter.mount(document.getElementById('counter-container')!);
```

### Lifecycle Methods
```ts
class MyComponent extends ReactiveComponent {
    mount(container: HTMLElement): void {
        // Appelé quand le composant est monté
        super.mount(container);
        console.log('Component mounted');
    }

    unmount(): void {
        // Appelé pour nettoyer les ressources
        console.log('Component unmounting');
        super.unmount();
    }

    update(newProps: any): void {
        // Appelé pour mettre à jour les props
        super.update(newProps);
    }
}
```

## Event Handling

Le framework implémente un système d'événements optimisé avec délégation globale et event pooling.

### Principe de fonctionnement

**Délégation globale** : Un seul listener sur `document` capture tous les événements
**Event Pooling** : Réutilisation des objets événements pour réduire l'allocation mémoire

### Syntaxe des événements
```ts
// Événements supportés (préfixés par 'on')
button({ onClick: handleClick }, 'Cliquer')
input({ onInput: handleInput, onFocus: handleFocus })
div({ onMouseOver: handleHover })
```

### Avantages du système
- **Performance** : Un seul listener global au lieu d'un par élément
- **Mémoire** : Event pooling réduit les allocations
- **Flexibilité** : Gestion automatique des éléments dynamiques

```ts
// Exemple avec plusieurs types d'événements
const form = div({ class: 'form' },
    input({
        type: 'text',
        placeholder: 'Votre nom',
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
    }, 'Valider')
);
```

## Performance Optimization

Le framework offre plusieurs techniques d'optimisation.

### Mémoïsation

#### memo() - Mémoïser les fonctions
```ts
import { memo } from './src/index';

// Mémoïser une fonction pure
const expensiveCalculation = memo((a, b) => {
    console.log('Computing...');
    return a * b * 1000;
});

expensiveCalculation(5, 10); // Computing... 50000
expensiveCalculation(5, 10); // 50000 (depuis le cache)
```

#### useCallback() - Mémoïser les event handlers
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

#### memoizeReactiveComponent() - Mémoïser les composants
```ts
import { memoizeReactiveComponent } from './src/index';

class TodoItem extends ReactiveComponent {
    constructor(todoId: string) {
        super(['todos'], () => this.render(todoId), {});
    }
    // ...
}

// Créer une version mémoïsée
const MemoizedTodoItem = memoizeReactiveComponent(
    TodoItem,
    (prevArgs, nextArgs) => prevArgs[0] === nextArgs[0]
);

// Les composants avec le même todoId seront réutilisés
const item1 = new MemoizedTodoItem('todo-1');
const item2 = new MemoizedTodoItem('todo-1'); // Réutilise item1
```

### Algorithme de Diffing

L'algorithme de diffing minimise les manipulations du DOM :

```ts
// Avant : Re-rendu complet
// <ul>
//   <li>Item 1</li>
//   <li>Item 2</li>
// </ul>

// Après : Seul l'élément modifié est mis à jour
// <ul>
//   <li>Item 1</li>
//   <li>Item 2 - MODIFIED</li> <- Seulement cet élément est re-rendu
// </ul>
```

**Utiliser les keys** pour optimiser le diffing :
```ts
// Sans keys : Tous les éléments sont recréés
ul(
    items.map(item => li(item.text))
)

// Avec keys : Les éléments inchangés sont réutilisés
ul(
    items.map(item => li({ key: item.id }, item.text))
)
```

### Fonctions d'égalité

```ts
import { shallowEqual, deepEqual } from './src/index';

// Comparaison superficielle (références)
shallowEqual([1, 2], [1, 2]); // false (tableaux différents)
shallowEqual(obj1, obj1); // true (même référence)

// Comparaison profonde (valeurs)
deepEqual([1, 2], [1, 2]); // true
deepEqual({ a: 1 }, { a: 1 }); // true
```

## Lazy Loading

Le framework supporte le lazy loading et le code splitting.

### LazyComponent

⚠️ **Note importante sur LazyReactiveComponent** :
La classe `LazyReactiveComponent` présente actuellement des limitations :
- Souscrit automatiquement à `'router.loadingState'` (peut ne pas exister)
- Vérifie `'user.preferences'` (peut ne pas exister)
- Les changements d'état internes ne déclenchent pas les re-rendus
- Trop complexe pour des composants qui se chargent instantanément

**Recommandation** : Utilisez `ReactiveComponent` directement pour les composants simples. `LazyReactiveComponent` est prévu pour de vrais imports asynchrones (code splitting réel).

### Utilisation correcte (ReactiveComponent)

```ts
import { ReactiveComponent } from './src/index';

// Composant réactif simple et fonctionnel
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

### LazyComponent (pour vrai code splitting)

```ts
import { LazyComponent } from './src/index';

// Lazy loading avec import dynamique réel
const lazyModule = new LazyComponent(
    () => import('./heavy-component').then(m => m.default),
    {
        fallback: { tag: 'div', props: {}, children: ['Loading...'] },
        onError: { tag: 'div', props: {}, children: ['Error loading'] }
    }
);

// Load et render
await lazyModule.load();
const element = lazyModule.render(props);
```

## Routing

Le framework inclut un système de routing avancé avec lazy loading.

### Hash Router de base

```ts
import { registerRoute, initRouter, navigateTo } from './src/index';

// Enregistrer des routes
registerRoute('', () => div('Page d'accueil'));
registerRoute('about', () => div('À propos'));
registerRoute('contact', () => div('Contact'));

// Initialiser le router
initRouter(); // Cherche automatiquement #router-outlet
```

### Lazy Router

Le lazy router supporte le chargement différé des routes :

```ts
import { registerLazyRoute, navigateToLazy, preloadRoute } from './src/index';

// Enregistrer des routes lazy
registerLazyRoute('/',
    () => Promise.resolve(() => div('Home')),
    { preload: true }
);

registerLazyRoute('/dashboard',
    () => import('./views/dashboard').then(m => m.default),
    { preload: false }
);

// Navigation lazy
await navigateToLazy('/dashboard');

// Preload manuel
await preloadRoute('/dashboard');
```

### Stratégies de Preloading

Le framework offre trois stratégies de preloading :

#### 1. Hover Preloading
```ts
import { enableHoverPreloading } from './src/index';

// Preload quand l'utilisateur survole un lien
enableHoverPreloading();
// Les routes se chargent dès que l'utilisateur survole les liens
```

#### 2. Visible Preloading
```ts
import { enableVisiblePreloading } from './src/index';

// Preload quand les liens deviennent visibles
enableVisiblePreloading();
// Utilise IntersectionObserver pour détecter la visibilité
```

#### 3. Idle Preloading
```ts
import { enableIdlePreloading } from './src/index';

// Preload pendant les temps d'inactivité du navigateur
enableIdlePreloading();
// Utilise requestIdleCallback pour charger les routes en arrière-plan
```

### Combinaison des stratégies

```ts
// Configuration optimale
registerLazyRoute('/', homeLoader, { preload: true });  // Route principale
registerLazyRoute('/about', aboutLoader, { preload: false });
registerLazyRoute('/contact', contactLoader, { preload: false });

// Preload la route initiale
preloadRoute(window.location.hash.slice(1) || '/');

// Activer hover + idle preloading
enableHoverPreloading();  // Précharge au survol
enableIdlePreloading();   // Précharge le reste en idle time
```

### Navigation

```ts
// Navigation programmatique
navigateTo('about'); // Synchrone
await navigateToLazy('/dashboard'); // Asynchrone avec lazy loading

// Navigation via liens
a({
    href: '#/about',
    onClick: (e) => {
        e.preventDefault();
        navigateToLazy('/about');
    }
}, 'À propos')
```

### Intégration avec le State Management

```ts
// Les composants de route peuvent utiliser le state
registerLazyRoute('/counter', () => Promise.resolve(() => {
    const count = getState('count') || 0;
    return div(
        h1(`Compteur: ${count}`),
        button({
            onClick: () => setState({ count: count + 1 })
        }, '+1')
    );
}));
```

## Exemples

### Exemple 1 : Compteur avec mémoïsation
```ts
import { div, h1, button, render, setState, getState, useCallback } from './src/index';

// État initial
setState({ count: 0 });

// Event handlers mémoïsés
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
    h1(`Compteur: ${getState('count')}`),
    div(
        button({ onClick: decrement }, '-'),
        button({ onClick: increment }, '+'),
        button({ onClick: reset }, 'Reset')
    )
);

render(counterApp, document.getElementById('app')!);
```

### Exemple 2 : Liste optimisée avec keys
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
            // Utiliser des keys pour optimiser le diffing
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

### Exemple 3 : Application avec lazy routing
```ts
import {
    registerLazyRoute,
    navigateToLazy,
    enableHoverPreloading,
    enableIdlePreloading
} from './src/index';

// Routes lazy
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

// Activer les stratégies de preloading
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

### Exemple 4 : Composant réactif avec batching
```ts
import { ReactiveComponent, setBatchedState } from './src/index';

class TodoListComponent extends ReactiveComponent {
    constructor() {
        super(['todos', 'filter'], () => this.render(), {});
    }

    private toggleAll() {
        const todos = getState('todos');
        const allCompleted = todos.every(t => t.completed);

        // Batching : Un seul re-rendu pour tous les changements
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

### TodoMVC - Exemple complet

L'implémentation complète de TodoMVC dans `examples/todomvc/` démontre :

**Fonctionnalités de base** :
- Gestion d'état complexe avec tableaux d'objets
- Événements multiples (click, input, keyup, dblclick)
- Filtrage et manipulation de données
- Édition inline avec gestion du focus

**Optimisations avancées** :
- ✅ **Mémoïsation** : `memoizeReactiveComponent` pour les TodoItems
- ✅ **useCallback** : Event handlers mémoïsés
- ✅ **Batched Updates** : `setBatchedState` pour toggle all et clear completed
- ✅ **Reactive Components** : Composants auto-actualisants pour stats, filtres, toggle-all
- ✅ **Lazy Router** : Routes lazy pour les filtres avec preloading
- ✅ **Preloading Strategies** : Hover et idle preloading activés
- ✅ **Diffing Algorithm** : Keys sur tous les éléments de liste
- ✅ **Event Pooling** : Système de délégation globale optimisé

**Structure de classes maintenue** :
- `TodoItemComponent` : Composant réactif pour chaque todo
- `TodoListManager` : Gère la liste des todos
- `TodoAppManager` : Gestionnaire principal de l'application

Pour lancer l'exemple :
```bash
npm run dev:todomvc
```

### Ressources
- Spécification TodoMVC : todomvc.com
- CSS TodoMVC : Inclus automatiquement dans l'exemple
- Tests : Testez toutes les fonctionnalités dans l'exemple TodoMVC

## Performance Tips

### ✅ À faire
- Utiliser `setBatchedState()` pour les opérations en masse
- Ajouter des `key` sur les éléments de liste
- Mémoïser les composants réactifs avec `memoizeReactiveComponent()`
- Mémoïser les event handlers avec `useCallback()`
- Utiliser `ReactiveComponent` pour les composants avec état
- Activer les stratégies de preloading pour le routing

### ❌ À éviter
- Modifier l'état dans des boucles sans batching
- Oublier les `key` sur les listes dynamiques
- Recréer les event handlers à chaque rendu
- Utiliser `LazyReactiveComponent` pour des composants simples
- Charger toutes les routes immédiatement

## API Reference Summary

### Core
- `div, h1, ..., button, input` : Création d'éléments
- `render(component, container)` : Rendu initial

### State
- `getState(key?)` : Lire l'état
- `setState(updates)` : Mise à jour immédiate
- `setBatchedState(updates)` : Mise à jour batchée
- `globalStore` : Instance du store global

### Components
- `ReactiveComponent` : Classe de base pour composants réactifs
- `memoizeReactiveComponent(Class, compareFn)` : Mémoïser un composant

### Performance
- `memo(fn, compareFn?)` : Mémoïser une fonction
- `useCallback(fn, deps)` : Mémoïser un event handler
- `shallowEqual(a, b)` : Comparaison superficielle
- `deepEqual(a, b)` : Comparaison profonde

### Routing
- `registerRoute(path, component)` : Route standard
- `registerLazyRoute(path, loader, options)` : Route lazy
- `navigateTo(path)` : Navigation synchrone
- `navigateToLazy(path)` : Navigation asynchrone
- `preloadRoute(path)` : Preload manuel
- `enableHoverPreloading()` : Preload au survol
- `enableVisiblePreloading()` : Preload à la visibilité
- `enableIdlePreloading()` : Preload en idle time
- `initRouter()` : Initialiser le router

### Utils
- `generateId()` : Générer un ID unique
- `createStatePath()` : Builder de chemins type-safe
