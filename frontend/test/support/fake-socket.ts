import { vi } from 'vitest';

type Listener = (...args: unknown[]) => void;

export class FakeSocket {
  private listeners = new Map<string, Listener[]>();

  on = vi.fn((event: string, listener: Listener) => {
    this.listeners.set(event, [...(this.listeners.get(event) ?? []), listener]);
    return this;
  });

  removeAllListeners = vi.fn(() => {
    this.listeners.clear();
    return this;
  });

  connect = vi.fn(() => this);
  disconnect = vi.fn(() => this);

  emit(event: string, ...args: unknown[]): void {
    for (const listener of this.listeners.get(event) ?? []) {
      listener(...args);
    }
  }

  listenerCount(): number {
    return [...this.listeners.values()].reduce((n, l) => n + l.length, 0);
  }
}
