import { type Direction } from './geometry.ts';

/**
 * Complete bridge configuration for multi-level maze connections.
 * Bridges allow movement between different levels or zones within a maze,
 * creating complex 3D-like navigation paths within a 2D structure.
 *
 * @group Geometry
 * @category Types
 */
export type Bridge = {
  /** Number of pieces required to complete this bridge connection */
  readonly pieces: number;
  /** Primary direction of the bridge span */
  readonly direction: Direction;
  /** Array of directions defining the bridge pathway */
  readonly path: Direction[];
  /** Array of directions defining the rear/return pathway */
  readonly rear: Direction[];
  /** Mapping of bridge connection directions to their targets */
  readonly connect: Partial<Record<Direction, Direction>>;
};

/**
 * Bridge layout configuration template used in maze geometry matrices.
 * Defines the structural layout of bridges without the runtime state.
 * Used as a template that gets instantiated into full Bridge objects during maze creation.
 *
 * @group Geometry
 * @category Types
 */
export type BridgeLayout = {
  /** Array of directions defining the main bridge pathway */
  path: Direction[];
  /** Array of directions defining the rear/return pathway */
  rear: Direction[];
  /** Optional number of pieces required (defaults to matrix setting) */
  pieces?: number;
  /** Optional connection mapping (defaults to matrix setting) */
  connect?: Partial<Record<Direction, Direction>>;
};
