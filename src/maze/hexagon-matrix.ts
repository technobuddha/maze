/* eslint-disable @typescript-eslint/no-unnecessary-type-conversion */
import { type Matrix } from '../geometry/matrix.ts';

/**
 * Matrix configuration for the hexagon maze implementation.
 *
 * Defines the geometric and topological properties for a 6-directional maze
 * where cells are connected via hexagonal pathways. This matrix supports
 * two cell kinds (even and odd columns) to create proper hexagonal tessellation
 * with alternating row offsets.
 *
 * @group Maze
 * @category Hexagon
 */
export const hexagonMatrix: Matrix = {
  /**
   * Bridge configuration for connecting opposite walls through tunnels.
   */
  bridge: {
    /**
     * Number of pieces used in bridge construction.
     */
    pieces: 1,
    /**
     * Layout definitions for different cell kinds showing path and rear directions.
     * Both even (0) and odd (1) column cells use the same bridge layouts.
     */
    layouts: {
      0: [
        { path: ['a'], rear: ['d'] },
        { path: ['b'], rear: ['e'] },
        { path: ['c'], rear: ['f'] },
        { path: ['d'], rear: ['a'] },
        { path: ['e'], rear: ['b'] },
        { path: ['f'], rear: ['c'] },
      ],
      1: [
        { path: ['a'], rear: ['d'] },
        { path: ['b'], rear: ['e'] },
        { path: ['c'], rear: ['f'] },
        { path: ['d'], rear: ['a'] },
        { path: ['e'], rear: ['b'] },
        { path: ['f'], rear: ['c'] },
      ],
    },
    /**
     * Mapping of directions to their connected counterparts for bridge creation.
     * Each direction connects to its direct opposite across the hexagon.
     */
    connect: { a: 'd', b: 'e', c: 'f', d: 'a', e: 'b', f: 'c' },
  },
  /**
   * All six possible directions in the hexagon maze system.
   * Corresponds to the six sides of a hexagon: north (a), northeast (b),
   * southeast (c), south (d), southwest (e), northwest (f).
   */
  directions: ['a', 'b', 'c', 'd', 'e', 'f'],
  /**
   * Pillar identifiers for corner decorations between adjacent directions.
   * Each pillar is positioned at the vertex between two adjacent hexagon sides.
   */
  pillars: ['ab', 'bc', 'cd', 'de', 'ef', 'fa'],
  /**
   * Default wall configuration for each cell kind.
   * Both even (0) and odd (1) column cells start with all walls present.
   */
  wall: {
    0: { a: true, b: true, c: true, d: true, e: true, f: true },
    1: { a: true, b: true, c: true, d: true, e: true, f: true },
  },
  /**
   * Mapping of directions to their opposite counterparts.
   */
  opposite: {
    /**
     * Maps lowercase directions to their uppercase opposites.
     */
    direction: {
      a: 'D',
      b: 'E',
      c: 'F',
      d: 'A',
      e: 'B',
      f: 'C',
    },
    /**
     * Maps uppercase facings to their lowercase opposite directions.
     */
    facing: {
      A: 'd',
      B: 'e',
      C: 'f',
      D: 'a',
      E: 'b',
      F: 'c',
    },
  },
  /**
   * Sequences of directions when turning right from each facing direction.
   * Used for navigation and pathfinding algorithms in hexagonal space.
   */
  rightTurn: {
    A: ['c', 'b', 'a', 'f', 'e', 'd'],
    B: ['d', 'c', 'b', 'a', 'f', 'e'],
    C: ['e', 'd', 'c', 'b', 'a', 'f'],
    D: ['f', 'e', 'd', 'c', 'b', 'a'],
    E: ['a', 'f', 'e', 'd', 'c', 'b'],
    F: ['b', 'a', 'f', 'e', 'd', 'c'],
  },
  /**
   * Sequences of directions when turning left from each facing direction.
   * Used for navigation and pathfinding algorithms in hexagonal space.
   */
  leftTurn: {
    A: ['e', 'f', 'a', 'b', 'c', 'd'],
    B: ['f', 'a', 'b', 'c', 'd', 'e'],
    C: ['a', 'b', 'c', 'd', 'e', 'f'],
    D: ['b', 'c', 'd', 'e', 'f', 'a'],
    E: ['c', 'd', 'e', 'f', 'a', 'b'],
    F: ['d', 'e', 'f', 'a', 'b', 'c'],
  },
  /**
   * Direction sequences for straight-line movement from each facing direction.
   * Includes the straight direction and diagonal alternatives for hexagonal geometry.
   */
  straight: {
    A: ['a', 'bf', 'ce', 'd'],
    B: ['b', 'ac', 'df', 'e'],
    C: ['c', 'bd', 'ae', 'f'],
    D: ['d', 'ce', 'bf', 'a'],
    E: ['e', 'df', 'ac', 'b'],
    F: ['f', 'ae', 'bd', 'c'],
  },
  /**
   * Coordinate offsets for movement in each direction by cell kind.
   * Different patterns for even (0) and odd (1) columns to support
   * hexagonal tessellation with proper alternating row alignment.
   */
  move: {
    0: {
      a: { x: +0, y: -1 },
      b: { x: +1, y: -1 },
      c: { x: +1, y: +0 },
      d: { x: +0, y: +1 },
      e: { x: -1, y: +0 },
      f: { x: -1, y: -1 },
    },
    1: {
      a: { x: +0, y: -1 },
      b: { x: +1, y: +0 },
      c: { x: +1, y: +1 },
      d: { x: +0, y: +1 },
      e: { x: -1, y: +1 },
      f: { x: -1, y: +0 },
    },
  },
  /**
   * Preferred directions for each cell kind, typically used in maze generation algorithms.
   * Both even and odd columns prefer the same directions: northeast, southeast, and south.
   */
  preferred: {
    0: ['b', 'c', 'd'],
    1: ['b', 'c', 'd'],
  },
  /**
   * Angle mappings for each direction in degrees.
   * Used for rendering and geometric calculations in hexagonal space.
   * Angles are measured clockwise from the positive x-axis.
   */
  angle: {
    a: 270,
    b: 330,
    c: 30,
    d: 90,
    e: 150,
    f: 210,
  },
};
