/**
 * Shared Game Utilities
 * Common utilities used across game modules to reduce code duplication
 */

// ============================================================================
// TIME UTILITIES
// ============================================================================

export const now = (): number => performance.now();

// ============================================================================
// MATH UTILITIES
// ============================================================================

// Export commonly used Math methods to avoid repeated destructuring
export const {
    min,
    max,
    floor,
    ceil,
    round,
    sqrt,
    abs,
    pow,
    sin,
    cos,
    atan2,
    PI,
    hypot,
    random
} = Math;
