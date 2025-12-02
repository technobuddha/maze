import { type Maze } from '../geometry/index.ts';

/**
 * Plugin that creates an elliptical maze shape by masking cells outside the ellipse boundary.
 *
 * Creates an elliptical maze area by applying a mask to cells that fall outside an ellipse
 * centered at the maze's midpoint. The ellipse dimensions are based on the maze size:
 * - Horizontal radius: half the maze width plus 1
 * - Vertical radius: half the maze height plus 1
 *
 * Masked cells are excluded from maze generation and pathfinding, creating the
 * characteristic elliptical shape with smooth curved boundaries.
 *
 * @param maze - The maze instance to apply the elliptical shape to
 *
 * @group Plugin
 * @category Ellipse
 */
export function ellipsePlugin(maze: Maze): void {
  const rx = Math.floor(maze.width / 2) + 1;
  const ry = Math.floor(maze.height / 2) + 1;
  const x0 = Math.floor(maze.width / 2);
  const y0 = Math.floor(maze.height / 2);

  for (const cell of maze.cellsInMaze()) {
    if ((cell.x - x0) ** 2 / rx ** 2 + (cell.y - y0) ** 2 / ry ** 2 >= 1) {
      maze.nexus(cell).mask = true;
    }
  }
}
