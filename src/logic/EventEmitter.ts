type EventCallback<T extends any> = (callback: T) => any;

/** Event emitter class, with support for typed events */
export class EventEmitter<EventMap extends Record<string, any>> {
  private eventListeners: { [K in keyof EventMap]?: Set<EventCallback<EventMap[K]>> } = {};

  /**
   * Registers an event of name K
   * @param eventType event to register
   * @param eventCallback callback on emit
   */
  public on<K extends keyof EventMap>(eventType: K, eventCallback: EventCallback<EventMap[K]>) {
    const listeners = this.eventListeners[eventType] ?? new Set();
    listeners.add(eventCallback);
    this.eventListeners[eventType] = listeners;
  }

  /**
   * Executes all events with name K, emitting specified payload
   * @param eventType event to emit
   * @param payload payload to emit
   */
  public emit<K extends keyof EventMap>(eventType: K, payload: EventMap[K]) {
    const listeners = this.eventListeners[eventType] ?? new Set();
    listeners.forEach(e => e(payload));
  }
}