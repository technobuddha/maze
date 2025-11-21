/* eslint-disable @typescript-eslint/no-unnecessary-type-conversion */
import { type Matrix } from '../matrix.ts';

/**
 * Matrix definition for pentagon-based maze geometry.
 *
 * Pentagon mazes use regular pentagonal cells arranged in a complex tessellating pattern.
 * The tessellation requires 4 different pentagon orientations (kinds 0-3) arranged in a
 * 5×4 repeating pattern to tile the plane. Each pentagon has 5 possible connections
 * (directions a-e for kind 0, f-j for kind 1, etc.) corresponding to the 5 sides.
 *
 * Direction mapping by cell kind:
 * - Kind 0: a(270°), b(0°), c(45°), d(135°), e(180°)
 * - Kind 1: f(270°), g(315°), h(45°), i(90°), j(180°)
 * - Kind 2: k(270°), l(0°), m(90°), n(135°), o(225°)
 * - Kind 3: p(225°), q(315°), r(0°), s(90°), t(180°)
 *
 * Cell kinds:
 * - Kind 0: Base pentagon orientation
 * - Kind 1: Pentagon rotated for tessellation fit
 * - Kind 2: Pentagon rotated for tessellation fit
 * - Kind 3: Pentagon rotated for tessellation fit
 *
 * The tessellation follows a 5×4 repeating pattern with specific offset positioning
 * to ensure proper geometric alignment and seamless tiling.
 *
 * @group Geometry
 * @category Constants
 */
export const pentagonMatrix: Matrix = {
  /** All twenty pentagon directions across the four cell kinds */
  // prettier-ignore
  directions: [ 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't' ],
  /** Pillar definitions for pentagon wall intersections (adjacent direction pairs for each kind) */
  // prettier-ignore
  pillars: [ 'ab', 'bc', 'cd', 'de', 'ea', 'fg', 'gh', 'hi', 'ij', 'jf', 'kl', 'lm', 'mn', 'no', 'ok', 'pq', 'qr', 'rs', 'st', 'tp'],
  /** Wall configurations - each cell kind supports its 5 corresponding directions */
  wall: {
    0: { a: true, b: true, c: true, d: true, e: true }, // Base pentagon orientation
    1: { f: true, g: true, h: true, i: true, j: true }, // First rotated orientation
    2: { k: true, l: true, m: true, n: true, o: true }, // Second rotated orientation
    3: { p: true, q: true, r: true, s: true, t: true }, // Third rotated orientation
  },
  /** Opposite direction and facing mappings for pentagon geometry */
  opposite: {
    /** Direction to opposite facing mappings (lowercase to uppercase) */
    direction: {
      a: 'M',
      b: 'J',
      c: 'O',
      d: 'G',
      e: 'T', // Kind 0 directions
      f: 'S',
      g: 'D',
      h: 'P',
      i: 'K',
      j: 'B', // Kind 1 directions
      k: 'I',
      l: 'T',
      m: 'A',
      n: 'Q',
      o: 'C', // Kind 2 directions
      p: 'H',
      q: 'N',
      r: 'E',
      s: 'F',
      t: 'L', // Kind 3 directions
    },
    /** Facing to opposite direction mappings (uppercase to lowercase) */
    facing: {
      A: 'm',
      B: 'j',
      C: 'o',
      D: 'g',
      E: 'r', // To kind 0 directions
      F: 's',
      G: 'd',
      H: 'p',
      I: 'k',
      J: 'b', // To kind 1 directions
      K: 'i',
      L: 't',
      M: 'a',
      N: 'q',
      O: 'c', // To kind 2 directions
      P: 'h',
      Q: 'n',
      R: 'e',
      S: 'f',
      T: 'l', // To kind 3 directions
    },
  },
  /** Right turn options from each facing direction (clockwise order around pentagon) */
  rightTurn: {
    A: ['l', 'k', 'o', 'n', 'm'],
    B: ['i', 'h', 'g', 'f', 'j'],
    C: ['n', 'm', 'l', 'k', 'o'],
    D: ['f', 'j', 'i', 'h', 'g'],
    E: ['q', 'p', 't', 's', 'r'],
    F: ['r', 'q', 'p', 't', 's'],
    G: ['c', 'b', 'a', 'e', 'd'],
    H: ['t', 's', 'r', 'q', 'p'],
    I: ['o', 'n', 'm', 'l', 'k'],
    J: ['a', 'e', 'd', 'c', 'b'],
    K: ['h', 'g', 'f', 'j', 'i'],
    L: ['s', 'r', 'q', 'p', 't'],
    M: ['e', 'd', 'c', 'b', 'a'],
    N: ['p', 't', 's', 'r', 'q'],
    O: ['b', 'a', 'e', 'd', 'c'],
    P: ['g', 'f', 'j', 'i', 'h'],
    Q: ['m', 'l', 'k', 'o', 'n'],
    R: ['d', 'c', 'b', 'a', 'e'],
    S: ['j', 'i', 'h', 'g', 'f'],
    T: ['k', 'o', 'n', 'm', 'l'],
  },
  /** Left turn options from each facing direction (counter-clockwise order around pentagon) */
  leftTurn: {
    A: ['n', 'o', 'k', 'l', 'm'],
    B: ['f', 'g', 'h', 'i', 'j'],
    C: ['k', 'l', 'm', 'n', 'o'],
    D: ['h', 'i', 'j', 'f', 'g'],
    E: ['s', 't', 'p', 'q', 'r'],
    F: ['t', 'p', 'q', 'r', 's'],
    G: ['e', 'a', 'b', 'c', 'd'],
    H: ['q', 'r', 's', 't', 'p'],
    I: ['l', 'm', 'n', 'o', 'k'],
    J: ['c', 'd', 'e', 'a', 'b'],
    K: ['j', 'f', 'g', 'h', 'i'],
    L: ['p', 'q', 'r', 's', 't'],
    M: ['b', 'c', 'd', 'e', 'a'],
    N: ['r', 's', 't', 'p', 'q'],
    O: ['d', 'e', 'a', 'b', 'c'],
    P: ['i', 'j', 'f', 'g', 'h'],
    Q: ['o', 'k', 'l', 'm', 'n'],
    R: ['a', 'b', 'c', 'd', 'e'],
    S: ['g', 'h', 'i', 'j', 'f'],
    T: ['m', 'n', 'o', 'k', 'l'],
  },
  /** Straight/forward movement options from each facing direction */
  straight: {
    A: ['k', 'o', 'l', 'n', 'm'],
    B: ['gh', 'fi', 'j'],
    C: ['m', 'n', 'l', 'k', 'o'],
    D: ['i', 'h', 'j', 'f', 'g'],
    E: ['t', 'p', 's', 'q', 'r'],
    F: ['pq', 'rt', 's'],
    G: ['b', 'c', 'a', 'e', 'd'],
    H: ['r', 'q', 's', 't', 'p'],
    I: ['m', 'n', 'l', 'o', 'k'],
    J: ['e', 'd', 'a', 'c', 'b'],
    K: ['f', 'g', 'j', 'h', 'i'],
    L: ['r', 'q', 's', 'p', 't'],
    M: ['dc', 'eb', 'a'],
    N: ['t', 'p', 's', 'r', 'q'],
    O: ['e', 'd', 'a', 'b', 'c'],
    P: ['f', 'g', 'j', 'i', 'h'],
    Q: ['k', 'o', 'l', 'n', 'm'],
    R: ['b', 'c', 'a', 'd', 'e'],
    S: ['i', 'h', 'j', 'g', 'f'],
    T: ['km', 'no', 'l'],
  },
  /** Movement offset calculations for each cell kind and direction */
  move: {
    /** Kind 0 pentagon movements - base orientation */
    0: {
      a: [
        { x: +0, y: -1 },
        { x: +0, y: -1 },
        { x: -1, y: -1 },
        { x: +0, y: -1 },
        { x: -1, y: -1 },
      ], // North variations
      b: [
        { x: +1, y: +0 },
        { x: +1, y: +0 },
        { x: +1, y: +0 },
        { x: +1, y: +0 },
        { x: +1, y: +0 },
      ], // East
      c: [
        { x: +0, y: +1 },
        { x: +1, y: +1 },
        { x: +0, y: +1 },
        { x: +1, y: +1 },
        { x: +0, y: +1 },
      ], // Southeast variations
      d: [
        { x: -1, y: +1 },
        { x: +0, y: +1 },
        { x: -1, y: +1 },
        { x: +0, y: +1 },
        { x: -1, y: +1 },
      ], // Southwest variations
      e: [
        { x: -1, y: +0 },
        { x: -1, y: +0 },
        { x: -1, y: +0 },
        { x: -1, y: +0 },
        { x: -1, y: +0 },
      ], // West
    },
    /** Kind 1 pentagon movements - first rotated orientation */
    1: {
      f: [
        { x: +0, y: -1 },
        { x: +0, y: -1 },
        { x: -1, y: -1 },
        { x: +0, y: -1 },
        { x: -1, y: -1 },
      ], // North variations
      g: [
        { x: +1, y: -1 },
        { x: +1, y: -1 },
        { x: +0, y: -1 },
        { x: +1, y: -1 },
        { x: +0, y: -1 },
      ], // Northeast variations
      h: [
        { x: +0, y: +1 },
        { x: +1, y: +1 },
        { x: +0, y: +1 },
        { x: +1, y: +1 },
        { x: +0, y: +1 },
      ], // Southeast variations
      i: [
        { x: -1, y: +1 },
        { x: +0, y: +1 },
        { x: -1, y: +1 },
        { x: +0, y: +1 },
        { x: -1, y: +1 },
      ], // Southwest variations
      j: [
        { x: -1, y: +0 },
        { x: -1, y: +0 },
        { x: -1, y: +0 },
        { x: -1, y: +0 },
        { x: -1, y: +0 },
      ], // West
    },
    /** Kind 2 pentagon movements - second rotated orientation */
    2: {
      k: [
        { x: +1, y: -1 },
        { x: +1, y: -1 },
        { x: +0, y: -1 },
        { x: +1, y: -1 },
        { x: +0, y: -1 },
      ], // Northeast variations
      l: [
        { x: +1, y: +0 },
        { x: +1, y: +0 },
        { x: +1, y: +0 },
        { x: +1, y: +0 },
        { x: +1, y: +0 },
      ], // East
      m: [
        { x: +0, y: +1 },
        { x: +1, y: +1 },
        { x: +0, y: +1 },
        { x: +1, y: +1 },
        { x: +0, y: +1 },
      ], // Southeast variations
      n: [
        { x: -1, y: +1 },
        { x: +0, y: +1 },
        { x: -1, y: +1 },
        { x: +0, y: +1 },
        { x: -1, y: +1 },
      ], // Southwest variations
      o: [
        { x: +0, y: -1 },
        { x: +0, y: -1 },
        { x: -1, y: -1 },
        { x: +0, y: -1 },
        { x: -1, y: -1 },
      ], // North variations
    },
    /** Kind 3 pentagon movements - third rotated orientation */
    3: {
      p: [
        { x: +0, y: -1 },
        { x: +0, y: -1 },
        { x: -1, y: -1 },
        { x: +0, y: -1 },
        { x: -1, y: -1 },
      ], // North variations
      q: [
        { x: +1, y: -1 },
        { x: +1, y: -1 },
        { x: +0, y: -1 },
        { x: +1, y: -1 },
        { x: +0, y: -1 },
      ], // Northeast variations
      r: [
        { x: +1, y: +0 },
        { x: +1, y: +0 },
        { x: +1, y: +0 },
        { x: +1, y: +0 },
        { x: +1, y: +0 },
      ], // East
      s: [
        { x: +0, y: +1 },
        { x: +1, y: +1 },
        { x: +0, y: +1 },
        { x: +1, y: +1 },
        { x: +0, y: +1 },
      ], // Southeast variations
      t: [
        { x: -1, y: +0 },
        { x: -1, y: +0 },
        { x: -1, y: +0 },
        { x: -1, y: +0 },
        { x: -1, y: +0 },
      ], // West
    },
  },
  /** Preferred direction ordering for maze generation algorithms by cell kind */
  preferred: {
    0: ['b', 'c', 'd'], // Kind 0: prefer east, southwest, southeast
    1: ['h', 'i', 'j'], // Kind 1: prefer southeast, southwest, west
    2: ['l', 'm'], // Kind 2: prefer east, southeast
    3: ['r', 's'], // Kind 3: prefer east, southeast
  },
  /** Direction angles in degrees for rendering and geometric calculations */
  angle: {
    // Kind 0 directions
    a: 270,
    b: 0,
    c: 45,
    d: 135,
    e: 180,
    // Kind 1 directions
    f: 270,
    g: 315,
    h: 45,
    i: 90,
    j: 180,
    // Kind 2 directions
    k: 270,
    l: 0,
    m: 90,
    n: 135,
    o: 225,
    // Kind 3 directions
    p: 225,
    q: 315,
    r: 0,
    s: 90,
    t: 180,
  },
};

/**
 * Matrix defining the pentagon cell kind (type) for each position in the tessellation.
 * Each position in the 5×4 repeating pattern corresponds to a specific pentagon
 * orientation (0-3). The pattern ensures proper geometric alignment and seamless
 * tiling across the entire maze surface.
 *
 * Pattern layout:
 * ```
 * Row 0: [0, 1, 2, 3]
 * Row 1: [2, 3, 0, 1]
 * Row 2: [3, 0, 1, 2]
 * Row 3: [1, 2, 3, 0]
 * Row 4: [2, 3, 0, 1]
 * ```
 *
 * @group Geometry
 * @category Constants
 */
export const kindMatrix: number[][] = [
  [0, 1, 2, 3],
  [2, 3, 0, 1],
  [3, 0, 1, 2],
  [1, 2, 3, 0],
  [2, 3, 0, 1],
];

/**
 * Matrix defining the horizontal offset positions for pentagon cells in the tessellation.
 * Values represent relative X coordinates for positioning pentagons within the tiling
 * pattern. These offsets ensure proper spacing and alignment between adjacent pentagons
 * of different orientations to create a seamless tessellation.
 *
 * The offsets account for the irregular spacing required by the pentagon tessellation,
 * where cells don't align on a regular grid due to the 5-fold symmetry.
 *
 * @group Geometry
 * @category Constants
 */
export const offsetXMatrix = [
  [+0.0, +1.0, +2.5, +4.0],
  [+0.5, +2.0, +3.0, +4.0],
  [+0.0, +1.0, +2.0, +3.5],
  [+0.0, +1.5, +3.0, +4.0],
  [-0.5, +1.0, +2.0, +3.0],
];

/**
 * Matrix defining the vertical offset positions for pentagon cells in the tessellation.
 * Values represent relative Y coordinates for positioning pentagons within the tiling
 * pattern. These offsets work in conjunction with the horizontal offsets to create
 * the complex but mathematically precise arrangement needed for pentagon tessellation.
 *
 * The pattern ensures that pentagon edges align properly with their neighbors,
 * maintaining the geometric constraints required for a valid tessellation.
 *
 * @group Geometry
 * @category Constants
 */
export const offsetYMatrix = [
  [+0.0, +0.0, +0.0, -0.5],
  [+1.0, +0.5, +1.0, +1.0],
  [+1.5, +2.0, +2.0, +2.0],
  [+3.0, +3.0, +2.5, +3.0],
  [+4.0, +3.5, +4.0, +4.0],
];
