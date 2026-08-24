import { CustomEventTarget, Random, type RandomProperties } from '@technobuddha/library';

/**
 * Configuration options for message display and styling.
 *
 * @group  Message Controller
 * @category  Message Controller
 */
export type MessageOptions = {
  /** Optional color for message styling */
  color?: string;
  /** Message severity level affecting display treatment */
  level?: 'error' | 'warning' | 'info';
};

/**
 * Callback function type for handling message events.
 *
 * @param message - The message text to display
 * @param options - Display and styling options for the message
 *
 * @group  Message Controller
 * @category  Message Controller
 */
export type MessageCallback = (args: { message: string } & MessageOptions) => void;

/**
 * Configuration properties for MessageController instances.
 *
 * @group  Message Controller
 * @category  Message Controller
 */
export type MessageControllerProperties = RandomProperties;

/**
 * Internal payload type for message events.
 *
 * @group  Message Controller
 * @category  Message Controller
 * @internal
 */
type Payload = { message: string } & MessageOptions;

/**
 * Event type definitions for the message controller.
 *
 * @group  Message Controller
 * @category  Message Controller
 * @internal
 */
type Events = {
  message: Payload;
};

/**
 * Abstract base class for managing message communication and display.
 *
 * Provides a centralized message handling system that allows components to:
 * - Send messages with styling and severity levels
 * - Register listeners for message events
 * - Manage callback registration and cleanup
 *
 * The controller uses a custom event system to decouple message senders from
 * message display handlers, enabling flexible message routing and handling
 * throughout the application.
 *
 * Key features:
 * - Event-driven message communication
 * - Support for message styling and severity levels
 * - Automatic callback management with cleanup
 * - Extensible architecture for different message display implementations
 *
 * @group  Message Controller
 * @category  Message Controller
 */
export abstract class MessageController extends Random {
  /** Internal event target for message communication */
  private readonly eventTarget = new CustomEventTarget<Events>();

  /**
   * Sends a message to all registered listeners.
   *
   * Dispatches a message event with optional styling and severity information
   * to all currently registered message handlers.
   *
   * @param message - The message text to send
   * @param options - Optional styling and severity configuration
   */
  public sendMessage(message: string, { color, level }: MessageOptions = {}): void {
    void this.eventTarget.dispatchEvent('message', { message, color, level });
  }

  /**
   * Registers a callback to receive message events.
   *
   * Adds a message listener that will be called whenever a message is sent.
   * The callback receives the message text and styling options separately
   * for easier handling.
   *
   * @param callback - Function to call when messages are received
   */
  public listenMessages(callback: MessageCallback): void {
    this.eventTarget.addEventListener('message', callback);
  }

  /**
   * Unregisters a previously registered message callback.
   *
   * Removes the callback from the message listener list and cleans up
   * internal tracking. The callback will no longer receive message events.
   *
   * @param callback - The callback function to remove
   */
  public ignoreMessages(callback: MessageCallback): void {
    this.eventTarget.removeEventListener('message', callback);
  }
}
