import { type Cartesian } from '@technobuddha/library';

/**
 * Direction enumeration for maze movement and wall placement.
 * Uses lowercase letters a-z plus '?' for undefined/null direction.
 * Different maze geometries use subsets of these directions based on their connectivity rules.
 * Common mappings: 'n'=north, 's'=south, 'e'=east, 'w'=west for square mazes.
 *
 * @group Geometry
 * @category Types
 */
// prettier-ignore
export type Direction =
  |'a'|'b'|'c'|'d'|'e'|'f'|'g'|'h'|'i'|'j'|'k'|'l'|'m'|'n'|'o'|'p'|'q'|'r'|'s'|'t'|'u'|'v'|'w'|'x'|'y'|'z'|'?';

/**
 * Facing enumeration for directional orientation within maze cells.
 * Uses uppercase letters A-Z plus '!' for undefined/null facing.
 * Represents the direction an entity is facing, typically the opposite of the direction moved.
 * Complements Direction - when moving in direction 'n', facing becomes 'S'.
 *
 * @group Geometry
 * @category Types
 */
// prettier-ignore
export type Facing =
  |'A'|'B'|'C'|'D'|'E'|'F'|'G'|'H'|'I'|'J'|'K'|'L'|'M'|'N'|'O'|'P'|'Q'|'R'|'S'|'T'|'U'|'V'|'W'|'X'|'Y'|'Z'|'!';

/**
 * Pillar identifier representing the intersection of two wall directions.
 * Template literal type combining two Direction values to identify corner/pillar positions.
 * Used for rendering wall intersections and corner decorations in maze display.
 *
 * @example "ns" - pillar at the intersection of north and south walls
 * @example "ew" - pillar at the intersection of east and west walls
 *
 * @group Geometry
 * @category Types
 */
export type Pillar = `${Direction}${Direction}`;

/**
 * Numeric identifier for different cell geometric types within a maze.
 * Different maze geometries may have multiple cell kinds (shapes) that behave differently.
 * For example, hexagonal mazes might have full hexagons (kind 0) and partial hexagons (kind 1).
 *
 * @group Geometry
 * @category Types
 */
export type Kind = number;

/**
 * Basic cell position in the maze grid.
 * Extends Cartesian coordinates with x,y properties representing grid position.
 *
 * @group Geometry
 * @category Types
 */
export type Cell = Cartesian;

/**
 * Cell with an associated movement direction.
 * Used to represent a cell and the direction of movement from/to that cell.
 * Common in pathfinding and maze generation algorithms.
 *
 * @group Geometry
 * @category Types
 */
export type CellDirection = Cell & {
  /** The direction associated with this cell */
  direction: Direction;
};

/**
 * Cell with an associated facing orientation.
 * Used to represent a cell and the direction an entity is facing within that cell.
 * Essential for navigation algorithms that need to track orientation.
 *
 * @group Geometry
 * @category Types
 */
export type CellFacing = Cell & {
  /** The facing direction within this cell */
  facing: Facing;
};

/**
 * Cell with direction and tunnel status information.
 * Extends CellDirection to include whether the movement uses a tunnel connection.
 * Used in advanced maze features like multi-level mazes or bridge connections.
 *
 * @group Geometry
 * @category Types
 */
export type CellTunnel = CellDirection & {
  /** Whether this cell connection involves a tunnel */
  tunnel: boolean;
};

/**
 * Represents an entrance or exit point in the maze.
 * Alias for CellFacing - terminus points have both position and facing direction.
 * The facing indicates which direction leads into/out of the maze.
 *
 * @group Geometry
 * @category Types
 */
export type Terminus = CellFacing;

/**
 * Represents a complete movement operation from one cell to another.
 * Contains the direction of movement, destination cell with facing, and optional tunnel path.
 * Used by pathfinding algorithms and movement validation systems.
 *
 * @group Geometry
 * @category Types
 */
export type Move = {
  /** The direction of movement */
  direction: Direction;
  /** The destination cell and resulting facing direction */
  target: CellFacing;
  /** Optional tunnel path for complex multi-level movements */
  tunnel?: CellFacing[];
};

/**
 * Coordinate offset for movement between cells with optional vertical zone.
 * Extends Cartesian coordinates to include vertical level information for multi-level mazes.
 * Used in matrix calculations to determine how to move between different cell positions.
 *
 * @group Geometry
 * @category Types
 */
export type MoveOffset = Cartesian & {
  /** Optional vertical zone for multi-level maze movement */
  zone?: 'up' | 'down';
};
