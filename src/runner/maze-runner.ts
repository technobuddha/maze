import { animate } from '@technobuddha/library';

import { type Drawing } from '../drawing/index.ts';
import { type MazeGenerator, type MazeGeneratorProperties } from '../generator/index.ts';
import { type Maze, type MazeProperties } from '../geometry/index.ts';
import { type MazeSolver, type MazeSolverProperties } from '../solver/index.ts';

import { type Phase } from './phase.ts';
import { type PlayMode } from './play-mode.ts';

/**
 * Factory function type for creating maze instances.
 *
 * @typeParam props - Configuration properties for the maze
 * @returns A new maze instance
 *
 * @group Runner
 * @category  Maze Runner
 */
export type MazeMaker = (props: MazeProperties) => Maze;

/**
 * Factory function type for creating maze generator instances.
 *
 * @typeParam props - Configuration properties for the generator
 * @returns A new maze generator instance
 *
 * @group Runner
 * @category  Maze Runner
 */
export type GeneratorMaker = (props: MazeGeneratorProperties) => MazeGenerator;

/**
 * Factory function type for creating maze solver instances.
 *
 * @typeParam props - Configuration properties for the solver
 * @returns A new maze solver instance
 *
 * @group Runner
 * @category  Maze Runner
 */
export type SolverMaker = (props: MazeSolverProperties) => MazeSolver;

/**
 * Plugin function type for extending maze functionality.
 *
 * @typeParam maze - The maze instance to extend
 *
 * @group Runner
 * @category  Maze Runner
 */
export type Plugin = (this: void, maze: Maze) => void;

/**
 * Configuration properties for the MazeRunner.
 *
 * @group Runner
 * @category  Maze Runner
 */
export type MazeRunnerProperties = {
  /** Factory function for creating the maze instance */
  readonly mazeMaker: MazeMaker;
  /** Optional factory function for creating the generator instance */
  readonly generatorMaker?: GeneratorMaker;
  /** Optional factory function for creating the solver instance */
  readonly solverMaker?: SolverMaker;
  /** Optional plugin function for extending maze functionality */
  readonly plugin?: Plugin;
  /** Optional drawing interface for rendering the maze */
  readonly drawing?: Drawing;
  /** Optional play mode configuration for each phase */
  readonly mode?: { [P in Phase]?: PlayMode };
  /** Optional name to display when the runner starts */
  readonly name?: string;
};

let id = 0;

/**
 * Orchestrates the complete maze lifecycle from generation through solving.
 *
 * The MazeRunner coordinates all phases of maze creation and solving, including:
 * - Maze initialization and reset
 * - Generation phase execution
 * - Braiding phase for removing dead ends
 * - Solving phase with pathfinding
 * - Final display and observation phases
 * - User interaction and playback control
 *
 * Key features:
 * - Event-driven architecture with custom events for phase and mode changes
 * - Configurable playback modes (pause, step, play, fast, instant, refresh)
 * - Automatic phase progression with customizable timing
 * - Abort capability for stopping execution
 * - Animation support with speed control
 * - Observation timer for automatic progression
 *
 * The runner follows a strict phase sequence: maze → generate → braid → solve → final → observe → exit.
 * Each phase can have different playback modes and the runner handles transitions automatically
 * based on completion status and user commands.
 *
 * @group Runner
 * @category  Maze Runner
 */
export class MazeRunner extends EventTarget {
  /** The maze instance managed by this runner */
  public readonly maze: Maze;
  /** The generator instance for maze creation, if provided */
  public readonly generator?: MazeGenerator;
  /** The solver instance for pathfinding, if provided */
  public readonly solver?: MazeSolver;
  /** Current playback mode controlling execution speed and behavior */
  public mode: PlayMode = 'pause';
  /** Current execution phase in the maze lifecycle */
  public phase: Phase = 'maze';
  /** Unique identifier for this runner instance */
  public readonly id: number;
  /** Play mode configuration for each phase of execution */
  public phasePlayMode: Record<Phase, PlayMode>;

  /** Active step generator for the current phase */
  private stepper: AsyncGenerator<void> | undefined = undefined;
  /** Base execution speed for the current phase */
  private baseSpeed = 1;
  /** Current execution speed multiplier */
  private speed = 1;
  /** Whether execution is currently active */
  private playing = true;
  /** Whether execution has been aborted */
  private aborted = false;
  /** Delay between execution steps in milliseconds */
  private delay = 0;
  /** Duration to observe the completed maze before auto-progression */
  public observationTime = 10000;
  /** Timer for automatic progression from observation phase */
  private observationTimer: ReturnType<typeof setTimeout> | undefined = undefined;

  /**
   * Creates a new MazeRunner with the specified configuration.
   *
   * Initializes the maze, generator, and solver instances using the provided factory functions.
   * Sets up the phase play mode configuration and optionally displays a startup message.
   * The maze is automatically reset to prepare for generation.
   *
   * @param props - Configuration properties for the runner
   */
  public constructor({
    mazeMaker,
    generatorMaker,
    solverMaker,
    plugin,
    drawing,
    mode,
    name,
  }: MazeRunnerProperties) {
    super();

    this.id = id++;

    this.maze = mazeMaker({ drawing, plugin });
    this.maze.reset();

    this.generator = generatorMaker?.({ maze: this.maze });
    this.solver = solverMaker?.({ maze: this.maze });

    if (name) {
      setTimeout(() => {
        this.maze.sendMessage(name, { level: 'info' });
      }, 100);
    }

    this.phasePlayMode = {
      maze: 'play',
      generate: 'fast',
      braid: 'fast',
      solve: 'fast',
      final: 'refresh',
      observe: 'refresh',
      exit: 'fast',
      ...mode,
    };
  }

  /**
   * Sets the playback mode and handles special mode behaviors.
   *
   * Updates the current play mode and triggers appropriate actions:
   * - 'pause': Stops execution
   * - 'refresh': Switches to exit phase and restarts
   * - Other modes: Updates play mode and dispatches command event
   *
   * @param playMode - The new playback mode to set
   */
  public setMode(playMode: PlayMode): void {
    switch (playMode) {
      case 'pause': {
        this.setPlayMode('pause');
        break;
      }

      //@ts-expect-error fall-though is intended
      case 'refresh': {
        this.switchPhase('exit');
      }

      case 'step':
      case 'play':
      case 'fast':
      case 'instant': {
        this.setPlayMode(playMode);
        this.dispatchEvent(new CustomEvent('command'));
        break;
      }

      // no default
    }
  }

  /**
   * Internal method to configure playback behavior based on the mode.
   *
   * Sets execution parameters including playing state, speed, and delay values.
   * Clears any active observation timer and dispatches a mode change event.
   *
   * @param playMode - The playback mode to configure
   */
  private setPlayMode(playMode: PlayMode): void {
    if (this.observationTimer) {
      clearTimeout(this.observationTimer);
      this.observationTimer = undefined;
    }

    this.dispatchEvent(new CustomEvent('mode', { detail: playMode }));
    this.mode = playMode;

    switch (playMode) {
      case 'pause': {
        this.playing = false;
        break;
      }

      case 'step': {
        this.playing = false;
        break;
      }

      case 'play': {
        this.playing = true;
        this.speed = 1;
        this.delay = 50;
        break;
      }

      case 'fast': {
        this.playing = true;
        this.speed = this.baseSpeed;
        this.delay = 0;
        break;
      }

      case 'instant': {
        this.playing = true;
        this.speed = Infinity;
        this.delay = 0;
        break;
      }

      case 'refresh': {
        this.playing = false;
        break;
      }

      // no default
    }
  }

  /**
   * Transitions to a new execution phase and configures the appropriate stepper.
   *
   * Sets up the step generator and base speed for the new phase, then dispatches
   * a phase change event and applies the configured play mode for that phase.
   *
   * @param phase - The new phase to transition to
   */
  private switchPhase(phase: Phase): void {
    if (!this.aborted) {
      if (this.maze && this.generator && this.solver) {
        // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
        switch (phase) {
          case 'generate': {
            this.stepper = this.generator.run();
            this.baseSpeed = this.generator.speed;
            break;
          }

          case 'braid': {
            this.stepper = this.generator.braid();
            this.baseSpeed = 1;
            break;
          }

          case 'solve': {
            this.stepper = this.solver.solve();
            this.baseSpeed = this.solver.speed;
            break;
          }

          // no default
        }

        this.phase = phase;
        this.dispatchEvent(new CustomEvent('phase', { detail: phase }));
        this.setPlayMode(this.phasePlayMode[phase]);
      }
    }
  }

  /**
   * Executes the current phase stepper with animation support.
   *
   * Runs the active stepper generator with speed control and animation timing.
   * Continues execution until the stepper completes or playback is paused.
   * Includes delay handling for smooth animation at slower speeds.
   *
   * @returns Promise that resolves to true when the stepper completes, false if paused
   */
  private async run(): Promise<boolean> {
    if (!this.aborted) {
      if (this.stepper) {
        while (true) {
          const done = await animate(async () => {
            for (let i = 0; i < this.speed; ++i) {
              if ((await this.stepper!.next()).done) {
                return true;
              }
              if (!this.playing) {
                return false;
              }
            }
            return false;
          });

          if (done || !this.playing) {
            return done;
          }

          if (this.delay > 0) {
            await new Promise((resolve) => void setTimeout(resolve, this.delay));
          }
        }
      }
    }

    return true;
  }

  /**
   * Waits for a command event to be dispatched.
   *
   * Creates a promise that resolves when a 'command' event is received,
   * typically used to pause execution until user input is provided.
   *
   * @returns Promise that resolves when a command event occurs
   */
  private async waitForCommand(): Promise<void> {
    return new Promise((resolve) => {
      const handler = (): void => {
        this.removeEventListener('command', handler);
        resolve();
      };
      this.addEventListener('command', handler);
    });
  }

  /**
   * Executes the complete maze lifecycle from generation through solving.
   *
   * Orchestrates the full sequence of maze phases:
   * 1. 'maze': Initial maze drawing
   * 2. 'generate': Run maze generation algorithm
   * 3. 'braid': Apply braiding to remove dead ends
   * 4. 'solve': Execute pathfinding algorithm
   * 5. 'final': Draw solution and prepare for observation
   * 6. 'observe': Display completed maze with optional auto-progression
   * 7. 'exit': Complete execution
   *
   * Handles phase transitions, user commands, and error conditions.
   * Execution can be paused and resumed based on play mode and user interaction.
   *
   * @returns Promise that resolves when execution completes or is aborted
   * @throws Error if execution is aborted
   */
  public async execute(): Promise<void> {
    if (!this.aborted) {
      if (this.maze && this.generator && this.solver) {
        while (true) {
          switch (this.phase) {
            case 'maze': {
              this.maze.draw();
              this.switchPhase('generate');
              break;
            }

            case 'generate': {
              const done = await this.run();

              if (done) {
                this.maze.draw();
                this.switchPhase('braid');
              }
              break;
            }

            case 'braid': {
              const done = await this.run();

              if (done) {
                this.maze.addTermini();
                this.maze.detectErrors();
                this.maze.draw();
                this.switchPhase('solve');
              }
              break;
            }

            case 'solve': {
              const done = await this.run();

              if (done) {
                this.maze.draw();
                this.switchPhase('final');
              }
              break;
            }

            case 'final': {
              this.maze.drawSolution();

              this.switchPhase('observe');

              if (this.phasePlayMode.observe !== 'pause') {
                this.observationTimer = setTimeout(() => {
                  this.switchPhase('exit');
                  this.dispatchEvent(new CustomEvent('command', {}));
                }, this.observationTime);
              }

              break;
            }

            case 'observe': {
              break;
            }

            case 'exit': {
              return;
            }

            // no default
          }

          if (this.aborted) {
            throw new Error('Aborted');
          }

          //@ts-expect-error 'phase' can change - false positive
          if (this.phase !== 'exit' && this.phase !== 'final' && !this.playing) {
            this.mode = 'pause';
            this.dispatchEvent(new CustomEvent('mode', { detail: this.mode }));

            await this.waitForCommand();
          }
        }
      }
    }
  }

  /**
   * Triggers a complete redraw of the current maze state.
   *
   * Calls the maze's draw method to refresh the visual representation.
   * Useful for manual refreshes or when the display needs updating.
   */
  public draw(): void {
    if (this.maze) {
      this.maze.draw();
    }
  }

  /**
   * Aborts the current execution and performs cleanup.
   *
   * Stops playback, sets the aborted flag, and disposes of the solver instance.
   * Once aborted, the runner cannot be restarted and should be discarded.
   */
  public abort(): void {
    this.playing = false;
    this.aborted = true;

    this.solver?.dispose();
  }
}
