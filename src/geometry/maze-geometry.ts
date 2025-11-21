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
 * @category Functions
 */
export function isFacing(orientation: string): orientation is Facing {
  return /^[A-Z!]$/u.test(orientation);
}

/**
 * Converts a Direction to its corresponding Facing orientation
 * @param direction - The direction to convert
 * @returns The uppercase facing equivalent ('?' becomes '!')
 * @group Geometry
 * @category Functions
 */
export function toFacing(direction: Direction): Facing {
  return direction === '?' ? '!' : (direction.toUpperCase() as Facing);
}

/**
 * Type guard to check if a string represents a Direction orientation
 * @param orientation - String to check
 * @returns True if the string is a valid Direction (lowercase letter or '?')
 * @group Geometry
 * @category Functions
 */
export function isDirection(orientation: string): orientation is Direction {
  return /^[a-z?]$/u.test(orientation);
}

/**
 * Converts a Facing to its corresponding Direction orientation
 * @param facing - The facing to convert
 * @returns The lowercase direction equivalent ('!' becomes '?')
 * @group Geometry
 * @category Functions
 */
export function toDirection(facing: Facing): Direction {
  return facing === '!' ? '?' : (facing.toLowerCase() as Direction);
}

/**
 * Ordering options for cell iteration and selection
 * @group Geometry
 * @category Types
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
 * @category Types
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
 * @category Classes
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

  public cellsInMaze(order: AllOrder = 'top-left'): Cell[] {
    return this.allCells(order).filter((cell) => this.inMaze(cell));
  }

  public cellsUnderMask(order: AllOrder = 'top-left'): Cell[] {
    return this.cellsInMaze(order).filter((cell) => this.nexus(cell).mask);
  }

  public cellsOnEdge(order: AllOrder = 'top-left'): Cell[] {
    return this.cellsInMaze(order).filter(
      (cell) => this.moves(cell, { wall: 'all', inMaze: false }).length > 0,
    );
  }

  public cellsInterior(order: AllOrder = 'top-left'): Cell[] {
    return this.cellsInMaze(order).filter((cell) =>
      this.moves(cell, { wall: 'all', inMaze: 'all' }).every(({ target }) => this.inMaze(target)),
    );
  }

  public deadEnds(): Cell[] {
    return this.cellsInMaze().filter((cell) => this.isDeadEnd(cell));
  }

  public randomCell(): Cell {
    return this.randomPick(this.cellsInMaze())!;
  }

  public randomCellFacing(cell = this.randomCell()): CellFacing {
    const facing = this.opposite(this.randomPick(this.nexus(cell).wallDirections())!);
    return { ...cell, facing };
  }
  //#endregion
  //#region Cell
  public inMaze(cell: Cell): boolean {
    return (
      cell.x >= 0 &&
      cell.x < this.width &&
      cell.y >= 0 &&
      cell.y < this.height &&
      !this.nexus(cell).mask
    );
  }

  public isSame(cell1: Cell | undefined | null, cell2: Cell | undefined | null): boolean;
  public isSame(cell1: CellTunnel, cell2: CellTunnel): boolean {
    if (cell1 && cell2 && 'tunnel' in cell1 && 'tunnel' in cell2) {
      return cell1.x === cell2.x && cell1.y === cell2.y && cell1.tunnel === cell2.tunnel;
    }
    return cell1?.x === cell2?.x && cell1?.y === cell2?.y;
  }

  public isIdentical(cell1: CellFacing, cell2: CellFacing): boolean {
    return cell1.x === cell2.x && cell1.y === cell2.y && cell1.facing === cell2.facing;
  }

  public manhattanDistance(a: Cell, b: Cell): number {
    return manhattanDistance(a, b, {
      width: this.width,
      height: this.height,
      wrapHorizontal: this.wrapHorizontal,
      wrapVertical: this.wrapVertical,
    });
  }

  public abstract isDeadEnd(cell: Cell): boolean;
  //#endregion
  //#region Movement
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

  public traversals(
    cell: Cell,
    { wall = 'all', inMaze = 'all' }: { wall?: boolean | 'all'; inMaze?: boolean | 'all' } = {},
  ): Move[] {
    return (Object.entries(this.nexus(cell).walls) as [Direction, boolean][])
      .filter(([, w]) => wall === 'all' || w === wall)
      .map(([direction]) => ({ direction, target: this.traverse(cell, direction) }))
      .filter(({ target }) => inMaze === 'all' || this.inMaze(target) === inMaze);
  }

  public traverseTo(source: Cell, destination: Cell): { direction: Direction; target: CellFacing } {
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

  public moves(
    cell: Cell,
    { wall = false, inMaze = true }: { wall?: boolean | 'all'; inMaze?: boolean | 'all' } = {},
  ): Move[] {
    return (Object.entries(this.nexus(cell).walls) as [Direction, boolean][])
      .filter(([, w]) => wall === 'all' || w === wall)
      .map(([direction]) => ({ direction, ...this.walk(cell, direction) }))
      .filter(({ target }) => inMaze === 'all' || this.inMaze(target) === inMaze);
  }

  public walk(cell: Cell, direction: Direction): { target: CellFacing; tunnel?: CellFacing[] } {
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

  public walkTo(
    source: Cell,
    destination: Cell,
  ): { direction: Direction; target: CellFacing; tunnel?: CellFacing[] } | undefined {
    return this.nexus(source)
      .wallDirections()
      .map((direction) => ({ direction, ...this.walk(source, direction) }))
      .find(({ target }) => this.isSame(destination, target));
  }

  public preferreds(cell: Cell): Direction[] {
    return this.moves(cell, { wall: true })
      .filter(({ direction }) => this.matrix.preferred[this.cellKind(cell)].includes(direction))
      .map(({ direction }) => direction);
  }
  //#endregion
}
