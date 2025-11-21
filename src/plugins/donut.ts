import { type Maze } from '../geometry/index.ts';

/**
 * Plugin that creates a donut (torus) shaped maze by masking cells outside and inside elliptical boundaries.
 *
 * Creates a donut-shaped maze area by applying a mask to cells that fall:
 * - Outside an outer ellipse (creates the outer boundary of the donut)
 * - Inside an inner ellipse (creates the hole in the center)
 *
 * The ellipses are centered at the maze's midpoint with dimensions based on the maze size:
 * - Outer ellipse: radii are half the maze dimensions plus 1
 * - Inner ellipse: radii are quarter the maze dimensions
 *
 * Masked cells are excluded from maze generation and pathfinding, creating the
 * characteristic donut shape with a hollow center.
 *
 * @param maze - The maze instance to apply the donut shape to
 *
 * @group Plugin
 * @category Shape
 */
export function donutPlugin(maze: Maze): void {
  const rx = Math.floor(maze.width / 2) + 1;
  const ry = Math.floor(maze.height / 2) + 1;
  const rx2 = Math.floor(maze.width / 4);
  const ry2 = Math.floor(maze.height / 4);
  const x0 = Math.floor(maze.width / 2);
  const y0 = Math.floor(maze.height / 2);

  for (const cell of maze.cellsInMaze()) {
    if (
      (cell.x - x0) ** 2 / rx ** 2 + (cell.y - y0) ** 2 / ry ** 2 >= 1 ||
      (cell.x - x0) ** 2 / rx2 ** 2 + (cell.y - y0) ** 2 / ry2 ** 2 <= 1
    ) {
      maze.nexus(cell).mask = true;
    }
  }
}
