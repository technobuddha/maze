import { create2dArray } from '@technobuddha/library';

import { type Cell, type CellFacing } from '../geometry/index.ts';

import { MazeSolver, type MazeSolverProperties } from './maze-solver.ts';

/**
 * Configuration properties for the Filler maze solver.
 *
 * @group Solver
 * @category Filler
 */
export type FillerProperties = MazeSolverProperties & {
  /** Color used for marking blocked/filled cells */
  readonly blockedColor?: string;
  /** Method for filling dead ends: 'blind-alley' fills entire paths, 'dead-end' fills only terminal cells */
  readonly method?: 'blind-alley' | 'dead-end';
};

/**
 * Filler maze solver that eliminates dead ends to simplify the maze structure.
 *
 * This algorithm systematically identifies and fills dead-end passages, leaving only
 * the solution path and necessary branching points. Two filling methods are supported:
 * - 'dead-end': Fills only terminal dead-end cells
 * - 'blind-alley': Fills entire dead-end passages back to the first branch point
 *
 * The solver continues until no more dead ends can be found, then traces the
 * remaining simplified path from entrance to exit.
 *
 * @group Solver
 * @category Filler
 */
export class Filler extends MazeSolver {
  /** Color used for marking filled/blocked cells */
  protected readonly markedColor: string;
  /** Filling method: 'dead-end' or 'blind-alley' */
  protected readonly method: FillerProperties['method'];
  /** 2D grid tracking which cells have been marked as dead ends */
  protected readonly deadEnds: boolean[][];

  /**
   * Creates a new Filler solver with specified filling method and visual settings.
   *
   * @param props - Configuration including method and color settings
   */
  public constructor({
    maze,
    blockedColor = maze.color.pruned,
    method = 'blind-alley',
    ...props
  }: FillerProperties) {
    super({ maze, ...props });
    this.markedColor = blockedColor;
    this.method = method;

    this.deadEnds = create2dArray(this.maze.width, this.maze.height, false);
  }

  /**
   * Determines if a cell is a dead end that can be filled.
   *
   * A cell is considered a dead end if:
   * - It's not already marked as filled
   * - It's not the entrance or exit
   * - It has only one unfilled neighbor (or no neighbors)
   *
   * @param cell - The cell to check
   * @param entrance - The maze entrance (protected from filling)
   * @param exit - The maze exit (protected from filling)
   * @returns True if the cell is a fillable dead end
   */
  private isDeadEnd(cell: Cell, entrance: Cell, exit: Cell): boolean {
    return (
      !this.deadEnds[cell.x][cell.y] &&
      !this.maze.isSame(cell, entrance) &&
      !this.maze.isSame(cell, exit) &&
      this.maze.moves(cell, { wall: false }).filter(
        ({ target }) => !this.deadEnds[target.x][target.y],
        // ||
        // this.maze.isSame(target, exit) ||
        // this.maze.isSame(target, entrance),
      ).length <= 1
    );
  }

  /**
   * Solves the maze by systematically filling dead ends until only the solution path remains.
   *
   * The algorithm operates in two phases:
   * 1. **Dead End Elimination**: Repeatedly identifies and fills dead ends using the specified method
   * 2. **Path Tracing**: Follows the remaining simplified path from entrance to exit
   *
   * The 'dead-end' method fills only terminal cells, while 'blind-alley' method
   * traces back entire dead-end passages to their first branch point.
   *
   * @param options - Optional configuration for colors and entrance/exit override
   * @yields After each cell is filled for visualization
   */
  public async *solve({
    markedColor = this.markedColor,
    entrance = this.maze.entrance,
    exit = this.maze.exit,
  } = {}): AsyncGenerator<void> {
    while (true) {
      const deadEnds = this.randomShuffle(
        this.maze.cellsInMaze().filter((cell) => this.isDeadEnd(cell, entrance, exit)),
      );
      if (deadEnds.length === 0) {
        break;
      }

      for (let deadEnd of deadEnds) {
        if (this.method === 'dead-end') {
          this.deadEnds[deadEnd.x][deadEnd.y] = true;
          this.maze.drawCell(deadEnd, markedColor);
          yield;
        } else {
          while (true) {
            const moves = this.maze
              .moves(deadEnd, { wall: false })
              .filter(
                ({ target }) =>
                  !this.deadEnds[target.x][target.y] ||
                  this.maze.isSame(target, exit) ||
                  this.maze.isSame(target, entrance),
              );
            if (moves.length <= 1) {
              this.deadEnds[deadEnd.x][deadEnd.y] = true;
              this.maze.drawCell(deadEnd, markedColor);
              yield;

              if (moves[0].target) {
                deadEnd = moves[0].target;
              } else {
                break;
              }
            } else {
              break;
            }
          }
        }
      }
    }

    let cell: CellFacing = { ...this.maze.entrance };
    let prev: CellFacing | undefined = undefined;
    const path: CellFacing[] = [cell];

    while (!this.maze.isSame(cell, exit)) {
      const moves = this.maze.moves(cell, { wall: false }).filter(
        // eslint-disable-next-line @typescript-eslint/no-loop-func
        ({ target }) => !this.maze.isSame(prev, target) && !this.deadEnds[target.x][target.y],
      );
      if (moves.length === 0 || moves.length > 1) {
        this.maze.sendMessage(`filler ${this.method} no solution found`, { level: 'error' });
        return;
      }

      const [move] = moves;
      prev = cell;
      cell = move.target;
      path.push(cell);
    }

    this.maze.solution = this.maze.makePath(path);
  }
}
