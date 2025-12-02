import { create2dArray } from '@technobuddha/library';

import { type Cell } from '../geometry/index.ts';

import { Robot, type RobotProperties } from './robot.ts';
import { RobotError } from './robot-error.ts';

/**
 * Configuration properties for backtracking robot behavior.
 *
 * Extends standard robot properties with options for tracking and displaying
 * blocked cells during the backtracking algorithm.
 * @group Robot
 * @category  Backtracking
 */
export type BacktrackingRobotProperties = RobotProperties & {
  /** Whether to visually mark blocked cells with X marks */
  showMarks?: boolean;
  /** 2D array tracking which cells are blocked/dead-ends */
  blocked?: boolean[][];
};

/**
 * Robot that navigates mazes using backtracking algorithm.
 *
 * Explores the maze by trying available paths and backtracking when reaching
 * dead ends. Maintains a record of blocked cells to avoid revisiting known
 * dead ends. This is a depth-first search approach that guarantees finding
 * a solution if one exists.
 *
 * @group Robot
 * @category  Backtracking
 */
export class BacktrackingRobot extends Robot {
  public readonly algorithm = 'backtracking';
  private readonly blocked: boolean[][];
  private readonly showMarks: boolean;

  public constructor({ maze, blocked, showMarks = false, ...props }: BacktrackingRobotProperties) {
    super({ maze, ...props });
    this.showMarks = showMarks;
    this.blocked = blocked ?? create2dArray(this.maze.width, this.maze.height, false);
  }

  /**
   * Redraws a cell with optional marking for blocked cells.
   *
   * Extends the base redraw functionality to add X marks on cells that have
   * been identified as blocked, when visual marking is enabled.
   *
   * @param cell - Cell to redraw
   * @param color - Optional color override
   */
  public override redrawCell(cell: Cell, color?: string): void {
    super.redrawCell(cell, color);
    if (this.showMarks && this.blocked[cell.x][cell.y]) {
      this.maze.drawX(cell);
    }
  }

  /**
   * Executes one step of the backtracking algorithm.
   *
   * Evaluates available moves from the current location, filtering out previously
   * visited cells, blocked cells, and the previous position. If no valid moves exist,
   * marks the current cell as blocked and backtracks. Otherwise, selects and moves
   * to the next cell using the decision strategy.
   *
   * @throws {@link RobotError} If unable to decide on a move from available options
   */
  public execute(): void {
    this.redrawCell(this.location);

    const moves = this.maze
      .moves(this.location, { wall: false })
      .filter(
        ({ target }) =>
          !this.maze.isSame(target, this.previous) &&
          !this.blocked[target.x][target.y] &&
          !this.history.some((cell) => this.maze.isSame(cell, target)),
      );

    if (moves.length === 0) {
      if (this.showMarks) {
        this.maze.drawX(this.location);
      }
      this.blocked[this.location.x][this.location.y] = true;

      this.backtrack();
    } else {
      const next = this.decide(moves);
      if (next) {
        this.moveTo(next.target);
      } else {
        throw new RobotError(`${this.name} cannot decide on a move`, this.color);
      }
    }
  }
}
