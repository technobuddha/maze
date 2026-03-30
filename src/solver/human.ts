/* eslint-disable @typescript-eslint/no-loop-func */
import { create2dArray, modulo } from '@technobuddha/library';

import {
  type Cell,
  type CellFacing,
  type CellTunnel,
  type Direction,
  type Facing,
} from '../geometry/index.ts';

import { MazeSolver, type MazeSolverProperties } from './maze-solver.ts';

/**
 * Configuration options for human solver behavior.
 *
 * @group Solver
 * @category Human
 */
export type Options = {
  /** Whether to follow single paths to their final destination automatically */
  finalDestination: boolean;
  /** Whether to mark visited cells with visual indicators */
  markVisited: boolean;
  /** Whether to mark and block dead-end paths */
  markDeadEnds: boolean;
  /** Whether to hide the reverse direction option in navigation choices */
  hideReverse: boolean;
};

/**
 * Extended cell information for human solver pathfinding.
 *
 * @group Solver
 * @category Human
 */
export type CellPath = Cell & {
  /** Direction taken to reach this destination */
  readonly direction: Direction;
  /** Final facing orientation at the destination */
  readonly facing: Facing;
  /** Original branch direction from the starting point */
  readonly branch: Direction;
  /** Complete path with tunnel information for rendering */
  readonly path: CellTunnel[];
  /** Movement history to reach this destination */
  readonly history: CellFacing[];
};

/**
 * Configuration properties for the Human maze solver.
 *
 * @group Solver
 * @category Human
 */
export type HumanProperties = MazeSolverProperties & {
  /** Optional behavior configuration settings */
  readonly options?: Partial<Options>;
};

/**
 * Interactive human-controlled maze solver with keyboard navigation.
 *
 * This solver provides manual navigation through the maze with intelligent
 * destination finding and visual feedback. The solver analyzes possible moves
 * and presents choices to the user, automatically following single paths when
 * configured to do so.
 *
 * Key features:
 * - Keyboard-controlled navigation (Arrow keys, Space, Escape, x)
 * - Visual highlighting of possible destinations
 * - Automatic dead-end detection and marking
 * - Visited cell tracking with visual indicators
 * - Auto-solve mode toggle for computer assistance
 * - Backtracking support
 *
 * Controls:
 * - Arrow Up/Space: Move to selected destination
 * - Arrow Left/Right: Change destination selection
 * - Arrow Down: Backtrack to previous position
 * - Escape: Toggle auto-solve mode
 * - x: Exit solver
 *
 * @group Solver
 * @category Human
 */
export class Human extends MazeSolver {
  /** Current behavior configuration options */
  public options: Options;

  /** 2D grid tracking which cells have been visited */
  protected readonly visited: boolean[][];
  /** 2D grid tracking which cells are marked as dead ends */
  protected readonly deadEnd: boolean[][];

  /** Event target for keyboard event handling */
  private readonly eventTarget = new EventTarget();

  /**
   * Creates a new Human solver with interactive controls and behavior options.
   *
   * @param props - Configuration including behavior options and maze settings
   */
  public constructor({ options, ...props }: HumanProperties) {
    super(props);

    this.visited = create2dArray(this.maze.width, this.maze.height, false);
    this.deadEnd = create2dArray(this.maze.width, this.maze.height, false);

    this.options = {
      finalDestination: true,
      markVisited: true,
      markDeadEnds: true,
      hideReverse: true,
      ...options,
    };
    this.keyHandler = this.initializeKeyboardHandler();
  }

  //#region Keyboard Handler
  /** Keyboard event handler function for capturing user input */
  private readonly keyHandler: (event: KeyboardEvent) => void;

  /**
   * Initializes keyboard event handling for user input capture.
   *
   * @returns The keyboard event handler function
   */
  private initializeKeyboardHandler(): (event: KeyboardEvent) => void {
    const handler = (event: KeyboardEvent): void => {
      this.eventTarget.dispatchEvent(new CustomEvent('keydown', { detail: event.key }));
    };
    document.addEventListener('keydown', handler);
    return handler;
  }

  /**
   * Captures the next keyboard input from the user.
   *
   * @returns Promise that resolves to the pressed key string
   * @throws When key capture is aborted
   */
  private async captureKey(): Promise<string> {
    const ac = new AbortController();
    this.addTrash(ac);

    return new Promise((resolve, reject) => {
      const onAbort = (_event: Event): void => {
        ac.signal.removeEventListener('abort', onAbort);
        this.removeTrash(ac);
        reject(new Error('Key capture aborted'));
      };

      const onKeyDown = (event: Event): void => {
        this.removeTrash(ac);
        resolve((event as CustomEvent).detail);
      };

      ac.signal.addEventListener('abort', onAbort);
      this.eventTarget.addEventListener('keydown', onKeyDown);
    });
  }

  /**
   * Programmatically sends a key event to the solver.
   *
   * Useful for automated testing or scripted navigation.
   *
   * @param key - The key string to simulate
   */
  public sendKey(key: string): void {
    this.eventTarget.dispatchEvent(new CustomEvent('keydown', { detail: key }));
  }
  //#endregion

  /**
   * Analyzes possible destinations from the current cell position.
   *
   * Explores each direction to find meaningful destinations, following
   * single paths to their endpoints when finalDestination is enabled.
   * Automatically marks dead ends when markDeadEnds is enabled.
   *
   * @param cell - Current position and facing direction
   * @returns Array of possible destination cells with path information
   */
  private destinations(cell: CellFacing): CellPath[] {
    type Destination = Cell & {
      direction: Direction;
      facing: Facing;
      readonly branch: Direction;
      readonly history: CellFacing[];
    };

    const toCellPath = (destination: Destination): CellPath => ({
      ...destination,
      path: this.maze.makePath(destination.history),
    });

    const destinations: Destination[] = this.maze.moves(cell, { wall: false }).map((move) => ({
      ...move.target,
      direction: move.direction,
      branch: move.direction,
      history: [cell, move.target],
    }));

    const cellPaths: CellPath[] = [];

    for (const destination of destinations) {
      let prev = cell;

      while (true) {
        const next = this.maze
          .moves(destination, { wall: false })
          .filter(({ target: m }) => !this.deadEnd[m.x][m.y] && !this.maze.isSame(m, prev));

        if (next.length === 0) {
          // dead end
          if (this.maze.isSame(destination, this.maze.exit)) {
            cellPaths.push(toCellPath(destination));
          } else if (this.options.markDeadEnds) {
            for (const h of destination.history) {
              this.deadEnd[h.x][h.y] = true;
              if (!this.maze.isSame(h, this.maze.entrance)) {
                this.maze.drawX(this.maze.drawCell(h));
              }
            }

            this.deadEnd[destination.x][destination.y] = true;
            if (!this.maze.isSame(destination, this.maze.entrance)) {
              this.maze.drawX(this.maze.drawCell(destination));
            }
          } else {
            destination.history.push(destination);
          }
          break;
        } else if (next.length === 1) {
          // single path
          if (this.options.finalDestination) {
            prev = { x: destination.x, y: destination.y, facing: destination.facing };
            destination.history.push(next[0].target);
            destination.x = next[0].target.x;
            destination.y = next[0].target.y;
            destination.facing = next[0].target.facing;
            destination.direction = next[0].direction;
          } else {
            cellPaths.push(toCellPath(destination));
            break;
          }
        } else {
          cellPaths.push(toCellPath(destination));
          break;
        }
      }
    }

    return cellPaths;
  }

  /**
   * Restores the visual appearance of a cell based on its current state.
   *
   * Updates cell rendering to show dead ends (X marks), visited cells,
   * or normal cell appearance depending on the cell's status.
   *
   * @param cell - The cell to restore visually
   */
  private restoreCell(cell: Cell): void {
    this.maze.drawCell(cell);
    if (this.deadEnd[cell.x][cell.y]) {
      this.maze.drawX(this.maze.drawCell(cell), 'red');
    } else if (this.visited[cell.x][cell.y]) {
      this.maze.drawCell(cell);
      this.maze.drawAvatar(cell, '#444444');
    }
  }

  /**
   * Interactively solves the maze with human keyboard input.
   *
   * Presents navigation choices to the user with visual highlighting
   * and processes keyboard commands for movement, backtracking, and
   * mode switching. Supports both manual navigation and auto-solve modes.
   *
   * The solver continues until the user reaches the exit or manually exits.
   *
   * @param options - Optional entrance and exit override points
   * @yields After each user interaction for visual updates
   */
  public async *solve({
    entrance = this.maze.entrance,
    exit = this.maze.exit,
  } = {}): AsyncGenerator<void> {
    const history: CellFacing[] = [entrance];
    let autoSolve = false;
    let human: CellFacing = entrance;
    let reverse = human;
    let destinations: CellPath[] = [];
    let choice = 0;
    let bias = true;

    while (!this.maze.isSame(human, exit)) {
      for (const move of destinations) {
        for (const subMove of move.path) {
          this.restoreCell(subMove);
        }
        this.restoreCell(move);
      }
      this.restoreCell(reverse);

      if (autoSolve) {
        // The first element of the solution is the starting point, so we skip it.
        const [, ...solution] = this.maze.solve(human);
        const [next] = solution;
        const walk = this.maze.walkTo(human, next);

        destinations = [
          {
            ...this.maze.exit,
            path: this.maze.makePath(solution),
            history: solution,
            direction: walk!.direction,
            branch: walk!.direction,
          },
        ];
      } else {
        destinations = this.destinations(human);
      }

      const turns = this.maze.straight(this.maze.isSame(human, entrance) ? entrance : human, bias);
      bias = !bias;

      if (this.options.hideReverse && destinations.length > 1) {
        destinations = destinations.filter((c) => !this.maze.isSame(c, reverse));
      }
      destinations = destinations.sort(
        (a, b) =>
          (this.visited[a.x][a.y] ? 1 : 0) - (this.visited[b.x][b.y] ? 1 : 0) ||
          turns.indexOf(a.branch) - turns.indexOf(b.branch),
      );

      choice = 0;

      for (const move of destinations) {
        for (const subMove of move.path) {
          this.restoreCell(subMove);
        }
        this.maze.drawPaths(move.path);
      }

      this.maze.drawStar(human, this.maze.color.avatar);
      yield;

      makeChoice: while (true) {
        for (const move of destinations) {
          this.maze.drawCell(move);
          this.maze.drawAvatar(
            move,
            this.maze.isSame(move, destinations[choice]) ? 'lime' : 'yellow',
          );
        }

        try {
          const key = await this.captureKey();

          switch (key) {
            case 'ArrowUp':
            case ' ': {
              // eslint-disable-next-line require-atomic-updates
              reverse = human;

              const { x, y, facing } = destinations[choice];
              human = { x, y, facing };

              for (const path of destinations[choice].path) {
                if (this.options.markVisited && !path.tunnel) {
                  this.visited[path.x][path.y] = true;
                }
              }

              history.push(...destinations[choice].history);

              if (this.options.markVisited) {
                this.visited[human.x][human.y] = true;
              }
              break makeChoice;
            }

            case 'ArrowRight': {
              choice = modulo(choice + 1, destinations.length);
              break;
            }

            case 'ArrowLeft': {
              choice = modulo(choice - 1, destinations.length);
              break;
            }

            case 'ArrowDown': {
              if (this.maze.isSame(human, history.at(-1))) {
                history.pop();
              }
              human = history.pop() ?? human;

              this.deadEnd[human.x][human.y] = false;
              break makeChoice;
            }

            case 'Escape': {
              autoSolve = !autoSolve;
              break makeChoice;
            }

            case 'x': {
              return;
            }

            // no default
          }
        } catch {
          break;
        }
      }
    }

    this.maze.solution = this.maze.makePath(this.maze.flatten(history));
  }

  /**
   * Cleans up resources and removes event listeners.
   *
   * Removes the keyboard event listener to prevent memory leaks
   * when the solver is disposed.
   */
  public override dispose(): void {
    super.dispose();
    document.removeEventListener('keydown', this.keyHandler);
  }
}
