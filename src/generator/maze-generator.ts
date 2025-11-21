import { create2dArray, modulo, Random, type RandomProperties } from '@technobuddha/library';

import {
  type Cell,
  type CellFacing,
  type Direction,
  type Maze,
  type Move,
} from '../geometry/index.ts';
import { logger } from '../library/logger.ts';

/**
 * Strategy types for controlling maze generation behavior.
 *
 * Defines the different algorithmic approaches for path selection during maze generation:
 * - 'random': Randomly selects from available unvisited neighbors
 * - 'right-turn': Prefers right-hand turns when choosing directions
 * - 'left-turn': Prefers left-hand turns when choosing directions
 * - 'straight': Attempts to continue in straight lines when possible
 * - 'bridge-builder': Constructs multi-level bridges across the maze
 *
 * @group Generator
 * @category Types
 */
export type Strategy = 'random' | 'right-turn' | 'left-turn' | 'straight' | 'bridge-builder';

/**
 * Internal state tracking for individual maze generation players.
 *
 * Each player maintains independent state for multi-agent generation algorithms.
 *
 * @group Generator
 * @category Types
 * @internal
 */
type PlayerState = {
  /** Current position and facing direction of the player */
  current: CellFacing | undefined;
  /** Generation strategy being used by this player */
  strategy: Strategy;
  /** Stack of previous positions for backtracking */
  stack: CellFacing[];
  /** Direction bias for straight-line strategy */
  bias: boolean;
  /** Bridge construction state and timing */
  bridge: {
    /** Steps remaining before next bridge attempt */
    random: number;
  };
};

/**
 * Configuration properties for maze generator instances.
 *
 * @group Generator
 * @category Types
 */
export type MazeGeneratorProperties = RandomProperties & {
  /** The maze instance to generate paths within */
  maze: Maze;
  /** Optional starting cell for generation (defaults to random) */
  start?: Cell;
  /** Generation speed multiplier for animation (defaults to 5) */
  speed?: number;
  /** Proportion of dead ends to remove via braiding (0-1, defaults to 0) */
  braiding?: number;
  /** Minimum bridge length in maze units (defaults to 1) */
  bridgeMinLength?: number;
  /** Maximum bridge length in maze units (defaults to 1) */
  bridgeMaxLength?: number;
  /** Steps to take after bridge construction before next bridge attempt (defaults to 1) */
  stepsAfterBridge?: number;
};

/**
 * Abstract base class for maze generation algorithms.
 *
 * Provides the foundational framework for creating maze generation algorithms including:
 * - Multi-player generation support with independent state tracking
 * - Bridge construction for multi-level mazes
 * - Cell visitation tracking and management
 * - Braiding support to reduce dead ends
 * - Configurable generation strategies and behaviors
 * - Integration with the maze geometry system
 *
 * Key features:
 * - Extensible architecture for implementing different generation algorithms
 * - Support for complex multi-level bridge structures
 * - Player-based generation allowing multiple simultaneous agents
 * - Comprehensive state management and finalization
 * - Integration with random number generation for reproducible results
 *
 * Subclasses must implement the `generate()` method to define the specific
 * algorithmic approach for maze creation.
 *
 * @group Generator
 * @category Core
 */
export abstract class MazeGenerator extends Random {
  /** 2D array tracking which player has visited each cell (false = unvisited) */
  private readonly visited: (false | number)[][];
  /** Array of state objects for each active player */
  protected readonly state: PlayerState[] = [];
  /** Index of the currently active player */
  public player = 0;

  /** The maze instance being generated */
  public maze: MazeGeneratorProperties['maze'];

  /** Minimum number of bridge pieces required for construction */
  public readonly bridgeMinPieces: number;
  /** Maximum number of bridge pieces allowed for construction */
  public readonly bridgeMaxPieces: number;
  /** Number of steps to take after bridge construction before attempting another */
  public readonly stepsAfterBridge: number;

  /** Force factor for encouraging backtracking (0-1) */
  public forced = 0;

  /** Animation speed multiplier for generation visualization */
  public readonly speed: number;
  /** Starting cell for maze generation */
  public start: Cell;
  /** Proportion of dead ends to remove through braiding (0-1) */
  public readonly braiding: number;

  /**
   * Creates a new maze generator with the specified configuration.
   *
   * Initializes the generator with maze reference, generation parameters, and
   * sets up the visitation tracking system. Calculates bridge piece requirements
   * based on the maze's bridge capabilities and desired bridge lengths.
   *
   * @param props - Configuration properties for the generator
   */
  public constructor({
    maze,
    start,
    speed = 5,
    braiding = 0,
    bridgeMinLength = 1,
    bridgeMaxLength = 1,
    stepsAfterBridge = 1,
    random = maze.random,
    ...props
  }: MazeGeneratorProperties) {
    super({ random, ...props });
    this.maze = maze;

    const pieces = this.maze.bridgePieces;
    const min = Math.max(Math.ceil(bridgeMinLength / pieces), 0);
    const max = Math.max(Math.ceil(bridgeMaxLength / pieces), 0);

    this.bridgeMinPieces = min;
    this.bridgeMaxPieces = Math.max(max, min);
    this.stepsAfterBridge = stepsAfterBridge;

    this.visited = create2dArray(this.maze.width, this.maze.height, false);

    this.start = start ?? this.maze.randomCell();
    this.speed = speed;
    this.braiding = braiding;
  }

  /**
   * Creates a new player with specified strategy and starting position.
   *
   * Adds a new player to the generation process with independent state tracking.
   * Players can use different strategies and starting positions for complex
   * multi-agent generation algorithms.
   *
   * @param options - Configuration for the new player
   */
  public createPlayer({
    strategy = 'random',
    start,
  }: {
    /** Generation strategy for this player (defaults to 'random') */
    strategy?: Strategy;
    /** Starting position (CellFacing or Cell, defaults to random) */
    start?: CellFacing | Cell;
  } = {}): void {
    const current =
      start ?
        'facing' in start ?
          start
        : this.maze.randomCellFacing(start)
      : this.maze.randomCellFacing();

    this.state.push({
      current,
      strategy,
      stack: current ? [current] : [],
      bias: true,
      bridge: {
        random: 1,
      },
    });
  }

  /**
   * Moves the current player to a new cell and facing direction.
   *
   * Updates the current player's position and facing direction for the next
   * step of generation. Used for manual position control during generation.
   *
   * @param cell - New position and facing direction for the current player
   */
  protected moveTo(cell?: CellFacing): void {
    this.state[this.player].current = cell;
  }

  /**
   * Checks if a cell has been visited by any player.
   *
   * @param cell - Cell to check for visitation
   * @returns True if the cell has been visited by any player
   */
  protected isVisited(cell: Cell): boolean {
    return this.visited[cell.x][cell.y] !== false;
  }

  /**
   * Checks if a cell has been visited by a specific player.
   *
   * @param cell - Cell to check for visitation
   * @param player - Player index to check (defaults to current player)
   * @returns True if the cell has been visited by the specified player
   */
  protected isVisitedByMe(cell: Cell, player?: number): boolean {
    return this.visited[cell.x][cell.y] === (player ?? this.player);
  }

  /**
   * Marks a cell as visited by a player and handles territory merging.
   *
   * When a player visits a cell already claimed by another player, all cells
   * belonging to the previous player are reassigned to the current player.
   * This implements a territory-conquest system for multi-player generation.
   *
   * @param options - Visitation parameters
   */
  protected visit({
    cell,
    player = this.player,
  }: {
    /** Cell to visit (defaults to current player position) */
    cell?: Cell;
    /** Player making the visit (defaults to current player) */
    player?: number;
  } = {}): void {
    const target = cell ?? this.state[player].current;

    if (target) {
      const visitor = this.visited[target.x][target.y];

      if (visitor === false) {
        this.visited[target.x][target.y] = this.player;
      } else if (visitor === this.player) {
        // no-op, already visited by this player
      } else {
        // Territory conquest: reassign all cells from the previous player
        // eslint-disable-next-line @typescript-eslint/prefer-for-of
        for (let i = 0; i < this.visited.length; ++i) {
          for (let j = 0; j < this.visited[i].length; ++j) {
            if (this.visited[i][j] === visitor) {
              this.visited[i][j] = this.player;
            }
          }
        }
      }
    }
  }

  /**
   * Executes the complete generation process including pre/post hooks.
   *
   * Runs the full generation lifecycle:
   * 1. Pre-generation hook execution
   * 2. Main generation algorithm via `generate()`
   * 3. Post-generation hook execution
   * 4. Finalization of bridges and tunnel systems
   *
   * This is the main entry point for maze generation and should be called
   * by the maze runner to create the complete maze structure.
   *
   * @yields Control back to caller for animation and user interaction
   */
  public async *run(): AsyncGenerator<void> {
    this.maze.hookPreGeneration?.(this);
    yield* this.generate();
    this.maze.hookPostGeneration?.(this);
    this.finalize();
  }

  /**
   * Abstract method for implementing the core generation algorithm.
   *
   * Subclasses must implement this method to define their specific approach
   * to maze generation. The method should yield control periodically to
   * allow for animation and user interaction.
   *
   * @yields Control back to caller for animation and user interaction
   */
  public abstract generate(): AsyncGenerator<void>;

  /**
   * Determines the next cell to move to based on the current player's strategy.
   *
   * Implements various pathfinding strategies including:
   * - Random selection from available unvisited neighbors
   * - Right/left turn preferences with directional priorities
   * - Straight-line movement with alternating bias
   * - Bridge construction with timing controls
   * - Forced backtracking based on the `forced` probability
   *
   * @returns Next cell to move to, or undefined if no valid moves available
   * @throws Error if no current cell is defined for the active player
   */
  protected step(): CellFacing | undefined {
    const state = this.state[this.player];

    if (state.current) {
      // eslint-disable-next-line @typescript-eslint/prefer-destructuring
      const current = state.current;
      let next: Move | undefined;

      if (state.stack.length > 0 && this.randomChance(this.forced)) {
        next = undefined;
      } else {
        switch (state.strategy) {
          case 'right-turn': {
            const turns = this.maze.rightTurn(current);

            [next] = this.maze
              .moves(current, { wall: true })
              .filter(({ target }) => this.visited[target.x][target.y] === false)
              .sort((a, b) => turns.indexOf(a.direction) - turns.indexOf(b.direction));
            break;
          }

          case 'left-turn': {
            const turns = this.maze.leftTurn(current);

            [next] = this.maze
              .moves(current, { wall: true })
              .filter(({ target }) => this.visited[target.x][target.y] === false)
              .sort((a, b) => turns.indexOf(a.direction) - turns.indexOf(b.direction));
            break;
          }

          case 'straight': {
            const turns = this.maze.straight(current, state.bias);
            state.bias = !state.bias;

            [next] = this.maze
              .moves(current, { wall: true })
              .filter(({ target }) => this.visited[target.x][target.y] === false)
              .sort((a, b) => turns.indexOf(a.direction) - turns.indexOf(b.direction));
            break;
          }

          case 'random': {
            next = this.randomPick(
              this.maze
                .moves(current, { wall: true })
                .filter(({ target }) => this.visited[target.x][target.y] === false),
            );
            break;
          }

          case 'bridge-builder': {
            if (state.bridge.random <= 0) {
              const blueprint = this.buildBridge(current);
              if (blueprint) {
                // eslint-disable-next-line @typescript-eslint/prefer-destructuring
                next = blueprint.next;

                const { bridge } = blueprint;
                for (const span of bridge) {
                  this.visited[span.x][span.y] = this.player;
                }

                state.bridge.random = this.stepsAfterBridge;
              } else {
                next = this.randomPick(
                  this.maze
                    .moves(current, { wall: true })
                    .filter(({ target }) => this.visited[target.x][target.y] === false),
                );
              }
            } else {
              state.bridge.random -= 1;

              const [dir] = this.maze.straight(current, state.bias);
              next = this.randomPick(
                this.maze
                  .moves(current, { wall: true })
                  .filter(
                    ({ target, direction }) =>
                      this.visited[target.x][target.y] === false && direction !== dir,
                  ),
              );
              next ??= this.randomPick(
                this.maze
                  .moves(current, { wall: true })
                  .filter(({ target }) => this.visited[target.x][target.y] === false),
              );
            }

            break;
          }

          // no default
        }
      }
      return next?.target;
    }
    throw new Error(`No current cell defined for player ${this.player}.`);
  }

  /**
   * Performs braiding to remove dead ends from the generated maze.
   *
   * Braiding reduces the number of dead ends by randomly connecting them to
   * neighboring cells. The process continues until the desired proportion
   * of dead ends is removed based on the `braiding` configuration.
   *
   * @yields Control back to caller for animation during braiding process
   */
  public async *braid(): AsyncGenerator<void> {
    if (this.braiding > 0) {
      const deadEnds = this.maze.deadEnds();
      const target = deadEnds.length - Math.floor(this.braiding * deadEnds.length);

      while (deadEnds.length > target) {
        const index = this.randomNumber(deadEnds.length);
        const cell = deadEnds[index];

        deadEnds.splice(index, 1);

        const move = this.randomPick(this.maze.moves(cell, { wall: true }));
        if (move) {
          this.maze.removeWall(cell, move.direction);
          yield;
          const nIndex = deadEnds.findIndex((c) => this.maze.isSame(c, move.target));
          if (nIndex >= 0) {
            deadEnds.splice(nIndex, 1);
          }
        }
      }
    }
  }

  /** Unique identifier for tracking bridge instances */
  protected bridgeId = 0;

  /**
   * Constructs a multi-level bridge from the current position.
   *
   * Attempts to build a bridge structure that spans multiple cells and creates
   * tunnels for crossing pathways. The bridge construction involves:
   * - Validating bridge path feasibility and length requirements
   * - Creating tunnel connections between bridge levels
   * - Managing bridge piece allocation and connectivity
   * - Ensuring proper zone and visitation constraints
   *
   * @param current - Starting position and facing direction for bridge construction
   * @returns Bridge blueprint with previous position, bridge cells, and next move, or null if construction fails
   */
  protected buildBridge(
    current: CellFacing,
  ): { prev: CellFacing; bridge: CellFacing[]; next: Move } | null {
    this.bridgeId++; // pre-increment will ensure that bridge id is not falsy

    const layout = this.randomPick(
      this.maze.bridges(current).filter(({ direction }) => {
        if (direction in this.maze.nexus(current).walls) {
          const cell = this.maze.traverse(current, direction);
          return this.maze.inMaze(cell) && this.visited[cell.x][cell.y] === false;
        }
        return false;
      }),
    );
    if (layout) {
      const { path, rear, pieces: bridgePieces, connect } = layout;
      const zone = this.maze.cellZone(current);

      // Build a bridge
      const bridge: CellFacing[] = [];
      let probe: Cell = { ...current };
      let index = 0;

      bridgeBuilding: while (true) {
        let direction = path[modulo(index++, path.length)];
        if (!(direction in this.maze.nexus(probe).walls)) {
          break;
        }

        const { target, tunnel } = this.maze.walk(probe, direction);
        if (
          // don't build outside the maze
          !this.maze.inMaze(target) ||
          // or on the edge
          this.maze.moves(target, { wall: 'all', inMaze: false }).length > 0 ||
          // or in another zone
          this.maze.cellZone(target) !== zone ||
          // or if we have already visited it
          this.isVisited(target) ||
          // or if it's already part of our bridge
          bridge.some((b) => this.maze.isSame(b, target))
        ) {
          break;
        }

        // if we go through a tunnel, make sure that the tunnels matches our path
        if (tunnel) {
          for (const span of tunnel) {
            const expected = this.maze.traverse(probe, direction);
            if (!this.maze.isIdentical(span, expected)) {
              break bridgeBuilding;
            }
            direction = path[modulo(index++, path.length)];
            probe = expected;
          }
        }
        bridge.push(target);
        probe = target;
      }

      while (bridge.length > 0) {
        const end = bridge.at(-1)!;
        if (
          this.maze
            .moves(end, { wall: 'all' })
            .filter(
              ({ target }) =>
                this.visited[target.x][target.y] === false &&
                !this.maze.nexus(target).bridge &&
                !bridge.some((b) => this.maze.isSame(target, b)),
            ).length === 0
        ) {
          bridge.pop();
        } else {
          break;
        }
      }

      // 'next' is actually the last cell in the bridge
      let pieces = Math.floor((bridge.length - 1) / bridgePieces);
      if (pieces > this.bridgeMinPieces) {
        if (pieces > this.bridgeMaxPieces) {
          pieces = this.bridgeMaxPieces;
        }

        bridge.length = pieces * bridgePieces + 1;

        const next = bridge.pop()!;
        let prev = current;
        const oPath = new Set([...path, ...rear]);
        const tunnels: { [direction in Direction]?: (CellFacing & { from: CellFacing })[] } = {};
        const xBridge = [prev, ...bridge, next];

        for (const span of bridge) {
          for (const traversal of this.maze
            .traversals(span)
            .filter(
              (t) =>
                !path.includes(t.direction) &&
                !oPath.has(t.direction) &&
                xBridge.every((x) => !this.maze.isSame(t.target, x)),
            )) {
            if (!(traversal.direction in tunnels)) {
              tunnels[traversal.direction] = [];
            }
            tunnels[traversal.direction]!.push({ ...traversal.target, from: { ...span } });
          }
          prev = span;
        }

        const saveTunnels = { ...tunnels };

        let keys: Direction[];
        while ((keys = Object.keys(tunnels) as Direction[]).length > 0) {
          const [key1] = keys;
          const key2 = connect[key1];

          if (key2) {
            if (tunnels[key1]?.length !== tunnels[key2]?.length) {
              if (tunnels[key1] && tunnels[key2]) {
                logger.error(
                  `@{${current.x},${current.y}} Tunnel length mismatch for ${key1} and ${key2}`,
                  { ...tunnels },
                );
              } else {
                logger.warn(
                  `
                  ${bridge.map((c) => `@{${c.x},${c.y}}`).join(' ')}
                  half-tunnel for ${key1} and ${key2}
                  `,
                  {
                    ...tunnels,
                  },
                  saveTunnels,
                );
              }
            }

            if (key2 in tunnels) {
              for (let i = 0; i < tunnels[key1]!.length; i++) {
                const t1 = tunnels[key1]![i];
                const t2 = tunnels[key2]![i];

                if (t2) {
                  const b1 = t1.from;
                  const b2 = t2.from;

                  const tunnel1 = { x: t1.x, y: t1.y, facing: t1.facing };
                  const tunnel2 = { x: t2.x, y: t2.y, facing: t2.facing };

                  this.maze.nexus(b1).tunnels[key1] = tunnel2;
                  this.maze.nexus(b2).tunnels[key2] = tunnel1;

                  if (!this.maze.isSame(b1, b2)) {
                    this.maze.nexus(b1).via[key1] = [b2];
                    this.maze.nexus(b2).via[key2] = [b1];
                  }
                }
              }
            }
            delete tunnels[key2];
          }
          delete tunnels[key1];
        }

        for (const span of bridge) {
          if (this.maze.nexus(span).bridge) {
            logger.warn(`Bridge already exists at ${span.x},${span.y}`);
          }
          this.maze.nexus(span).bridge = this.bridgeId;
          this.maze.removeWall(span, this.maze.opposite(span.facing));
        }

        return { prev, bridge, next: { direction: this.maze.opposite(next.facing), target: next } };
      }
    }
    return null;
  }

  /**
   * Finalizes bridge construction by activating tunnel systems.
   *
   * Processes all constructed bridges to determine which should be elevated
   * and activates their associated tunnel systems. This involves:
   * - Identifying active bridges based on tunnel connectivity
   * - Marking bridge cells as elevated for proper rendering
   * - Ensuring tunnel systems are properly linked
   *
   * Called automatically after generation completion to finalize the maze structure.
   */
  public finalize(): void {
    const bridges = new Set<number>();

    for (const cell of this.maze.cellsInMaze()) {
      const nexus = this.maze.nexus(cell);
      const { walls, tunnels, bridge } = this.maze.nexus(cell);

      for (const direction of nexus.wallDirections()) {
        // If we have a tunnel under a wall...
        if (bridge && walls[direction] && tunnels[direction]) {
          // If a cell has a tunnel look at the connecting cell
          const cell2 = this.maze.traverse(cell, direction);
          if (this.maze.inMaze(cell2)) {
            const nexus2 = this.maze.nexus(cell2);

            // Check to see if the neighboring cell doesn't have a wall (we have a wall)
            // which means there is a tunnel...
            if (!nexus2.walls[this.maze.opposite(cell2.facing)]) {
              // mark this bridge is active
              bridges.add(bridge);

              // walk down the tunnel and mark all the bridges as active
              const { tunnel } = this.maze.walk(cell2, this.maze.opposite(cell2.facing));
              if (tunnel) {
                for (const span of tunnel) {
                  const { bridge } = this.maze.nexus(span);
                  if (bridge) {
                    bridges.add(bridge);
                  }
                }
              }
            }
          }
        }
      }
    }

    for (const cell of this.maze.cellsInMaze()) {
      const { bridge } = this.maze.nexus(cell);

      if (bridge && bridges.has(bridge)) {
        this.maze.nexus(cell).elevated = true;
      }
    }
  }
}
