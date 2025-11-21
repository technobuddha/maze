import { type BridgeLayout } from './bridges.ts';
import {
  type Direction,
  type Facing,
  type Kind,
  type MoveOffset,
  type Pillar,
} from './geometry.ts';

/**
 * Configuration for bridge connections in multi-level mazes.
 * Defines how cells can connect across different levels through bridge structures.
 *
 * @group Geometry
 * @category Types
 */
export type BridgeMatrix = {
  /** Number of pieces required to complete a bridge connection (default: 1) */
  readonly pieces?: number;
  /** Mapping of directions to their corresponding bridge connection directions */
  readonly connect: Partial<Record<Direction, Direction>>;
  /** Bridge layout configurations for different cell kinds */
  readonly layouts: Record<Kind, BridgeLayout[]>;
};

/**
 * Complete geometric definition matrix for a specific maze geometry type.
 * This is the core configuration that defines how a maze geometry behaves,
 * including movement rules, wall configurations, navigation logic, and rendering properties.
 * Each maze type (square, hexagonal, triangular, etc.) has its own unique matrix.
 *
 * @group Geometry
 * @category Types
 */
export type Matrix = {
  /** All valid directions for movement in this geometry */
  readonly directions: Direction[];

  /** Pillar definitions - intersections where walls meet */
  readonly pillars: Pillar[];

  /** Wall configuration for each cell kind - which directions can have walls */
  readonly wall: Record<Kind, Partial<Record<Direction, boolean>>>;

  /** Opposite direction/facing mappings for navigation and pathfinding */
  readonly opposite: {
    /** Maps each direction to its opposite facing */
    readonly direction: Partial<Record<Direction, Facing>>;
    /** Maps each facing to its opposite direction */
    readonly facing: Partial<Record<Facing, Direction>>;
  };

  /** Right turn possibilities from each facing direction */
  readonly rightTurn: Partial<Record<Facing, Direction[]>>;

  /** Left turn possibilities from each facing direction */
  readonly leftTurn: Partial<Record<Facing, Direction[]>>;

  /** Straight movement possibilities from each facing (may include compound directions) */
  readonly straight: Partial<Record<Facing, (Direction | `${Direction}${Direction}`)[]>>;

  /** Movement offset calculations for each cell kind and direction */
  readonly move: Record<Kind, Partial<Record<Direction, MoveOffset | MoveOffset[]>>>;

  /** Preferred direction ordering for each cell kind (used in generation algorithms) */
  readonly preferred: Record<Kind, Direction[]>;

  /** Angle in radians for each direction (used for rendering and calculations) */
  readonly angle: Partial<Record<Direction, number>>;

  /** Optional bridge configuration for multi-level maze support */
  readonly bridge?: BridgeMatrix;
};
