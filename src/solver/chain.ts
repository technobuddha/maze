import { type Cartesian, create2dArray, JSONSet } from '@technobuddha/library';

import { type Cell, type CellFacing, type CellTunnel } from '../geometry/index.ts';
import { type Robot } from '../robot/index.ts';

import { Roboto, type RobotoProperties } from './roboto.ts';

/**
 * Chain-following maze solver that builds a direct path to the exit and uses robots to navigate obstacles.
 *
 * The Chain solver first constructs a direct chain of cells from entrance to exit using Manhattan distance,
 * then follows this chain while deploying robots to find paths around blocked sections.
 *
 * @group Solver
 * @category  Chain
 */
export type ChainProperties = Omit<RobotoProperties, 'robots'> & {
  /** Direction preference for robot turns when navigating obstacles */
  turn?: 'right' | 'left';
  /** Type of robot algorithm to deploy when obstacles are encountered */
  robot?: 'wall-walking' | 'backtracking' | 'tremaux';
  /** Color for rendering the current avatar position */
  avatarColor?: string;
  /** Color for rendering the solution path */
  pathColor?: string;
  /** Color for rendering the chain links */
  chainColor?: string;
};

/**
 * Chain-following maze solving algorithm that builds a direct path and uses helper robots.
 *
 * This solver creates a chain of cells that provides the most direct route to the exit,
 * then attempts to follow this chain. When blocked by walls, it deploys robot solvers
 * to find alternative paths that reconnect to the chain further ahead.
 *
 * @group Solver
 * @category  Chain
 */
export class Chain extends Roboto {
  /** Color used for rendering the current avatar position */
  private readonly avatarColor: NonNullable<ChainProperties['avatarColor']>;
  /** Color used for rendering the solution path */
  private readonly pathColor: NonNullable<ChainProperties['avatarColor']>;
  /** Color used for rendering the chain links */
  private readonly chainColor: NonNullable<ChainProperties['avatarColor']>;

  /** Current position and facing direction in the maze */
  private current: CellFacing = this.maze.entrance;
  /** Sequence of cells forming the direct chain to the exit */
  private chain: CellFacing[] = [];
  /** Complete movement history for building the final solution */
  private history: CellFacing[] = [];
  /** Current path with tunnel information for rendering */
  private path: CellTunnel[] = [];
  /** Grid tracking blocked cells for robot navigation */
  private readonly blocked: boolean[][];
  /** Factory function for creating robots with specific configurations */
  private readonly makeRobot: (turn: 'right' | 'left', color: string) => Robot;

  /**
   * Creates a new Chain solver with specified configuration.
   *
   * @param props - Configuration properties for the Chain solver
   */
  public constructor({
    maze,
    robot = 'wall-walking',
    avatarColor = maze.color.avatar,
    pathColor = maze.color.path,
    chainColor = '#EEEEEE',
    ...props
  }: ChainProperties) {
    super({ maze, robots: [], ...props });

    this.avatarColor = avatarColor;
    this.pathColor = pathColor;
    this.chainColor = chainColor;

    this.blocked = create2dArray(maze.width, maze.height, false);

    this.makeRobot =
      robot === 'wall-walking' ?
        (turn: 'right' | 'left', color: string) =>
          this.createRobot(
            {
              algorithm: 'wall-walking',
              turn,
              color,
              drawCell: this.restoreCell.bind(this),
            },
            this.current,
          )
      : robot === 'backtracking' ?
        (turn: 'right' | 'left', color: string) =>
          this.createRobot(
            {
              algorithm: 'backtracking',
              program: turn === 'right' ? 'right-turn' : 'left-turn',
              color,
              drawCell: this.restoreCell.bind(this),
              blocked: this.blocked,
            },
            this.current,
          )
      : (turn: 'right' | 'left', color: string) =>
          this.createRobot(
            {
              algorithm: 'tremaux',
              program: turn === 'right' ? 'right-turn' : 'left-turn',
              color,
              drawCell: this.restoreCell.bind(this),
            },
            this.current,
          );
  }

  /**
   * Restores the visual appearance of a cell based on its current state.
   *
   * Updates cell rendering to show avatar, path indicators, or chain links
   * depending on the cell's role in the current solving state.
   *
   * @param cell - The cell to restore visually
   */
  private restoreCell(cell: Cell): void {
    this.maze.drawCell(cell);

    const pathCell = this.path.find((c) => this.maze.isSame(c, cell));

    if (this.maze.isSame(cell, this.current)) {
      this.maze.drawAvatar(cell, this.avatarColor);
    } else if (pathCell) {
      this.maze.drawPath(this.maze.drawCell(pathCell), this.pathColor);
    } else if (this.chain.some((c) => this.maze.isSame(c, cell))) {
      this.maze.drawAvatar(cell, this.chainColor);
    }
  }

  /**
   * Moves the current position to a new cell and updates visual rendering.
   *
   * @param cell - The new cell position and facing direction
   */
  private moveTo(cell: CellFacing): void {
    const location = this.current;

    this.current = cell;

    this.restoreCell(location);
    this.restoreCell(cell);
  }

  /**
   * Solves the maze using chain-following algorithm with robot assistance.
   *
   * First builds a direct chain of cells to the exit using Manhattan distance heuristic,
   * then attempts to follow this chain. When blocked by walls, deploys helper robots
   * to find alternative paths that reconnect to the chain further ahead.
   *
   * @param options - Optional entrance and exit override points
   * @yields After each step of the solving process for animation
   * @throws When unable to build a viable chain to the exit
   */
  public override async *solve({
    /** Starting position (defaults to maze entrance) */
    entrance = this.maze.entrance,
    /** Target position (defaults to maze exit) */
    exit = this.maze.exit,
  } = {}): AsyncGenerator<void> {
    let link: CellFacing = entrance;
    this.chain = [link];
    while (!this.maze.isSame(link, exit)) {
      this.maze.drawAvatar(this.maze.drawCell(link), this.chainColor);
      yield;
      const closest = this.maze
        .moves(link, { wall: 'all' })
        .filter(({ target }) => !this.chain.some((c) => this.maze.isSame(c, target)))
        .map((m) => ({
          move: m,
          distance: this.maze.manhattanDistance(m.target, this.maze.exit),
        }))
        .sort((a, b) => a.distance - b.distance);

      if (closest.length === 0) {
        throw new Error('Unable to build a chain');
      }

      const { target } = this.randomPick(
        closest.filter((c) => c.distance === closest[0].distance),
      )!.move;
      link = target;
      this.chain.push(link);
    }

    let pos = 0;

    this.current = {
      ...entrance,
      facing: this.maze.opposite(
        this.randomPick(this.maze.moves(entrance).map((m) => m.direction))!,
      ),
    };

    while (!this.maze.isSame(this.current, exit)) {
      const nextLinkOfChain = this.chain[pos + 1];

      // We are attempting to follow the chain...
      const moves = this.maze
        .moves(this.current, { wall: false })
        .filter(({ target }) => this.maze.isSame(target, nextLinkOfChain));
      if (moves.length > 0) {
        const original = this.current;

        const [next] = moves;
        this.history.push(next.target);
        this.path = this.maze.makePath(this.history);
        this.moveTo(next.target);
        this.restoreCell(this.current);
        this.restoreCell(original);
        pos++;
        yield;
      } else {
        this.activateOneRobot(this.makeRobot('right', 'lime'));
        this.activateOneRobot(this.makeRobot('left', 'magenta'));

        let searching = true;
        while (searching) {
          this.runAllRobots();
          yield;

          if (this.robots.length === 0) {
            this.maze.sendMessage('No solution found', { level: 'warning' });
            return;
          }

          for (const robot of this.robots) {
            const chainPos = this.chain.findIndex((c) => this.maze.isSame(c, robot.location));

            if (chainPos > pos) {
              const redraw = new JSONSet<Cartesian>(this.path);

              this.history = this.maze.flatten([...this.history, ...robot.path()]);
              this.path = this.maze.makePath(this.history);

              for (const p of this.path) {
                redraw.add(p);
              }

              for (const cell of redraw) {
                this.restoreCell(cell);
              }

              this.moveTo(this.chain[chainPos]);
              pos = chainPos;
              yield;

              searching = false;
            }
          }
        }

        this.killAllRobots();
      }
    }
    this.history.push(exit);

    this.maze.solution = this.maze.makePath(this.history);
  }
}
