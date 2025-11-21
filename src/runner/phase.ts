/**
 * Array of all possible execution phases in the maze lifecycle.
 *
 * Defines the ordered sequence of phases that a maze runner goes through:
 * - 'maze': Initial maze setup and drawing
 * - 'generate': Maze generation algorithm execution
 * - 'braid': Braiding phase to remove dead ends
 * - 'solve': Pathfinding and solution algorithm execution
 * - 'final': Final drawing and solution display
 * - 'observe': Observation period for completed maze
 * - 'exit': Completion and cleanup phase
 *
 * @group Runner
 * @category Types
 */
export const phases = ['maze', 'generate', 'braid', 'solve', 'final', 'observe', 'exit'] as const;

/**
 * Type representing a specific phase in the maze execution lifecycle.
 *
 * Union type derived from the phases array, ensuring type safety when
 * working with maze execution phases throughout the runner system.
 *
 * @group Runner
 * @category Types
 */
export type Phase = (typeof phases)[number];
