import { Random, type RandomProperties } from '@technobuddha/library';

import { type CellFacing, type Maze } from '../geometry/index.ts';

/**
 * Internal type for resource management tracking.
 *
 * @internal
 */
type Trash = AbortController;

/**
 * Configuration properties for maze solver instances.
 *
 * @group Solver
 * @category Maze Solver
 */
export type MazeSolverProperties = RandomProperties & {
  /** The maze instance to be solved */
  readonly maze: Maze;
  /** Animation speed multiplier for visualization (higher = faster) */
  readonly speed?: number;
};

/**
 * Arguments for the solve method configuration.
 *
 * @group Solver
 * @category Maze Solver
 */
export type SolveArguments = {
  /** Optional color override for visual elements during solving */
  readonly color?: string;
  /** Optional entrance point override (defaults to maze entrance) */
  readonly entrance?: CellFacing;
  /** Optional exit point override (defaults to maze exit) */
  readonly exit?: CellFacing;
};

/**
 * Abstract base class for all maze solving algorithms.
 *
 * Provides common functionality for maze solvers including:
 * - Random number generation with seeding support
 * - Resource management for cleanup
 * - Animation speed control
 * - Standardized solve interface
 *
 * All concrete solver implementations must extend this class and implement
 * the abstract solve method with their specific algorithm logic.
 *
 * @group Solver
 * @category Maze Solver
 */
export abstract class MazeSolver extends Random implements Disposable {
  /** Animation speed multiplier for visualization */
  public readonly speed: NonNullable<MazeSolverProperties['speed']>;
  /** The maze instance being solved */
  protected readonly maze: MazeSolverProperties['maze'];
  /** Collection of disposable resources for cleanup */
  protected readonly trash = new Set<Trash>();

  /**
   * Creates a new maze solver with configuration options.
   *
   * @param props - Configuration including maze, speed, and random seed
   */
  public constructor({ maze, speed = 1, random = maze.random, ...props }: MazeSolverProperties) {
    super({ random, ...props });
    this.maze = maze;
    this.speed = speed;
  }

  //#region Trash
  /**
   * Adds a disposable resource to the cleanup collection.
   *
   * Resources added here will be automatically disposed when the solver
   * is disposed, preventing memory leaks and cleaning up event listeners.
   *
   * @param controller - The AbortController to track for cleanup
   */
  protected addTrash(controller: Trash): void {
    this.trash.add(controller);
  }

  /**
   * Removes a disposable resource from the cleanup collection.
   *
   * Call this when a resource has been manually disposed or is no longer
   * needed for automatic cleanup.
   *
   * @param controller - The AbortController to stop tracking
   */
  protected removeTrash(controller: Trash): void {
    this.trash.delete(controller);
  }

  /**
   * Disposes all tracked resources and cleans up the solver.
   *
   * Aborts all tracked AbortControllers and clears the trash collection.
   * This should be called when the solver is no longer needed to prevent
   * memory leaks and clean up any ongoing operations.
   */
  public dispose(): void {
    for (const trash of this.trash) {
      trash.abort();
    }
    this.trash.clear();
  }

  /**
   * Symbol.dispose implementation for automatic resource cleanup.
   *
   * Enables usage with `using` declarations for automatic disposal
   * when the solver goes out of scope.
   */
  public [Symbol.dispose](): void {
    this.dispose();
  }
  //#endregion

  /**
   * Solves the maze using the implemented algorithm.
   *
   * This abstract method must be implemented by all concrete solver classes
   * to provide their specific solving algorithm. The method should yield
   * periodically to allow for animation and visualization of the solving process.
   *
   * @param args - Optional configuration for entrance, exit, and visual settings
   * @yields After each step of the solving algorithm for visualization
   */
  public abstract solve(args?: SolveArguments): AsyncGenerator<void>;
}
