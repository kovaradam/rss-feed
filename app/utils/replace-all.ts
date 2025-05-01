export function replaceAll(input: string, toReplace: string, toAdd: string) {
  if (toReplace.length > input.length || !toReplace.length) {
    return input;
  }

  let result = "";

  for (let i = 0; i + toReplace.length <= input.length; ) {
    if (input.slice(i, i + toReplace.length) === toReplace) {
      result += toAdd;
      i += toReplace.length;
    } else {
      result += input[i];
      i++;
    }
  }
  return result;
}

if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;

  test("replaceAll", () => {
    expect(replaceAll("aa", "aa", "b")).toBe("b");
    expect(replaceAll("a", "aa", "b")).toBe("a");
    expect(replaceAll("aa", "a", "b")).toBe("bb");
    expect(replaceAll("aa", "a", "bb")).toBe("bbbb");
    expect(replaceAll("aa", "a", "")).toBe("");
    expect(replaceAll("aa", "b", "")).toBe("aa");
    expect(replaceAll("aa", "", "")).toBe("aa");
  });
}
