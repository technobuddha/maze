/* eslint-disable @typescript-eslint/no-unnecessary-type-conversion */
import { type Matrix } from '../matrix.ts';

/**
 * Matrix definition for square-based maze geometry.
 *
 * Square mazes use a simple rectangular grid where each cell is a square with
 * 4 possible connections corresponding to the cardinal directions (north, east,
 * west, south). This is the most basic and widely used maze tessellation.
 *
 * Direction mapping:
 * - n (270°): North - connects to cell above
 * - e (0°): East - connects to cell to the right
 * - w (180°): West - connects to cell to the left
 * - s (90°): South - connects to cell below
 *
 * Cell kinds:
 * - Kind 0: Standard square cell (only kind needed for square tessellation)
 *
 * The square tessellation is the simplest maze geometry, requiring no complex
 * offset calculations or multiple cell orientations. Each cell connects directly
 * to its orthogonal neighbors in a regular grid pattern.
 *
 * @group Geometry
 * @category Constants
 */
export const squareMatrix: Matrix = {
  /** Bridge configuration for multi-level maze support */
  bridge: {
    /** Number of bridge pieces available */
    pieces: 1,
    /** Bridge layout configurations by piece type */
    layouts: {
      0: [
        { path: ['n'], rear: ['s'] }, // North-south bridge
        { path: ['e'], rear: ['w'] }, // East-west bridge
        { path: ['w'], rear: ['e'] }, // West-east bridge
        { path: ['s'], rear: ['n'] }, // South-north bridge
      ],
    },
    /** Bridge connection mappings between directions */
    connect: { n: 's', e: 'w', w: 'e', s: 'n' },
  },
  /** All four cardinal directions */
  directions: ['n', 'e', 'w', 's'],
  /** Corner pillar definitions (diagonal adjacent direction pairs) */
  pillars: ['ne', 'nw', 'se', 'sw'],
  /** Wall configurations - square cells support all 4 cardinal directions */
  wall: {
    0: { n: true, e: true, w: true, s: true }, // Standard square supports all walls
  },
  /** Opposite direction and facing mappings for square geometry */
  opposite: {
    /** Direction to opposite facing mappings (lowercase to uppercase) */
    direction: {
      n: 'S', // North direction faces South
      e: 'W', // East direction faces West
      w: 'E', // West direction faces East
      s: 'N', // South direction faces North
    },
    /** Facing to opposite direction mappings (uppercase to lowercase) */
    facing: {
      N: 's', // North facing connects to south
      E: 'w', // East facing connects to west
      W: 'e', // West facing connects to east
      S: 'n', // South facing connects to north
    },
  },
  /** Right turn options from each facing direction (clockwise order) */
  rightTurn: {
    N: ['e', 'n', 'w', 's'], // From North: right leads to East, straight to North, etc.
    E: ['s', 'e', 'n', 'w'], // From East: right leads to South, straight to East, etc.
    W: ['n', 'w', 's', 'e'], // From West: right leads to North, straight to West, etc.
    S: ['w', 's', 'e', 'n'], // From South: right leads to West, straight to South, etc.
  },
  /** Left turn options from each facing direction (counter-clockwise order) */
  leftTurn: {
    N: ['w', 'n', 'e', 's'], // From North: left leads to West, straight to North, etc.
    E: ['n', 'e', 's', 'w'], // From East: left leads to North, straight to East, etc.
    W: ['s', 'w', 'n', 'e'], // From West: left leads to South, straight to West, etc.
    S: ['e', 's', 'w', 'n'], // From South: left leads to East, straight to South, etc.
  },
  /** Straight/forward movement options from each facing direction */
  straight: {
    N: ['n', 'ew', 's'], // From North: straight north, cross east-west, or south
    E: ['e', 'ns', 'w'], // From East: straight east, cross north-south, or west
    W: ['w', 'ns', 'e'], // From West: straight west, cross north-south, or east
    S: ['s', 'ew', 'n'], // From South: straight south, cross east-west, or north
  },
  /** Movement offset calculations for square grid navigation */
  move: {
    /** Kind 0 square movements - standard orthogonal grid */
    0: {
      n: { x: +0, y: -1 }, // North: move up one row
      e: { x: +1, y: +0 }, // East: move right one column
      w: { x: -1, y: +0 }, // West: move left one column
      s: { x: +0, y: +1 }, // South: move down one row
    },
  },
  /** Preferred direction ordering for maze generation algorithms by cell kind */
  preferred: {
    0: ['s', 'w'], // Kind 0: prefer south and west for consistent generation patterns
  },
  /** Direction angles in degrees for rendering and geometric calculations */
  angle: {
    n: 270, // North points up (-Y direction)
    s: 90, // South points down (+Y direction)
    e: 0, // East points right (+X direction)
    w: 180, // West points left (-X direction)
  },
};
