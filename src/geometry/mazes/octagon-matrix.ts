/* eslint-disable @typescript-eslint/no-unnecessary-type-conversion */
import { type Matrix } from '../matrix.ts';

/**
 * Keys that define the variable parts of matrix configurations.
 * These parts change between different octagon maze variants.
 *
 * @internal
 */
export type Keys = 'bridge' | 'opposite' | 'move' | 'rightTurn' | 'leftTurn' | 'straight';

/**
 * The main matrix configuration that remains constant across octagon maze variants.
 * Contains directions, pillars, walls, preferences, and angles.
 *
 * @group Geometry
 * @category Mazes
 */
export type MatrixMain = Omit<Matrix, Keys>;

/**
 * The variable part of matrix configuration that differs between octagon maze variants.
 * Contains bridge connections, opposites, movement patterns, and turn sequences.
 *
 * @group Geometry
 * @category Mazes
 */
export type MatrixPart = Pick<Matrix, Keys>;

/**
 * Base matrix configuration for octagon maze implementations.
 *
 * Defines the geometric and topological properties common to all octagon maze variants.
 * This includes a 16-direction system with three cell kinds (0=octagon, 1=diamond, 2=square)
 * that can be combined in different ways to create various tessellation patterns.
 *
 * @group Geometry
 * @category Mazes
 */
export const octagonMatrix: MatrixMain = {
  /**
   * All sixteen possible directions in the octagon maze system.
   * Includes 8 directions for octagonal cells (a-h), 4 for diamond cells (i-l),
   * and 4 for square cells (m-p).
   */
  // prettier-ignore
  directions: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p'],
  /**
   * Pillar identifiers for corner decorations between adjacent directions.
   * Organized by cell type: octagon pillars (ab-ha), diamond pillars (ij-li),
   * and square pillars (mn-pm).
   */
  // prettier-ignore
  pillars: [ 'ab', 'bc', 'cd', 'de', 'ef', 'fg', 'gh', 'ha', 'ij', 'jk', 'kl', 'li', 'mn', 'no', 'op', 'pm' ],
  /**
   * Default wall configuration for each cell kind.
   * Kind 0 (octagon): 8 walls, Kind 1 (diamond): 4 walls, Kind 2 (square): 4 walls.
   */
  wall: {
    0: { a: true, b: true, c: true, d: true, e: true, f: true, g: true, h: true },
    1: { i: true, j: true, k: true, l: true },
    2: { m: true, n: true, o: true, p: true },
  },

  /**
   * Preferred directions for each cell kind during maze generation algorithms.
   * Typically favors directions that create better visual flow.
   */
  preferred: {
    0: ['c', 'd', 'e'],
    1: ['j'],
    2: ['n', 'o'],
  },
  /**
   * Angle mappings for each direction in degrees.
   * Used for rendering and geometric calculations.
   * Angles are measured clockwise from the positive x-axis.
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
    i: 315,
    j: 45,
    k: 135,
    l: 225,
    m: 270,
    n: 0,
    o: 90,
    p: 180,
  },
};

/**
 * Matrix configuration for octagon-diamond tessellation patterns.
 *
 * Defines the variable matrix properties for mazes that combine octagonal cells (kind 0)
 * with diamond-shaped cells (kind 1). The diamond cells are positioned at the intersections
 * between octagonal cells, creating a more complex but visually appealing pattern.
 *
 * @group Geometry
 * @category Mazes
 */
export const matrixDiamond: MatrixPart = {
  /**
   * Bridge configuration for connecting cells through tunnels in diamond patterns.
   */
  bridge: {
    /**
     * Mapping of directions to their connected counterparts for bridge creation.
     * Octagonal directions connect to their opposites, diamond directions connect diagonally.
     */
    connect: {
      a: 'e',
      b: 'f',
      c: 'g',
      d: 'h',
      e: 'a',
      f: 'b',
      g: 'c',
      h: 'd',
      i: 'k',
      j: 'l',
      k: 'i',
      l: 'j',
    },
    /**
     * Layout definitions showing path and rear directions for bridge construction.
     * Octagonal cells (0) support 8 bridge orientations, diamond cells (1) support 4.
     */
    layouts: {
      0: [
        { path: ['a'], rear: ['e'] },
        { path: ['b', 'i'], rear: ['f', 'k'] },
        { path: ['c'], rear: ['g'] },
        { path: ['d', 'j'], rear: ['h', 'l'] },
        { path: ['e'], rear: ['a'] },
        { path: ['f', 'k'], rear: ['b', 'i'] },
        { path: ['g'], rear: ['c'] },
        { path: ['h', 'l'], rear: ['d', 'j'] },
      ],
      1: [
        { path: ['i', 'b'], rear: ['k', 'f'] },
        { path: ['j', 'd'], rear: ['l', 'h'] },
        { path: ['k', 'f'], rear: ['i', 'b'] },
        { path: ['l', 'h'], rear: ['j', 'd'] },
      ],
    },
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
      b: 'K',
      c: 'G',
      d: 'L',
      e: 'A',
      f: 'I',
      g: 'C',
      h: 'J',
      i: 'F',
      j: 'H',
      k: 'B',
      l: 'D',
    },
    /**
     * Maps uppercase facings to their lowercase opposite directions.
     */
    facing: {
      A: 'e',
      B: 'k',
      C: 'g',
      D: 'l',
      E: 'a',
      F: 'i',
      G: 'c',
      H: 'j',
      I: 'f',
      J: 'h',
      K: 'b',
      L: 'd',
    },
  },
  /**
   * Coordinate offsets for movement in each direction by cell kind.
   * Octagonal cells (0) use standard 8-direction movement, diamond cells (1) use 4-direction diagonal movement.
   */
  move: {
    0: {
      a: { x: +0, y: -1 },
      b: { x: +1, y: -1 },
      c: { x: +2, y: +0 },
      d: { x: +1, y: +0 },
      e: { x: +0, y: +1 },
      f: { x: -1, y: +0 },
      g: { x: -2, y: +0 },
      h: { x: -1, y: -1 },
    },
    1: {
      i: { x: +1, y: +0 },
      j: { x: +1, y: +1 },
      k: { x: -1, y: +1 },
      l: { x: -1, y: +0 },
    },
  },
  /**
   * Sequences of directions when turning right from each facing direction.
   * Used for navigation and pathfinding algorithms in octagon-diamond tessellation.
   */
  rightTurn: {
    A: ['d', 'c', 'b', 'a', 'h', 'g', 'f', 'e'],
    B: ['j', 'i', 'l', 'k'],
    C: ['f', 'e', 'd', 'c', 'b', 'a', 'h', 'g'],
    D: ['k', 'j', 'i', 'l'],
    E: ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'],
    F: ['l', 'k', 'j', 'i'],
    G: ['b', 'a', 'h', 'g', 'f', 'e', 'd', 'c'],
    H: ['i', 'l', 'k', 'j'],
    I: ['e', 'd', 'c', 'b', 'a', 'h', 'g', 'f'],
    J: ['g', 'f', 'e', 'd', 'c', 'b', 'a', 'h'],
    K: ['a', 'h', 'g', 'f', 'e', 'd', 'c', 'b'],
    L: ['c', 'b', 'a', 'h', 'g', 'f', 'e', 'd'],
  },
  /**
   * Sequences of directions when turning left from each facing direction.
   * Used for navigation and pathfinding algorithms in octagon-diamond tessellation.
   */
  leftTurn: {
    A: ['f', 'g', 'h', 'a', 'b', 'c', 'd', 'e'],
    B: ['l', 'i', 'j', 'k'],
    C: ['h', 'a', 'b', 'c', 'd', 'e', 'f', 'g'],
    D: ['i', 'j', 'k', 'l'],
    E: ['b', 'c', 'd', 'e', 'f', 'g', 'h', 'a'],
    F: ['j', 'k', 'l', 'i'],
    G: ['d', 'e', 'f', 'g', 'h', 'a', 'b', 'c'],
    H: ['k', 'l', 'i', 'j'],
    I: ['g', 'h', 'a', 'b', 'c', 'd', 'e', 'f'],
    J: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
    K: ['c', 'd', 'e', 'f', 'g', 'h', 'a', 'b'],
    L: ['e', 'f', 'g', 'h', 'a', 'b', 'c', 'd'],
  },
  /**
   * Direction sequences for straight-line movement from each facing direction.
   * Includes the straight direction and alternative paths for octagon-diamond geometry.
   */
  straight: {
    A: ['a', 'hb', 'cg', 'df', 'e'],
    B: ['i', 'lj', 'k'],
    C: ['c', 'bd', 'ae', 'hf', 'g'],
    D: ['j', 'ik', 'l'],
    E: ['e', 'df', 'cg', 'bh', 'a'],
    F: ['k', 'lj', 'i'],
    G: ['g', 'fh', 'ae', 'bd', 'c'],
    H: ['l', 'ik', 'j'],
    I: ['b', 'ac', 'hd', 'eg', 'f'],
    J: ['d', 'ce', 'bf', 'ag', 'h'],
    K: ['f', 'eg', 'hd', 'ac', 'b'],
    L: ['h', 'ag', 'bf', 'ce', 'd'],
  },
};

/**
 * Matrix configuration for octagon-square tessellation patterns.
 *
 * Defines the variable matrix properties for mazes that combine octagonal cells (kind 0)
 * with square cells (kind 2). The square cells are positioned between octagonal cells,
 * creating a different tessellation pattern from the diamond variant.
 *
 * @group Geometry
 * @category Mazes
 */
export const matrixSquare: MatrixPart = {
  /**
   * Bridge configuration for connecting cells through tunnels in square patterns.
   */
  bridge: {
    /**
     * Mapping of directions to their connected counterparts for bridge creation.
     * Both octagonal and square directions connect to their direct opposites.
     */
    connect: {
      a: 'e',
      b: 'f',
      c: 'g',
      d: 'h',
      e: 'a',
      f: 'b',
      g: 'c',
      h: 'd',
      m: 'o',
      n: 'p',
      o: 'm',
      p: 'n',
    },
    /**
     * Layout definitions showing path and rear directions for bridge construction.
     * Octagonal cells (0) support 8 bridge orientations, square cells (2) support 4.
     */
    layouts: {
      0: [
        { path: ['a', 'm'], rear: ['e', 'o'] },
        { path: ['b'], rear: ['f'] },
        { path: ['c', 'n'], rear: ['g', 'p'] },
        { path: ['d'], rear: ['h'] },
        { path: ['e', 'o'], rear: ['a', 'm'] },
        { path: ['f'], rear: ['b'] },
        { path: ['g', 'p'], rear: ['c', 'n'] },
        { path: ['h'], rear: ['d'] },
      ],
      1: [
        { path: ['m', 'a'], rear: ['o', 'e'] },
        { path: ['n', 'c'], rear: ['p', 'g'] },
        { path: ['o', 'e'], rear: ['m', 'a'] },
        { path: ['p', 'g'], rear: ['n', 'c'] },
      ],
    },
  },
  /**
   * Mapping of directions to their opposite counterparts.
   */
  opposite: {
    /**
     * Maps lowercase directions to their uppercase opposites.
     */
    direction: {
      a: 'O',
      b: 'F',
      c: 'P',
      d: 'H',
      e: 'M',
      f: 'B',
      g: 'N',
      h: 'D',
      m: 'E',
      n: 'G',
      o: 'A',
      p: 'C',
    },
    /**
     * Maps uppercase facings to their lowercase opposite directions.
     */
    facing: {
      A: 'o',
      B: 'f',
      C: 'p',
      D: 'h',
      E: 'm',
      F: 'b',
      G: 'n',
      H: 'd',
      M: 'e',
      N: 'g',
      O: 'a',
      P: 'c',
    },
  },
  /**
   * Coordinate offsets for movement in each direction by cell kind.
   * Octagonal cells (0) use standard 8-direction movement, square cells (2) use 4-direction cardinal movement.
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
    2: {
      m: { x: +0, y: -1 },
      n: { x: +1, y: +0 },
      o: { x: +0, y: +1 },
      p: { x: -1, y: +0 },
    },
  },
  /**
   * Sequences of directions when turning right from each facing direction.
   * Used for navigation and pathfinding algorithms in octagon-square tessellation.
   */
  rightTurn: {
    A: ['n', 'm', 'p', 'o'],
    B: ['e', 'd', 'c', 'b', 'a', 'h', 'g', 'f'],
    C: ['o', 'n', 'm', 'p'],
    D: ['g', 'f', 'e', 'd', 'c', 'b', 'a', 'h'],
    E: ['p', 'o', 'n', 'm'],
    F: ['a', 'h', 'g', 'f', 'e', 'd', 'c', 'b'],
    G: ['m', 'p', 'o', 'n'],
    H: ['c', 'b', 'a', 'h', 'g', 'f', 'e', 'd'],
    M: ['d', 'c', 'b', 'a', 'h', 'g', 'f', 'e'],
    N: ['f', 'e', 'd', 'c', 'b', 'a', 'h', 'g'],
    O: ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'],
    P: ['b', 'a', 'h', 'g', 'f', 'e', 'd', 'c'],
  },
  /**
   * Sequences of directions when turning left from each facing direction.
   * Used for navigation and pathfinding algorithms in octagon-square tessellation.
   */
  leftTurn: {
    A: ['p', 'm', 'n', 'o'],
    B: ['g', 'h', 'a', 'b', 'c', 'd', 'e', 'f'],
    C: ['m', 'n', 'o', 'p'],
    D: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],
    E: ['n', 'o', 'p', 'm'],
    F: ['c', 'd', 'e', 'f', 'g', 'h', 'a', 'b'],
    G: ['o', 'p', 'm', 'n'],
    H: ['e', 'f', 'g', 'h', 'a', 'b', 'c', 'd'],
    M: ['f', 'g', 'h', 'a', 'b', 'c', 'd', 'e'],
    N: ['h', 'a', 'b', 'c', 'd', 'e', 'f', 'g'],
    O: ['b', 'c', 'd', 'e', 'f', 'g', 'h', 'a'],
    P: ['d', 'e', 'f', 'g', 'h', 'a', 'b', 'c'],
  },
  /**
   * Direction sequences for straight-line movement from each facing direction.
   * Includes the straight direction and alternative paths for octagon-square geometry.
   */
  straight: {
    A: ['m', 'pn', 'o'],
    B: ['b', 'ac', 'dh', 'ge', 'f'],
    C: ['n', 'mo', 'p'],
    D: ['d', 'ce', 'bf', 'ag', 'h'],
    E: ['o', 'np', 'm'],
    F: ['f', 'ge', 'hd', 'ac', 'b'],
    G: ['p', 'mo', 'n'],
    H: ['h', 'ag', 'bf', 'ce', 'd'],
    M: ['a', 'bh', 'gc', 'fd', 'e'],
    N: ['c', 'bd', 'ae', 'fh', 'g'],
    O: ['e', 'df', 'cg', 'hb', 'a'],
    P: ['g', 'hf', 'ae', 'bd', 'c'],
  },
};
