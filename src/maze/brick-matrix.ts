/* eslint-disable @typescript-eslint/no-unnecessary-type-conversion */
import { type Matrix } from '../geometry/matrix.ts';

/**
 * Matrix definition for brick/hexagonal maze geometry.
 *
 * Brick mazes use hexagonal cells arranged in a brick-like pattern with offset rows.
 * Each cell has 6 possible connections (directions a-f) corresponding to the 6 sides
 * of a hexagon. The geometry supports two cell kinds (0 and 1) representing the
 * alternating offset pattern of brick/hexagonal arrangements.
 *
 * Direction mapping:
 * - a: Upper-left (225°)
 * - b: Upper-right (315°)
 * - c: Right (0°)
 * - d: Lower-right (45°)
 * - e: Lower-left (135°)
 * - f: Left (180°)
 *
 * Cell kinds:
 * - Kind 0: Left-aligned hexagons (odd rows)
 * - Kind 1: Right-aligned hexagons (even rows)
 *
 * @group Maze
 * @category Brick
 */
export const brickMatrix: Matrix = {
  /** Bridge configuration for multi-level hexagonal maze connections */
  bridge: {
    /** Default bridge connection mappings - opposite directions */
    connect: {
      a: 'e', // Upper-left connects to lower-left
      b: 'd', // Upper-right connects to lower-right
      c: 'f', // Right connects to left
      d: 'b', // Lower-right connects to upper-right
      e: 'a', // Lower-left connects to upper-left
      f: 'c', // Left connects to right
    },
    /** Bridge layouts for different cell kinds */
    layouts: {
      0: [
        { path: ['a', 'b'], rear: ['e', 'd'], connect: { c: 'f', f: 'c' } },
        { path: ['b', 'a'], rear: ['d', 'e'], connect: { c: 'f', f: 'c' } },
        { path: ['d', 'e'], rear: ['b', 'a'], connect: { c: 'f', f: 'c' } },
        { path: ['e', 'd'], rear: ['a', 'b'], connect: { c: 'f', f: 'c' } },
        { path: ['c'], rear: ['f'], connect: { a: 'e', e: 'a', b: 'd', d: 'b' } },
        { path: ['f'], rear: ['c'], connect: { a: 'e', e: 'a', b: 'd', d: 'b' } },
      ],
      1: [
        { path: ['a', 'b'], rear: ['e', 'd'], connect: { c: 'f', f: 'c' } },
        { path: ['b', 'a'], rear: ['d', 'e'], connect: { c: 'f', f: 'c' } },
        { path: ['d', 'e'], rear: ['b', 'a'], connect: { c: 'f', f: 'c' } },
        { path: ['e', 'd'], rear: ['a', 'b'], connect: { c: 'f', f: 'c' } },
        { path: ['c'], rear: ['f'], connect: { a: 'e', e: 'a', b: 'd', d: 'b' } },
        { path: ['f'], rear: ['c'], connect: { a: 'e', e: 'a', b: 'd', d: 'b' } },
      ],
    },
  },
  /** All six hexagonal directions available for movement */
  directions: ['a', 'b', 'c', 'd', 'e', 'f'],
  /** Pillar definitions for hexagonal wall intersections (adjacent direction pairs) */
  pillars: ['fa', 'ab', 'bc', 'cd', 'de', 'ef'],
  /** Wall configurations - both cell kinds support all 6 directions */
  wall: {
    0: { a: true, b: true, c: true, d: true, e: true, f: true }, // Left-aligned hexagons
    1: { a: true, b: true, c: true, d: true, e: true, f: true }, // Right-aligned hexagons
  },
  /** Opposite direction and facing mappings for hexagonal geometry */
  opposite: {
    /** Direction to opposite facing mappings */
    direction: {
      a: 'D', // Upper-left → Lower-right facing
      b: 'E', // Upper-right → Lower-left facing
      c: 'F', // Right → Left facing
      d: 'A', // Lower-right → Upper-left facing
      e: 'B', // Lower-left → Upper-right facing
      f: 'C', // Left → Right facing
    },
    /** Facing to opposite direction mappings */
    facing: {
      A: 'd', // Upper-left facing → Lower-right direction
      B: 'e', // Upper-right facing → Lower-left direction
      C: 'f', // Right facing → Left direction
      D: 'a', // Lower-right facing → Upper-left direction
      E: 'b', // Lower-left facing → Upper-right direction
      F: 'c', // Left facing → Right direction
    },
  },
  /** Right turn options from each facing direction (clockwise order) */
  rightTurn: {
    A: ['c', 'b', 'a', 'f', 'e', 'd'], // From upper-left facing
    B: ['d', 'c', 'b', 'a', 'f', 'e'], // From upper-right facing
    C: ['e', 'd', 'c', 'b', 'a', 'f'], // From right facing
    D: ['f', 'e', 'd', 'c', 'b', 'a'], // From lower-right facing
    E: ['a', 'f', 'e', 'd', 'c', 'b'], // From lower-left facing
    F: ['b', 'a', 'f', 'e', 'd', 'c'], // From left facing
  },
  /** Left turn options from each facing direction (counter-clockwise order) */
  leftTurn: {
    A: ['e', 'f', 'a', 'b', 'c', 'd'], // From upper-left facing
    B: ['f', 'a', 'b', 'c', 'd', 'e'], // From upper-right facing
    C: ['a', 'b', 'c', 'd', 'e', 'f'], // From right facing
    D: ['b', 'c', 'd', 'e', 'f', 'a'], // From lower-right facing
    E: ['c', 'd', 'e', 'f', 'a', 'b'], // From lower-left facing
    F: ['d', 'e', 'f', 'a', 'b', 'c'], // From left facing
  },
  /** Straight/forward movement options from each facing direction */
  straight: {
    A: ['b', 'a', 'c', 'f', 'e', 'd'], // From upper-left facing
    B: ['a', 'b', 'f', 'c', 'd', 'e'], // From upper-right facing
    C: ['c', 'ea', 'bd', 'f'], // From right facing (includes compound moves)
    D: ['e', 'd', 'f', 'c', 'b', 'a'], // From lower-right facing
    E: ['d', 'e', 'c', 'f', 'a', 'b'], // From lower-left facing
    F: ['f', 'bd', 'ae', 'c'], // From left facing (includes compound moves)
  },
  /** Movement offset calculations for each cell kind and direction */
  move: {
    /** Left-aligned hexagons (odd rows) - offset pattern */
    0: {
      a: { x: -1, y: -1 }, // Upper-left
      b: { x: +0, y: -1 }, // Upper-right
      c: { x: +1, y: +0 }, // Right
      d: { x: +0, y: +1 }, // Lower-right
      e: { x: -1, y: +1 }, // Lower-left
      f: { x: -1, y: +0 }, // Left
    },
    /** Right-aligned hexagons (even rows) - offset pattern */
    1: {
      a: { x: +0, y: -1 }, // Upper-left
      b: { x: +1, y: -1 }, // Upper-right
      c: { x: +1, y: +0 }, // Right
      d: { x: +1, y: +1 }, // Lower-right
      e: { x: +0, y: +1 }, // Lower-left
      f: { x: -1, y: +0 }, // Left
    },
  },
  /** Preferred direction ordering for maze generation algorithms */
  preferred: {
    0: ['e', 'd', 'c'], // Left-aligned: prefer lower-left, lower-right, right
    1: ['e', 'd', 'c'], // Right-aligned: same preference pattern
  },
  /** Direction angles in degrees for rendering and calculations */
  angle: {
    a: 225, // Upper-left: 225° (SW)
    b: 315, // Upper-right: 315° (NW)
    c: 0, // Right: 0° (E)
    d: 45, // Lower-right: 45° (NE)
    e: 135, // Lower-left: 135° (SE)
    f: 180, // Left: 180° (W)
  },
};
