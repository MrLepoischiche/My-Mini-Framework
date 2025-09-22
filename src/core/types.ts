// Type pour les propriétés d'un élément (attributs + événements)
export interface ElementProps {
  [key: string]: any;
  key?: string | number;
  // Attributs HTML classiques
  id?: string;
  class?: string | string[];
  style?: string | Record<string, string | number>;
  // Événements (préfixés par 'on')
  onClick?: (event: Event) => void;
  onInput?: (event: Event) => void;
  onChange?: (event: Event) => void;
  // ... autres événements selon vos besoins
}

// Type pour les enfants d'un élément
export type ElementChild = string | number | VirtualElement | null | undefined;

// Structure d'un élément virtuel
export interface VirtualElement {
  tag: string;
  props: ElementProps;
  children: ElementChild[];
}

// Type pour la fonction de création d'élément
export type ElementFactory = {
  // Avec props explicites
  (props: ElementProps, ...children: ElementChild[]): VirtualElement;
  // Sans props (premier paramètre = enfant)
  (...children: ElementChild[]): VirtualElement;
};