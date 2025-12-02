/**
 * Array of all possible playback modes for maze runner execution.
 *
 * Defines the available speed and control modes for maze execution:
 * - 'pause': Stops execution and waits for user input
 * - 'step': Executes one step at a time, requiring manual advancement
 * - 'play': Normal speed execution with animation and delays
 * - 'fast': Accelerated execution without delays but with animation
 * - 'instant': Maximum speed execution without delays or animation
 * - 'refresh': Special mode that triggers a complete restart
 *
 * @group Runner
 * @category  Play Mode
 */
export const playModes = ['pause', 'step', 'play', 'fast', 'instant', 'refresh'] as const;

/**
 * Type representing a specific playback mode for maze runner execution.
 *
 * Union type derived from the playModes array, ensuring type safety when
 * controlling maze runner playback speed and behavior throughout the system.
 *
 * @group Runner
 * @category  Play Mode
 */
export type PlayMode = (typeof playModes)[number];
