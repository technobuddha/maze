/**
 * Specialized error class for robot-related failures during maze solving.
 *
 * This error type is thrown by robots when they encounter situations that prevent
 * them from continuing their algorithm execution, such as being unable to decide
 * on a move or encountering unexpected maze conditions.
 *
 * The error includes an optional color property that can be used for visual
 * feedback in user interfaces to associate the error with the specific robot
 * that encountered the problem.
 *
 * @group Robot
 * @category Errors
 */
export class RobotError extends Error {
  /** The name identifier for this error type */
  public override readonly name: string = 'RobotError';
  /** Optional color associated with the robot that encountered this error */
  public readonly color: string | undefined;

  /**
   * Creates a new robot error with message and optional color.
   *
   * @param message - Descriptive error message explaining what went wrong
   * @param color - Optional color identifier for visual error reporting
   */
  public constructor(message: string, color?: string) {
    super(message);
    this.color = color;
  }

  /**
   * Returns a string representation of the error.
   *
   * @returns Formatted error string with name and message
   */
  public override toString(): string {
    return `${this.name}: ${this.message}`;
  }
}
