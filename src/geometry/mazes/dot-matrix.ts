/* eslint-disable @typescript-eslint/no-unnecessary-type-conversion */
import { type Matrix } from '../matrix.ts';

/**
 * Matrix configuration for the dot maze implementation.
 *
 * Defines the geometric and topological properties for an 8-directional maze
 * where cells are connected via diagonal pathways in addition to cardinal directions.
 * This matrix supports complex intersection handling and diagonal movement patterns.
 *
 * @group Geometry
 * @category Mazes
 */
export const dotMatrix: Matrix = {
  /**
   * Bridge configuration for connecting opposite walls through tunnels.
   */
  bridge: {
    /**
     * Mapping of directions to their connected counterparts for bridge creation.
     */
    connect: { a: 'e', c: 'g', e: 'a', g: 'c' },
    /**
     * Layout definitions for different cell kinds showing path and rear directions.
     */
    layouts: {
      0: [
        { path: ['a'], rear: ['e'] },
        { path: ['b'], rear: ['f'] },
        { path: ['c'], rear: ['g'] },
        { path: ['d'], rear: ['h'] },
        { path: ['e'], rear: ['a'] },
        { path: ['f'], rear: ['b'] },
        { path: ['g'], rear: ['c'] },
        { path: ['h'], rear: ['d'] },
      ],
    },
  },
  /**
   * All eight possible directions in the dot maze system.
   * Includes cardinal (a,c,e,g) and diagonal (b,d,f,h) directions.
   */
  directions: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
  /**
   * Pillar identifiers for corner decorations between adjacent directions.
   */
  pillars: ['ab', 'bc', 'cd', 'de', 'ef', 'fg', 'gh', 'ha'],
  /**
   * Default wall configuration for each cell kind.
   */
  wall: {
    0: { a: true, b: true, c: true, d: true, e: true, f: true, g: true, h: true },
  },
  /**
   * Mapping of directions to their opposite counterparts.
   */
  opposite: {
    /**
     * Maps lowercase directions to their uppercase opposites.
     */
    direction: {
      a: 'E',
      b: 'F',
      c: 'G',
      d: 'H',
      e: 'A',
      f: 'B',
      g: 'C',
      h: 'D',
    },
    /**
     * Maps uppercase facings to their lowercase opposite directions.
     */
    facing: {
      A: 'e',
      B: 'f',
      C: 'g',
      D: 'h',
      E: 'a',
      F: 'b',
      G: 'c',
      H: 'd',
    },
  },
  /**
   * Sequences of directions when turning right from each facing direction.
   * Used for navigation and pathfinding algorithms.
   */
  rightTurn: {
    A: ['d', 'c', 'b', 'a', 'h', 'g', 'f', 'e'],
    B: ['e', 'd', 'c', 'b', 'a', 'h', 'g', 'f'],
    C: ['f', 'e', 'd', 'c', 'b', 'a', 'h', 'g'],
    D: ['g', 'f', 'e', 'd', 'c', 'b', 'a', 'h'],
    E: ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'],
    F: ['a', 'h', 'g', 'f', 'e', 'd', 'c', 'b'],
    G: ['b', 'a', 'h', 'g', 'f', 'e', 'd', 'c'],
    H: ['c', 'b', 'a', 'h', 'g', 'f', 'e', 'd'],
  },
  /**
   * Sequences of directions when turning left from each facing direction.
   * Used for navigation and pathfinding algorithms.
   */
  leftTurn: {
    A: ['f', 'g', 'h', 'a', 'b', 'c', 'd', 'e'],
    B: ['g', 'h', 'a', 'b', 'c', 'd', 'e', 'f'],
    C: ['h', 'a', 'b', 'c', 'd', 'e', 'f', 'g'],
    D: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
    E: ['b', 'c', 'd', 'e', 'f', 'g', 'h', 'a'],
    F: ['c', 'd', 'e', 'f', 'g', 'h', 'a', 'b'],
    G: ['d', 'e', 'f', 'g', 'h', 'a', 'b', 'c'],
    H: ['e', 'f', 'g', 'h', 'a', 'b', 'c', 'd'],
  },
  /**
   * Direction sequences for straight-line movement from each facing direction.
   * Includes the straight direction and diagonal alternatives.
   */
  straight: {
    A: ['a', 'bh', 'cg', 'df', 'e'],
    B: ['b', 'ac', 'dh', 'eg', 'f'],
    C: ['c', 'bd', 'ae', 'fh', 'g'],
    D: ['d', 'ce', 'bf', 'ag', 'h'],
    E: ['e', 'df', 'cg', 'bh', 'a'],
    F: ['f', 'eg', 'dh', 'ca', 'b'],
    G: ['g', 'fh', 'ea', 'db', 'c'],
    H: ['h', 'ag', 'bf', 'ce', 'd'],
  },
  /**
   * Coordinate offsets for movement in each direction by cell kind.
   */
  move: {
    0: {
      a: { x: +0, y: -1 },
      b: { x: +1, y: -1 },
      c: { x: +1, y: +0 },
      d: { x: +1, y: +1 },
      e: { x: +0, y: +1 },
      f: { x: -1, y: +1 },
      g: { x: -1, y: +0 },
      h: { x: -1, y: -1 },
    },
  },
  /**
   * Preferred directions for each cell kind, typically used in maze generation algorithms.
   */
  preferred: {
    0: ['c', 'd', 'e'],
  },
  /**
   * Angle mappings for each direction in degrees.
   * Used for rendering and geometric calculations.
   */
  angle: {
    a: 270,
    b: 315,
    c: 0,
    d: 45,
    e: 90,
    f: 135,
    g: 180,
    h: 225,
  },
};
