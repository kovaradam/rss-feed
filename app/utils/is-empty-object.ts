export function isEmptyObject(object: object): boolean {
  return Object.values(object)
    .map((value) => {
      switch (true) {
        case Array.isArray(value) || typeof value === 'string':
          return value.length === 0;
        case typeof value === 'object':
          return value === null || isEmptyObject(value);
        case typeof value === 'boolean':
          return false;
        default:
          return value === undefined;
      }
    })
    .every(Boolean);
}

if (import.meta.vitest) {
  const { it, expect } = import.meta.vitest;
  it('add', () => {
    expect(isEmptyObject({})).toBe(true);
    expect(isEmptyObject({ arr: [] })).toBe(true);
    expect(isEmptyObject({ arr: [1] })).toBe(false);

    expect(isEmptyObject({ str: '' })).toBe(true);
    expect(isEmptyObject({ str: 'str' })).toBe(false);

    expect(isEmptyObject({ obj: {} })).toBe(true);
    expect(isEmptyObject({ obj: { num: 0 } })).toBe(false);

    expect(isEmptyObject({ bool: true })).toBe(false);
    expect(isEmptyObject({ bool: false })).toBe(false);
  });
}
