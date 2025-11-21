import { type Cell, type CellDirection } from '../geometry/index.ts';

import { MazeGenerator, type MazeGeneratorProperties } from './maze-generator.ts';

/**
 * Disjoint set data structure for tracking connected components.
 *
 * Implements union-find operations with path compression and union by size
 * for efficient cycle detection and component merging during maze generation.
 * Used by Kruskal's algorithm to determine if connecting two cells would
 * create a cycle in the maze.
 *
 * @group Generator
 * @category Kruskals
 * @internal
 */
class DisjointSet {
  private sets: number[];
  private readonly setSizes: number[];

  /**
   * Creates a new disjoint set with the specified number of items.
   *
   * Initializes each item as its own parent (singleton set) with size 1.
   *
   * @param numberOfItems - Number of items to initialize (defaults to 0)
   */
  public constructor(numberOfItems = 0) {
    //Array of items. Each item has an index which points to the parent set.
    this.sets = [];

    //record the size of the sets so we know which one should win (only at the parent index)
    this.setSizes = [];

    for (let i = 0; i < numberOfItems; i++) {
      this.sets[i] = i;
      this.setSizes[i] = 1;
    }
  }

  /**
   * Finds the root parent of a set with path compression.
   *
   * Recursively traverses the parent chain to find the root, then flattens
   * the path by making all nodes point directly to the root for future
   * efficiency improvements.
   *
   * @param index - Index of the item to find the parent for
   * @returns Index of the root parent of the set
   */
  public findParent(index: number): number {
    const parentIndex = this.sets[index];

    //if the parent is itself, then it has no parent so it must be the parent of the set
    if (parentIndex === index) {
      return index;
    }

    //recursively find parent until it has no parent (parent is self)
    const rootParentIndex = this.findParent(parentIndex);

    //save it for later so we don't have to go searching that far up the tree again
    this.sets[index] = rootParentIndex;
    return rootParentIndex;
  }

  /**
   * Joins two sets together using union by size.
   *
   * Merges the two sets containing the specified indices by making the
   * root of the smaller set point to the root of the larger set. This
   * helps maintain balanced trees for better performance.
   *
   * @param index1 - Index of an item in the first set
   * @param index2 - Index of an item in the second set
   */
  public union(index1: number, index2: number): void {
    const parent1 = this.findParent(index1);
    const parent2 = this.findParent(index2);

    //the bigger set should always win, so that we can avoid flickering when visualizing the sets
    if (this.setSizes[parent1] >= this.setSizes[parent2]) {
      this.sets[parent2] = parent1;
      this.setSizes[parent1] += this.setSizes[parent2];
    } else {
      this.sets[parent1] = parent2;
      this.setSizes[parent2] += this.setSizes[parent1];
    }
  }
}

/**
 * Configuration properties for the Kruskal's maze generator.
 *
 * @group Generator
 * @category Kruskals
 */
export type KruskalsProperties = MazeGeneratorProperties;

/**
 * Kruskal's maze generator that creates mazes by randomly connecting cells.
 *
 * Kruskal's algorithm generates mazes using a minimum spanning tree approach:
 * 1. Starts with all cells as separate components (forest of single nodes)
 * 2. Creates a randomized list of all possible cell connections (edges)
 * 3. Iterates through the edge list, connecting cells that are in different components
 * 4. Uses a disjoint set data structure to efficiently track components and detect cycles
 * 5. Continues until all cells are connected in a single spanning tree
 *
 * This approach creates mazes with:
 * - Uniform distribution of passage lengths
 * - No bias toward any particular direction or pattern
 * - Guaranteed single solution with no cycles
 * - Efficient generation through union-find operations
 *
 * The algorithm is particularly suitable for creating unbiased mazes where no
 * particular structural patterns are desired.
 *
 * @group Generator
 * @category Kruskals
 */
export class Kruskals extends MazeGenerator {
  private readonly disjointSubsets: DisjointSet;
  private readonly preferreds: CellDirection[];

  /**
   * Creates a new Kruskal's generator with the specified configuration.
   *
   * Initializes the disjoint set data structure with one component per cell
   * and creates a randomized list of all possible cell connections for processing.
   *
   * @param props - Configuration properties for the generator
   */
  public constructor(props: KruskalsProperties) {
    super(props);

    this.disjointSubsets = new DisjointSet(this.maze.width * this.maze.height);

    const allCells = this.maze.cellsInMaze();

    this.preferreds = this.randomShuffle(
      allCells.flatMap((c) => this.maze.preferreds(c).map((direction) => ({ ...c, direction }))),
    );

    this.player = 0;
    this.createPlayer();
  }

  /**
   * Converts a cell coordinate to a linear index for the disjoint set.
   *
   * Maps 2D cell coordinates to a 1D array index for efficient
   * disjoint set operations.
   *
   * @param cell - Cell to convert to index
   * @returns Linear index representing the cell
   */
  private getCellIndex(cell: Cell): number {
    return cell.y * this.maze.width + cell.x;
  }

  /**
   * Generates the maze using Kruskal's minimum spanning tree algorithm.
   *
   * Processes the randomized edge list, connecting cells that belong to
   * different components while avoiding cycles. Continues until all cells
   * are connected in a single spanning tree.
   *
   * @yields Control back to caller for animation after each wall removal
   */
  public async *generate(): AsyncGenerator<void> {
    while (this.preferreds.length > 0) {
      const preferred = this.preferreds.pop()!;
      const cell1 = { ...preferred };
      const cell2 = this.maze.walk(cell1, preferred.direction).target;

      const idx1 = this.getCellIndex(cell1);
      const idx2 = this.getCellIndex(cell2);

      const parent1 = this.disjointSubsets.findParent(idx1);
      const parent2 = this.disjointSubsets.findParent(idx2);

      if (parent1 !== parent2) {
        this.maze.removeWall(cell1, preferred.direction);
        yield;
        this.disjointSubsets.union(idx1, idx2);
      }
    }
  }
}
