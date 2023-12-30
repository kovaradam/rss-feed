export class BrowserStorage {
  private listeners = [] as (() => void)[];
  constructor(private key: string, private storage = globalThis.localStorage) {
    this.key = key;
  }

  private getKey = (itemKey: string) => {
    return `${this.key}-${itemKey}`;
  };

  set = (key: string, value: string) => {
    this.storage.setItem(this.getKey(key), value);
    this.listeners.forEach((listener) => listener());
  };
  get = (key: string) => {
    return this.storage.getItem(this.getKey(key));
  };

  subscribe = (newListener: (typeof this.listeners)[number]) => {
    this.listeners.push(newListener);
    return () => {
      this.listeners = this.listeners.filter(
        (listener) => listener !== newListener
      );
    };
  };
}
