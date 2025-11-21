import { create2dArray } from '@technobuddha/library';

import { type Cell, type Direction, type Move } from '../geometry/index.ts';
import { darken } from '../library/index.ts';

import { Robot, type RobotProperties } from './robot.ts';
import { RobotError } from './robot-error.ts';

/**
 * Configuration properties for the Trémaux algorithm robot.
 *
 * @group Robot
 * @category Properties
 */
export type TremauxRobotProperties = RobotProperties & {
  /** Whether to visually mark passages with traversal indicators */
  showMarks?: boolean;
  /** Color for single-traversal path markings */
  pathColor?: string;
  /** Color for blocked/double-traversal path markings */
  blockedColor?: string;
};

/**
 * Trémaux algorithm maze-solving robot that marks passages to avoid loops.
 *
 * The Trémaux algorithm is a systematic method for solving mazes that guarantees
 * a solution by marking passages as they are traversed. It uses a marking system
 * where passages can be marked 0 (unmarked), 1 (traversed once), or 2 (blocked/traversed twice).
 *
 * Algorithm rules:
 * 1. **Unmarked passages**: If only unmarked passages exist, choose any unmarked path
 * 2. **All marked once**: If all forward passages are marked once, backtrack through entrance
 * 3. **Mixed markings**: Choose the passage with the fewest marks (0 preferred, then 1)
 * 4. **Dead ends**: Mark passages twice to indicate they lead to dead ends
 *
 * Key behaviors:
 * - Systematic passage marking prevents infinite loops
 * - Backtracking when all forward paths are explored
 * - Visual indicators show traversal history when showMarks is enabled
 * - Guaranteed to find a solution in finite time for any solvable maze
 * - Uses star avatar to distinguish from other robot types
 *
 * @group Robot
 * @category Algorithms
 */
export class TremauxRobot extends Robot {
  /** Algorithm identifier for this robot type */
  public readonly algorithm = 'trémaux';
  /** Whether to display visual passage markings */
  protected readonly showMarks: boolean;
  /** Color for single-traversal markings */
  protected readonly markedColor: string;
  /** Color for blocked/double-traversal markings */
  protected readonly blockedColor: string;
  /** 2D array tracking passage markings for each cell and direction */
  protected readonly marks: Record<Direction, number>[][];

  /**
   * Creates a new Trémaux algorithm robot with specified configuration.
   *
   * Initializes the marking system with zero marks for all valid passages
   * and sets up visual colors for different marking states.
   *
   * @param props - Configuration including maze, visual options, and colors
   */
  public constructor({
    maze,
    program = 'random',
    showMarks = false,
    pathColor = maze.color.path,
    blockedColor = maze.color.blocked,
    ...props
  }: TremauxRobotProperties) {
    super({ maze, program, ...props });
    this.showMarks = showMarks;
    this.markedColor = darken(pathColor, 0.15);
    this.blockedColor = darken(blockedColor, 0.15);

    this.marks = create2dArray(
      this.maze.width,
      this.maze.height,
      (x, y) =>
        Object.fromEntries(
          Object.entries(this.maze.nexus({ x: x, y: y }).walls).map(([k]) => [k as Direction, 0]),
        ) as Record<Direction, number>,
    );

    this.avatar = (cell, color) => this.maze.drawStar(cell, color);
  }

  /**
   * Draws a visual mark on a passage to indicate traversal count.
   *
   * Renders passage markings when showMarks is enabled, using different
   * colors to distinguish between single traversals (marked once) and
   * blocked passages (marked twice).
   *
   * @param cell - The cell containing the passage
   * @param direction - The direction of the passage to mark
   */
  private drawMark(cell: Cell, direction: Direction): void {
    if (this.showMarks) {
      const m = this.marks[cell.x][cell.y][direction];
      this.maze.drawWall(cell, direction, m === 1 ? this.markedColor : this.blockedColor);
    }
  }

  /**
   * Executes a move with proper passage marking and visual updates.
   *
   * Increments the mark count for both the departure and arrival passages
   * (marking both sides of the traversal), updates the robot's position,
   * and refreshes visual markings for affected cells.
   *
   * @param next - The move to execute with target position and direction
   */
  protected move(next: Move): void {
    this.marks[this.location.x][this.location.y][next.direction] = Math.min(
      this.marks[this.location.x][this.location.y][next.direction] + 1,
      2,
    );
    this.marks[next.target.x][next.target.y][this.maze.opposite(next.target.facing)] = Math.min(
      this.marks[next.target.x][next.target.y][this.maze.opposite(next.target.facing)] + 1,
      2,
    );

    this.redrawCell(this.location);
    this.moveTo(next.target);

    for (const direction of Object.keys(
      this.marks[this.previous.x][this.previous.y],
    ) as Direction[]) {
      this.drawMark(this.previous, direction);
    }

    for (const direction of Object.keys(
      this.marks[this.location.x][this.location.y],
    ) as Direction[]) {
      this.drawMark(this.location, direction);
    }
  }

  /**
   * Executes one step of the Trémaux algorithm.
   *
   * Analyzes available moves and current passage markings to determine
   * the next action according to Trémaux rules:
   *
   * 1. If unmarked passages exist, select one using the decision program
   * 2. If all forward passages are marked once and backtrack is possible, backtrack
   * 3. Otherwise, select the passage with the fewest marks
   *
   * Throws an error if no valid moves can be determined.
   *
   * @throws {@link RobotError} When unable to find a valid move or make a decision
   */
  public execute(): void {
    const moves = this.maze.moves(this.location, { wall: false });
    if (moves.length === 0) {
      throw new RobotError(`${this.name} cannot find a move`, this.color);
    }

    const pmi = moves.findIndex(({ target }) => this.maze.isSame(target, this.previous));
    const prevMove = pmi >= 0 ? moves[pmi] : undefined;

    if (pmi >= 0) {
      moves.splice(pmi, 1);
    }

    const marks = this.marks[this.location.x][this.location.y];

    if (moves.length > 0 && moves.every((m) => marks[m.direction] === 0)) {
      // * If only the entrance you just came from is marked, pick an arbitrary unmarked
      // * entrance, if any. This rule also applies if you're just starting in the middle
      // * of the maze and there are no marked entrances at all.
      const next = this.decide(moves);
      if (next) {
        this.move(next);
      } else {
        throw new RobotError(`${this.name} cannot decide`, this.color);
      }
    } else if (
      prevMove &&
      moves.every((m) => marks[m.direction] === 1) &&
      marks[prevMove.direction] < 2
    ) {
      // * If all entrances are marked, go back through the entrance you just came from,
      // * unless it is marked twice. This rule will apply whenever you reach a dead end.
      this.move(prevMove);
    } else if (moves.length === 0) {
      if (prevMove) {
        this.move(prevMove);
      } else {
        throw new RobotError(`${this.name} cannot find a move`, this.color);
      }
    } else {
      // * Pick any entrance with the fewest marks (zero if possible, else one).
      const ranked = this.randomShuffle(
        moves.map((move) => ({ ...move, marks: marks[move.direction] })),
      ).sort((a, b) => a.marks - b.marks);
      const best = ranked.filter((move) => move.marks === ranked[0].marks);

      const next = this.decide(best);
      if (next) {
        this.move(next);
      } else {
        throw new RobotError(`${this.name} cannot decide`, this.color);
      }
    }
  }
}
