import { type Maze } from '../geometry/index.ts';

/**
 * Plugin that creates portal connections between random pairs of cells in the maze.
 *
 * Creates bidirectional portal connections by linking two random cells of the same kind
 * through tunnel systems. When a player moves through a wall from the first cell,
 * they emerge from the corresponding wall of the second cell, effectively creating
 * a teleportation mechanism.
 *
 * The plugin operates during the pre-generation phase to:
 * 1. Select two random cells of the same geometric kind (to ensure compatibility)
 * 2. Create tunnel connections mapping each wall direction from cell1 to cell2
 * 3. Create reverse tunnel connections mapping each wall direction from cell2 to cell1
 * 4. Mark both cells as bridge elements for proper rendering
 *
 * This creates a symmetrical portal system where movement through any wall of either
 * portal cell transports the player to the corresponding wall of the partner cell.
 *
 * @param maze - The maze instance to add portal functionality to
 *
 * @group Plugin
 * @category Portal
 */
export function portalPlugin(maze: Maze): void {
  maze.hookPreGeneration = () => {
    for (let i = 0; i < 1; ++i) {
      const cell1 = maze.randomCell();
      const kind = maze.cellKind(cell1);

      let cell2 = maze.randomCell();
      while (maze.cellKind(cell2) !== kind || maze.isSame(cell1, cell2)) {
        cell2 = maze.randomCell();
      }

      for (const move of maze.moves(cell1, { wall: 'all' })) {
        maze.nexus(cell2).tunnels[move.direction] = move.target;
      }
      for (const move of maze.moves(cell2, { wall: 'all' })) {
        maze.nexus(cell1).tunnels[move.direction] = move.target;
      }

      maze.nexus(cell1).bridge = 1;
      maze.nexus(cell2).bridge = 1;
    }
  };
}
