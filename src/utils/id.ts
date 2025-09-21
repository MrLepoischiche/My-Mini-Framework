// Générer un ID unique
export function generateId(): string {
    return `event-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}