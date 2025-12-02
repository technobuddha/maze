import { create2dArray } from '@technobuddha/library';

import { type CellFacing } from '../geometry/index.ts';

import { MazeSolver, type MazeSolverProperties } from './maze-solver.ts';

/**
 * Represents a single rabbit in the Fibonacci maze solving algorithm.
 *
 * Each rabbit maintains its position, age, movement history, and previous location
 * to prevent immediate backtracking.
 *
 * @group Solver
 * @category  Fibonaccis Rabbits
 */
type Rabbit = {
  /** Current position and facing direction of the rabbit */
  cell: CellFacing;
  /** Age of the rabbit in generations (used for reproduction and lifespan) */
  age: number;
  /** Previous position to prevent immediate backtracking */
  tail: CellFacing;
  /** Complete movement history for solution reconstruction */
  history: CellFacing[];
};

/**
 * Configuration properties for the Fibonacci's Rabbits maze solver.
 *
 * @group Solver
 * @category  Fibonaccis Rabbits
 */
export type FibonaccisRabbitsProperties = MazeSolverProperties & {
  /** Maximum age a rabbit can reach before dying (in generations) */
  readonly lifeSpan?: number;
  /** Age at which rabbits become fertile and reproduce */
  readonly gestationPeriod?: number;
  /** Maximum number of rabbits allowed per cell to prevent overcrowding */
  readonly populationLimit?: number;
  /** Color for rendering individual rabbits */
  readonly rabbitColor?: string;
  /** Color for rendering groups of rabbits (fluffle) */
  readonly fluffleColor?: string;
};

/**
 * Fibonacci's Rabbits maze solver using population-based exploration.
 *
 * This algorithm simulates rabbit reproduction following Fibonacci sequence patterns.
 * Rabbits explore the maze randomly, reproduce at regular intervals, and die of old age.
 * The population dynamics create emergent pathfinding behavior through parallel exploration.
 *
 * Key behaviors:
 * - Rabbits reproduce every `gestationPeriod` generations after reaching maturity
 * - Rabbits die after reaching `lifeSpan` generations
 * - Overpopulation is controlled by `populationLimit` per cell
 * - Random movement with backtracking prevention
 *
 * @group Solver
 * @category  Fibonaccis Rabbits
 */
export class FibonaccisRabbits extends MazeSolver {
  /** Maximum age a rabbit can reach before dying */
  protected readonly lifeSpan: NonNullable<FibonaccisRabbitsProperties['lifeSpan']>;
  /** Age at which rabbits become fertile and reproduce */
  protected readonly gestationPeriod: NonNullable<FibonaccisRabbitsProperties['gestationPeriod']>;
  /** Maximum number of rabbits allowed per cell */
  protected readonly populationLimit: NonNullable<FibonaccisRabbitsProperties['populationLimit']>;
  /** Color for rendering individual rabbits */
  protected readonly rabbitColor: NonNullable<FibonaccisRabbitsProperties['rabbitColor']>;
  /** Color for rendering groups of rabbits */
  protected readonly fluffleColor: NonNullable<FibonaccisRabbitsProperties['fluffleColor']>;
  /** Peak rabbit population reached during solving */
  protected maxRabbits = 0;

  /**
   * Creates a new Fibonacci's Rabbits solver with population parameters.
   *
   * @param props - Configuration including lifespan, reproduction, and visual settings
   */
  public constructor({
    lifeSpan = 100,
    gestationPeriod = 20,
    populationLimit = 2,
    rabbitColor = 'oklch(0.8677 0.0735 7.09)',
    fluffleColor = 'oklch(0.628 0.2577 29.23)',
    ...props
  }: FibonaccisRabbitsProperties) {
    super(props);
    this.lifeSpan = lifeSpan;
    this.gestationPeriod = gestationPeriod;
    this.populationLimit = populationLimit;
    this.rabbitColor = rabbitColor;
    this.fluffleColor = fluffleColor;
  }

  /**
   * Solves the maze using Fibonacci rabbit population dynamics.
   *
   * Simulates rabbit reproduction and exploration where:
   * 1. Rabbits age each generation and reproduce at intervals
   * 2. Old rabbits die after reaching lifespan
   * 3. Rabbits move randomly while avoiding immediate backtracking
   * 4. Overpopulation is controlled by culling excess rabbits
   * 5. Solution is found when any rabbit reaches the exit
   *
   * The algorithm visualizes population density using different colors for
   * individual rabbits vs groups (fluffles).
   *
   * @param options - Optional entrance and exit override points
   * @yields After each generation for population visualization
   */
  public async *solve({
    entrance = this.maze.entrance,
    exit = this.maze.exit,
  } = {}): AsyncGenerator<void> {
    const currentCount = create2dArray(this.maze.width, this.maze.height, 0);
    const lastCount = create2dArray(this.maze.width, this.maze.height, 0);
    let rabbits: Rabbit[] = [{ cell: entrance, age: 0, tail: entrance, history: [entrance] }];
    currentCount[entrance.x][entrance.y]++;

    while (true) {
      this.maxRabbits = Math.max(this.maxRabbits, rabbits.length);

      // Create the next generation of rabbits, culling the old ones and creating new ones
      const currGeneration = [...rabbits];
      rabbits = [];
      for (const rabbit of currGeneration) {
        rabbit.age++;
        if (rabbit.age <= this.lifeSpan) {
          rabbits.push(rabbit);
          if (rabbit.age % this.gestationPeriod === 0 && rabbit.age !== this.gestationPeriod) {
            currentCount[rabbit.cell.x][rabbit.cell.y]++;
            rabbits.push({
              cell: { ...rabbit.cell },
              age: 0,
              tail: { ...rabbit.cell },
              history: [...rabbit.history],
            });
          }
        } else {
          currentCount[rabbit.cell.x][rabbit.cell.y]--;
        }
      }

      for (const rabbit of rabbits) {
        const next =
          this.randomPick(
            this.maze
              .moves(rabbit.cell, { wall: false })
              .filter(({ target }) => !this.maze.isSame(target, rabbit.tail))
              .map(({ target }) => target),
          ) ?? rabbit.tail;

        rabbit.history.push(next);
        currentCount[rabbit.cell.x][rabbit.cell.y]--;
        currentCount[next.x][next.y]++;

        rabbit.tail = rabbit.cell;
        rabbit.cell = next;

        if (this.maze.isSame(next, exit)) {
          this.maze.sendMessage(`${this.maxRabbits} rabbits solved the maze!`, {
            color: this.rabbitColor,
          });
          this.maze.solution = this.maze.makePath(this.maze.flatten(rabbit.history));
          return;
        }
      }

      // Cull the overpopulation
      for (const cell of this.maze
        .cellsInMaze()
        .filter((c) => currentCount[c.x][c.y] > this.populationLimit)) {
        currentCount[cell.x][cell.y]--;
        rabbits.splice(
          rabbits.findIndex((r) => this.maze.isSame(cell, r.cell)),
          1,
        );
      }

      for (const cell of this.maze.cellsInMaze()) {
        if (currentCount[cell.x][cell.y] !== lastCount[cell.x][cell.y]) {
          this.maze.drawCell(cell);

          if (currentCount[cell.x][cell.y] > 0) {
            this.maze.drawAvatar(
              cell,
              currentCount[cell.x][cell.y] > 1 ? this.fluffleColor : this.rabbitColor,
            );
          }

          lastCount[cell.x][cell.y] = currentCount[cell.x][cell.y];
        }
      }
      yield;
    }
  }
}
