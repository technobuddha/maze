/* eslint-disable @typescript-eslint/no-unnecessary-type-conversion */
import { type Matrix } from '../geometry/matrix.ts';

/**
 * Matrix definition for triangle-based maze geometry.
 *
 * Triangle mazes use equilateral triangular cells arranged in a tessellating pattern.
 * The tessellation requires 2 different triangle orientations (kinds 0-1) that alternate
 * to tile the plane. Each triangle has 3 possible connections corresponding to the 3 sides.
 *
 * Direction mapping by cell kind:
 * - Kind 0 (upward triangles): b(330°), d(90°), f(210°) - connects to right, down, left
 * - Kind 1 (downward triangles): a(270°), c(30°), e(150°) - connects to up, right, left
 *
 * Cell kinds:
 * - Kind 0: Upward-pointing triangles (△)
 * - Kind 1: Downward-pointing triangles (▽)
 *
 * The tessellation follows a checkerboard pattern where upward and downward triangles
 * alternate positions to create a seamless honeycomb-like structure. Each triangle
 * connects to its three neighboring triangles along its sides.
 *
 * @group Maze
 * @category  Triangle
 */
export const triangleMatrix: Matrix = {
  /** Bridge configuration for multi-level maze support */
  bridge: {
    /** Number of bridge pieces available */
    pieces: 2,
    /** Bridge layout configurations by piece type */
    layouts: {
      /** Kind 0 (upward triangle) bridge configurations */
      0: [
        { path: ['b', 'a'], rear: ['e', 'd'] }, // Right-up bridge with left-down rear
        { path: ['b', 'c'], rear: ['e', 'f'] }, // Right-right bridge with left-left rear
        { path: ['d', 'c'], rear: ['a', 'f'] }, // Down-right bridge with up-left rear
        { path: ['d', 'e'], rear: ['a', 'b'] }, // Down-left bridge with up-right rear
        { path: ['f', 'a'], rear: ['c', 'd'] }, // Left-up bridge with right-down rear
        { path: ['f', 'e'], rear: ['c', 'b'] }, // Left-left bridge with right-right rear
      ],
      /** Kind 1 (downward triangle) bridge configurations */
      1: [
        { path: ['a', 'b'], rear: ['d', 'e'] }, // Up-right bridge with down-left rear
        { path: ['a', 'f'], rear: ['d', 'c'] }, // Up-left bridge with down-right rear
        { path: ['c', 'b'], rear: ['f', 'e'] }, // Right-right bridge with left-left rear
        { path: ['c', 'd'], rear: ['f', 'a'] }, // Right-down bridge with left-up rear
        { path: ['e', 'd'], rear: ['b', 'a'] }, // Left-down bridge with right-up rear
        { path: ['e', 'f'], rear: ['b', 'c'] }, // Left-left bridge with right-right rear
      ],
    },
    /** Bridge connection mappings between opposite directions */
    connect: { a: 'd', b: 'e', c: 'f', d: 'a', e: 'b', f: 'c' },
  },
  /** All six triangle directions across both cell kinds */
  directions: ['a', 'b', 'c', 'd', 'e', 'f'],
  /** Pillar definitions for triangle corner intersections (adjacent direction pairs) */
  pillars: ['ac', 'ce', 'ea', 'bd', 'df', 'fb'],
  /** Wall configurations - each cell kind supports its 3 corresponding directions */
  wall: {
    0: { b: true, d: true, f: true }, // Upward triangles: right, down, left
    1: { a: true, c: true, e: true }, // Downward triangles: up, right, left
  },
  /** Opposite direction and facing mappings for triangle geometry */
  opposite: {
    /** Direction to opposite facing mappings (lowercase to uppercase) */
    direction: {
      a: 'D', // Up direction faces Down
      b: 'E', // Right direction faces Left
      c: 'F', // Right direction faces Left
      d: 'A', // Down direction faces Up
      e: 'B', // Left direction faces Right
      f: 'C', // Left direction faces Right
    },
    /** Facing to opposite direction mappings (uppercase to lowercase) */
    facing: {
      A: 'd', // Up facing connects to down
      B: 'e', // Right facing connects to left
      C: 'f', // Right facing connects to left
      D: 'a', // Down facing connects to up
      E: 'b', // Left facing connects to right
      F: 'c', // Left facing connects to right
    },
  },
  /** Right turn options from each facing direction (clockwise order around triangle) */
  rightTurn: {
    A: ['b', 'f', 'd'], // From Up: right leads to Right, straight to Left, left to Down
    B: ['c', 'a', 'e'], // From Right: right leads to Right, straight to Up, left to Left
    C: ['d', 'b', 'f'], // From Right: right leads to Down, straight to Right, left to Left
    D: ['e', 'c', 'a'], // From Down: right leads to Left, straight to Right, left to Up
    E: ['f', 'd', 'b'], // From Left: right leads to Left, straight to Down, left to Right
    F: ['a', 'e', 'c'], // From Left: right leads to Up, straight to Left, left to Right
  },
  /** Left turn options from each facing direction (counter-clockwise order around triangle) */
  leftTurn: {
    A: ['f', 'b', 'd'], // From Up: left leads to Left, straight to Right, right to Down
    B: ['a', 'c', 'e'], // From Right: left leads to Up, straight to Right, right to Left
    C: ['b', 'd', 'f'], // From Right: left leads to Right, straight to Down, right to Left
    D: ['c', 'e', 'a'], // From Down: left leads to Right, straight to Left, right to Up
    E: ['d', 'f', 'b'], // From Left: left leads to Down, straight to Left, right to Right
    F: ['e', 'a', 'c'], // From Left: left leads to Left, straight to Up, right to Right
  },
  /** Straight/forward movement options from each facing direction */
  straight: {
    A: ['bf', 'd'], // From Up: cross right-left, or straight down
    B: ['ac', 'e'], // From Right: cross up-right, or straight left
    C: ['bd', 'f'], // From Right: cross right-down, or straight left
    D: ['ce', 'a'], // From Down: cross right-left, or straight up
    E: ['df', 'b'], // From Left: cross down-left, or straight right
    F: ['ea', 'c'], // From Left: cross left-up, or straight right
  },
  /** Movement offset calculations for each cell kind and direction */
  move: {
    /** Kind 0 (upward triangle) movements */
    0: {
      b: { x: +1, y: +0 }, // Right: move right one column
      d: { x: +0, y: +1 }, // Down: move down one row
      f: { x: -1, y: +0 }, // Left: move left one column
    },
    /** Kind 1 (downward triangle) movements */
    1: {
      a: { x: +0, y: -1 }, // Up: move up one row
      c: { x: +1, y: +0 }, // Right: move right one column
      e: { x: -1, y: +0 }, // Left: move left one column
    },
  },
  /** Preferred direction ordering for maze generation algorithms by cell kind */
  preferred: {
    0: ['b', 'd'], // Kind 0 (upward): prefer right and down for consistent patterns
    1: ['c'], // Kind 1 (downward): prefer right for consistent patterns
  },
  /** Direction angles in degrees for rendering and geometric calculations */
  angle: {
    a: 270, // Up (north) direction
    b: 330, // Northeast direction (60° clockwise from north)
    c: 30, // Northeast direction (30° clockwise from east)
    d: 90, // Down (south) direction
    e: 150, // Northwest direction (150° clockwise from north)
    f: 210, // Southwest direction (210° clockwise from north)
  },
};
