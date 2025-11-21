/* eslint-disable @typescript-eslint/no-unnecessary-type-conversion */
import { type Matrix } from '../matrix.ts';

/**
 * Matrix definition for circular maze geometry.
 *
 * Circular mazes are composed of concentric rings with radial spokes, creating
 * a polar coordinate system. The maze uses different cell kinds (0-6) to represent
 * different ring positions and connection patterns:
 *
 * - Kind 0: Standard ring cells with 4 directions (a=north, b=east, c=south, d=west)
 * - Kind 1: Ring cells with inward connection (g=inner radial)
 * - Kind 2: Ring cells with inward connection (h=inner radial)
 * - Kind 3: Ring cells with outward connections (e,f=outer radials)
 * - Kind 4: Ring cells with both outer and inner connections
 * - Kind 5: Ring cells with both outer and inner connections
 * - Kind 6: Center cells with only outward connections
 *
 * Direction mapping:
 * - a: North (0°)
 * - b: East (90°)
 * - c: South (180°)
 * - d: West (270°)
 * - e: Outer radial NW (315°)
 * - f: Outer radial NE (45°)
 * - g: Inner radial (180°)
 * - h: Inner radial (180°)
 *
 * @group Geometry
 * @category Constants
 */
export const circularMatrix: Matrix = {
  /** Bridge configuration for multi-level circular maze connections */
  bridge: {
    /** Number of bridge pieces required for connections */
    pieces: 1,
    /** Bridge layouts for different cell kinds */
    layouts: {
      0: [
        { path: ['a'], rear: ['c'] }, // North-south bridge
        { path: ['b'], rear: ['d'] }, // East-west bridge
        { path: ['c'], rear: ['a'] }, // South-north bridge
        { path: ['d'], rear: ['b'] }, // West-east bridge
      ],
      1: [{ path: ['a'], rear: ['c', 'g'] }], // North bridge with inner radial rear
      2: [{ path: ['a'], rear: ['c', 'h'] }], // North bridge with inner radial rear
      3: [], // No bridge layouts for outer ring cells
      4: [], // No bridge layouts for outer ring cells
      5: [], // No bridge layouts for outer ring cells
      6: [], // No bridge layouts for center cells
    },
    /** Default bridge connection mappings - opposite directions */
    connect: { a: 'c', b: 'd', c: 'a', d: 'b', e: 'g', f: 'h', g: 'e', h: 'g' },
  },
  /** All eight circular directions available for movement */
  directions: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
  /** Pillar definitions for circular maze intersections (adjacent direction pairs) */
  pillars: ['ab', 'bc', 'cd', 'da', 'de', 'fb', 'bg', 'gd', 'bh', 'hd', 'ef'],
  /** Wall configurations - defines which directions can have walls for each cell kind */
  wall: {
    0: { a: true, b: true, c: true, d: true }, // Standard ring cells: cardinal directions
    1: { a: true, b: true, g: true, d: true }, // Ring cells with inner radial g
    2: { a: true, b: true, h: true, d: true }, // Ring cells with inner radial h
    3: { e: true, f: true, b: true, c: true, d: true }, // Ring cells with outer radials
    4: { e: true, f: true, b: true, g: true, d: true }, // Ring cells with outer + inner g
    5: { e: true, f: true, b: true, h: true, d: true }, // Ring cells with outer + inner h
    6: { e: true, f: true }, // Center cells: only outer radials
  },
  /** Opposite direction and facing mappings for circular geometry */
  opposite: {
    /** Direction to opposite facing mappings */
    direction: {
      a: 'C', // North → South facing
      b: 'D', // East → West facing
      c: 'A', // South → North facing
      d: 'B', // West → East facing
      e: 'G', // Outer NW → Inner facing
      f: 'H', // Outer NE → Inner facing
      g: 'E', // Inner → Outer NW facing
      h: 'F', // Inner → Outer NE facing
    },
    /** Facing to opposite direction mappings */
    facing: {
      A: 'c', // North facing → South direction
      B: 'd', // East facing → West direction
      C: 'a', // South facing → North direction
      D: 'b', // West facing → East direction
      E: 'g', // Outer NW facing → Inner direction
      F: 'h', // Outer NE facing → Inner direction
      G: 'e', // Inner facing → Outer NW direction
      H: 'f', // Inner facing → Outer NE direction
    },
  },
  /** Straight-ahead movement priorities for each facing direction */
  straight: {
    A: ['a', 'fe', 'bd', 'gh', 'c'], // North facing: prefer north, then radials
    B: ['b', 'fh', 'ca', 'ge', 'd'], // East facing: prefer east, then alternating
    C: ['c', 'gh', 'db', 'ef', 'a'], // South facing: prefer south, then radials
    D: ['d', 'eg', 'ac', 'fh', 'b'], // West facing: prefer west, then alternating
    E: ['e', 'a', 'f', 'd', 'b', 'h', 'c', 'g'], // Outer NW facing: prefer radial out
    F: ['f', 'a', 'e', 'b', 'd', 'g', 'c', 'h'], // Outer NE facing: prefer radial out
    G: ['g', 'c', 'h', 'd', 'b', 'f', 'a', 'e'], // Inner facing: prefer radial in
    H: ['h', 'c', 'g', 'b', 'd', 'e', 'a', 'f'], // Inner facing: prefer radial in
  },
  /** Right turn movement priorities for each facing direction */
  rightTurn: {
    A: ['b', 'f', 'a', 'e', 'd', 'c'], // North facing: turn right to east
    B: ['g', 'c', 'h', 'b', 'f', 'a', 'e', 'd'], // East facing: prefer inward radials
    C: ['e', 'd', 'g', 'c', 'h', 'b', 'f', 'a'], // South facing: turn right to west
    D: ['f', 'a', 'e', 'd', 'g', 'c', 'h', 'b'], // West facing: turn right to north
    E: ['b', 'f', 'a', 'e', 'd', 'g'], // Outer NW: turn toward circumference
    F: ['b', 'f', 'a', 'e', 'd', 'h'], // Outer NE: turn toward circumference
    G: ['d', 'g', 'c', 'h', 'b', 'f', 'a', 'e'], // Inner: turn around circumference
    H: ['a', 'e', 'd', 'g', 'c', 'h', 'b', 'f'], // Inner: turn around circumference
  },
  /** Left turn movement priorities for each facing direction */
  leftTurn: {
    A: ['d', 'e', 'a', 'f', 'b', 'c'], // North facing: turn left to west
    B: ['e', 'a', 'f', 'b', 'h', 'c', 'g', 'd'], // East facing: turn left to north
    C: ['f', 'b', 'h', 'c', 'g', 'd', 'e', 'a'], // South facing: turn left to east
    D: ['h', 'c', 'g', 'd', 'e', 'a', 'f', 'b'], // West facing: turn left to south
    E: ['d', 'e', 'a', 'f', 'b', 'g'], // Outer NW: turn toward circumference
    F: ['d', 'e', 'a', 'f', 'b', 'h'], // Outer NE: turn toward circumference
    G: ['a', 'f', 'b', 'h', 'c', 'g', 'd', 'e'], // Inner: turn around circumference
    H: ['b', 'h', 'c', 'g', 'd', 'e', 'a', 'f'], // Inner: turn around circumference
  },
  /** Movement vectors for each cell kind and direction */
  move: {
    /** Standard ring cells: cardinal directions only */
    0: {
      a: { x: +0, y: +1 }, // North: up one row
      b: { x: +1, y: +0 }, // East: right one column
      c: { x: +0, y: -1 }, // South: down one row
      d: { x: -1, y: +0 }, // West: left one column
    },
    /** Ring cells with inner radial g */
    1: {
      a: { x: +0, y: +1 }, // North: up one row
      b: { x: +1, y: +0 }, // East: right one column
      g: { x: +0, y: -1, zone: 'down' }, // Inner radial: down to inner ring
      d: { x: -1, y: +0 }, // West: left one column
    },
    /** Ring cells with inner radial h */
    2: {
      a: { x: +0, y: +1 }, // North: up one row
      b: { x: +1, y: +0 }, // East: right one column
      h: { x: +0, y: -1, zone: 'down' }, // Inner radial: down to inner ring
      d: { x: -1, y: +0 }, // West: left one column
    },
    /** Ring cells with outer radials */
    3: {
      e: { x: +0, y: +1, zone: 'up' }, // Outer NW: up to outer ring
      f: { x: +1, y: +1, zone: 'up' }, // Outer NE: up-right to outer ring
      b: { x: +1, y: +0 }, // East: right one column
      c: { x: +0, y: -1 }, // South: down one row
      d: { x: -1, y: +0 }, // West: left one column
    },
    /** Ring cells with outer radials and inner radial g */
    4: {
      e: { x: +0, y: +1, zone: 'up' }, // Outer NW: up to outer ring
      f: { x: +1, y: +1, zone: 'up' }, // Outer NE: up-right to outer ring
      b: { x: +1, y: +0 }, // East: right one column
      g: { x: +0, y: -1, zone: 'down' }, // Inner radial: down to inner ring
      d: { x: -1, y: +0 }, // West: left one column
    },
    /** Ring cells with outer radials and inner radial h */
    5: {
      e: { x: +0, y: +1, zone: 'up' }, // Outer NW: up to outer ring
      f: { x: +1, y: +1, zone: 'up' }, // Outer NE: up-right to outer ring
      b: { x: +1, y: +0 }, // East: right one column
      h: { x: +0, y: -1, zone: 'down' }, // Inner radial: down to inner ring
      d: { x: -1, y: +0 }, // West: left one column
    },
    /** Center cells: only outer radials */
    6: {
      e: { x: +0, y: +1, zone: 'up' }, // Outer NW: up to outer ring
      f: { x: +1, y: +1, zone: 'up' }, // Outer NE: up-right to outer ring
    },
  },
  /** Preferred directions for maze generation algorithms by cell kind */
  preferred: {
    0: ['a', 'd'], // Standard ring: prefer north-south movement
    1: ['a', 'd'], // Ring with inner g: prefer north-south movement
    2: ['a', 'd'], // Ring with inner h: prefer north-south movement
    3: ['e', 'f', 'd'], // Ring with outer: prefer radial outward, then west
    4: ['e', 'f', 'd'], // Ring with outer+inner g: prefer radial outward, then west
    5: ['e', 'f', 'd'], // Ring with outer+inner h: prefer radial outward, then west
    6: ['e'], // Center: prefer single radial outward
  },
  /** Angle mappings for directional rendering (in degrees) */
  angle: {
    a: 0, // North: 0°
    b: 90, // East: 90°
    c: 180, // South: 180°
    d: 270, // West: 270°
    e: 315, // Outer NW: 315°
    f: 45, // Outer NE: 45°
    g: 180, // Inner radial: 180°
    h: 180, // Inner radial: 180°
  },
};
