export class HistoryStack {
  private static historyStackArray: Array<{
    href: string;
    title: string;
  }> = [];

  static add = (newEntry: (typeof HistoryStack.historyStackArray)[number]) => {
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
    newEntry: (typeof HistoryStack.historyStackArray)[number]
  ) => {
    this.historyStackArray = [newEntry]
      .concat(this.historyStackArray)
      .slice(0, 10);
  };

  static clear = () => {
    this.historyStackArray = [];
  };
}

if (globalThis.document) {
  globalThis.addEventListener('popstate', () => {
    HistoryStack.pop();
  });
}

if (import.meta.vitest) {
  const { it, expect, beforeEach } = import.meta.vitest;

  beforeEach(HistoryStack.clear);

  it('adds location objects', () => {
    const firstEntry = {
      title: 'title1',
      href: 'href1',
    };
    HistoryStack.add(firstEntry);

    expect(HistoryStack.getStack().length).toBe(1);
    expect(HistoryStack.peek()?.title).toBe(firstEntry.title);

    const secondEntry = {
      title: 'title2',
      href: 'href2',
    };

    HistoryStack.add(secondEntry);

    expect(HistoryStack.getStack().length).toBe(2);
    expect(HistoryStack.peek()?.title).toBe(secondEntry.title);
  });

  it('does not add duplicate location object', () => {
    const entry = {
      title: 'title',
      href: 'href',
    };
    HistoryStack.add(entry);
    expect(HistoryStack.getStack().length).toBe(1);
    HistoryStack.add(entry);
    expect(HistoryStack.getStack().length).toBe(1);
  });
}
