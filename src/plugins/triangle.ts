import { type Maze } from '../geometry/index.ts';

/**
 * Plugin that creates a triangular maze shape by masking cells outside the triangle boundary.
 *
 * Creates a triangular maze area by applying a mask to cells that fall outside a triangle
 * defined by three vertices:
 * - Bottom-left corner of the maze
 * - Bottom-right corner of the maze
 * - Top-center of the maze
 *
 * Uses the mathematical point-in-triangle test based on barycentric coordinates
 * to determine which cells should be masked. The algorithm checks if a point
 * lies on the same side of each triangle edge, effectively creating a triangular
 * boundary within the rectangular maze grid.
 *
 * Masked cells are excluded from maze generation and pathfinding, creating the
 * characteristic triangular shape with straight diagonal boundaries.
 *
 * @param maze - The maze instance to apply the triangular shape to
 *
 * @group Plugin
 * @category Shape
 */
export function trianglePlugin(maze: Maze): void {
  const a = { x: 0, y: maze.height - 1 };
  const b = { x: maze.width - 1, y: maze.height - 1 };
  const c = { x: Math.floor(maze.width / 2), y: 0 };

  for (const cell of maze.cellsInMaze()) {
    const asx = cell.x - a.x;
    const asy = cell.y - a.y;
    const sab = (b.x - a.x) * asy - (b.y - a.y) * asx > 0;

    if (
      (c.x - a.x) * asy - (c.y - a.y) * asx > 0 === sab ||
      (c.x - b.x) * (cell.y - b.y) - (c.y - b.y) * (cell.x - b.x) > 0 !== sab
    ) {
      maze.nexus(cell).mask = true;
    }
  }
}
