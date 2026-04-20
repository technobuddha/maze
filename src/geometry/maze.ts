import {
  type Cartesian,
  create2dArray,
  lookAhead,
  type Rect,
  rotate,
  scale,
  star,
  toRadians,
  translate,
} from '@technobuddha/library';

import { CanvasDrawing, type Drawing } from '../drawing/index.ts';
import { inverse, logger } from '../library/index.ts';

import { type Bridge } from './bridges.ts';
import { defaultColors, type MazeColors } from './color.ts';
import {
  type Cell,
  type CellDirection,
  type CellFacing,
  type CellTunnel,
  type Direction,
  type Kind,
  type Pillar,
  type Terminus,
} from './geometry.ts';
import { type Matrix } from './matrix.ts';
import { type AllOrder, MazeGeometry, type MazeGeometryProperties } from './maze-geometry.ts';

/** Pre-calculated star shape for drawing decorative elements */
const starShape = rotate(star(5, 0.5, 1), Math.PI / 10);

/**
 * Zone classification for maze locations
 * @group Geometry
 * @category  Maze
 */
export type Zone = 'edge' | 'interior';

/**
 * String template type for specifying maze locations by order and zone
 * @group Geometry
 * @category  Maze
 */
export type Location = `${AllOrder} ${Zone}`;

/**
 * Dimensions for custom drawing size calculations
 * @group Geometry
 * @category  Maze
 */
export type CustomDrawingSize = {
  /** The logical width in cells */
  readonly width: number;
  /** The logical height in cells */
  readonly height: number;
  /** The actual rendered width in pixels */
  readonly actualWidth: number;
  /** The actual rendered height in pixels */
  readonly actualHeight: number;
};

/**
 * Configuration for maze drawing dimensions and layout
 * @group Geometry
 * @category  Maze
 */
export type DrawingSizes = {
  /** Width of a cell group in pixels */
  readonly groupWidth: number;
  /** Height of a cell group in pixels */
  readonly groupHeight: number;
  /** Number of vertical cells per group (default: 1) */
  readonly verticalCellsPerGroup?: number;
  /** Number of horizontal cells per group (default: 1) */
  readonly horizontalCellsPerGroup?: number;
  /** Top padding in pixels */
  readonly topPadding?: number;
  /** Left padding in pixels */
  readonly leftPadding?: number;
  /** Bottom padding in pixels */
  readonly bottomPadding?: number;
  /** Right padding in pixels */
  readonly rightPadding?: number;
  /** Custom size calculation function */
  readonly custom?: (this: void, args: CustomDrawingSize) => CustomDrawingSize;
};

/**
 * Methods for visualizing distances in maze rendering
 * @group Geometry
 * @category  Maze
 */
export type ShowDistances = 'none' | 'greyscale' | 'primary' | 'color' | 'spectrum';

/**
 * Information about a loop detected in maze analysis
 * @internal
 */
export type Loop = {
  /** The cell where the loop was detected */
  readonly cell: Cell;
  /** Distance from entrance to this cell */
  readonly distance: number;
  /** Cells that form loops with this cell */
  readonly loops: Cell[];
  /** Distances to the loop cells */
  readonly distances: number[];
};

/**
 * Configuration properties for maze construction and rendering
 * @group Geometry
 * @category  Maze
 */
export type MazeProperties = MazeGeometryProperties & {
  /** Drawing context for rendering the maze */
  readonly drawing?: Drawing;
  /** Size of each cell in pixels (default: 21) */
  readonly cellSize?: number;
  /** Width of walls in pixels (default: 1) */
  readonly wallSize?: number;
  /** Size of void areas in pixels (default: 0) */
  readonly voidSize?: number;

  /** Entrance location specification */
  readonly entrance?: Cell | CellDirection | Location;
  /** Exit location specification */
  readonly exit?: Cell | CellDirection | Location;

  /** Method for showing distances in the maze (default: 'none') */
  readonly showDistances?: ShowDistances;
  /** Color scheme configuration */
  readonly color?: Partial<MazeColors>;

  /** Whether to show cell coordinates (default: false) */
  readonly showCoordinates?: boolean;
  /** Whether to show cell kind information (default: false) */
  readonly showKind?: boolean;
  /** Whether to show bridge connections (default: false) */
  readonly showBridges?: boolean;
  /** Whether to highlight unreachable cells (default: false) */
  readonly showUnreachables?: boolean;

  /** Plugin function for custom maze modifications */
  readonly plugin?: (this: void, maze: Maze) => void;
};

/**
 * Abstract base class for maze implementations with rendering capabilities.
 * Extends MazeGeometry to provide drawing, analysis, solving, and visualization features.
 * Different maze geometries (square, hexagonal, etc.) extend this class to implement
 * their specific rendering behaviors.
 *
 * @group Geometry
 * @category  Maze
 */
export abstract class Maze extends MazeGeometry {
  //#region Properties

  /** The entrance point of the maze with position and facing direction */
  public entrance: Terminus = { x: -1, y: -1, facing: '!' };
  /** The exit point of the maze with position and facing direction */
  public exit: Terminus = { x: -1, y: -1, facing: '!' };
  /** The solution path from entrance to exit as a sequence of cell tunnels */
  public solution: CellTunnel[] = [];

  /** Actual rendered width of the maze in pixels */
  public actualWidth = 0;
  /** Actual rendered height of the maze in pixels */
  public actualHeight = 0;
  /** Left offset for centering the maze in the drawing area */
  public leftOffset = 0;
  /** Top offset for centering the maze in the drawing area */
  public topOffset = 0;

  /** Width of walls in pixels */
  public readonly wallSize: NonNullable<MazeProperties['wallSize']>;
  /** Size of each cell in pixels */
  public readonly cellSize: NonNullable<MazeProperties['cellSize']>;
  /** Size of void areas in pixels */
  public readonly voidSize: NonNullable<MazeProperties['voidSize']>;
  /** Method for displaying distances in the maze */
  public readonly showDistances: NonNullable<MazeProperties['showDistances']>;
  /** Whether to display cell coordinates */
  public readonly showCoordinates: NonNullable<MazeProperties['showCoordinates']>;
  /** Whether to display cell kind information */
  public readonly showKind: NonNullable<MazeProperties['showKind']>;
  /** Whether to display bridge connections */
  public readonly showBridges: NonNullable<MazeProperties['showBridges']>;
  /** Whether to highlight unreachable cells */
  public readonly showUnreachables: boolean;

  /** Original entrance specification before resolution */
  private readonly entranceSpec: MazeProperties['entrance'];
  /** Original exit specification before resolution */
  private readonly exitSpec: MazeProperties['exit'];
  /** Plugin function for custom maze modifications */
  protected plugin: MazeProperties['plugin'];
  /** Drawing context for rendering the maze */
  public drawing: MazeProperties['drawing'];
  /** Complete color scheme with all required colors */
  public readonly color: NonNullable<Required<MazeColors>>;
  //#endregion

  //#region Construction
  /**
   * Creates a new Maze instance with the specified properties and matrix
   * @param properties - Configuration properties for the maze
   * @param matrix - The matrix implementation defining the maze's geometric structure
   */
  public constructor(
    {
      drawing,
      cellSize = 21,
      wallSize = 1,
      voidSize = 0,
      entrance,
      exit,
      color,
      showDistances = 'none',
      showCoordinates = false,
      showKind = false,
      showBridges = false,
      showUnreachables = false,
      plugin,
      ...props
    }: MazeProperties,
    matrix: Matrix,
  ) {
    super(props, matrix);

    this.cellSize = cellSize;
    this.wallSize = wallSize;
    this.voidSize = voidSize;

    this.drawing = drawing;

    this.color = { ...defaultColors, ...color };

    this.showDistances = showDistances;

    this.showCoordinates = showCoordinates;
    this.showKind = showKind;
    this.showBridges = showBridges;
    this.showUnreachables = showUnreachables;

    this.entranceSpec = entrance;
    this.exitSpec = exit;

    this.plugin = plugin;

    this.reset();
  }

  /**
   * Resets the maze dimensions and recreates the nexus structure.
   * Calculates actual dimensions based on drawing context if available.
   */
  public reset(): void {
    let width = this.requestedWidth;
    let height = this.requestedHeight;
    let leftOffset: number | undefined = undefined;
    let topOffset: number | undefined = undefined;
    let actualWidth: number | undefined = undefined;
    let actualHeight: number | undefined = undefined;

    if (this.drawing) {
      const {
        groupWidth,
        groupHeight,
        verticalCellsPerGroup = 1,
        horizontalCellsPerGroup = 1,
        topPadding = 0,
        leftPadding = 0,
        rightPadding = 0,
        bottomPadding = 0,
        custom,
      } = this.drawingSize();

      width ??=
        Math.floor(
          (this.drawing.width - (leftPadding + rightPadding + this.wallSize * 2)) / groupWidth,
        ) * horizontalCellsPerGroup;
      height ??=
        Math.floor(
          (this.drawing.height - (topPadding + bottomPadding + this.wallSize * 2)) / groupHeight,
        ) * verticalCellsPerGroup;

      actualWidth = (width / horizontalCellsPerGroup) * groupWidth + this.wallSize * 2;
      actualHeight = (height / verticalCellsPerGroup) * groupHeight + this.wallSize * 2;

      if (custom) {
        ({ width, height, actualWidth, actualHeight } = custom({
          width,
          height,
          actualWidth,
          actualHeight,
        }));
      }

      const availableHeight = this.drawing.height - (topPadding + bottomPadding);
      const availableWidth = this.drawing.width - (leftPadding + rightPadding);

      leftOffset = leftPadding + (availableWidth - actualWidth) / 2;
      topOffset = topPadding + (availableHeight - actualHeight) / 2;
    }

    this.width = width ?? 25;
    this.height = height ?? 25;

    this.actualWidth = actualWidth ?? 0;
    this.actualHeight = actualHeight ?? 0;
    this.leftOffset = leftOffset ?? 0;
    this.topOffset = topOffset ?? 0;

    this.createNexus();

    this.plugin?.(this);
  }

  //#endregion

  /**
   * Removes all interior walls between adjacent cells within the maze bounds.
   * This effectively creates an open space with no internal barriers.
   */
  public removeInteriorWalls(): void {
    for (const cell of this.cellsInMaze()) {
      const wall = this.nexus(cell).walls;
      for (const direction of (Object.keys(wall) as Direction[]).filter((d) => wall[d])) {
        const move = this.walk(cell, direction).target;
        if (move && this.inMaze(move)) {
          wall[direction] = false;
        }
      }
    }
  }

  //#region Maze

  /**
   * Determines if a cell is a dead end (has only one accessible passage).
   * Entrance and exit cells are never considered dead ends.
   * @param cell - The cell to check
   * @returns True if the cell is a dead end
   */
  public isDeadEnd(cell: Cell): boolean {
    return (
      !this.isSame(cell, this.entrance) &&
      !this.isSame(cell, this.exit) &&
      this.moves(cell, { wall: false }).length === 1
    );
  }

  /**
   * Analyzes the maze structure starting from the given entrance point.
   *
   * Performs breadth-first search to calculate distances from the entrance to all reachable cells,
   * detect loops in the maze structure, and identify unreachable areas. The analysis provides
   * comprehensive information about maze connectivity and structural properties.
   *
   * @param entrance - The starting point for analysis (defaults to maze entrance)
   * @returns Analysis results
   */
  public analyze(entrance: Cell = this.entrance): {
    /** The greatest distance from entrance to any reachable cell */
    maxDistance: number;
    /** The cell that is farthest from the entrance */
    maxCell: Cell;
    /** 2D array mapping each cell to its distance from entrance (Infinity for unreachable) */
    distances: number[][];
    /** Array of cells that cannot be reached from the entrance */
    unreachable: Cell[];
    /** Array of detected loops where cells connect back to previously visited areas */
    loops: Loop[];
  } {
    const distances = create2dArray(this.width, this.height, Infinity);
    const loops: Loop[] = [];
    const queue: Cell[] = [entrance];

    distances[entrance.x][entrance.y] = 0;

    let maxDistance = 1;
    let maxCell = entrance;
    while (queue.length > 0) {
      const cell = queue.pop()!;
      const distance = distances[cell.x][cell.y];

      if (distance > maxDistance) {
        maxDistance = distance;
        maxCell = cell;
      }

      const loopCells = this.moves(cell, { wall: false })
        .filter(({ target }) => distances[target.x][target.y] !== Infinity)
        .filter(({ target }) => distances[target.x][target.y] !== distance)
        .map(({ target }) => target);
      if (loopCells.length > 0) {
        loops.push({
          cell,
          loops: loopCells,
          distance,
          distances: loopCells.map((l) => distances[l.x][l.y]),
        });
      }

      const moves = this.moves(cell, { wall: false })
        .filter(({ target }) => distances[target.x][target.y] === Infinity)
        .map(({ target }) => target);
      for (const next of moves) {
        distances[next.x][next.y] = distance + 1;
        queue.unshift(next);
      }
    }

    const unreachable = this.cellsInMaze().filter((cell) => distances[cell.x][cell.y] === Infinity);

    return { maxDistance, maxCell, distances, unreachable, loops };
  }

  /**
   * Finds the shortest path between entrance and exit using breadth-first search.
   * @param entrance - The starting point (defaults to maze entrance)
   * @param exit - The target point (defaults to maze exit)
   * @returns Array of cells representing the solution path from entrance to exit
   */
  public solve(entrance: CellFacing = this.entrance, exit: CellFacing = this.exit): CellFacing[] {
    const visited = create2dArray(this.width, this.height, false);
    const parent: (CellFacing | undefined)[][] = create2dArray(this.width, this.height, undefined);
    const queue: CellFacing[] = [entrance];

    visited[entrance.x][entrance.y] = true;

    while (queue.length > 0) {
      const cell = queue.shift()!;

      for (const move of this.moves(cell, { wall: false }).filter(
        ({ target }) => !visited[target.x][target.y],
      )) {
        visited[move.target.x][move.target.y] = true;
        parent[move.target.x][move.target.y] = cell;
        queue.push(move.target);
      }
    }

    const solution: CellFacing[] = [];

    let cell: CellFacing | undefined = exit;
    while (cell) {
      solution.unshift(cell);
      cell = parent[cell.x][cell.y];
    }

    return solution;
  }

  /**
   * Adds entrance and exit points to the maze based on specifications or automatic selection.
   * If no specifications are provided, chooses points that maximize the distance between them.
   * Creates openings in exterior walls where possible.
   * @returns This maze instance for method chaining
   */
  public addTermini(): this {
    let entrance: Cell;
    let exit: Cell;

    if (this.entranceSpec && this.exitSpec) {
      entrance = this.parseSpecification(this.entranceSpec);
      exit = this.parseSpecification(this.exitSpec);
    } else if (this.entranceSpec) {
      entrance = this.parseSpecification(this.entranceSpec);
      exit = this.analyze(entrance).maxCell;
    } else if (this.exitSpec) {
      exit = this.parseSpecification(this.exitSpec);
      entrance = this.analyze(exit).maxCell;
    } else {
      entrance = this.analyze(this.randomCell()).maxCell;
      exit = this.analyze(entrance).maxCell;
    }

    const outsideEntrance = this.randomPick(this.moves(entrance, { wall: true, inMaze: false }));
    if (outsideEntrance) {
      this.entrance = { ...entrance, facing: this.opposite(outsideEntrance.direction) };
      this.nexus(this.entrance).walls[outsideEntrance.direction] = false;
    } else {
      const direction = this.randomPick(
        this.moves(entrance, { wall: false }).map(({ direction }) => direction),
      );
      const facing =
        direction ?
          this.opposite(
            this.randomPick(
              this.nexus(entrance)
                .wallDirections()
                .filter((d) => d !== direction),
            )!,
          )
        : '!';
      this.entrance = { ...entrance, facing };
    }

    const outsideExit = this.randomPick(this.moves(exit, { wall: true, inMaze: false }));
    if (outsideExit) {
      this.exit = { ...exit, facing: this.opposite(outsideExit.direction) };
      this.nexus(this.exit).walls[outsideExit.direction] = false;
    } else {
      this.exit = { ...exit, facing: '!' };
    }

    return this;
  }
  //#endregion
  //#region Maze Drawing

  /**
   * Attaches a new drawing context to the maze and returns the previous one.
   * @param drawing - The new drawing context to attach
   * @returns The previously attached drawing context, if any
   */
  public attachDrawing(drawing?: Drawing): Drawing | undefined {
    const current = this.drawing;

    this.drawing = drawing;
    return current;
  }

  /**
   * Returns the drawing size configuration for this maze geometry.
   * Must be implemented by concrete maze classes to define their specific dimensions.
   * @returns Drawing size configuration including group dimensions and padding
   */
  protected abstract drawingSize(): DrawingSizes;

  /**
   * Clears the drawing area with the specified color and sets up coordinate system.
   * @param color - The background color (defaults to void color)
   */
  public clear(color: string = this.color.void): void {
    if (this.drawing) {
      this.drawing.clear(color, {
        originX: this.leftOffset,
        originY: this.topOffset,
      });
    }
  }

  /**
   * Renders the complete maze including all cells and masks.
   * Clears the drawing area, draws all cells, and applies any masking.
   */
  public draw(): void {
    if (this.drawing) {
      this.clear();

      for (const cell of this.cellsInMaze()) {
        this.drawCell(cell);
      }

      this.drawMasks();
    }
  }

  /**
   * Applies masks to the maze by erasing cells that should be hidden.
   * Masked cells are drawn with the void color to create cutout shapes.
   */
  public drawMasks(): void {
    if (this.drawing) {
      for (const cell of this.cellsUnderMask()) {
        this.eraseCell(cell, this.color.void);
      }
    }
  }

  /**
   * Detects and reports structural errors in the maze such as unreachable cells.
   * Logs errors and optionally highlights problematic areas in the rendering.
   */
  public detectErrors(): void {
    const { unreachable } = this.analyze(this.entrance);

    if (unreachable.length > 0) {
      this.sendMessage(`There are ${unreachable.length} unreachable cells`, { level: 'error' });
      logger.error(`Unreachable cells: `, unreachable);

      if (this.showUnreachables) {
        for (const cell of unreachable) {
          this.drawCell(cell, this.color.error);
        }
      }
    }

    // if (loops.length > 0) {
    //   for (const loop of loops) {
    //     logger.error(
    //       `Loop detected from {x: ${loop.cell.x}, y: ${loop.cell.y} :: ${loop.distance}} with ${loop.loops.map((l, i) => `{x: ${l.x}, y:${l.y} :: ${loop.distances[i]}}`).join(' ')}`,
    //     );

    //     this.drawX(loop.cell, this.color.error);
    //   }
    // }

    // if (loops.length > 0 || unreachable.length > 0) {
    //   // eslint-disable-next-line no-debugger
    //   debugger;
    // }
  }

  /**
   * Renders distance information on the maze using various visualization methods.
   * Colors cells based on their distance from the specified starting point.
   * @param method - The visualization method to use (defaults to maze's showDistances setting)
   * @param point - The starting point for distance calculation (defaults to entrance)
   */
  public drawDistances(method = this.showDistances, point = this.entrance): void {
    if (this.drawing) {
      const { maxDistance, distances } = this.analyze(point);

      for (let x = 0; x < distances.length; ++x) {
        for (let y = 0; y < distances[x].length; ++y) {
          this.nexuses[x][y].distance = distances[x][y];
        }
      }

      for (const cell of this.cellsInMaze()) {
        if (this.isSame(this.entrance, cell) || this.isSame(this.exit, cell)) {
          this.drawCell(cell);
        } else {
          const { distance } = this.nexus(cell);
          let color: string | undefined = undefined;

          if (distance === Infinity) {
            color = this.color.error;
          } else {
            const grey = (1 - distance / maxDistance) * 0.35 + 0.15;

            switch (method) {
              case 'none': {
                color = this.color.cell;
                break;
              }

              case 'greyscale': {
                // color = `rgba(${255 * grey}, ${255 * grey}, ${255 * grey})`;
                color = `oklch(${grey} 0 0)`;
                break;
              }

              case 'primary': {
                // color = `hsl(212, 72.3%, ${3 + 35 * (1 - this.nexus(cell).distance / maxDistance)}%)`;
                color = `oklch(${grey} 0.115 213.72)`;
                //oklch(0.6611 0.115 213.72)
                break;
              }

              case 'color': {
                color = `hsl(276, 100%, ${15 + 35 * (1 - this.nexus(cell).distance / maxDistance)}%)`;
                break;
              }

              case 'spectrum': {
                //color = `hsl(${(this.nexus(cell).distance * 360) / maxDistance}, 25%, 50%)`;
                color = `oklch(0.5999 0.1279 ${(1 - distance / maxDistance) * 360} )`;
                break;
              }
              // no default
            }
          }

          if (color) {
            this.drawCell(cell, color);
          }
        }
      }

      //this.drawMasks();
    }
  }

  /**
   * Renders the complete maze solution with optional distance visualization.
   *
   * Displays the maze with distance-based coloring, overlays the solution path from
   * entrance to exit, and marks the exit cell. The solution path is drawn with
   * directional indicators showing the route to follow.
   *
   * @param color - Color for the solution path indicators (defaults to solution color)
   * @param method - Distance visualization method to use (defaults to maze's showDistances setting)
   */
  public drawSolution(color = this.color.solution, method = this.showDistances): void {
    if (this.drawing) {
      this.drawDistances(method);
      this.drawPaths(this.solution, color);
      this.drawCell(this.exit);
      this.drawPath({ ...this.exit, direction: this.opposite(this.exit.facing) }, color);
    }
  }
  //#endregion
  //#region Cell

  /**
   * Calculates the origin point (top-left corner) for rendering a specific cell.
   * Must be implemented by concrete maze classes based on their geometry.
   * @param cell - The cell to get the origin point for
   * @returns The x,y coordinates of the cell's origin point
   */
  protected abstract cellOrigin(cell: Cell): Cartesian;

  /**
   * Calculates offset coordinates for a cell based on its origin and geometry.
   * Transforms the cell's base offsets by adding the cell's origin coordinates.
   * @param cell - The cell to calculate offsets for
   * @returns Record mapping offset names to their calculated coordinates
   */
  protected cellOffsets(cell: Cell): Record<string, number> {
    const { x, y } = this.cellOrigin(cell);

    return Object.fromEntries(
      Object.entries(this.offsets(this.cellKind(cell))).map(([k, v]) => {
        if (k.startsWith('x')) {
          return [k, v + x];
        }
        if (k.startsWith('y')) {
          return [k, v + y];
        }
        return [k, v];
      }),
    );
  }
  //#endregion
  //#region Path
  /**
   * Converts a solution history into a path with tunnel information.
   * Processes the sequence of cells and facings to create a detailed path
   * that includes tunnel traversals and direction changes.
   * @param history - Array of cells with facing directions representing the solution
   * @returns Array of cells with direction and tunnel information for rendering
   */
  public makePath(history: CellFacing[]): CellTunnel[] {
    const path: CellTunnel[] = [];

    if (history.length > 0) {
      for (const [cell, next] of lookAhead(this.flatten(history))) {
        const walk = this.walkTo(cell, next);
        if (walk) {
          const { direction, tunnel } = walk;

          path.push({ x: cell.x, y: cell.y, direction, tunnel: false });
          if (tunnel) {
            for (const [tunnelCell, tunnelNext] of lookAhead(tunnel, { last: next })) {
              const traverse = this.traverseTo(tunnelCell, tunnelNext);
              path.push({
                x: tunnelCell.x,
                y: tunnelCell.y,
                direction: traverse.direction,
                tunnel: true,
              });
            }
          }
        }
      }
    }

    return path;
  }

  /**
   * Flattens a path by removing loops and cycles.
   * When the same cell appears multiple times in a path, removes the loop
   * by keeping only the path from the first occurrence to the last occurrence.
   * @param path - Array of cells representing a path that may contain loops
   * @returns Flattened path with loops removed
   */
  public flatten<T extends Cell = Cell>(path: T[]): T[] {
    const flatPath: T[] = [];

    for (let i = 0; i < path.length; ++i) {
      const cell = path[i];

      const loop = path.findLastIndex((c) => this.isSame(c, cell));
      if (loop > i) {
        // If we find a loop, we skip the rest of the path
        i = loop;
        flatPath.push(path[loop]);
      } else {
        flatPath.push(cell);
      }
    }

    return flatPath;
  }
  //#endregion
  //#region Construction

  /**
   * Adds a wall between the specified cell and its neighbor in the given direction.
   * Updates both cells' wall states and optionally redraws them.
   * @param cell - The cell to add a wall from
   * @param direction - The direction to add the wall
   * @param draw - Whether to redraw the affected cells (defaults to true)
   */
  public addWall(cell: Cell, direction: Direction, draw = true): void {
    const cell2 = this.walk(cell, direction).target;
    if (this.inMaze(cell) && this.inMaze(cell2)) {
      this.nexus(cell).addWall(direction);

      const direction2 = this.opposite(cell2.facing);
      this.nexus(cell2).addWall(direction2);

      if (draw) {
        this.drawCell(cell);
        this.drawCell(cell2);
      }
    }
  }

  /**
   * Removes a wall between the specified cell and its neighbor in the given direction.
   * Updates both cells' wall states and redraws them.
   * @param cell - The cell to remove a wall from
   * @param direction - The direction to remove the wall
   */
  public removeWall(cell: Cell, direction: Direction): void {
    if (this.inMaze(cell)) {
      this.nexus(cell).removeWall(direction);
      this.drawCell(cell);

      const cell2 = this.walk(cell, direction).target;
      if (this.inMaze(cell2)) {
        const direction2 = this.opposite(cell2.facing);

        this.nexus(cell2).removeWall(direction2);
        this.drawCell(cell2);
      }
    }
  }
  //#endregion
  //#region Cell Kind
  /**
   * Returns the zone identifier for the specified cell.
   * Default implementation returns 0 for all cells; subclasses may override for multi-zone mazes.
   * @param _cell - The cell to get the zone for (unused in base implementation)
   * @returns Zone identifier (always 0 in base implementation)
   */
  public cellZone(_cell: Cell): number {
    return 0;
  }
  //#endregion
  //#region Cell Drawing
  /**
   * Determines the appropriate color for a cell based on its special properties.
   * Returns entrance/exit colors for terminus cells, elevated color for bridges,
   * or the provided color for regular cells.
   * @param cell - The cell to determine color for
   * @param color - The default color to use
   * @returns The appropriate color for the cell
   */
  protected cellColor(cell: Cell, color: string): string {
    if (this.isSame(cell, this.entrance)) {
      return this.color.entrance;
    }

    if (this.isSame(cell, this.exit)) {
      return this.color.exit;
    }

    if (color === this.color.cell && this.nexus(cell).elevated) {
      return this.color.bridge;
    }

    return color;
  }

  /**
   * Draws a complete cell including floor, walls, and pillars.
   * Erases the existing cell content, draws the floor with appropriate coloring,
   * then renders walls and pillars based on the cell's nexus state.
   * @param cell - The cell to draw
   * @param cellColor - Color for the cell floor (defaults to cell color)
   * @param wallColor - Color for walls and pillars (defaults to wall color)
   * @returns The cell that was drawn
   */
  public drawCell<T extends Cell>(
    cell: T,
    cellColor = this.color.cell,
    wallColor = this.color.wall,
  ): T {
    this.eraseCell(cell);
    this.drawFloor(cell, this.cellColor(cell, cellColor));

    this.drawWalls(cell, wallColor);
    this.drawPillars(cell, wallColor);

    if (this.showCoordinates) {
      this.drawText(cell, cell.x === 0 ? cell.y.toString() : cell.x.toString());
    } else if (this.showKind) {
      this.drawText(cell, this.cellKind(cell).toString());
    } else if (this.showBridges && this.nexus(cell).bridge) {
      this.drawText(cell, '○');
    }

    return cell;
  }

  /**
   * Draws all walls and passages for the specified cell.
   * Renders walls, barriers, elevated sections, and passages based on cell's nexus state.
   * @param cell - The cell to draw walls for
   * @param wallColor - Color for wall sections (defaults to wall color)
   * @param cellColor - Color for passage openings (defaults to cell color)
   */
  public drawWalls(cell: Cell, wallColor = this.color.wall, cellColor = this.color.cell): void {
    const nexus = this.nexus(cell);
    const { walls, barriers, elevated } = nexus;

    for (const direction of this.matrix.directions) {
      if (walls[direction] === true || barriers[direction]) {
        this.drawWall(cell, direction, wallColor);
      } else if (walls[direction] === false) {
        const move = this.traverse(cell, direction);
        if (
          this.inMaze(move) &&
          this.nexus(move).tunnels[this.opposite(move.facing)] &&
          this.nexus(move).walls[this.opposite(move.facing)] === true
        ) {
          this.drawTunnel(cell, direction);
        } else if (elevated) {
          this.drawWall(cell, direction, this.color.bridge);
          this.drawPassage(cell, direction, this.color.wall, this.color.bridge);
        } else {
          this.drawPassage(cell, direction, wallColor, cellColor);
        }
      }
    }
  }

  /**
   * Draws pillars (corner intersections) for the specified cell.
   * Renders pillar elements where adjacent walls meet to create proper corners.
   * @param cell - The cell to draw pillars for
   * @param color - The pillar color (defaults to wall color)
   */
  public drawPillars(cell: Cell, color = this.color.wall): void {
    const { walls } = this.nexus(cell);

    for (const pillar of this.matrix.pillars) {
      if (pillar[0] in walls && pillar[1] in walls) {
        this.drawPillar(cell, pillar, color);
      }
    }
  }

  /**
   * Draws text content within the specified cell.
   * Centers the text within the cell's drawing box area.
   * @param cell - The cell to draw text in
   * @param text - The text content to display
   * @param color - The text color (defaults to text color)
   */
  public drawText(cell: Cell, text: string, color = this.color.text): void {
    if (this.drawing) {
      const { rect } = this.nexus(cell);

      this.drawing.text(rect, text, color);
    }
  }

  /**
   * Draws a tunnel (special passage) in the specified direction from a cell.
   * Tunnels are typically rendered differently from regular passages to indicate
   * special connectivity like bridges or multi-level connections.
   * @param cell - The cell to draw the tunnel from
   * @param direction - The direction of the tunnel
   * @param wallColor - Color for wall sections flanking the tunnel
   * @param tunnelColor - Color for the tunnel opening itself
   */
  public drawTunnel(
    cell: Cell,
    direction: Direction,
    wallColor = this.color.wall,
    tunnelColor = this.color.tunnel,
  ): void {
    this.drawPassage(cell, direction, wallColor, tunnelColor);
  }

  /**
   * Draws a passage opening in the specified direction from a cell.
   * Must be implemented by concrete maze classes based on their geometry.
   * @param cell - The cell to draw the passage from
   * @param direction - The direction of the passage
   * @param wallColor - The color for any remaining wall portions
   * @param cellColor - The color for the passage opening
   */
  public abstract drawPassage(
    cell: Cell,
    direction: Direction,
    wallColor: string,
    cellColor: string,
  ): void;

  /**
   * Draws a path indicator (arrow or circle) within a cell.
   * Renders an arrow pointing in the specified direction, or a circle if no direction is specified.
   * Used for visualizing solution paths, movement directions, or waypoints.
   * @param cell - The cell with direction information to draw the path indicator for
   * @param color - The path indicator color (defaults to path color)
   */
  public drawPath(cell: CellDirection, color = this.color.path): void {
    if (this.drawing) {
      const { rect } = this.nexus(cell);
      if (cell.direction === '?') {
        this.renderCircle(rect, color);
      } else {
        const angle = this.matrix.angle[cell.direction] ?? 0;

        this.renderArrow(rect, angle, color);
      }
    }
  }

  /**
   * Draws path indicators for multiple cells.
   * Renders path arrows/circles for each cell, using inverted color for tunnel cells.
   * @param cells - Array of cells with tunnel information to draw path indicators for
   * @param color - The base path color (defaults to path color, inverted for tunnels)
   */
  public drawPaths(cells: CellTunnel[], color = this.color.path): void {
    if (this.drawing) {
      for (const cell of cells) {
        this.drawPath(cell, cell.tunnel ? inverse(color) : color);
      }
    }
  }

  /**
   * Draws a star symbol within the specified cell.
   * Redraws the cell first, then overlays a star shape for marking special locations.
   * @param cell - The cell to draw the star in
   * @param color - The star color (defaults to avatar color)
   */
  public drawStar(cell: Cell, color = this.color.avatar): void {
    if (this.drawing) {
      const { rect } = this.nexus(cell);
      this.drawCell(cell);
      this.renderStar(rect, color);
    }
  }

  /**
   * Renders an arrow shape within the specified rectangle.
   * Creates a directional arrow pointing at the given angle for path visualization.
   * @param rect - The bounding rectangle to render the arrow within
   * @param angle - The rotation angle for the arrow direction
   * @param color - The arrow color
   */
  protected renderArrow(rect: Rect, angle: number, color: string): void {
    this.renderShape(
      [
        { x: 1, y: 0 },
        { x: -1, y: 2 / 3 },
        { x: 0, y: 0 },
        { x: -1, y: -2 / 3 },
      ],
      rect,
      angle,
      color,
    );
  }

  /**
   * Renders a star shape within the specified rectangle.
   * Creates a multi-pointed star symbol for marking special locations.
   * @param rect - The bounding rectangle to render the star within
   * @param color - The star color
   */
  protected renderStar(rect: Rect, color: string): void {
    this.renderShape(starShape, rect, 0, color);
  }

  /**
   * Renders a custom polygon shape within the specified rectangle.
   * Scales, rotates, and translates the coordinate array to fit the rectangle.
   * @param coords - Array of coordinates defining the shape
   * @param rect - The bounding rectangle to render the shape within
   * @param angle - The rotation angle for the shape
   * @param color - The shape color
   */
  protected renderShape(coords: Cartesian[], rect: Rect, angle: number, color: string): void {
    if (this.drawing) {
      this.drawing.polygon(
        translate(
          rotate(scale(coords, { x: rect.width / 2, y: rect.height / 2 }), toRadians(angle)),
          {
            x: rect.x + rect.width / 2,
            y: rect.y + rect.height / 2,
          },
        ),
        color,
      );
    }
  }

  /**
   * Draws an avatar (circle) within the specified cell.
   * Renders a circular symbol to represent player position or important locations.
   * @param cell - The cell to draw the avatar in
   * @param color - The avatar color (defaults to avatar color)
   */
  public drawAvatar(cell: Cell, color = this.color.avatar): void {
    if (this.drawing) {
      const { rect } = this.nexus(cell);

      this.renderCircle(rect, color);
    }
  }

  /**
   * Draws a small dot within the specified cell.
   * Renders a small circular marker for subtle cell marking or breadcrumb trails.
   * @param cell - The cell to draw the dot in
   * @param color - The dot color (defaults to avatar color)
   * @param r - The dot radius as a fraction of cell size (defaults to 0.125)
   */
  public drawDot(cell: Cell, color = this.color.avatar, r = 0.125): void {
    if (this.drawing) {
      const { rect } = this.nexus(cell);
      this.renderCircle(rect, color, r);
    }
  }

  /**
   * Renders a circle within the specified rectangle.
   * Creates a circular shape centered in the rectangle with the given radius ratio.
   * @param rect - The bounding rectangle to render the circle within
   * @param color - The circle color
   * @param r - The radius as a fraction of rectangle width (defaults to 0.25)
   */
  protected renderCircle(rect: Rect, color: string, r = 0.25): void {
    if (this.drawing) {
      this.drawing.circle(
        { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 },
        Math.abs(rect.width) * r,
        color,
      );
    }
  }

  /**
   * Returns geometry-specific offset values for rendering different cell kinds.
   * Must be implemented by concrete maze classes to define their shape-specific offsets.
   * @param kind - The kind of cell to get offsets for
   * @returns Dictionary of named offset values in pixels
   */
  protected abstract offsets(kind: Kind): Record<string, number>;

  /**
   * Erases a cell by drawing it with the void color or specified color.
   * @param cell - The cell to erase
   * @param color - The color to use for erasing (defaults to void color)
   */
  public abstract eraseCell(cell: Cell, color?: string): void;

  /**
   * Draws the floor/background of a cell.
   * @param cell - The cell to draw the floor for
   * @param color - The floor color (defaults to cell color)
   */
  public abstract drawFloor(cell: Cell, color?: string): void;

  /**
   * Draws a wall in the specified direction from a cell.
   * @param cell - The cell to draw the wall from
   * @param direction - The direction of the wall
   * @param color - The wall color (defaults to wall color)
   */
  public abstract drawWall(cell: Cell, direction: Direction, color?: string): void;

  /**
   * Draws a pillar at the intersection of walls.
   * @param cell - The cell containing the pillar
   * @param pillar - The pillar specification (directions it connects)
   * @param color - The pillar color (defaults to wall color)
   */
  public abstract drawPillar(cell: Cell, pillar: Pillar, color?: string): void;

  /**
   * Draws an X mark on a cell for highlighting or error indication.
   * @param cell - The cell to mark with an X
   * @param color - The X mark color (defaults to error color)
   */
  public abstract drawX(cell: Cell, color?: string): void;
  //#endregion
  //#region Location
  /**
   * Parses a location string into a Cell object.
   * Location strings specify cells using order (first, last, random) and zone (edge, corner, center).
   * @param p - The location string to parse (e.g., "first edge", "random center")
   * @returns The cell corresponding to the parsed location
   */
  public parseLocation(p: Location): Cell {
    const [allOrder, zone] = p.split(' ') as [AllOrder, Zone];

    const cells = this.cellsInMaze(allOrder);

    let cell: Cell | undefined = undefined;
    switch (zone) {
      case 'edge': {
        cell = cells.find((cell) => this.moves(cell, { wall: 'all', inMaze: false }).length > 0);
        break;
      }

      case 'interior': {
        cell = cells.find((cell) => this.moves(cell, { wall: 'all', inMaze: false }).length === 0);
        break;
      }

      // no default
    }

    if (cell) {
      return cell;
    }

    this.sendMessage(`Unable to find cell matching criteria "${p}"`, { level: 'warning' });
    return this.randomCell();
  }

  /**
   * Parses a cell specification into a Cell object.
   * Handles both direct Cell objects and Location strings by parsing them appropriately.
   * @param pd - The cell specification (Cell object or Location string)
   * @returns The parsed Cell object
   */
  private parseSpecification(pd: Cell | Location): Cell {
    if (typeof pd === 'string') {
      return this.parseLocation(pd);
    }

    return pd;
  }
  //#endregion
  //#region Bridge
  /**
   * Returns the available bridge configurations for the specified cell.
   * Bridges allow multi-level connections and special routing in complex mazes.
   * @param cell - The cell to get bridge configurations for
   * @returns Array of bridge layouts available for the cell's kind
   */
  public bridges(cell: Cell): Bridge[] {
    const pieces = this.matrix.bridge?.pieces ?? 1;
    const connect = this.matrix.bridge?.connect ?? {};
    return (this.matrix.bridge?.layouts[this.cellKind(cell)] ?? []).map((layout) => ({
      direction: layout.path[0],
      pieces,
      connect,
      ...layout,
    }));
  }
  //#endregion
  //#region Export
  /**
   * Exports the maze to a canvas with optional solution and distance visualization.
   * Creates a high-quality rendering of the maze for saving or display purposes.
   * @param config - Export configuration options containing canvas, showSolution, transparentBackground, showDistances, and scale properties
   * @returns The canvas element with the rendered maze
   */
  public export({
    canvas,
    showSolution = false,
    transparentBackground = false,
    showDistances = this.showDistances,
    scale = 1,
  }: {
    canvas: HTMLCanvasElement;
    showSolution?: boolean;
    transparentBackground?: boolean;
    showDistances?: ShowDistances;
    scale?: number;
  }): void {
    if (this.drawing) {
      const draw = this.attachDrawing(new CanvasDrawing(canvas, { scale }));

      const bg = this.color.void;
      if (transparentBackground) {
        this.color.void = 'transparent';
      }

      if (showSolution) {
        this.clear();
        this.drawSolution(this.color.solution, showDistances);
      } else {
        this.draw();
        this.drawDistances(showDistances);
      }

      if (transparentBackground) {
        this.color.void = bg;
      }

      this.attachDrawing(draw);
    }
  }
}
