import React from "react";

export class HistoryStack {
  private static historyStackArray: Array<{
    href: string;
    title: string;
    historyLength: number;
  }> = [];

  private static listeners: Array<() => void> = [];

  static add = (
    newEntry: Omit<
      (typeof HistoryStack.historyStackArray)[number],
      "historyLength"
    >
  ) => {
    const lastEntry = this.peek();
    if (!lastEntry) {
      this.push(newEntry);
      return;
    }

    if (lastEntry.href === newEntry.href) {
      return;
    }

    this.push(newEntry);
  };

  static peek = (index = 0) => {
    return this.historyStackArray[index];
  };

  static pop = () => {
    this.historyStackArray = this.historyStackArray.slice(1);
  };

  static getStack = () => {
    return Object.freeze([...this.historyStackArray]);
  };

  private static push = (
    input: Omit<
      (typeof HistoryStack.historyStackArray)[number],
      "historyLength"
    >
  ) => {
    const newEntry = {
      ...input,
      historyLength: globalThis.history?.state?.idx,
    };

    if (
      newEntry.historyLength !== undefined &&
      this.historyStackArray[0]?.historyLength === newEntry.historyLength
    ) {
      // replace
      this.historyStackArray[0] = newEntry;
    } else {
      this.historyStackArray = [newEntry]
        .concat(this.historyStackArray)
        .slice(0, 10);
    }
  };

  static clear = () => {
    this.historyStackArray = [];
  };

  static useStack = () => {
    React.useSyncExternalStore(
      this.subscribe,
      () => this.peek()?.href,
      () => ""
    );
    return this.getStack();
  };

  private static subscribe = (newListener: (typeof this.listeners)[number]) => {
    this.listeners = [newListener].concat(this.listeners);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== newListener);
    };
  };
}

if (globalThis.document) {
  globalThis.addEventListener("popstate", () => {
    HistoryStack.pop();
  });
}

if (import.meta.vitest) {
  const { it, expect, beforeEach } = import.meta.vitest;

  beforeEach(() => {
    globalThis.history = { state: { idx: 0 } } as never;
    HistoryStack.clear();
  });

  const createEntry = (href: string) => {
    globalThis.history = {
      state: { idx: globalThis.history.state.idx + 1 },
    } as never;
    return {
      title: `title_${href}`,
      href: href,
    };
  };

  it("adds location objects", () => {
    const firstEntry = createEntry("href1");

    HistoryStack.add(firstEntry);

    expect(HistoryStack.getStack().length).toBe(1);
    expect(HistoryStack.peek()?.title).toBe(firstEntry.title);

    const secondEntry = createEntry("href2");

    HistoryStack.add(secondEntry);

    expect(HistoryStack.getStack().length).toBe(2);
    expect(HistoryStack.peek()?.title).toBe(secondEntry.title);
  });

  it("does not add duplicate location object", () => {
    let entry = createEntry("href");
    HistoryStack.add(entry);
    expect(HistoryStack.getStack().length).toBe(1);
    entry = createEntry("href");
    HistoryStack.add(entry);
    expect(HistoryStack.getStack().length).toBe(1);
  });

  it("replaces stack top on istory replace", () => {
    const entry = { href: "href1", title: "title1" };
    HistoryStack.add(entry);
    expect(HistoryStack.getStack().length).toBe(1);
    expect(HistoryStack.peek()?.href).toBe(entry.href);

    const nextEntry = { href: "href2", title: "title2" };
    HistoryStack.add(nextEntry);
    expect(HistoryStack.getStack().length).toBe(1);
    expect(HistoryStack.peek()?.href).toBe(nextEntry.href);
  });
}
