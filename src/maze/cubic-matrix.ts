/* eslint-disable @typescript-eslint/no-unnecessary-type-conversion */
import { type Matrix } from '../geometry/matrix.ts';

/**
 * Matrix configuration for cubic maze tessellation with square cells and diagonal connections.
 * Defines a complex geometry where each cell can have up to 12 directional connections (a-l),
 * enabling diagonal paths and creating a more intricate maze structure than standard square grids.
 *
 * The cubic system uses 6 different cell kinds (0-5) with varying wall configurations:
 * - Kinds 0,3: Basic square cells with 4 primary directions (a,b,c,d)
 * - Kinds 1,4: Square cells with 4 secondary directions (e,f,g,h)
 * - Kinds 2,5: Square cells with 4 tertiary directions (i,j,k,l)
 *
 * This creates a tessellation where each cell type has different connection patterns,
 * allowing for complex pathways including diagonal movement through the maze.
 *
 * @group Maze
 * @category Cubic
 */
export const cubicMatrix: Matrix = {
  /**
   * Bridge configurations for connecting cubic maze cells across different orientations.
   * Defines how paths, rear connections, and cross-connections work for each cell kind.
   * Each layout specifies path directions, rear directions, and connection mappings.
   */
  bridge: {
    connect: {},
    layouts: {
      /** Kind 0: Primary square cells with directions a,b,c,d and diagonal connections */
      0: [
        { path: ['a', 'e'], rear: ['g', 'c'], connect: { b: 'd', d: 'b', f: 'h', h: 'f' } },
        { path: ['b', 'j'], rear: ['l', 'd'], connect: { a: 'c', d: 'a', i: 'k', k: 'i' } },
        { path: ['c', 'g'], rear: ['e', 'a'], connect: { b: 'd', d: 'b', f: 'h', h: 'f' } },
        { path: ['d', 'l'], rear: ['j', 'b'], connect: { a: 'c', d: 'a', i: 'k', k: 'i' } },
      ],
      /** Kind 1: Secondary square cells with directions e,f,g,h and diagonal connections */
      1: [
        { path: ['e', 'a'], rear: ['c', 'g'], connect: { b: 'd', d: 'b', f: 'h', h: 'f' } },
        { path: ['f', 'k'], rear: ['l', 'h'], connect: { a: 'c', c: 'a', e: 'g', g: 'e' } },
        { path: ['g', 'c'], rear: ['e', 'a'], connect: { b: 'd', d: 'b', f: 'h', h: 'f' } },
        { path: ['h', 'l'], rear: ['k', 'f'], connect: { a: 'c', c: 'a', e: 'g', g: 'e' } },
      ],
      /** Kind 2: Tertiary square cells with directions i,j,k,l and diagonal connections */
      2: [
        { path: ['i', 'h'], rear: ['f', 'k'], connect: { e: 'g', g: 'e', j: 'l', k: 'j' } },
        { path: ['j', 'b'], rear: ['d', 'l'], connect: { a: 'c', c: 'a', i: 'k', k: 'i' } },
        { path: ['k', 'f'], rear: ['h', 'i'], connect: { e: 'g', g: 'e', j: 'l', k: 'j' } },
        { path: ['l', 'd'], rear: ['b', 'g'], connect: { a: 'c', c: 'a', e: 'g', g: 'e' } },
      ],
    },
  },
  /** All 12 possible directions in cubic tessellation: 4 primary (a-d), 4 secondary (e-h), 4 tertiary (i-l) */
  directions: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l'],
  /** Corner pillars between adjacent directions, creating structural posts at intersections */
  pillars: ['ab', 'bc', 'cd', 'da', 'ef', 'fg', 'gh', 'he', 'ij', 'jk', 'kl', 'li'],
  /**
   * Initial wall configuration for each cell kind.
   * Defines which directions have walls by default before maze generation removes them.
   * Each kind has walls on 4 specific directions out of the possible 12.
   */
  wall: {
    /** Kind 0: Walls on primary directions a,b,c,d */
    0: { a: true, b: true, c: true, d: true },
    /** Kind 1: Walls on secondary directions e,f,g,h */
    1: { e: true, f: true, g: true, h: true },
    /** Kind 2: Walls on tertiary directions i,j,k,l */
    2: { i: true, j: true, k: true, l: true },
    /** Kind 3: Walls on primary directions a,b,c,d (same as kind 0) */
    3: { a: true, b: true, c: true, d: true },
    /** Kind 4: Walls on secondary directions e,f,g,h (same as kind 1) */
    4: { e: true, f: true, g: true, h: true },
    /** Kind 5: Walls on tertiary directions i,j,k,l (same as kind 2) */
    5: { i: true, j: true, k: true, l: true },
  },
  /**
   * Opposite direction mappings for cubic tessellation.
   * Maps each direction to its opposite direction and facing orientation.
   */
  opposite: {
    /** Maps each lowercase direction to its opposite uppercase direction */
    direction: {
      a: 'G',
      b: 'L',
      c: 'E',
      d: 'J',
      e: 'C',
      f: 'I',
      g: 'A',
      h: 'K',
      i: 'F',
      j: 'D',
      k: 'H',
      l: 'B',
    },
    /** Maps each uppercase facing direction to its opposite lowercase direction */
    facing: {
      A: 'g',
      B: 'l',
      C: 'e',
      D: 'j',
      E: 'c',
      F: 'i',
      G: 'a',
      H: 'k',
      I: 'f',
      J: 'd',
      K: 'h',
      L: 'b',
    },
  },
  /**
   * Right turn sequences for each facing direction.
   * Defines the sequence of directions when making right turns from each facing orientation.
   */
  rightTurn: {
    A: ['f', 'e', 'h', 'g'],
    B: ['k', 'j', 'i', 'l'],
    C: ['h', 'g', 'f', 'e'],
    D: ['i', 'l', 'k', 'j'],
    E: ['b', 'a', 'd', 'c'],
    F: ['l', 'k', 'j', 'i'],
    G: ['d', 'c', 'b', 'a'],
    H: ['j', 'i', 'l', 'k'],
    I: ['e', 'h', 'g', 'f'],
    J: ['c', 'b', 'a', 'd'],
    K: ['g', 'f', 'e', 'h'],
    L: ['a', 'd', 'c', 'b'],
  },
  /**
   * Left turn sequences for each facing direction.
   * Defines the sequence of directions when making left turns from each facing orientation.
   */
  leftTurn: {
    A: ['h', 'e', 'f', 'g'],
    B: ['i', 'j', 'k', 'l'],
    C: ['f', 'g', 'h', 'e'],
    D: ['k', 'l', 'i', 'j'],
    E: ['d', 'a', 'b', 'c'],
    F: ['j', 'k', 'l', 'i'],
    G: ['b', 'c', 'd', 'a'],
    H: ['l', 'i', 'j', 'k'],
    I: ['g', 'h', 'e', 'f'],
    J: ['a', 'b', 'c', 'd'],
    K: ['e', 'f', 'g', 'h'],
    L: ['c', 'd', 'a', 'b'],
  },
  /**
   * Straight movement sequences for each facing direction.
   * Defines the sequence of directions when moving straight from each facing orientation.
   */
  straight: {
    A: ['e', 'hf', 'g'],
    B: ['j', 'ki', 'l'],
    C: ['g', 'fh', 'e'],
    D: ['l', 'ki', 'j'],
    E: ['a', 'bd', 'c'],
    F: ['k', 'jl', 'i'],
    G: ['c', 'db', 'a'],
    H: ['i', 'lj', 'k'],
    I: ['h', 'eg', 'f'],
    J: ['b', 'ac', 'd'],
    K: ['f', 'eg', 'h'],
    L: ['d', 'ac', 'b'],
  },
  /**
   * Movement vectors for each direction within each cell kind.
   * Defines how to move from one cell to another in each direction for each cell type.
   * Values represent x,y coordinate offsets in the grid.
   */
  move: {
    /** Kind 0: Movement vectors for primary directions a,b,c,d */
    0: {
      a: { x: +1, y: +0 },
      b: { x: +2, y: +0 },
      c: { x: -2, y: +1 },
      d: { x: -1, y: +0 },
    },
    /** Kind 1: Movement vectors for secondary directions e,f,g,h */
    1: {
      e: { x: -1, y: -1 },
      f: { x: +1, y: +0 },
      g: { x: -1, y: +0 },
      h: { x: -2, y: -1 },
    },
    /** Kind 2: Movement vectors for tertiary directions i,j,k,l */
    2: {
      i: { x: -1, y: +0 },
      j: { x: +1, y: +0 },
      k: { x: -1, y: +1 },
      l: { x: -2, y: +0 },
    },
    /** Kind 3: Movement vectors for primary directions a,b,c,d (same as kind 0) */
    3: {
      a: { x: +1, y: +0 },
      b: { x: +2, y: +0 },
      c: { x: +1, y: +1 },
      d: { x: -1, y: +0 },
    },
    /** Kind 4: Movement vectors for secondary directions e,f,g,h (same as kind 1) */
    4: {
      e: { x: +2, y: -1 },
      f: { x: +1, y: +0 },
      g: { x: -1, y: +0 },
      h: { x: +1, y: -1 },
    },
    /** Kind 5: Movement vectors for tertiary directions i,j,k,l (same as kind 2) */
    5: {
      i: { x: -1, y: +0 },
      j: { x: +1, y: +0 },
      k: { x: +2, y: +1 },
      l: { x: -2, y: +0 },
    },
  },

  /**
   * Preferred directions for each cell kind during maze generation.
   * Influences the direction priority when creating paths through the maze.
   */
  preferred: {
    0: ['b', 'c'],
    1: ['f', 'g'],
    2: ['i', 'j'],
    3: ['b', 'c'],
    4: ['f', 'g'],
    5: ['i', 'j'],
    6: ['b', 'c'],
    7: ['f', 'g'],
    8: ['i', 'j'],
  },

  /**
   * Angular orientations for each direction in degrees.
   * Used for rendering and visual presentation of the cubic tessellation.
   * Angles are based on 15-degree increments to create the cubic visual effect.
   */
  angle: {
    a: 270,
    b: 15,
    c: 90,
    d: 195,
    e: 345,
    f: 15,
    g: 150,
    h: 210,
    i: 270,
    j: 0,
    k: 90,
    l: 150,
  },
};
