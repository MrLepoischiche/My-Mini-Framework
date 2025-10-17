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
12. [Développement de jeux](#développement-de-jeux)

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
├── game/           # Modules de développement de jeux
│   ├── math.ts     # Vector2, détection de collision
│   ├── time.ts     # Timer, Scheduler, DeltaTime
│   ├── input.ts    # Suivi clavier et souris
│   ├── animation.ts # Tweening et fonctions d'easing
│   ├── loop.ts     # Boucle de jeu à pas fixe/variable
│   ├── entity.ts   # Système entité-composant avec physique
│   └── network.ts  # Réseau multijoueur (WebSocket)
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

## Développement de jeux

Le framework inclut une suite complète de modules de développement de jeux pour créer des jeux 2D, des prototypes simples aux jeux multijoueurs en réseau.

### Architecture

Les modules de jeu sont organisés en trois niveaux :

**Niveau 1 - Fondation** :
- `game/math.ts` : Opérations Vector2 et détection de collision
- `game/time.ts` : Timers, scheduling et gestion du delta time

**Niveau 2 - Systèmes principaux** :
- `game/input.ts` : Suivi des entrées clavier et souris
- `game/animation.ts` : Système de tweening avec fonctions d'easing
- `game/loop.ts` : Boucle de jeu à pas fixe/variable

**Niveau 3 - Fonctionnalités avancées** :
- `game/entity.ts` : Système entité-composant avec physique
- `game/network.ts` : Réseau multijoueur avec WebSocket

Tous les modules sont :
- **Sans dépendances** : Aucune bibliothèque de jeu externe requise
- **Tree-shakeable** : Importez uniquement ce dont vous avez besoin
- **TypeScript-first** : Type safety complète
- **Modulaires** : Utilisables indépendamment ou ensemble
- **Intégrés au framework** : Fonctionne parfaitement avec le state management réactif

### Math de jeu

Opérations Vector2 et détection de collision pour jeux 2D.

```ts
import { Vector2, aabbCollision, circleCollision } from './src/index';

// Créer des vecteurs
const position = new Vector2(10, 20);
const velocity = new Vector2(5, 0);

// Opérations vectorielles
position.add(velocity);           // Addition
position.subtract(velocity);      // Soustraction
position.multiply(2);             // Multiplication scalaire
position.normalize();             // Normaliser en vecteur unitaire

// Utilitaires vectoriels
const length = position.magnitude();
const dot = position.dot(velocity);
const distance = position.distanceTo(new Vector2(100, 100));
const angle = position.angle();

// Interpolation
position.lerp(new Vector2(100, 100), 0.1);  // Mouvement fluide

// Détection de collision
const box1 = { x: 0, y: 0, width: 50, height: 50 };
const box2 = { x: 25, y: 25, width: 50, height: 50 };
if (aabbCollision(box1, box2)) {
    console.log('Collision détectée !');
}

const circle1 = { x: 0, y: 0, radius: 25 };
const circle2 = { x: 40, y: 0, radius: 25 };
if (circleCollision(circle1, circle2)) {
    console.log('Les cercles se chevauchent !');
}

// Fonctions utilitaires
import { clamp, lerp, randomRange, randomInt } from './src/index';

const health = clamp(playerHealth, 0, 100);
const smoothValue = lerp(current, target, 0.1);
const randomSpeed = randomRange(5, 10);
```

**Fonctions disponibles** :
- Opérations Vector2 : `add`, `subtract`, `multiply`, `divide`, `normalize`
- Utilitaires Vector2 : `magnitude`, `dot`, `distanceTo`, `angle`, `rotate`, `lerp`, `limit`
- Collision : `aabbCollision`, `circleCollision`, `circleAABBCollision`
- Utilitaires math : `clamp`, `lerp`, `randomRange`, `randomInt`, `degToRad`, `radToDeg`

### Temps de jeu

Timers, chronomètres et delta time pour mouvement indépendant des frames.

```ts
import { Timer, Scheduler, DeltaTime, wait, formatTime } from './src/index';

// Timer (chronomètre avec callbacks)
const cooldown = new Timer(3000, () => console.log('Prêt !'));
cooldown.start();
cooldown.update();  // Appeler dans la boucle de jeu

const progress = cooldown.getProgress();  // 0 à 1
const remaining = cooldown.getRemaining();  // ms restantes

// Scheduler (délais pausables)
const scheduler = new Scheduler();
const taskId = scheduler.delay(() => spawnEnemy(), 5000);
scheduler.pause();   // Pause toutes les tâches
scheduler.resume();  // Reprend toutes les tâches
scheduler.cancel(taskId);  // Annule une tâche spécifique

// Tâches répétitives
const repeatId = scheduler.repeat(() => updateAI(), 100);

// Delta time (mouvement indépendant des frames)
const deltaTime = new DeltaTime();

function gameLoop() {
    const dt = deltaTime.update();  // Temps depuis la dernière frame (ms)

    // Mouvement indépendant des frames
    player.x += velocity * deltaTime.getDeltaSeconds();

    // Effet ralenti
    deltaTime.setTimeScale(0.5);  // Demi-vitesse

    const fps = deltaTime.getFPS();
}

// Utilitaires
await wait(1000);  // Délai async
const timeStr = formatTime(125000);  // "02:05"
const timestamp = timestamp();  // performance.now()
```

**Classes** :
- `Timer` : Chronomètre avec pause/reprise et callbacks de complétion
- `Scheduler` : Planificateur de tâches avec support pause/reprise
- `DeltaTime` : Timing indépendant des frames avec mise à l'échelle du temps

### Entrées de jeu

Suivi de l'état du clavier et de la souris optimisé pour les jeux.

```ts
import { getInputManager } from './src/index';

const input = getInputManager();

function gameLoop() {
    input.update();  // Appeler une fois par frame

    // Clavier - état continu
    if (input.isKeyDown('ArrowLeft')) {
        player.x -= 5;
    }
    if (input.isKeyDown('ArrowRight')) {
        player.x += 5;
    }
    if (input.isKeyDown(' ')) {  // Barre d'espace
        player.jump();
    }

    // Clavier - détection d'une seule pression
    if (input.wasKeyPressed('e')) {
        interact();  // Ne se déclenche qu'une fois par pression
    }
    if (input.wasKeyReleased('Shift')) {
        stopSprinting();
    }

    // Position de la souris
    const mousePos = input.getMousePosition();
    aimAt(mousePos.x, mousePos.y);

    // Boutons de souris
    if (input.isMouseButtonDown(0)) {  // Bouton gauche
        shoot();
    }
    if (input.wasMouseButtonPressed(2)) {  // Bouton droit
        placeObject();
    }

    // Molette de souris
    const wheel = input.getMouseWheel();
    if (wheel !== 0) {
        zoom += wheel * 0.1;
    }
}

// Nettoyage
input.destroy();
```

**API** :
- Clavier : `isKeyDown(key)`, `wasKeyPressed(key)`, `wasKeyReleased(key)`
- Position souris : `getMousePosition()` retourne `{x, y}`
- Boutons souris : `isMouseButtonDown(button)`, `wasMouseButtonPressed(button)`, `wasMouseButtonReleased(button)`
- Molette souris : `getMouseWheel()` retourne la valeur delta

### Animation de jeu

Système de tweening avec 22 fonctions d'easing pour animations fluides.

```ts
import {
    Tween, TweenSequence, getTweenManager, Easing, animate
} from './src/index';

// Tween simple
const obj = { x: 0 };
const tween = new Tween(obj, 'x', 0, 100, 1000, Easing.easeOutQuad);
tween.onComplete(() => console.log('Terminé !'))
     .start();

// Mettre à jour les tweens dans la boucle de jeu
function gameLoop() {
    getTweenManager().update();
}

// Séquence de tweens (chaîner les animations)
const sequence = new TweenSequence()
    .add(new Tween(player, 'x', 0, 100, 500, Easing.easeInQuad))
    .add(new Tween(player, 'y', 0, 50, 300, Easing.easeOutBounce))
    .add(new Tween(player, 'alpha', 1, 0, 200, Easing.linear))
    .start();

sequence.pause();
sequence.resume();

// Animation basée sur les Promises
await animate(0, 100, 1000, Easing.easeInOutQuad)
    .then(value => console.log('Valeur finale :', value));

// Exemples pratiques
// Suivi fluide de la caméra
new Tween(camera, 'x', camera.x, player.x, 500, Easing.easeOutQuad).start();

// Animation de barre de vie
new Tween(healthBar, 'width', currentWidth, targetWidth, 300, Easing.easeOutCubic).start();

// Fondu d'interface
new Tween(menu, 'opacity', 0, 1, 400, Easing.easeInOutQuad).start();
```

**Fonctions d'easing disponibles** :
- Linéaire : `linear`
- Quadratique : `easeInQuad`, `easeOutQuad`, `easeInOutQuad`
- Cubique : `easeInCubic`, `easeOutCubic`, `easeInOutCubic`
- Quartique : `easeInQuart`, `easeOutQuart`, `easeInOutQuart`
- Exponentielle : `easeInExpo`, `easeOutExpo`, `easeInOutExpo`
- Sinusoïdale : `easeInSine`, `easeOutSine`, `easeInOutSine`
- Circulaire : `easeInCirc`, `easeOutCirc`, `easeInOutCirc`
- Élastique : `easeInElastic`, `easeOutElastic`, `easeInOutElastic`

### Boucle de jeu

Pas de temps fixe pour la physique et variable pour le rendu.

```ts
import { getGameLoop } from './src/index';

const gameLoop = getGameLoop();

// Configurer la boucle
gameLoop.start({
    onInit: () => {
        // Initialiser les ressources du jeu
        loadAssets();
        setupPlayers();
    },

    onUpdate: (deltaMs) => {
        // Mise à jour à pas variable (rendu, entrées, animation)
        getInputManager().update();
        getTweenManager().update();
        updateCamera(deltaMs);
    },

    onFixedUpdate: (fixedDelta) => {
        // Mise à jour à pas fixe (simulation physique)
        // fixedDelta est toujours 16.67ms (60Hz) par défaut
        updatePhysics(fixedDelta);
        getEntityManager().fixedUpdate(fixedDelta);
    },

    onRender: () => {
        // Rendu
        clearCanvas();
        getEntityManager().render(ctx);
        renderUI();
    },

    onDestroy: () => {
        // Nettoyage des ressources
        unloadAssets();
    }
});

// Contrôler la boucle
gameLoop.pause();
gameLoop.resume();
gameLoop.stop();

// FPS et statistiques
const fps = gameLoop.getFPS();
const frameCount = gameLoop.getFrameCount();

// Configurer le pas fixe (par défaut : 60 FPS)
gameLoop.setFixedDelta(16.67);  // 60 FPS
gameLoop.setFixedDelta(8.33);   // 120 FPS
```

**Concepts clés** :
- **Pas fixe** : Mises à jour physiques à taux constant (déterministe)
- **Pas variable** : Le rendu s'adapte au taux de frames
- **Hooks de cycle de vie** : Séparation claire des responsabilités
- **Pause/Reprise** : Contrôle total sur l'exécution du jeu

### Entité de jeu

Système entité-composant avec physique et collision intégrées.

```ts
import { Entity, EntityManager, getEntityManager } from './src/index';

// Créer une classe d'entité personnalisée
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
        console.log('Joueur apparu');
    }

    onUpdate(deltaMs: number) {
        // Logique de mise à jour personnalisée
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
        console.log('Joueur détruit');
    }
}

// Gestion des entités
const manager = getEntityManager();
const player = new Player(100, 100);
manager.add(player);

// Physique
player.applyForce(new Vector2(100, 0));  // Appliquer une force
player.applyVelocity(16.67);  // Mettre à jour la position selon la physique

// Système de composants
class HealthComponent implements EntityComponent {
    constructor(public entity: Entity, private maxHealth: number) {}

    update(deltaMs: number) {
        // Logique de mise à jour du composant
    }

    render(ctx?: CanvasRenderingContext2D) {
        // Rendu de la barre de vie
    }

    destroy() {
        // Nettoyage
    }
}

player.addComponent('health', new HealthComponent(player, 100));
const health = player.getComponent<HealthComponent>('health');

// Requêtes
const players = manager.getByTag('player');
const enemy = manager.getById('enemy_1');
const allEntities = manager.getAll();

// Opérations par lots dans la boucle de jeu
manager.update(deltaMs);        // Mettre à jour toutes les entités actives
manager.fixedUpdate(16.67);     // Mise à jour physique
manager.render(ctx);            // Rendre toutes les entités visibles
manager.checkCollisions();      // Détecter et résoudre les collisions

// Détection de collision
if (player.checkCollision(enemy)) {
    console.log('Collision !');
}

// Transformation et état
player.active = false;    // Désactiver les mises à jour
player.visible = false;   // Cacher l'entité
player.rotation += 0.1;   // Rotation
player.scale.set(2, 2);   // Agrandir
```

**Fonctionnalités** :
- Transformation : position, velocity, acceleration, rotation, scale
- Physique : application de force, intégration d'Euler, traînée
- Collision : formes AABB et Cercle avec détection automatique
- Composants : Architecture de composants enfichables
- Cycle de vie : onInit, onUpdate, onFixedUpdate, onRender, onDestroy, onCollision
- Requêtes : Par tag, par ID, obtenir tout
- Opérations par lots : Mise à jour, rendu et collision pour toutes les entités

### Réseau de jeu

Réseau multijoueur basé sur WebSocket avec synchronisation d'état.

```ts
import {
    getNetworkManager,
    calculateStateDelta,
    applyStateDelta,
    interpolateStates,
    type EntityState
} from './src/index';

const network = getNetworkManager();

// Se connecter au serveur
network.connect({
    url: 'ws://localhost:8080',
    autoReconnect: true,
    reconnectDelay: 1000,
    pingInterval: 5000,

    onOpen: () => {
        console.log('Connecté au serveur');
        network.send('JOIN', { playerName: 'Player1' });
    },

    onClose: () => {
        console.log('Déconnecté');
    },

    onError: (event) => {
        console.error('Erreur de connexion :', event);
    }
});

// Envoyer des messages
network.send('INPUT', { keys: pressedKeys, mouse: mousePos });
network.send('CHAT', { message: 'Bonjour !' }, 0, true);  // Avec ACK

// Gestionnaires de messages
network.on('STATE_UPDATE', (message) => {
    const serverState = message.data;
    updateGameState(serverState);
});

network.on('PLAYER_JOINED', (message) => {
    const player = message.data;
    spawnPlayer(player);
});

// Synchronisation d'état
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

    // Compression delta (n'envoyer que les changements)
    const delta = calculateStateDelta(previousState, currentState);
    if (delta) {
        network.send('STATE_UPDATE', delta);
        previousState = currentState;
    }
}

// Appliquer l'état reçu
function receivePlayerState(delta: StateDelta) {
    const newState = applyStateDelta(playerState, delta);
    playerState = newState;
}

// Prédiction côté client avec interpolation
function smoothPlayerMovement(fromState: EntityState, toState: EntityState, t: number) {
    const interpolated = interpolateStates(fromState, toState, t);
    player.position.set(interpolated.position.x, interpolated.position.y);
    player.rotation = interpolated.rotation || 0;
}

// État de connexion
if (network.isConnected()) {
    const latency = network.getLatency();
    console.log(`Ping : ${latency?.current}ms`);
}

// Nettoyage
network.disconnect();
```

**Fonctionnalités** :
- Wrapper WebSocket avec auto-reconnexion
- File de messages avec priorité
- Système d'accusé de réception pour messages fiables
- Suivi de latence (ping/pong, mesure RTT)
- Utilitaires de synchronisation d'état :
  - `calculateStateDelta` : Compression delta
  - `applyStateDelta` : Appliquer les deltas à l'état
  - `interpolateStates` : Prédiction côté client fluide
- Routage de messages basé sur événements

### Exemple de jeu complet

Voici un jeu simple utilisant tous les modules ensemble :

```ts
import {
    getGameLoop, getInputManager, getEntityManager, getTweenManager,
    Vector2, Entity, Tween, Easing
} from './src/index';

// Entité joueur
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

        // Mouvement
        this.velocity.set(0, 0);
        if (input.isKeyDown('ArrowLeft')) this.velocity.x = -speed;
        if (input.isKeyDown('ArrowRight')) this.velocity.x = speed;
        if (input.isKeyDown('ArrowUp')) this.velocity.y = -speed;
        if (input.isKeyDown('ArrowDown')) this.velocity.y = speed;

        // Tirer
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
            // Animation de dégâts
            new Tween(this, 'scale', 1, 1.2, 100, Easing.easeOutQuad)
                .onComplete(() => {
                    new Tween(this, 'scale', 1.2, 1, 100, Easing.easeInQuad).start();
                })
                .start();
        }
    }
}

// Initialisation du jeu
const player = new Player();
getEntityManager().add(player);

// Démarrer la boucle de jeu
getGameLoop().start({
    onInit: () => {
        console.log('Jeu démarré !');
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

### Bonnes pratiques pour les modules de jeu

**✅ À faire** :
- Utiliser le pas fixe pour la physique (`onFixedUpdate`)
- Utiliser le pas variable pour le rendu et les entrées (`onUpdate`)
- Appeler `update()` une fois par frame sur les gestionnaires singleton
- Utiliser la compression delta pour les mises à jour d'état réseau
- Taguer les entités pour des requêtes efficaces
- Utiliser l'architecture de composants pour les comportements réutilisables
- Exploiter le delta time pour un mouvement indépendant des frames

**❌ À ne pas faire** :
- Mélanger logique physique et logique de rendu
- Oublier d'appeler `update()` sur les gestionnaires dans la boucle de jeu
- Créer des entités sans formes de collision si elles en ont besoin
- Envoyer l'état complet à chaque frame (utiliser la compression delta)
- Interroger les entités à chaque frame (mettre en cache les résultats si possible)
- Utiliser le tweening pour un mouvement basé sur la physique

**Intégration avec l'état du framework** :
```ts
// État du jeu dans le store du framework
setState({
    score: 0,
    health: 100,
    gameOver: false
});

// Mettre à jour depuis la boucle de jeu
function onPlayerDeath() {
    setState({ gameOver: true });
    getGameLoop().pause();
}

// Réagir aux changements d'état dans l'interface
const gameUI = () => div(
    h1(`Score : ${getState('score')}`),
    div(`Vie : ${getState('health')}`),
    getState('gameOver') ? div('Game Over !') : null
);
```

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

### Modules de jeu
- **Math** : `Vector2`, `aabbCollision`, `circleCollision`, `circleAABBCollision`, `clamp`, `lerp`, `randomRange`, `randomInt`
- **Time** : `Timer`, `Scheduler`, `DeltaTime`, `wait`, `formatTime`, `timestamp`
- **Input** : `getInputManager()`, `InputManager` (suivi clavier/souris)
- **Animation** : `Tween`, `TweenSequence`, `getTweenManager()`, `Easing`, `animate()`
- **Loop** : `getGameLoop()`, `GameLoop` (pas fixe/variable)
- **Entity** : `Entity`, `EntityComponent`, `getEntityManager()`, `EntityManager`
- **Network** : `NetworkClient`, `getNetworkManager()`, `calculateStateDelta`, `applyStateDelta`, `interpolateStates`
