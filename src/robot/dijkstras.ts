import { create2dArray } from '@technobuddha/library';

import { type Cell, type CellFacing } from '../geometry/index.ts';

import { Robot, type RobotProperties } from './robot.ts';

/**
 * Journal entry for tracking Dijkstra's algorithm state at each cell.
 *
 * @group Robot
 * @category  Dijkstras
 */
type Journal = {
  /** Parent cell in the shortest path tree */
  parent?: CellFacing;
  /** Shortest distance from the starting point */
  distance: number;
  /** Number of unprocessed child cells (for pruning visualization) */
  children?: number;
};

/**
 * Queue entry for Dijkstra's algorithm processing.
 *
 * @group Robot
 * @category  Dijkstras
 */
type Queue = {
  /** Cell position and facing direction */
  cell: CellFacing;
  /** Distance from the starting point */
  distance: number;
  /** Parent cell for path reconstruction */
  parent?: CellFacing;
};

/**
 * Configuration properties for the Dijkstra's algorithm robot.
 *
 * @group Robot
 * @category  Dijkstras
 */
export type DijkstrasRobotProperties = Omit<RobotProperties, 'program' | 'showPath'> & {
  /** Whether to visually mark scanned and pruned cells */
  readonly showMarks?: boolean;
  /** Color for marking cells that have been scanned */
  readonly scannedColor?: string;
  /** Color for marking cells that have been pruned (dead ends) */
  readonly prunedColor?: string;
  /** Color for the robot avatar indicator */
  readonly avatarColor?: string;
};

/**
 * Dijkstra's algorithm maze-solving robot that finds the shortest path.
 *
 * This robot implements Dijkstra's shortest path algorithm, systematically exploring
 * the maze to build a shortest-path tree from the entrance. It maintains a priority
 * queue of cells to visit and tracks distances to ensure the optimal solution.
 *
 * Key behaviors:
 * - Uses breadth-first exploration to guarantee shortest path
 * - Maintains a journal of distances and parent relationships
 * - Prunes dead-end branches when no unvisited neighbors remain
 * - Provides visual feedback showing scanned vs pruned areas
 * - Reconstructs the optimal path from entrance to exit
 *
 * The algorithm guarantees finding the shortest path if one exists, making it
 * ideal for scenarios where optimality is more important than speed.
 *
 * @group Robot
 * @category  Dijkstras
 */
export class DijkstrasRobot extends Robot {
  /** Algorithm identifier for this robot type */
  public readonly algorithm = 'dijkstras';
  /** Whether to display visual markers for algorithm progress */
  public readonly showMarks: boolean;
  /** Color for marking scanned cells */
  public readonly scannedColor: string;
  /** Color for marking pruned cells */
  public readonly prunedColor: string;
  /** Color for the robot avatar */
  public readonly avatarColor: string;

  /** Priority queue of cells to process */
  protected readonly queue: Queue[];
  /** 2D array tracking algorithm state for each cell */
  protected readonly journal: Journal[][];
  /** 2D array tracking which cells have been scanned */
  protected readonly scanned: boolean[][];

  /**
   * Creates a new Dijkstra's algorithm robot with specified configuration.
   *
   * @param props - Configuration including maze, visual options, and colors
   */
  public constructor({
    maze,
    showMarks = false,
    scannedColor = maze.color.scanned,
    avatarColor = maze.color.avatar,
    prunedColor = maze.color.pruned,
    ...props
  }: DijkstrasRobotProperties) {
    super({ maze, program: 'random', ...props });
    this.showMarks = showMarks;
    this.scannedColor = scannedColor;
    this.avatarColor = avatarColor;
    this.prunedColor = prunedColor;

    this.scanned = create2dArray<boolean>(maze.width, maze.height, false);
    this.journal = create2dArray<Journal>(this.maze.width, this.maze.height, () => ({
      distance: Infinity,
    }));

    this.scanned[this.maze.entrance.x][this.maze.entrance.y] = true;
    this.queue = [{ cell: this.maze.entrance, distance: 0 }];
  }

  /**
   * Gets the display name for this robot.
   *
   * @returns The algorithm name as the robot identifier
   */
  public override get name(): string {
    return this.algorithm;
  }

  /**
   * Redraws a cell with algorithm-specific visual indicators.
   *
   * Shows pruned cells (dead ends) in pruned color and scanned cells
   * with dots when showMarks is enabled. Uses different colors to
   * distinguish between active paths and eliminated branches.
   *
   * @param cell - The cell to redraw
   * @param color - Optional color override for the cell
   */
  protected override redrawCell(cell: Cell, color?: string): void {
    const journal = this.journal[cell.x][cell.y];
    const children = journal.children ?? 0;

    super.redrawCell(cell, this.showMarks && children <= 0 ? this.prunedColor : color);
    if (this.showMarks && journal.distance !== Infinity && children > 0) {
      this.maze.drawDot(cell, this.scannedColor);
    }
  }

  /**
   * Executes one step of Dijkstra's algorithm.
   *
   * Processes the next cell from the queue, updating distances and parent
   * relationships. Adds unvisited neighbors to the queue for future processing.
   * When a dead end is reached, backtracks through the tree to prune branches
   * that no longer lead to unexplored areas.
   *
   * The algorithm continues until the queue is empty or the exit is reached,
   * building a complete shortest-path tree of the accessible maze area.
   */
  public execute(): void {
    const q = this.queue.pop();
    if (q) {
      const { cell, distance, parent } = q;

      const validMoves = this.randomShuffle(
        this.maze
          .moves(cell, { wall: false })
          .filter(({ target }) => !this.scanned[target.x][target.y]),
      );

      this.journal[cell.x][cell.y].parent = parent;
      this.journal[cell.x][cell.y].distance = distance;
      this.journal[cell.x][cell.y].children = validMoves.length;
      this.moveTo(cell);

      if (validMoves.length > 0) {
        for (const validMove of validMoves) {
          this.scanned[validMove.target.x][validMove.target.y] = true;
          this.queue.unshift({ cell: validMove.target, distance: distance + 1, parent: cell });
        }
      } else if (!this.maze.isSame(cell, this.maze.exit)) {
        let parent = cell;
        while (parent) {
          this.journal[parent.x][parent.y].children ??= 0;
          this.journal[parent.x][parent.y].children!--;

          if (this.journal[parent.x][parent.y].children! <= 0) {
            if (!this.maze.isSame(parent, cell)) {
              this.redrawCell(parent);
            }
            parent = this.journal[parent.x][parent.y].parent!;
          } else {
            break;
          }
        }
      }
    }
  }

  /**
   * Reconstructs the shortest path from entrance to exit.
   *
   * Uses the parent relationships stored in the journal to backtrack
   * from the exit to the entrance, building the optimal path that
   * Dijkstra's algorithm discovered.
   *
   * @returns Array of cells representing the shortest path
   */
  public override path(): CellFacing[] {
    let cell = this.maze.exit;
    const path: CellFacing[] = [cell];

    for (
      let dist = this.journal[cell.x][cell.y];
      dist.parent;
      dist = this.journal[dist.parent.x][dist.parent.y]
    ) {
      cell = dist.parent;
      path.unshift(cell);
    }

    return path;
  }
}
