import { type Rect } from '@technobuddha/library';

import { type CellFacing, type Direction } from './geometry.ts';

/**
 * Generic type for direction-based mappings with optional false/undefined values
 * @internal
 */
export type Directional<T> = Partial<Record<Direction, T | false | undefined>>;

/**
 * Wall configuration mapping directions to boolean presence of walls
 * @group Geometry
 * @category Types
 */
export type Wall = Directional<true>;

/**
 * Tunnel configuration mapping directions to their destination cells with facing
 * @group Geometry
 * @category Types
 */
export type Tunnels = Directional<CellFacing>;

/**
 * Via (bridge) configuration mapping directions to arrays of connected cells
 * @group Geometry
 * @category Types
 */
export type Via = Directional<CellFacing[]>;

/**
 * Offset values for geometric calculations, keyed by descriptive names
 * @group Geometry
 * @category Types
 */
export type Offsets = Record<string, number>;

/**
 * Properties for constructing a Nexus instance
 * @group Geometry
 * @category Types
 */
export type NexusProperties = {
  /** X coordinate of the cell */
  x: number;
  /** Y coordinate of the cell */
  y: number;
  /** Wall configuration for all possible directions */
  walls: Wall;
  /** Tunnel connections to other cells */
  tunnels: Tunnels;
  /** Bridge (via) connections for multi-level mazes */
  via: Via;
  /** Barrier configuration for impassable walls */
  barriers: Wall;
  /** Whether this cell is masked (hidden/removed) */
  mask?: boolean;
  /** Distance from entrance for pathfinding algorithms */
  distance?: number;
  /** Drawing bounding box for rendering */
  drawingBox: Rect;
};

/**
 * Represents a connection hub for a maze cell, managing walls, tunnels, bridges, and rendering.
 * The Nexus is the core data structure that defines how a cell connects to its neighbors
 * and contains all the state needed for maze generation, solving, and rendering.
 *
 * @group Geometry
 * @category Classes
 */
export class Nexus {
  /** X coordinate of this cell in the maze grid */
  public readonly x: number;
  /** Y coordinate of this cell in the maze grid */
  public readonly y: number;
  /** Wall configuration - which directions have walls present */
  public readonly walls: Wall;
  /** Tunnel connections - passages to neighboring cells */
  public readonly tunnels: Tunnels;
  /** Via connections - bridge connections for multi-level movement */
  public readonly via: Via;
  /** Barrier configuration - permanent impassable walls */
  public readonly barriers: Wall;
  /** Bridge identifier for multi-level maze connections */
  public bridge: number | undefined;
  /** Whether this cell is at an elevated level */
  public elevated = false;
  /** Whether this cell is masked (hidden from the maze) */
  public mask: boolean;
  /** Distance from entrance, used in pathfinding and analysis */
  public distance: number;
  /** Drawing rectangle defining the cell's render bounds */
  public rect: Rect;

  /**
   * Creates a new Nexus instance with the specified properties
   * @param properties - Configuration object containing all nexus properties
   */
  public constructor({
    x,
    y,
    walls,
    tunnels,
    via,
    barriers,
    mask = false,
    distance = Infinity,
    drawingBox: rect,
  }: NexusProperties) {
    this.x = x;
    this.y = y;
    this.walls = walls;
    this.tunnels = tunnels;
    this.via = via;
    this.barriers = barriers;
    this.mask = mask;
    this.distance = distance;
    this.rect = rect;
  }

  /**
   * Gets all directions that have wall configurations defined for this cell
   * @returns Array of directions where walls can exist
   */
  public wallDirections(): Direction[] {
    return Object.keys(this.walls) as Direction[];
  }

  /**
   * Gets all directions that have tunnel configurations defined for this cell
   * @returns Array of directions where tunnels can be created
   */
  public tunnelDirections(): Direction[] {
    return Object.keys(this.tunnels) as Direction[];
  }

  /**
   * Gets all directions that have via (bridge) configurations defined for this cell
   * @returns Array of directions where bridge connections can exist
   */
  public viaDirections(): Direction[] {
    return Object.keys(this.via) as Direction[];
  }

  /**
   * Checks if a wall can exist in the specified direction for this cell type
   * @param direction - The direction to check
   * @returns True if this cell type supports walls in the given direction
   */
  public hasWall(direction: Direction): boolean {
    return direction in this.walls;
  }

  /**
   * Adds/erects a wall in the specified direction
   * @param direction - The direction to add the wall
   * @throws Error if the direction is not valid for this cell type
   */
  public addWall(direction: Direction): void {
    if (direction in this.walls) {
      this.walls[direction] = true;
    } else {
      throw new Error(`Invalid wall: ${direction}`);
    }
  }

  /**
   * Removes/opens a wall in the specified direction
   * @param direction - The direction to remove the wall from
   * @throws Error if the direction is not valid for this cell type
   */
  public removeWall(direction: Direction): void {
    if (direction in this.walls) {
      this.walls[direction] = false;
    } else {
      throw new Error(`Invalid wall: ${direction}`);
    }
  }

  /**
   * Converts a regular wall to a permanent barrier in the specified direction.
   * Barriers are immutable and cannot be removed during maze generation.
   * @param direction - The direction to erect the barrier
   */
  public erectBarrier(direction: Direction): void {
    if (direction in this.walls) {
      delete this.walls[direction];
    }
    this.barriers[direction] = true;
  }
}
