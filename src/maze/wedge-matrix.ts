/* eslint-disable @typescript-eslint/no-unnecessary-type-conversion */
import { type Matrix } from '../geometry/matrix.ts';

/**
 * Matrix definition for wedge-based maze geometry.
 *
 * Wedge mazes use a complex tessellation pattern that combines triangular and diamond-shaped
 * cells arranged in a repeating pattern. The tessellation requires 4 different wedge
 * orientations (kinds 0-3) to completely tile the plane, creating a sophisticated
 * geometric structure with varying connectivity patterns.
 *
 * Direction mapping by cell kind:
 * - Kind 0 (top wedges): a(270°), b(55°), c(180°) - up, northeast, left connections
 * - Kind 1 (right wedges): d(225°), e(0°), f(90°) - southwest, right, down connections
 * - Kind 2 (bottom wedges): g(315°), h(90°), i(180°) - northwest, down, left connections
 * - Kind 3 (left wedges): j(270°), k(0°), l(135°) - up, right, northwest connections
 *
 * Cell kinds:
 * - Kind 0: Top-pointing wedges with upward orientation
 * - Kind 1: Right-pointing wedges with rightward orientation
 * - Kind 2: Bottom-pointing wedges with downward orientation
 * - Kind 3: Left-pointing wedges with leftward orientation
 *
 * The wedge tessellation creates a complex pattern where each wedge type has 3 possible
 * connections at specific angles. This geometry produces intricate maze structures with
 * multiple junction types and sophisticated pathfinding challenges.
 *
 * @group Maze
 * @category  Wedge
 */
export const wedgeMatrix: Matrix = {
  /** Bridge configuration for multi-level maze support with 2 bridge pieces per kind */
  bridge: {
    /** Number of bridge pieces available */
    pieces: 2,
    /** Bridge connection mappings between opposite directions across all wedge orientations */
    connect: { a: 'f', c: 'e', e: 'c', f: 'a', h: 'j', i: 'k', j: 'h', k: 'i' },
    /** Bridge layout configurations by piece type for each wedge kind */
    layouts: {
      /** Kind 0 (top wedges) bridge configurations */
      0: [
        { path: ['a', 'g', 'j', 'd'], rear: ['h', 'l', 'f', 'b'] }, // Multi-directional bridge path
        { path: ['c', 'l', 'i', 'd'], rear: ['k', 'g', 'e', 'b'] }, // Alternative bridge configuration
      ],
      /** Kind 1 (right wedges) bridge configurations */
      1: [
        { path: ['e', 'g', 'k', 'b'], rear: ['i', 'l', 'c', 'd'] },
        { path: ['f', 'l', 'h', 'b'], rear: ['j', 'g', 'a', 'd'] },
      ],
      /** Kind 2 (bottom wedges) bridge configurations */
      2: [
        { path: ['h', 'b', 'f', 'l'], rear: ['a', 'd', 'j', 'g'] },
        { path: ['i', 'd', 'c', 'l'], rear: ['e', 'b', 'k', 'g'] },
      ],
      /** Kind 3 (left wedges) bridge configurations */
      3: [
        { path: ['j', 'd', 'a', 'g'], rear: ['f', 'b', 'h', 'l'] },
        { path: ['k', 'b', 'e', 'g'], rear: ['c', 'd', 'i', 'l'] },
      ],
    },
  },
  /** All twelve wedge directions across all four cell kinds */
  directions: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l'],
  /** Pillar definitions for wedge corner intersections (adjacent direction pairs within each kind) */
  pillars: ['ab', 'bc', 'ca', 'de', 'ef', 'fd', 'gh', 'hi', 'ig', 'jk', 'kl', 'lj'],
  /** Wall configurations - each wedge kind supports its 3 corresponding directions */
  wall: {
    0: { a: true, b: true, c: true }, // Top wedges: up, northeast, left
    1: { d: true, e: true, f: true }, // Right wedges: southwest, right, down
    2: { g: true, h: true, i: true }, // Bottom wedges: northwest, down, left
    3: { j: true, k: true, l: true }, // Left wedges: up, right, northwest
  },
  /** Opposite direction and facing mappings for wedge geometry */
  opposite: {
    /** Direction to opposite facing mappings (lowercase to uppercase) */
    direction: {
      a: 'H', // Up direction (kind 0) faces bottom-down (kind 2)
      b: 'D', // Northeast direction (kind 0) faces southwest (kind 1)
      c: 'K', // Left direction (kind 0) faces right (kind 3)
      d: 'B', // Southwest direction (kind 1) faces northeast (kind 0)
      e: 'I', // Right direction (kind 1) faces left (kind 2)
      f: 'J', // Down direction (kind 1) faces up (kind 3)
      g: 'L', // Northwest direction (kind 2) faces northwest (kind 3)
      h: 'A', // Down direction (kind 2) faces up (kind 0)
      i: 'E', // Left direction (kind 2) faces right (kind 1)
      j: 'F', // Up direction (kind 3) faces down (kind 1)
      k: 'C', // Right direction (kind 3) faces left (kind 0)
      l: 'G', // Northwest direction (kind 3) faces northwest (kind 2)
    },
    /** Facing to opposite direction mappings (uppercase to lowercase) */
    facing: {
      A: 'h', // Up facing connects to down (kind 2)
      B: 'd', // Northeast facing connects to southwest (kind 1)
      C: 'k', // Left facing connects to right (kind 3)
      D: 'b', // Southwest facing connects to northeast (kind 0)
      E: 'i', // Right facing connects to left (kind 2)
      F: 'j', // Down facing connects to up (kind 3)
      G: 'l', // Northwest facing connects to northwest (kind 3)
      H: 'a', // Down facing connects to up (kind 0)
      I: 'e', // Left facing connects to right (kind 1)
      J: 'f', // Up facing connects to down (kind 1)
      K: 'c', // Right facing connects to left (kind 0)
      L: 'g', // Northwest facing connects to northwest (kind 2)
    },
  },
  /** Right turn options from each facing direction (clockwise order around wedge) */
  rightTurn: {
    A: ['g', 'i', 'h'], // From up: right leads to northwest, straight to left, left to down
    B: ['f', 'e', 'd'], // From northeast: right leads to down, straight to right, left to southwest
    C: ['j', 'l', 'k'], // From left: right leads to up, straight to northwest, left to right
    D: ['a', 'c', 'b'], // From southwest: right leads to up, straight to left, left to northeast
    E: ['h', 'g', 'i'], // From right: right leads to down, straight to northwest, left to left
    F: ['l', 'k', 'j'], // From down: right leads to northwest, straight to right, left to up
    G: ['k', 'j', 'l'], // From northwest: right leads to right, straight to up, left to northwest
    H: ['c', 'b', 'a'], // From down: right leads to left, straight to northeast, left to up
    I: ['d', 'f', 'e'], // From left: right leads to southwest, straight to down, left to right
    J: ['e', 'd', 'f'], // From up: right leads to right, straight to southwest, left to down
    K: ['b', 'a', 'c'], // From right: right leads to northeast, straight to up, left to left
    L: ['i', 'h', 'g'], // From northwest: right leads to left, straight to down, left to northwest
  },
  /** Left turn options from each facing direction (counter-clockwise order around wedge) */
  leftTurn: {
    A: ['i', 'g', 'h'], // From up: left leads to left, straight to northwest, right to down
    B: ['e', 'f', 'd'], // From northeast: left leads to right, straight to down, right to southwest
    C: ['l', 'j', 'k'], // From left: left leads to northwest, straight to up, right to right
    D: ['c', 'a', 'b'], // From southwest: left leads to left, straight to up, right to northeast
    E: ['g', 'h', 'i'], // From right: left leads to northwest, straight to down, right to left
    F: ['k', 'l', 'j'], // From down: left leads to right, straight to northwest, right to up
    G: ['j', 'k', 'l'], // From northwest: left leads to up, straight to right, right to northwest
    H: ['b', 'c', 'a'], // From down: left leads to northeast, straight to left, right to up
    I: ['f', 'd', 'e'], // From left: left leads to down, straight to southwest, right to right
    J: ['d', 'e', 'f'], // From up: left leads to southwest, straight to right, right to down
    K: ['a', 'b', 'c'], // From right: left leads to up, straight to northeast, right to left
    L: ['h', 'i', 'g'], // From northwest: left leads to down, straight to left, right to northwest
  },
  /** Straight/forward movement options from each facing direction */
  straight: {
    A: ['gi', 'h'], // From up: cross northwest-left, or straight down
    B: ['fe', 'd'], // From northeast: cross down-right, or straight southwest
    C: ['jl', 'k'], // From left: cross up-northwest, or straight right
    D: ['ac', 'b'], // From southwest: cross up-left, or straight northeast
    E: ['hg', 'i'], // From right: cross down-northwest, or straight left
    F: ['kl', 'j'], // From down: cross right-northwest, or straight up
    G: ['kj', 'l'], // From northwest: cross right-up, or straight northwest
    H: ['bc', 'a'], // From down: cross northeast-left, or straight up
    I: ['df', 'e'], // From left: cross southwest-down, or straight right
    J: ['ed', 'f'], // From up: cross right-southwest, or straight down
    K: ['ba', 'c'], // From right: cross northeast-up, or straight left
    L: ['hi', 'g'], // From northwest: cross down-left, or straight northwest
  },
  /** Movement offset calculations for each wedge kind and direction */
  move: {
    /** Kind 0 (top wedges) movements */
    0: {
      a: { x: +0, y: -1 }, // Up: move up one row
      b: { x: +1, y: +0 }, // Northeast: move right one column
      c: { x: -1, y: +0 }, // Left: move left one column
    },
    /** Kind 1 (right wedges) movements */
    1: {
      d: { x: -1, y: +0 }, // Southwest: move left one column
      e: { x: +1, y: +0 }, // Right: move right one column
      f: { x: +0, y: +1 }, // Down: move down one row
    },
    /** Kind 2 (bottom wedges) movements */
    2: {
      g: { x: +1, y: +0 }, // Northwest: move right one column
      h: { x: +0, y: +1 }, // Down: move down one row
      i: { x: -1, y: +0 }, // Left: move left one column
    },
    /** Kind 3 (left wedges) movements */
    3: {
      j: { x: +0, y: -1 }, // Up: move up one row
      k: { x: +1, y: +0 }, // Right: move right one column
      l: { x: -1, y: +0 }, // Northwest: move left one column
    },
  },
  /** Preferred direction ordering for maze generation algorithms by wedge kind */
  preferred: {
    0: ['b'], // Kind 0 (top): prefer northeast for consistent patterns
    1: ['e', 'f'], // Kind 1 (right): prefer right and down for flow
    2: ['g', 'h'], // Kind 2 (bottom): prefer northwest and down for structure
    3: ['k'], // Kind 3 (left): prefer right for balance
  },
  /** Direction angles in degrees for rendering and geometric calculations */
  angle: {
    a: 270, // Up direction (north)
    b: 55, // Northeast direction (55° from east)
    c: 180, // Left direction (west)
    d: 225, // Southwest direction (225° from north)
    e: 0, // Right direction (east)
    f: 90, // Down direction (south)
    g: 315, // Northwest direction (315° from north)
    h: 90, // Down direction (south)
    i: 180, // Left direction (west)
    j: 270, // Up direction (north)
    k: 0, // Right direction (east)
    l: 135, // Northwest direction (135° from north)
  },
};
