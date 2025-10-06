import {
  create2dArray,
  manhattanDistance,
  modulo,
  type Rect,
  toSquare,
} from '@technobuddha/library';

import { type MazeGenerator } from '../generator/index.ts';
import { MessageController, type MessageControllerProperties } from '../random/index.ts';

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

export function isFacing(orientation: string): orientation is Facing {
  return /^[A-Z!]$/u.test(orientation);
}

export function toFacing(direction: Direction): Facing {
  return direction === '?' ? '!' : (direction.toUpperCase() as Facing);
}

export function isDirection(orientation: string): orientation is Direction {
  return /^[a-z?]$/u.test(orientation);
}

export function toDirection(facing: Facing): Direction {
  return facing === '!' ? '?' : (facing.toLowerCase() as Direction);
}

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

export type MazeGeometryProperties = MessageControllerProperties & {
  readonly width?: number;
  readonly height?: number;
  readonly wrapHorizontal?: boolean;
  readonly wrapVertical?: boolean;
};

export abstract class MazeGeometry extends MessageController {
  public width: NonNullable<MazeGeometryProperties['width']> = 25;
  public height: NonNullable<MazeGeometryProperties['height']> = 25;
  protected readonly requestedWidth: MazeGeometryProperties['width'];
  protected readonly requestedHeight: MazeGeometryProperties['height'];
  public readonly wrapHorizontal: NonNullable<MazeGeometryProperties['wrapHorizontal']>;
  public readonly wrapVertical: NonNullable<MazeGeometryProperties['wrapHorizontal']>;

  //#region Matrix
  public readonly matrix: Matrix;
  public readonly bridgePieces: number;
  //#endregion

  protected nexuses: Nexus[][] = [];

  //#region Hooks
  public hookPreGeneration: ((generator: MazeGenerator) => void) | undefined = undefined;
  public hookPostGeneration: ((generator: MazeGenerator) => void) | undefined = undefined;
  //#endregion

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
  public nexus(cell: Cell): Nexus {
    if (cell.x >= 0 && cell.y >= 0 && cell.x < this.width && cell.y < this.height) {
      return this.nexuses[cell.x][cell.y];
    }

    throw new Error(`No nexus for cell (${cell.x}, ${cell.y})`);
  }

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

  public initialWalls(cell: Cell): Wall {
    const kind = this.cellKind(cell);

    const initialWalls = this.matrix.wall[kind];

    if (initialWalls) {
      return { ...initialWalls };
    }

    throw new Error(`No initial walls for cell (${cell.x}, ${cell.y}) kind ${kind}`);
  }

  public initialTunnels(cell: Cell): Tunnels {
    return Object.fromEntries(
      Object.keys(this.initialWalls(cell)).map((d) => [d as Direction, false]),
    ) as Record<Direction, false>;
  }

  public initialVia(cell: Cell): Via {
    return Object.fromEntries(
      Object.keys(this.initialWalls(cell)).map((d) => [d as Direction, false]),
    ) as Record<Direction, false>;
  }

  public initialBarriers(cell: Cell): Wall {
    return Object.fromEntries(
      Object.keys(this.initialWalls(cell)).map((d) => [d as Direction, false]),
    ) as Record<Direction, false>;
  }

  protected abstract drawingBox(cell: Cell): Rect;

  public backup(): Nexus[][] {
    return structuredClone(this.nexuses);
  }

  public restore(backup: Nexus[][]): void {
    this.nexuses = structuredClone(backup);
  }
  //#endregion
  //#region Create Cells

  public abstract cellKind(cell: Cell): number;
  //#endregion Create Cells
  //#region Direction
  public angle(facing: Facing): number;
  public angle(direction: Direction): number;
  public angle(orientation: Direction | Facing): number {
    const angle =
      this.matrix.angle[isDirection(orientation) ? orientation : toDirection(orientation)];
    if (angle != null) {
      return angle;
    }

    throw new Error(`"${orientation}" is not valid.`);
  }

  public opposite(facing: Facing): Direction;
  public opposite(direction: Direction): Facing;
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

  public rightTurn(cell: CellFacing): Direction[] {
    const rightTurn = this.matrix.rightTurn[cell.facing];
    if (rightTurn) {
      return rightTurn.filter((d) => d in this.nexus(cell).walls);
    }

    throw new Error(`"${cell.facing}" is not a valid facing`);
  }

  public leftTurn(cell: CellFacing): Direction[] {
    const leftTurn = this.matrix.leftTurn[cell.facing];
    if (leftTurn) {
      return leftTurn.filter((d) => d in this.nexus(cell).walls);
    }

    throw new Error(`"${cell.facing}" is not a valid facing`);
  }

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
