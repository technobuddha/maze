import { type Cell } from '../geometry.ts';

import { DotMaze, type DotMazeProperties } from './dot-maze.ts';

/**
 * Properties for configuring a zeta maze.
 * Inherits all standard maze properties for zeta tessellation geometry.
 *
 * @group Maze
 * @category Zeta
 */
export type ZetaMazeProperties = DotMazeProperties;

/**
 * Zeta maze implementation that extends dot maze functionality with frozen diagonal wall patterns.
 *
 * Creates mazes based on the dot maze foundation but applies a unique "frozen walls" system
 * that randomly establishes diagonal barriers across the maze grid. This creates a distinctive
 * zeta pattern where walls are pre-frozen in diagonal arrangements, constraining the maze
 * generation to work around these fixed barriers.
 *
 * Key features:
 * - Built on dot maze geometry and functionality
 * - Applies random diagonal wall freezing during initialization
 * - Uses 50% probability to choose between \\ and / diagonal patterns
 * - Creates unique maze constraints through pre-established barrier patterns
 * - Modifies intersection drawing to exclude certain visual elements
 * - Compatible with all dot maze algorithms while adding zeta-specific constraints
 *
 * The zeta pattern creates interesting maze generation challenges where the algorithm
 * must work around the frozen diagonal barriers, producing distinctive pathway patterns
 * that differ significantly from standard dot mazes.
 *
 * @group Maze
 * @category Zeta
 */
export class ZetaMaze extends DotMaze {
  /**
   * Resets the maze and applies the frozen wall pattern.
   *
   * Extends the base reset functionality by calling the parent reset method
   * and then applying the zeta-specific diagonal wall freezing pattern.
   * This ensures that every maze generation starts with the characteristic
   * frozen diagonal barriers that define the zeta maze structure.
   */
  public override reset(): void {
    super.reset();
    this.freezeWalls();
  }

  /**
   * Draws intersections for a zeta maze cell with modified visibility.
   *
   * Overrides the parent intersection drawing to pass a `false` parameter,
   * which modifies the visual representation of intersections in the zeta maze.
   * This creates a different visual style compared to standard dot mazes.
   *
   * @param cell - The cell for which to draw intersections
   */
  public override drawIntersections(cell: Cell): void {
    super.drawIntersections(cell, false);
  }

  /**
   * Applies the frozen diagonal wall pattern across the entire maze grid.
   *
   * Creates the characteristic zeta pattern by randomly choosing between two
   * diagonal wall configurations for each grid intersection:
   * - 50% chance: Creates \\ diagonal by erecting barriers on 'h' and 'd' directions
   * - 50% chance: Creates / diagonal by erecting barriers on 'b' and 'f' directions
   *
   * This method iterates through all interior grid points (excluding borders)
   * and applies the random diagonal pattern, creating a frozen barrier structure
   * that constrains subsequent maze generation algorithms.
   * @internal
   */
  private freezeWalls(): void {
    for (let x = 1; x < this.width; ++x) {
      for (let y = 1; y < this.height; ++y) {
        if (this.randomChance(0.5)) {
          // remove walls on the \ diagonal
          this.nexus({ x: x, y: y }).erectBarrier('h');
          this.nexus({ x: x - 1, y: y - 1 }).erectBarrier('d');
        } else {
          // remove walls on the / diagonal
          this.nexus({ x: x - 1, y: y }).erectBarrier('b');
          this.nexus({ x: x, y: y - 1 }).erectBarrier('f');
        }
      }
    }
  }
}
