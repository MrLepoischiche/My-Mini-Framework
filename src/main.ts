import { div, h1, button, render, getState, setState, registerRoute, initRouter, navigateTo } from './index';

// Initialiser l'état
setState({ count: 0 });

// Définir des pages
registerRoute('', () => div('Home Page'));
registerRoute('about', () => div('About Page'));
registerRoute('counter', () => {
    const count = getState('count') || 0;
    return div(
        h1(`Count: ${count}`),
        button({ onClick: () => setState({ count: count + 1 }) }, '+')
    );
});

// App avec navigation
const app = () => div(
    div(
        button({ onClick: () => navigateTo('') }, 'Home'),
        button({ onClick: () => navigateTo('about') }, 'About'),
        button({ onClick: () => navigateTo('counter') }, 'Counter')
    ),
    div({ id: 'router-outlet' })
);

render(app, document.getElementById('app')!);
initRouter();