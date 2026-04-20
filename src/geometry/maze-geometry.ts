import {
  create2dArray,
  manhattanDistance,
  modulo,
  type Rect,
  toSquare,
} from '@technobuddha/library';

import { type MazeGenerator } from '../generator/index.ts';
import {
  MessageController,
  type MessageControllerProperties,
} from '../message-controller/index.ts';

import {
  type Cell,
  type CellFacing,
  type CellTunnel,
  type Direction,
  type Facing,
  type Move,
  type MoveOffset,
} from './geometry.ts';
import { type Matrix } from './matrix.ts';
import { Nexus, type Tunnels, type Via, type Wall } from './nexus.ts';

/**
 * Type guard to check if a string represents a Facing orientation
 * @param orientation - String to check
 * @returns True if the string is a valid Facing (uppercase letter or '!')
 * @group Geometry
 * @category  Maze Geometry
 */
export function isFacing(orientation: string): orientation is Facing {
  return /^[A-Z!]$/v.test(orientation);
}

/**
 * Converts a Direction to its corresponding Facing orientation
 * @param direction - The direction to convert
 * @returns The uppercase facing equivalent ('?' becomes '!')
 * @group Geometry
 * @category  Maze Geometry
 */
export function toFacing(direction: Direction): Facing {
  return direction === '?' ? '!' : (direction.toUpperCase() as Facing);
}

/**
 * Type guard to check if a string represents a Direction orientation
 * @param orientation - String to check
 * @returns True if the string is a valid Direction (lowercase letter or '?')
 * @group Geometry
 * @category  Maze Geometry
 */
export function isDirection(orientation: string): orientation is Direction {
  return /^[a-z?]$/v.test(orientation);
}

/**
 * Converts a Facing to its corresponding Direction orientation
 * @param facing - The facing to convert
 * @returns The lowercase direction equivalent ('!' becomes '?')
 * @group Geometry
 * @category  Maze Geometry
 */
export function toDirection(facing: Facing): Direction {
  return facing === '!' ? '?' : (facing.toLowerCase() as Direction);
}

/**
 * Ordering options for cell iteration and selection
 * @group Geometry
 * @category  Maze Geometry
 */
export type AllOrder =
  | 'top-left'
  | 'left-top'
  | 'top-right'
  | 'right-top'
  | 'bottom-left'
  | 'left-bottom'
  | 'bottom-right'
  | 'right-bottom'
  | 'random';

/**
 * Configuration properties for maze geometry construction
 * @group Geometry
 * @category  Maze Geometry
 */
export type MazeGeometryProperties = MessageControllerProperties & {
  /** Width of the maze in cells */
  readonly width?: number;
  /** Height of the maze in cells */
  readonly height?: number;
  /** Whether the maze wraps around horizontally (creates a cylinder) */
  readonly wrapHorizontal?: boolean;
  /** Whether the maze wraps around vertically (creates a torus if both wrap) */
  readonly wrapVertical?: boolean;
};

/**
 * Abstract base class providing core maze geometry functionality.
 * Handles cell management, movement logic, matrix operations, and geometric calculations
 * that are common across different maze types (square, hexagonal, etc.).
 * Extends MessageController to provide event communication capabilities.
 *
 * @group Geometry
 * @category  Maze Geometry
 */
export abstract class MazeGeometry extends MessageController {
  /** Current width of the maze in cells */
  public width: NonNullable<MazeGeometryProperties['width']> = 25;
  /** Current height of the maze in cells */
  public height: NonNullable<MazeGeometryProperties['height']> = 25;
  /** Originally requested width (may be undefined for auto-sizing) */
  protected readonly requestedWidth: MazeGeometryProperties['width'];
  /** Originally requested height (may be undefined for auto-sizing) */
  protected readonly requestedHeight: MazeGeometryProperties['height'];
  /** Whether the maze wraps horizontally (cylinder topology) */
  public readonly wrapHorizontal: NonNullable<MazeGeometryProperties['wrapHorizontal']>;
  /** Whether the maze wraps vertically (torus topology when combined with horizontal) */
  public readonly wrapVertical: NonNullable<MazeGeometryProperties['wrapHorizontal']>;

  //#region Matrix
  /** The matrix defining the geometric properties of this maze type */
  public readonly matrix: Matrix;
  /** Number of pieces required to complete a bridge connection */
  public readonly bridgePieces: number;
  //#endregion

  /** 2D array of nexus objects representing the maze structure */
  protected nexuses: Nexus[][] = [];

  //#region Hooks
  /** Optional hook called before maze generation begins */
  public hookPreGeneration: ((generator: MazeGenerator) => void) | undefined = undefined;
  /** Optional hook called after maze generation completes */
  public hookPostGeneration: ((generator: MazeGenerator) => void) | undefined = undefined;
  //#endregion

  /**
   * Creates a new MazeGeometry instance with specified properties and matrix
   * @param properties - Configuration properties for the maze geometry
   * @param matrix - The matrix defining the geometric structure and rules
   */
  public constructor(
    {
      width: requestedWidth,
      height: requestedHeight,
      wrapHorizontal = false,
      wrapVertical = false,
      ...props
    }: MazeGeometryProperties,
    matrix: Matrix,
  ) {
    super(props);

    this.requestedWidth = requestedWidth;
    this.requestedHeight = requestedHeight;

    this.wrapHorizontal = wrapHorizontal;
    this.wrapVertical = wrapVertical;

    this.matrix = matrix;
    this.bridgePieces = matrix.bridge?.pieces ?? 1;
  }
  //#region Nexus

  /**
   * Retrieves the nexus (connection hub) for a specific cell
   * @param cell - The cell to get the nexus for
   * @returns The nexus object containing walls, tunnels, and other cell properties
   * @throws Error if the cell coordinates are outside the maze bounds
   */
  public nexus(cell: Cell): Nexus {
    if (cell.x >= 0 && cell.y >= 0 && cell.x < this.width && cell.y < this.height) {
      return this.nexuses[cell.x][cell.y];
    }

    throw new Error(`No nexus for cell (${cell.x}, ${cell.y})`);
  }

  /**
   * Creates and initializes the nexus structure for all cells in the maze.
   * Each nexus contains walls, tunnels, barriers, and drawing information.
   */
  public createNexus(): void {
    this.nexuses = create2dArray(
      this.width,
      this.height,
      (x, y) =>
        new Nexus({
          x,
          y,
          walls: this.initialWalls({ x, y }),
          tunnels: this.initialTunnels({ x, y }),
          via: this.initialVia({ x, y }),
          barriers: this.initialBarriers({ x, y }),
          drawingBox: toSquare(this.drawingBox({ x, y })),
        }),
    );
  }

  /**
   * Determines the initial wall configuration for a cell based on its kind
   * @param cell - The cell to get initial walls for
   * @returns Wall configuration with all walls initially present
   * @throws Error if no wall configuration exists for the cell's kind
   */
  public initialWalls(cell: Cell): Wall {
    const kind = this.cellKind(cell);

    const initialWalls = this.matrix.wall[kind];

    if (initialWalls) {
      return { ...initialWalls };
    }

    throw new Error(`No initial walls for cell (${cell.x}, ${cell.y}) kind ${kind}`);
  }

  /**
   * Creates the initial tunnel configuration for a cell (all tunnels closed)
   * @param cell - The cell to create tunnel configuration for
   * @returns Tunnel configuration with all directions set to false
   */
  public initialTunnels(cell: Cell): Tunnels {
    return Object.fromEntries(
      Object.keys(this.initialWalls(cell)).map((d) => [d as Direction, false]),
    ) as Record<Direction, false>;
  }

  /**
   * Creates the initial via (bridge connection) configuration for a cell
   * @param cell - The cell to create via configuration for
   * @returns Via configuration with all directions set to false
   */
  public initialVia(cell: Cell): Via {
    return Object.fromEntries(
      Object.keys(this.initialWalls(cell)).map((d) => [d as Direction, false]),
    ) as Record<Direction, false>;
  }

  /**
   * Creates the initial barrier configuration for a cell (no barriers)
   * @param cell - The cell to create barrier configuration for
   * @returns Barrier configuration with all directions set to false
   */
  public initialBarriers(cell: Cell): Wall {
    return Object.fromEntries(
      Object.keys(this.initialWalls(cell)).map((d) => [d as Direction, false]),
    ) as Record<Direction, false>;
  }

  /**
   * Calculates the drawing bounding box for a specific cell.
   * Must be implemented by concrete geometry classes.
   * @param cell - The cell to calculate the drawing box for
   * @returns Rectangle defining the cell's drawing area
   */
  protected abstract drawingBox(cell: Cell): Rect;

  /**
   * Creates a deep copy backup of the current nexus structure
   * @returns Deep clone of the nexuses array for later restoration
   */
  public backup(): Nexus[][] {
    return structuredClone(this.nexuses);
  }

  /**
   * Restores the nexus structure from a previously created backup
   * @param backup - The backup nexuses array to restore
   */
  public restore(backup: Nexus[][]): void {
    this.nexuses = structuredClone(backup);
  }
  //#endregion
  //#region Create Cells

  /**
   * Determines the geometric kind/type of a cell based on its position.
   * Must be implemented by concrete geometry classes to define cell shapes.
   * @param cell - The cell to determine the kind for
   * @returns Numeric identifier for the cell's geometric type
   */
  public abstract cellKind(cell: Cell): number;
  //#endregion Create Cells
  //#region Direction

  /**
   * Gets the angle in radians for a facing orientation
   * @param facing - The facing orientation
   * @returns Angle in radians
   */
  public angle(facing: Facing): number;
  /**
   * Gets the angle in radians for a direction
   * @param direction - The direction
   * @returns Angle in radians
   */
  public angle(direction: Direction): number;
  /**
   * Gets the angle in radians for either a direction or facing orientation
   * @param orientation - The direction or facing to get the angle for
   * @returns The angle in radians as defined by the matrix
   * @throws Error if the orientation is not valid for this geometry
   */
  public angle(orientation: Direction | Facing): number {
    const angle =
      this.matrix.angle[isDirection(orientation) ? orientation : toDirection(orientation)];
    if (angle != null) {
      return angle;
    }

    throw new Error(`"${orientation}" is not valid.`);
  }

  /**
   * Gets the opposite direction for a facing orientation
   * @param facing - The facing orientation
   * @returns The opposite direction
   */
  public opposite(facing: Facing): Direction;
  /**
   * Gets the opposite facing for a direction
   * @param direction - The direction
   * @returns The opposite facing
   */
  public opposite(direction: Direction): Facing;
  /**
   * Gets the opposite orientation (facing↔direction) for any orientation
   * @param orientation - The orientation to get the opposite for
   * @returns The opposite orientation as defined by the matrix
   * @throws Error if the orientation is not valid for this geometry
   */
  public opposite(orientation: Facing | Direction): Direction | Facing {
    if (isFacing(orientation)) {
      if (orientation === '!') {
        return '?';
      }

      const opposite = this.matrix.opposite.facing[orientation];
      if (opposite) {
        return opposite;
      }

      throw new Error(`"${orientation}" is not a valid facing`);
    }

    if (orientation === '?') {
      return '!';
    }

    const opposite = this.matrix.opposite.direction[orientation];
    if (opposite) {
      return opposite;
    }

    throw new Error(`"${orientation}" is not a valid direction`);
  }

  /**
   * Gets the possible right turn directions from a cell's current facing
   * @param cell - The cell with its current facing direction
   * @returns Array of directions that constitute right turns, filtered by available walls
   * @throws Error if the facing direction is not valid
   */
  public rightTurn(cell: CellFacing): Direction[] {
    const rightTurn = this.matrix.rightTurn[cell.facing];
    if (rightTurn) {
      return rightTurn.filter((d) => d in this.nexus(cell).walls);
    }

    throw new Error(`"${cell.facing}" is not a valid facing`);
  }

  /**
   * Gets the possible left turn directions from a cell's current facing
   * @param cell - The cell with its current facing direction
   * @returns Array of directions that constitute left turns, filtered by available walls
   * @throws Error if the facing direction is not valid
   */
  public leftTurn(cell: CellFacing): Direction[] {
    const leftTurn = this.matrix.leftTurn[cell.facing];
    if (leftTurn) {
      return leftTurn.filter((d) => d in this.nexus(cell).walls);
    }

    throw new Error(`"${cell.facing}" is not a valid facing`);
  }

  /**
   * Gets the possible straight-ahead directions from a cell's current facing
   * @param cell - The cell with its current facing direction
   * @param bias - Random bias for direction ordering (default: random 50/50)
   * @returns Array of directions that constitute moving straight, with optional bias ordering
   * @throws Error if the facing direction is not valid
   */
  public straight(cell: CellFacing, bias = this.randomChance(0.5)): Direction[] {
    const straight = this.matrix.straight[cell.facing];
    if (straight) {
      const validDirections = straight.flatMap((dir) => {
        const dirs = Array.from(dir).filter((d) => d in this.nexus(cell).walls) as Direction[];
        return bias ? dirs : dirs.reverse();
      });
      return validDirections;
    }

    throw new Error(`"${cell.facing}" is not a valid direction`);
  }

  /**
   * Gets the primary forward direction from a cell's current facing
   * @param cell - The cell with its current facing direction
   * @param bias - Random bias for direction selection (default: random 50/50)
   * @returns The first straight-ahead direction, with optional bias
   */
  public forward(cell: CellFacing, bias = this.randomChance(0.5)): Direction {
    const [forward] = this.straight(cell, bias);
    return forward;
  }
  //#endregion Direction
  //#region Cell Selection
  /**
   * Gets all cells in the maze grid in the specified order
   * @param order - The ordering strategy for returning cells (default: 'top-left')
   * @returns Array of all cells ordered according to the specified strategy
   */
  public allCells(order: AllOrder = 'top-left'): Cell[] {
    const cells = create2dArray(this.width, this.height, (x, y) => ({ x, y })).flat();

    switch (order) {
      case 'top-left': {
        return cells.sort((a, b) => a.y - b.y || a.x - b.x);
      }
      case 'left-top': {
        return cells.sort((a, b) => a.x - b.x || a.y - b.y);
      }
      case 'top-right': {
        return cells.sort((a, b) => a.y - b.y || b.x - a.x);
      }
      case 'right-top': {
        return cells.sort((a, b) => b.x - a.x || a.y - b.y);
      }
      case 'bottom-left': {
        return cells.sort((a, b) => b.y - a.y || a.x - b.x);
      }
      case 'left-bottom': {
        return cells.sort((a, b) => a.x - b.x || b.y - a.y);
      }
      case 'bottom-right': {
        return cells.sort((a, b) => b.y - a.y || b.x - a.x);
      }
      case 'right-bottom': {
        return cells.sort((a, b) => b.x - a.x || b.y - a.y);
      }
      case 'random':
      default: {
        return this.randomShuffle(cells);
      }
    }
  }

  /**
   * Gets all cells that are actually part of the maze (not masked out).
   *
   * Filters the complete grid to return only cells where `inMaze` returns true,
   * excluding any cells that have been masked out of the maze structure.
   *
   * @param order - The ordering strategy for returning cells
   * @returns Array of cells that are part of the maze, ordered according to the specified strategy
   */
  public cellsInMaze(order: AllOrder = 'top-left'): Cell[] {
    return this.allCells(order).filter((cell) => this.inMaze(cell));
  }

  /**
   * Gets all cells that are in the maze and under a mask.
   *
   * Returns cells that are both part of the maze structure and have a mask applied,
   * which may indicate special cell states or visual treatments.
   *
   * @param order - The ordering strategy for returning cells
   * @returns Array of masked cells ordered according to the specified strategy
   */
  public cellsUnderMask(order: AllOrder = 'top-left'): Cell[] {
    return this.cellsInMaze(order).filter((cell) => this.nexus(cell).mask);
  }

  /**
   * Gets all cells on the edge of the maze.
   *
   * Returns cells that have at least one move leading outside the maze boundaries,
   * identifying the perimeter cells of the maze structure.
   *
   * @param order - The ordering strategy for returning cells
   * @returns Array of edge cells ordered according to the specified strategy
   */
  public cellsOnEdge(order: AllOrder = 'top-left'): Cell[] {
    return this.cellsInMaze(order).filter(
      (cell) => this.moves(cell, { wall: 'all', inMaze: false }).length > 0,
    );
  }

  /**
   * Gets all cells in the interior of the maze.
   *
   * Returns cells where all possible moves lead to other cells within the maze,
   * excluding edge cells that border the maze boundaries.
   *
   * @param order - The ordering strategy for returning cells
   * @returns Array of interior cells ordered according to the specified strategy
   */
  public cellsInterior(order: AllOrder = 'top-left'): Cell[] {
    return this.cellsInMaze(order).filter((cell) =>
      this.moves(cell, { wall: 'all', inMaze: 'all' }).every(({ target }) => this.inMaze(target)),
    );
  }

  /**
   * Gets all dead-end cells in the maze.
   *
   * Returns cells that have only one open passage, making them terminal points
   * in the maze's path structure.
   *
   * @returns Array of dead-end cells
   */
  public deadEnds(): Cell[] {
    return this.cellsInMaze().filter((cell) => this.isDeadEnd(cell));
  }

  /**
   * Selects a random cell from the maze.
   *
   * @returns A randomly chosen cell that is part of the maze
   */
  public randomCell(): Cell {
    return this.randomPick(this.cellsInMaze())!;
  }

  /**
   * Creates a cell with a random facing direction.
   *
   * Selects a random wall direction from the cell and returns the cell facing
   * the opposite direction, useful for establishing starting positions.
   *
   * @param cell - The cell to add facing to (defaults to a random cell)
   * @returns Cell with a random facing direction
   */
  public randomCellFacing(cell = this.randomCell()): CellFacing {
    const facing = this.opposite(this.randomPick(this.nexus(cell).wallDirections())!);
    return { ...cell, facing };
  }
  //#endregion
  //#region Cell
  /**
   * Checks if a cell is within the maze boundaries and not masked.
   *
   * Validates that the cell coordinates are within the grid dimensions and
   * that the cell is not excluded by a mask.
   *
   * @param cell - The cell to check
   * @returns True if the cell is part of the maze, false otherwise
   */
  public inMaze(cell: Cell): boolean {
    return (
      cell.x >= 0 &&
      cell.x < this.width &&
      cell.y >= 0 &&
      cell.y < this.height &&
      !this.nexus(cell).mask
    );
  }

  /**
   * Checks if two cells refer to the same location.
   *
   * Compares cell coordinates and tunnel identifiers (if present) to determine
   * if both cells represent the same maze location.
   *
   * @param cell1 - First cell to compare
   * @param cell2 - Second cell to compare
   * @returns True if cells refer to the same location, false otherwise
   */
  public isSame(cell1: Cell | undefined | null, cell2: Cell | undefined | null): boolean;
  public isSame(cell1: CellTunnel, cell2: CellTunnel): boolean {
    if (cell1 && cell2 && 'tunnel' in cell1 && 'tunnel' in cell2) {
      return cell1.x === cell2.x && cell1.y === cell2.y && cell1.tunnel === cell2.tunnel;
    }
    return cell1?.x === cell2?.x && cell1?.y === cell2?.y;
  }

  /**
   * Checks if two cells are identical including their facing direction.
   *
   * Compares both the cell coordinates and the facing direction to determine
   * complete equality of positioned cells.
   *
   * @param cell1 - First cell with facing to compare
   * @param cell2 - Second cell with facing to compare
   * @returns True if cells are identical in position and facing, false otherwise
   */
  public isIdentical(cell1: CellFacing, cell2: CellFacing): boolean {
    return cell1.x === cell2.x && cell1.y === cell2.y && cell1.facing === cell2.facing;
  }

  /**
   * Calculates the Manhattan distance between two cells.
   *
   * Computes the grid-based distance (sum of horizontal and vertical distances)
   * between cells, accounting for maze wrapping if enabled.
   *
   * @param a - First cell
   * @param b - Second cell
   * @returns Manhattan distance between the cells
   */
  public manhattanDistance(a: Cell, b: Cell): number {
    return manhattanDistance(a, b, {
      width: this.width,
      height: this.height,
      wrapHorizontal: this.wrapHorizontal,
      wrapVertical: this.wrapVertical,
    });
  }

  /**
   * Checks if a cell is a dead end.
   *
   * Determines whether the cell has only one open passage, making it a terminal
   * point in the maze with no branching paths.
   *
   * @param cell - Cell to check
   * @returns True if the cell is a dead end, false otherwise
   */
  public abstract isDeadEnd(cell: Cell): boolean;
  //#endregion
  //#region Movement
  /**
   * Traverses from a cell in a specified direction.
   *
   * Moves one step in the given direction according to the maze geometry's movement
   * rules, returning the destination cell with appropriate facing direction.
   *
   * @param cell - Starting cell
   * @param direction - Direction to traverse
   * @returns Destination cell with facing direction
   * @throws Error if traversal in the specified direction is not possible
   */
  public traverse(cell: Cell, direction: Direction): CellFacing {
    let move = this.matrix.move[this.cellKind(cell)][direction];

    if (move) {
      if (Array.isArray(move)) {
        move = move[modulo(cell.y, move.length)];
      }

      return { ...this.resolveMove(cell, move), facing: toFacing(direction) };
    }

    throw new Error(`No traverse for cell (${cell.x}, ${cell.y}) in direction "${direction}"`);
  }

  /**
   * Gets all possible traversals from a cell.
   *
   * Returns all directions that can be traversed from the cell, optionally filtered
   * by wall state and whether destinations are in the maze.
   *
   * @param cell - Starting cell
   * @param options - Filtering options for wall state and destination location
   * @returns Array of possible moves with direction and target
   */
  public traversals(
    cell: Cell,
    { wall = 'all', inMaze = 'all' }: { wall?: boolean | 'all'; inMaze?: boolean | 'all' } = {},
  ): Move[] {
    return (Object.entries(this.nexus(cell).walls) as [Direction, boolean][])
      .filter(([, w]) => wall === 'all' || w === wall)
      .map(([direction]) => ({ direction, target: this.traverse(cell, direction) }))
      .filter(({ target }) => inMaze === 'all' || this.inMaze(target) === inMaze);
  }

  /**
   * Finds the direction to traverse from source to destination cell.
   *
   * Searches all possible directions from the source cell to find which one
   * leads to the destination, returning unknown direction markers if no path exists.
   *
   * @param source - Starting cell
   * @param destination - Target cell
   * @returns Object with direction and target, or unknown markers if unreachable
   */
  public traverseTo(
    source: Cell,
    destination: Cell,
  ): {
    /** Direction to move from source to reach destination */
    direction: Direction;
    /** Target cell with facing direction */
    target: CellFacing;
  } {
    return (
      this.nexus(source)
        .wallDirections()
        .map((direction) => ({
          direction,
          target: this.traverse(source, direction),
        }))
        .find(({ target }) => this.isSame(destination, target)) ?? {
        direction: '?',
        target: { ...destination, facing: '!' },
      }
    );
  }

  /**
   * Gets all possible moves from a cell, following tunnels and portals.
   *
   * Returns all directions that can be moved from the cell, automatically following
   * any tunnel or portal connections to reach the final destination, optionally filtered
   * by wall state and whether destinations are in the maze.
   *
   * @param cell - Starting cell
   * @param options - Filtering options for wall state and destination location
   * @returns Array of possible moves with direction, target, and optional tunnel path
   */
  public moves(
    cell: Cell,
    { wall = false, inMaze = true }: { wall?: boolean | 'all'; inMaze?: boolean | 'all' } = {},
  ): Move[] {
    return (Object.entries(this.nexus(cell).walls) as [Direction, boolean][])
      .filter(([, w]) => wall === 'all' || w === wall)
      .map(([direction]) => ({ direction, ...this.walk(cell, direction) }))
      .filter(({ target }) => inMaze === 'all' || this.inMaze(target) === inMaze);
  }

  /**
   * Walks from a cell in a direction, following tunnels and portals to the final destination.
   *
   * Traverses one step in the specified direction and then automatically follows any
   * tunnel or portal connections until reaching a cell without a portal or exiting the maze.
   * Records all intermediate cells in the tunnel path.
   *
   * @param cell - Starting cell
   * @param direction - Direction to walk
   * @returns Object with target cell and optional array of cells traversed through tunnels
   */
  public walk(
    cell: Cell,
    direction: Direction,
  ): {
    /** Target cell with facing direction after walking */
    target: CellFacing;
    /** Optional array of cells traversed through tunnels */
    tunnel?: CellFacing[];
  } {
    const tunnel: CellFacing[] = [];

    let target = this.traverse(cell, direction);
    while (this.inMaze(target)) {
      const { tunnels, via } = this.nexus(target);
      const facing = this.opposite(target.facing);

      const portal = tunnels[facing];
      if (portal) {
        tunnel.push(target);
        if (via[facing]) {
          tunnel.push(...via[facing]);
        }
        target = { ...portal };
      } else {
        break;
      }
    }

    return tunnel.length > 0 ? { target, tunnel } : { target };
  }

  /**
   * Resolves a cell position after applying a movement offset.
   *
   * Applies the x and y offsets to the cell coordinates, handling wrapping
   * at maze boundaries if horizontal or vertical wrapping is enabled.
   *
   * @param cell - Starting cell
   * @param move - Offset to apply with x and y displacement
   * @returns Cell at the new position after applying the offset and wrapping
   */
  public resolveMove(cell: Cell, move: MoveOffset): Cell {
    let { x, y } = cell;

    x += move.x;
    y += move.y;

    if (this.wrapHorizontal) {
      if (x < 0) {
        x += this.width;
      }
      if (x >= this.width) {
        x -= this.width;
      }
    }

    if (this.wrapVertical) {
      if (y < 0) {
        y += this.height;
      }
      if (y >= this.height) {
        y -= this.height;
      }
    }

    return { x, y };
  }

  /**
   * Finds the direction and path to walk from source to destination cell.
   *
   * Searches all possible walk directions from the source cell to find which one
   * leads to the destination (following tunnels and portals), returning undefined if unreachable.
   *
   * @param source - Starting cell
   * @param destination - Target cell
   * @returns Object with direction, target, and optional tunnel path, or undefined if unreachable
   */
  public walkTo(
    source: Cell,
    destination: Cell,
  ):
    | {
        /** Direction to walk from source to reach destination */
        direction: Direction;
        /** Target cell with facing direction after walking */
        target: CellFacing;
        /** Optional array of cells traversed through tunnels */
        tunnel?: CellFacing[];
      }
    | undefined {
    return this.nexus(source)
      .wallDirections()
      .map((direction) => ({ direction, ...this.walk(source, direction) }))
      .find(({ target }) => this.isSame(destination, target));
  }

  /**
   * Gets the preferred movement directions from a cell.
   *
   * Returns directions that are both available (have walls) and marked as preferred
   * in the maze geometry's movement matrix for the cell's kind.
   *
   * @param cell - Cell to get preferred directions for
   * @returns Array of preferred directions
   */
  public preferreds(cell: Cell): Direction[] {
    return this.moves(cell, { wall: true })
      .filter(({ direction }) => this.matrix.preferred[this.cellKind(cell)].includes(direction))
      .map(({ direction }) => direction);
  }
  //#endregion
}
