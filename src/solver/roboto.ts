/* eslint-disable @typescript-eslint/no-loop-func */
import { conjoin, MersenneTwister, ordinal } from '@technobuddha/library';

import { type CellFacing } from '../geometry/index.ts';
import { mix } from '../library/index.ts';
import { DrunkenRobot, type DrunkenRobotProperties } from '../robot/drunkards-walk.ts';
import {
  BacktrackingRobot,
  type BacktrackingRobotProperties,
  DijkstrasRobot,
  type DijkstrasRobotProperties,
  PledgeRobot,
  type PledgeRobotProperties,
  RandomMouseRobot,
  type RandomMouseRobotProperties,
  type Robot,
  TremauxRobot,
  type TremauxRobotProperties,
  WallWalkingRobot,
  type WallWalkingRobotProperties,
} from '../robot/index.ts';
import { RobotError } from '../robot/robot-error.ts';

import { MazeSolver, type MazeSolverProperties } from './maze-solver.ts';

/**
 * Generic robot configuration type that omits maze and location properties.
 *
 * Creates a robot specification by combining an algorithm identifier with
 * the corresponding robot properties, excluding maze and location since
 * those are provided by the Roboto solver.
 *
 * @typeParam Algorithm - The algorithm identifier string
 * @typeParam Properties - The specific robot properties type
 * @group Solver
 * @category Roboto
 */
export type RoboProperties<Algorithm extends string, Properties> = Omit<
  Properties,
  'maze' | 'location'
> & {
  /** The algorithm identifier for the robot type */
  algorithm: Algorithm;
};

/**
 * Union type of all supported robot configurations.
 *
 * Defines all available robot algorithms that can be used by the Roboto solver,
 * each with their specific configuration properties.
 *
 * @group Solver
 * @category Roboto
 */
export type Robo =
  | RoboProperties<'backtracking', BacktrackingRobotProperties>
  | RoboProperties<'dijkstras', DijkstrasRobotProperties>
  | RoboProperties<'drunkards-walk', DrunkenRobotProperties>
  | RoboProperties<'pledge', PledgeRobotProperties>
  | RoboProperties<'random-mouse', RandomMouseRobotProperties>
  | RoboProperties<'tremaux', TremauxRobotProperties>
  | RoboProperties<'wall-walking', WallWalkingRobotProperties>;

/**
 * Configuration properties for the Roboto maze solver.
 *
 * @group Solver
 * @category Roboto
 */
export type RobotoProperties = MazeSolverProperties & {
  /** Array of robot configurations to deploy in the maze */
  robots: Robo[];
};

/**
 * Multi-robot maze solver that deploys and manages multiple solving algorithms simultaneously.
 *
 * Roboto creates and coordinates multiple robot instances, each running different algorithms
 * in parallel. The solver manages robot lifecycles, handles errors, and tracks completion
 * in a competitive environment where robots race to find the exit.
 *
 * Key features:
 * - Supports 7 different robot algorithms (Tremaux, Wall-walking, Backtracking, etc.)
 * - Synchronized random number generation across all robots
 * - Competitive scoring and place tracking for multiple robots
 * - Error handling and graceful robot termination
 * - Automatic solution capture from the first successful robot
 *
 * @group Solver
 * @category Roboto
 */
export class Roboto extends MazeSolver {
  /** Random seed for synchronized number generation across all robots */
  private readonly seed = Math.floor(Math.random() * 0x7fffffff);
  /** Original robot configurations for spawning */
  private readonly robos: Robo[] = [];
  /** Active robot instances currently running */
  protected readonly robots: Robot[] = [];

  /**
   * Creates a new Roboto solver with specified robot configurations.
   *
   * @param props - Configuration including maze and array of robot specifications
   */
  public constructor({ maze, robots, ...props }: RobotoProperties) {
    super({ maze, ...props });
    this.robos = robots;
  }

  /**
   * Creates a robot instance from a configuration specification.
   *
   * Instantiates the appropriate robot class based on the algorithm type,
   * ensuring all robots share the same random number generator for fairness.
   *
   * @param robo - Robot configuration specification
   * @param location - Starting position and facing direction for the robot
   * @returns Configured robot instance ready for execution
   */
  protected createRobot(robo: Robo, location: CellFacing): Robot {
    // Ensure that all robots use the same random numbers.
    const rng = new MersenneTwister(this.seed);
    // cspell:ignore genrand
    const random = rng.genrandReal3.bind(rng);

    switch (robo.algorithm) {
      case 'tremaux': {
        return new TremauxRobot({ random, maze: this.maze, location, ...robo });
      }

      case 'wall-walking': {
        return new WallWalkingRobot({ random, maze: this.maze, location, ...robo });
      }

      case 'backtracking': {
        return new BacktrackingRobot({ random, maze: this.maze, location, ...robo });
      }

      case 'random-mouse': {
        return new RandomMouseRobot({ random, maze: this.maze, location, ...robo });
      }

      case 'drunkards-walk': {
        return new DrunkenRobot({ random, maze: this.maze, location, ...robo });
      }

      case 'dijkstras': {
        return new DijkstrasRobot({ random, maze: this.maze, location, ...robo });
      }

      case 'pledge': {
        return new PledgeRobot({ random, maze: this.maze, location, ...robo });
      }

      // no default
    }
  }

  /**
   * Executes one step for a single robot with error handling.
   *
   * Attempts to execute the robot's next action, catching and handling
   * any errors that occur. Failed robots are automatically terminated
   * and removed from the active robot pool.
   *
   * @param robot - The robot instance to execute
   */
  protected runOneRobot(robot: Robot): void {
    try {
      robot.execute();
    } catch (error) {
      if (error instanceof RobotError) {
        this.maze.sendMessage(error.message, { color: error.color });
      } else {
        this.maze.sendMessage(`${robot.name} encountered an error: ${error}`, { level: 'error' });
      }
      this.killOneRobot(robot);
    }
  }

  /**
   * Executes one step for all active robots.
   *
   * Iterates through all active robots and executes their next action.
   * Creates a copy of the robot array to handle robots that may be
   * removed during execution due to errors or completion.
   */
  protected runAllRobots(): void {
    for (const robot of Array.from(this.robots)) {
      this.runOneRobot(robot);
    }
  }

  /**
   * Terminates and disposes all active robots.
   *
   * Removes all robots from the active pool and properly disposes
   * their resources to prevent memory leaks.
   */
  protected killAllRobots(): void {
    let robot: Robot | undefined;
    while ((robot = this.robots.pop())) {
      robot.dispose();
    }
  }

  /**
   * Terminates and disposes a specific robot.
   *
   * Removes the robot from the active pool and disposes its resources.
   * Issues a warning if the robot is not found in the active pool.
   *
   * @param robot - The robot instance to terminate
   */
  protected killOneRobot(robot: Robot): void {
    const index = this.robots.indexOf(robot);
    if (index >= 0) {
      this.robots.splice(index, 1);
    } else {
      this.maze.sendMessage(`${robot.name} body not found`, { level: 'warning' });
    }
    robot.dispose();
  }

  /**
   * Adds a robot to the active execution pool.
   *
   * @param robot - The robot instance to activate
   */
  protected activateOneRobot(robot: Robot): void {
    this.robots.push(robot);
  }

  /**
   * Checks if a robot has completed its program by reaching the target.
   *
   * @param robot - The robot to check for completion
   * @param exit - The target position (defaults to maze exit)
   * @returns True if the robot has reached the target position
   */
  protected isProgramComplete(robot: Robot, exit = this.maze.exit): boolean {
    return this.maze.isSame(robot.location, exit);
  }

  /**
   * Solves the maze using multiple robots in competitive parallel execution.
   *
   * Deploys all configured robots from the entrance and runs them simultaneously
   * until one or more reach the exit. Tracks completion order, handles ties,
   * and captures the solution path from the first successful robot.
   *
   * The solver continues until all robots either complete or fail, providing
   * competitive messaging for multi-robot scenarios.
   *
   * @param options - Optional entrance and exit override points
   * @yields After each execution cycle for animation and visualization
   */
  public async *solve({
    entrance = this.maze.entrance,
    exit = this.maze.exit,
  } = {}): AsyncGenerator<void> {
    const players = this.robos.length;
    let place = 0;

    this.killAllRobots();
    for (const robo of this.robos) {
      this.activateOneRobot(this.createRobot(robo, entrance));
    }

    while (this.robots.length > 0) {
      this.runAllRobots();
      yield;

      const winners = this.robots.filter((robot) => this.isProgramComplete(robot, exit));
      if (winners.length > 0) {
        const [winner] = winners;

        if (place === 0) {
          this.maze.solution = this.maze.makePath(winner.path());
        }

        if (players > 1) {
          if (winners.length === 1) {
            this.maze.sendMessage(`${winner.name} takes ${ordinal(++place)} place`, {
              color: winner.color,
            });
          } else if (winners.length > 1) {
            this.maze.sendMessage(
              // eslint-disable-@typescript-eslint/no-loop-func
              `${winners.map((r) => r.name).join(', ')} tie for ${conjoin(winners.map(() => ordinal(++place)))} places`,
              {
                color: mix(winners[0].color, winners[1].color),
              },
            );
          }
        } else {
          ++place;
        }

        for (const winner of winners) {
          this.killOneRobot(winner);
        }
      }
    }

    if (place === 0 && this.robots.length === 0) {
      if (this.robos.length > 0) {
        this.maze.sendMessage('No solution found', { level: 'warning' });
      }
    }
  }
}
