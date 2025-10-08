import { CustomEventTarget, Random, type RandomProperties } from '@technobuddha/library';

export type MessageOptions = {
  color?: string;
  level?: 'error' | 'warning' | 'info';
};

export type MessageCallback = (message: string, options: MessageOptions) => void;

export type MessageControllerProperties = RandomProperties;

type Payload = { message: string } & MessageOptions;

type Events = {
  message: Payload;
};

export abstract class MessageController extends Random {
  private readonly eventTarget = new CustomEventTarget<Events>();
  private readonly handlers = new WeakMap<MessageCallback, (event: CustomEvent<Payload>) => void>();

  public sendMessage(message: string, { color, level }: MessageOptions = {}): void {
    this.eventTarget.dispatchEvent('message', { message, color, level });
  }

  public listenMessages(callback: MessageCallback): void {
    const handler = (event: CustomEvent<Payload>): void => {
      const { message, ...options } = event.detail;
      callback(message, options);
    };

    this.handlers.set(callback, handler);
    this.eventTarget.addEventListener('message', handler);
  }

  public ignoreMessages(callback: MessageCallback): void {
    const handler = this.handlers.get(callback);
    if (handler) {
      this.eventTarget.removeEventListener('message', handler);
      this.handlers.delete(callback);
    }
  }
}
