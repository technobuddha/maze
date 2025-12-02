import { JSONSet, modulo, Random, type RandomProperties } from '@technobuddha/library';

import {
  type Cell,
  type CellFacing,
  type CellTunnel,
  type Maze,
  type Move,
} from '../geometry/index.ts';
import { darken } from '../library/index.ts';
import { type MessageOptions } from '../message-controller/index.ts';

/**
 * Decision-making strategies for robot navigation.
 *
 * @group Robot
 * @category  Robot
 */
export type Program =
  | 'random'
  | 'seek'
  | 'straight'
  | 'left-turn'
  | 'right-turn'
  | 'right-wall'
  | 'left-wall';

/**
 * Configuration properties for robot initialization.
 * @group Robot
 * @category  Robot
 */
export type RobotProperties = RandomProperties & {
  /** The maze to navigate */
  maze: Maze;
  /** Color for the robot avatar */
  color?: string;
  /** Starting location and facing direction */
  location: CellFacing;
  /** Navigation strategy program */
  program?: Program;
  /** Number of trail markers to display (0 = none) */
  trails?: number;
  /** Whether to show the current path to the robot's location */
  showPath?: boolean;
  /** Custom cell drawing function */
  drawCell?: (cell: Cell, color?: string) => void;
};

/**
 * Abstract base class for maze-solving robots.
 *
 * Provides common functionality for robot navigation including movement tracking,
 * path visualization, decision-making strategies, and visual feedback through trails
 * and avatars. Specific solving algorithms extend this class to implement their
 * unique exploration strategies.
 *
 * @group Robot
 * @category  Robot
 */
export abstract class Robot extends Random implements Disposable {
  /** Color used for the robot avatar and visual indicators */
  public readonly color: string;
  /** Current cell position and facing direction */
  public location: CellFacing;
  /** Active navigation strategy program */
  public program: Program;

  protected previous: CellFacing;
  protected readonly history: CellFacing[];
  protected readonly trails: number;
  protected readonly trail: CellFacing[] = [];
  protected readonly showPath: boolean;
  protected readonly start: CellFacing;
  protected readonly maze: Maze;
  protected drawCell: (cell: Cell, color?: string) => void;
  protected avatar: (cell: Cell, color: string) => void;
  protected bias = true;
  protected pathSet = new JSONSet<CellTunnel>();

  private seekingWall = true;

  public constructor({
    maze,
    location = maze.entrance,
    color = maze.color.avatar,
    trails = 0,
    showPath = false,
    program = 'random',
    random = maze.random,
    drawCell = (cell, color) => maze.drawCell(cell, color),
    ...props
  }: RobotProperties) {
    super({ random, ...props });
    this.maze = maze;

    this.program = program;

    this.color = color;
    this.trails = trails;
    this.showPath = showPath;
    this.drawCell = drawCell;

    this.location = location;
    this.previous = location;
    this.start = location;
    this.history = [location];

    this.avatar = (cell, color) => this.maze.drawAvatar(cell, color);
  }

  /**
   * Identifier for the algorithm implemented by this robot.
   *
   * Must be overridden by subclasses to specify the algorithm name.
   */
  public abstract algorithm: string;

  /**
   * Gets the display name for this robot.
   *
   * Combines the algorithm name with the current navigation program.
   *
   * @returns Formatted robot name
   */
  public get name(): string {
    return `${this.algorithm} ${this.program}`;
  }

  /**
   * Redraws a cell with appropriate visual indicators.
   *
   * Updates the cell's appearance and adds trail markers if the cell
   * is part of the robot's recent movement trail.
   *
   * @param cell - Cell to redraw
   * @param color - Optional color override
   */
  protected redrawCell(cell: Cell, color?: string): void {
    this.drawCell(cell, color);

    const index = this.trail.findIndex((c) => this.maze.isSame(c, cell));
    if (index > 0) {
      this.avatar(cell, darken(this.color, (0.5 / this.trail.length) * (index + 1)));
      this.maze.drawDot(cell, this.maze.color.cell);
    }
  }

  /**
   * Updates the visual path display from entrance to current location.
   *
   * Redraws path segments that have changed since the last update, removing
   * old path markers and adding new ones as the robot explores.
   */
  protected drawPath(): void {
    if (this.showPath) {
      const currentPathSet = new JSONSet<CellTunnel>(this.maze.makePath(this.path()));

      for (const path of this.pathSet.difference(currentPathSet)) {
        this.drawCell(path);
      }

      for (const path of currentPathSet.difference(this.pathSet)) {
        this.maze.drawPath(path);
      }
      this.pathSet = currentPathSet;
    }
  }

  /**
   * Manages the visual trail markers showing recent robot movement.
   *
   * Maintains a fixed-length trail of the robot's recent positions, drawing
   * fading avatar markers to show the movement history.
   */
  protected drawTrails(): void {
    if (this.trails > 0) {
      while (this.trail.length > this.trails) {
        const cell = this.trail.pop()!;
        this.redrawCell(cell);
      }

      for (let i = this.trail.length - 1; i >= 0; i--) {
        const cell = this.trail[i];
        this.redrawCell(cell);
        this.avatar(cell, darken(this.color, (0.5 / this.trail.length) * (i + 1)));
        this.maze.drawDot(cell, this.maze.color.cell);
      }

      this.trail.unshift(this.location);
    }
  }

  /**
   * Moves the robot to a new cell.
   *
   * Updates the robot's position, tracking history, and redraws affected cells
   * with appropriate visual indicators including trails and paths.
   *
   * @param next - Target cell and facing direction
   */
  protected moveTo(next: CellFacing): void {
    this.redrawCell(this.location);

    this.history.push({ ...this.location });
    this.previous = this.location;
    this.location = next;

    this.drawPath();
    this.drawTrails();
    this.redrawCell(this.location);
    this.avatar(this.location, this.color);
  }

  /**
   * Backtracks to the previous position in the movement history.
   *
   * Reverses the last move, updating position and history while maintaining
   * visual consistency with trails and paths.
   */
  protected backtrack(): void {
    this.redrawCell(this.location);

    this.history.pop();
    this.location = this.previous;
    this.previous = this.history.at(-1) ?? this.start;

    this.drawPath();
    this.drawTrails();
    this.redrawCell(this.location);
    this.avatar(this.location, this.color);
  }

  /**
   * Selects the next move from available options using the configured program strategy.
   *
   * Applies the robot's navigation program to choose which direction to move:
   * - random: Random selection from available moves
   * - seek: Prefers moves closer to the exit
   * - straight: Attempts to continue in the same direction
   * - left-turn: Prioritizes left turns
   * - right-turn: Prioritizes right turns
   * - left-wall: Follows the left wall (wall-following algorithm)
   * - right-wall: Follows the right wall (wall-following algorithm)
   *
   * @param moves - Available moves from the current position
   * @returns Selected move, or undefined if no valid move exists
   */
  protected decide(moves: Move[]): Move | undefined {
    if (moves.length === 0) {
      return undefined;
    }

    switch (this.program) {
      case 'random': {
        return this.randomPick(moves);
      }

      case 'seek': {
        const closest = moves
          .map((m) => ({
            move: m,
            distance: this.maze.manhattanDistance(m.target, this.maze.exit),
          }))
          .sort((a, b) => a.distance - b.distance);

        return this.randomPick(closest.filter((c) => c.distance === closest[0].distance))!.move;
      }

      case 'left-turn': {
        for (const direction of this.maze.leftTurn(this.location)) {
          const move = moves.find((m) => m.direction === direction);
          if (move) {
            return move;
          }
        }
        return undefined;
      }

      case 'right-turn': {
        for (const direction of this.maze.rightTurn(this.location)) {
          const move = moves.find((m) => m.direction === direction);
          if (move) {
            return move;
          }
        }
        return undefined;
      }

      case 'right-wall': {
        const right = this.maze.rightTurn(this.location);
        const { walls } = this.maze.nexus(this.location);

        if (this.seekingWall) {
          const wall = right.findIndex((t) => walls[t] === true);
          if (wall >= 0) {
            // We are seeking a wall, and we found one
            this.seekingWall = false;

            const dirs = new Set(moves.map((m) => m.direction));
            let next = wall;
            while (!dirs.has(right[next])) {
              next = modulo(next + 1, right.length);
              if (next === wall) {
                // We have gone all the way around, so we will just pick the first
                return undefined;
              }
            }

            return moves.find((m) => m.direction === right[next]);
          }

          this.bias = !this.bias;
          const [first] = this.maze.straight(this.location, this.bias);
          return moves.find((m) => m.direction === first);
        }

        const [first] = right.map((t) => moves.find((m) => m.direction === t)).filter(Boolean);
        return first;
      }

      case 'left-wall': {
        const left = this.maze.leftTurn(this.location);
        const { walls } = this.maze.nexus(this.location);

        if (this.seekingWall) {
          const wall = left.findIndex((t) => walls[t] === true);
          if (wall >= 0) {
            // We are seeking a wall, and we found one
            this.seekingWall = false;

            const dirs = new Set(moves.map((m) => m.direction));
            let next = wall;
            while (!dirs.has(left[next])) {
              next = modulo(next + 1, left.length);
              if (next === wall) {
                // We have gone all the way around, so we will just pick the first
                return undefined;
              }
            }

            return moves.find((m) => m.direction === left[next]);
          }

          this.bias = !this.bias;
          const [first] = this.maze.straight(this.location, this.bias);
          return moves.find((m) => m.direction === first);
        }

        const [first] = left.map((t) => moves.find((m) => m.direction === t)).filter(Boolean);
        return first;
      }

      case 'straight': {
        this.bias = !this.bias;
        for (const direction of this.maze.straight(this.location, this.bias)) {
          const move = moves.find((m) => m.direction === direction);
          if (move) {
            return move;
          }
        }
        return undefined;
      }

      default: {
        return moves[0];
      }
    }
  }

  /**
   * Executes one step of the robot's algorithm.
   *
   * Must be implemented by subclasses to define the specific behavior
   * of each algorithm at each step of execution.
   */
  public abstract execute(): void;

  /**
   * Sends a message through the maze's message controller.
   *
   * @param message - Message text to display
   * @param options - Message display options
   */
  public sendMessage(message: string, options: MessageOptions = {}): void {
    this.maze.sendMessage(message, options);
  }

  /**
   * Gets the complete path from entrance to current location.
   *
   * Returns the full history of cells visited from the starting position
   * to the robot's current location.
   *
   * @returns Array of cells representing the robot's path
   */
  public path(): CellFacing[] {
    return [...this.history, this.location];
  }

  //#region Disposable
  /**
   * Cleans up the robot's visual artifacts.
   *
   * Removes trail markers and redraws cells to their default appearance
   * when the robot is disposed.
   */
  public dispose(): void {
    if (this.trails > 0) {
      for (const cell of this.trail) {
        this.redrawCell(cell);
      }
    } else {
      this.redrawCell(this.location);
    }
  }

  /**
   * Symbol.dispose implementation for using statement compatibility.
   *
   * Enables automatic resource cleanup when used with JavaScript's
   * explicit resource management (using statement).
   */
  public [Symbol.dispose](): void {
    this.dispose();
  }
  //#endregion
}
