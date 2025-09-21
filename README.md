# Mini Framework

Un framework JavaScript léger avec Virtual DOM, state management réactif, système d'événements custom et routing.

## Table des matières

1. [Installation](#installation)
2. [Architecture](#architecture)
3. [Démarrage rapide](#démarrage-rapide)
4. [API de base](#api-de-base)
5. [State Management](#state-management)
6. [Event Handling](#event-handling)
7. [Routing](#routing)
8. [Exemples](#exemples)

## Installation
```bash
# Cloner le projet
git clone https://zone01normandie.org/git/ejean/mini-framework.git
cd mini-framework

# Installer les dépendances
npm i

# Lancer en développement (Exemple minimal)
npm run dev

# Lancer l'exemple TodoMVC
npm run dev:todomvc
```

## Architecture

### Vue d'ensemble

Le framework est organisé en modules indépendants qui travaillent ensemble pour fournir une expérience de développement cohérente.

```
src/
├── core/           # Cœur du framework
│   ├── types.ts    # Définitions TypeScript
│   └── element.ts  # Création d'éléments (div, h1, etc.)
├── dom/            # Gestion du DOM
│   └── render.ts   # Virtual DOM et rendu
├── state/          # State management
│   └── store.ts    # Store réactif global
├── events/         # Système d'événements
│   └── handler.ts  # Délégation globale
├── router/         # Routing
│   └── hash.ts     # Router basé sur hash URLs
├── utils/          # Utilitaires
│   └── id.ts       # Génération d'IDs uniques
└── index.ts        # Point d'entrée
```

### Concepts clés

#### Virtual DOM
Le framework utilise une représentation virtuelle du DOM pour optimiser les performances :
```ts
// Structure d'un élément virtuel
interface VirtualElement {
    tag: string;           // 'div', 'h1', etc.
    props: ElementProps;   // Attributs et événements
    children: ElementChild[]; // Enfants (texte ou autres éléments)
}
```

#### Flux de données unidirectionnel
```
État → Virtual DOM → DOM réel
  ↑                     ↓
setState()         Événements utilisateur
```

#### Contrôle d'inversion
Contrairement à une librairie où vous appelez les fonctions, le framework prend le contrôle :
- Librairie : `library.doSomething()`
- Framework : Le framework appelle vos fonctions de composant automatiquement

### Cycle de vie d'une application
1. Initialisation : render(app, container)
2. Création Virtual DOM : Vos fonctions de composant sont appelées
3. Rendu DOM : Le Virtual DOM est converti en éléments HTML
4. Événements : Le système de délégation capture les interactions
5. Changement d'état : setState() déclenche un nouveau cycle
6. Re-rendu : Seuls les éléments modifiés sont mis à jour

### Principes de conception
- Simplicité : API minimale et intuitive
- Performance : Virtual DOM et délégation d'événements
- Réactivité : Mise à jour automatique du DOM
- Modularité : Chaque fonctionnalité est isolée
- Type Safety : Support complet de TypeScript

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

### Création d'éléments♦
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


## State Management

La gestion de l'état est réalisé par un Store global, qui stocke les données sous forme de paires clé-valeur, la valeur pouvant être de n'importe quel type.

Les fonctions `getState()` et `setState()` sont disponibles pour, respectivement, récupérer les valeurs de l'état et effectuer des modifications dans ledit état :
```ts
p({ class: 'my-value' }, getState().value)

input({
    placeholder: 'Change the value',
    onInput: (e: Event) => {
        setState({ value: (e.target as HTMLInputElement).value })
    }
})
```

De plus, `setState()` prend en charge la réactivité : un appel à cette fonction déclenchera automatiquement un rechargement de tout élément faisant appel à `getState()`.


## Event Handling

Le framework implémente un système d'événements custom basé sur la délégation globale, différent du traditionnel `addEventListener`.

### Principe de fonctionnement

La délégation globale permet de centraliser les événements et leurs fonctions handlers au sein d'un registre. Le traitement de ces événements est réalisé par un seul et même écouteur, qui exécute les handlers associés à chaque élément qui correspond à la cible de l'événement.

### Syntaxe des événements
```ts
// Événements supportés (préfixés par 'on')
button({ onClick: handleClick }, 'Cliquer')
input({ onInput: handleInput, onFocus: handleFocus })
div({ onMouseOver: handleHover })
```

### Avantages du système
- Performance : `addEventListener()` (un écouteur pour CHAQUE élément) vs `dispatchEvent()` (un SEUL listener global sur document) => Optimisation mémoire
- Flexibilité : Gestion automatique des éléments ajoutés dynamiquement

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


## Routing

Le framework inclut un système de routing simple basé sur les hash URLs pour créer des applications single-page.

### Configuration des routes
```ts
import { registerRoute, initRouter, navigateTo } from './src/index';

// Enregistrer des routes
registerRoute('', () => div('Page d'accueil'));
registerRoute('about', () => div('À propos'));
registerRoute('contact', () => div('Contact'));

// Initialiser le router
initRouter(); // Le router cherche automatiquement #router-outlet
```

### Fonctionnement

Le router utilise les **hash URLs** (`#/route`) pour détecter les changements de navigation :
- `#/` ou `#` → route vide (`''`)
- `#/about` → route `'about'`
- `#/contact` → route `'contact'`

Le framework écoute l'événement `hashchange` pour détecter automatiquement les changements d'URL.

### Navigation
```ts
// Navigation programmatique
navigateTo('about'); // Va vers #/about
navigateTo('');      // Va vers #/ (accueil)

// Navigation via liens
a({ href: '#/about', onClick: (e) => {
    e.preventDefault();
    navigateTo('about');
}}, 'À propos')
```
```html
<div id="app">
    <!-- Navigation -->
    <nav>
        <button onclick="navigateTo('')">Accueil</button>
        <button onclick="navigateTo('about')">À propos</button>
    </nav>
    
    <!-- Container pour les routes -->
    <div id="router-outlet"></div>
</div>
```

### Intégration avec le State Management
```ts
// Les composants de route peuvent utiliser le state
registerRoute('counter', () => {
    const count = getState('count') || 0;
    return div(
        h1(`Compteur: ${count}`),
        button({ 
            onClick: () => setState({ count: count + 1 }) 
        }, '+1')
    );
});
```
**Note importante** : Les routes sont automatiquement re-rendues lors des changements d'état grâce à la réactivité du framework.

### Routes non trouvées

Si l'utilisateur navigue vers une route non enregistrée, le framework affiche automatiquement :
```html
<p>404 - Not Found</p>
```


## Exemples
### Exemple 1 : Compteur simple
```ts
import { div, h1, button, render, setState, getState } from './src/index';

// État initial
setState({ count: 0 });

// Application
const counterApp = () => div(
    h1(`Compteur: ${getState('count')}`),
    div(
        button({ onClick: () => setState({ count: getState('count') - 1 }) }, '-'),
        button({ onClick: () => setState({ count: getState('count') + 1 }) }, '+'),
        button({ onClick: () => setState({ count: 0 }) }, 'Reset')
    )
);

render(counterApp, document.getElementById('app')!);
```

### Exemple 2 : Formulaire avec validation
```ts
// État du formulaire
setState({
    name: '',
    email: '',
    errors: {}
});

const validateForm = () => {
    const { name, email } = getState();
    const errors = {};
    
    if (!name.trim()) errors.name = 'Le nom est requis';
    if (!email.includes('@')) errors.email = 'Email invalide';
    
    setState({ errors });
    return Object.keys(errors).length === 0;
};

const formApp = () => {
    const { name, email, errors } = getState();
    
    return div({ class: 'form' },
        h2('Inscription'),
        
        div(
            input({
                type: 'text',
                placeholder: 'Nom',
                value: name,
                onInput: (e) => setState({ name: e.target.value })
            }),
            errors.name && span({ class: 'error' }, errors.name)
        ),
        
        div(
            input({
                type: 'email',
                placeholder: 'Email',
                value: email,
                onInput: (e) => setState({ email: e.target.value })
            }),
            errors.email && span({ class: 'error' }, errors.email)
        ),
        
        button({
            onClick: () => {
                if (validateForm()) {
                    alert('Formulaire valide !');
                }
            }
        }, 'Valider')
    );
};
```

### Exemple 3 : Application avec routing
```ts
// Configuration des routes
registerRoute('', () => div(
    h1('Accueil'),
    p('Bienvenue sur notre site !')
));

registerRoute('products', () => {
    const products = getState('products') || [];
    return div(
        h1('Nos produits'),
        ul(...products.map(product => 
            li(product.name + ' - ' + product.price + '€')
        ))
    );
});

registerRoute('contact', () => div(
    h1('Contact'),
    p('Email: contact@example.com')
));

// Application principale
const app = () => div(
    div({ class: 'nav' },
        button({ onClick: () => navigateTo('') }, 'Accueil'),
        button({ onClick: () => navigateTo('products') }, 'Produits'),
        button({ onClick: () => navigateTo('contact') }, 'Contact')
    ),
    div({ id: 'router-outlet' })
);

// Initialisation
setState({ products: [
    { name: 'Produit 1', price: 29.99 },
    { name: 'Produit 2', price: 39.99 }
]});

render(app, document.getElementById('app')!);
initRouter();
```

### TodoMVC - Exemple complet

L'implémentation complète de TodoMVC est disponible dans `examples/todomvc/` et démontre :

- Gestion d'état complexe avec tableaux d'objets
- Événements multiples (click, input, keyup, dblclick)
- Filtrage et manipulation de données
- Édition inline avec gestion du focus
- Router simple pour les filtres
- Interface utilisateur complète et fonctionnelle

Pour lancer l'exemple :
```bash
npm run dev:todomvc
```

### Ressources
- Spécification TodoMVC : todomvc.com
- CSS TodoMVC : Inclus automatiquement dans l'exemple
- Tests : Testez toutes les fonctionnalités dans l'exemple TodoMVC