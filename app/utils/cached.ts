interface CachedFn<T extends unknown[], U> {
  (...args: T): Promise<U>;
  $cached: (...args: T) => Promise<U>;
}

export function cached<T extends unknown[], U>(params: {
  fn: (...args: T) => Promise<U>;
  getKey: (...args: T) => string;
  /** duration to store cached result in miliseconds */
  ttl: number;
  doNotCache?: (result: U) => boolean;
}): CachedFn<T, U> {
  const id = Cache.createId();

  const cachedFn = async (...args: T) => {
    const cacheKey = params.getKey(...args);
    const cachedResult = Cache.get(id, cacheKey);

    if (cachedResult) {
      return cachedResult.value as U;
    }

    const result = await params.fn(...args);

    if (params.doNotCache?.(result) !== true) {
      Cache.set(id, cacheKey, { value: result, ttl: params.ttl });
    }

    return result;
  };

  (params.fn as CachedFn<T, U>).$cached = cachedFn;

  return params.fn as CachedFn<T, U>;
}

class Cache {
  static counter = 0;
  static fnMap = new Map<
    string,
    Map<string, { createdAt: number; value: unknown; ttl: number }>
  >();
  static get(fnId: string, key: string) {
    const invocationMap = this.fnMap.get(fnId);

    if (!invocationMap) {
      this.fnMap.set(fnId, new Map());
      return null;
    }

    const result = invocationMap.get(key);

    if (!result) {
      return null;
    }

    if (Date.now() - result.createdAt > result.ttl) {
      invocationMap.delete(key);
      return null;
    }

    return result;
  }
  static set(
    fnName: string,
    key: string,
    params: { value: unknown; ttl: number }
  ) {
    let invocationMap = this.fnMap.get(fnName);

    if (!invocationMap) {
      invocationMap = new Map();
      this.fnMap.set(fnName, new Map());
    }

    invocationMap.set(key, {
      value: params.value,
      createdAt: Date.now(),
      ttl: params.ttl,
    });
  }

  static createId() {
    return String(Cache.counter++);
  }
}

if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;

  test("cache happy path", async () => {
    const resultStore = { val_a: 0, val_b: 1 };
    const cachedFn = cached({
      fn: (key: keyof typeof resultStore) => {
        return Promise.resolve(resultStore[key]);
      },
      getKey: (key) => key,
      ttl: Number.MAX_SAFE_INTEGER,
    });

    expect(await cachedFn.$cached("val_a")).toBe(0);
    resultStore["val_a"] = 1;
    // Cache should return the initial val_a value
    expect(await cachedFn.$cached("val_a")).toBe(0);

    resultStore["val_b"] = 5;
    // Cache should return the new val_b value
    expect(await cachedFn.$cached("val_b")).toBe(5);
  });

  test("do not cache", async () => {
    const resultStore = { val: null as number | null };
    const cachedFn = cached({
      fn: (key: keyof typeof resultStore) => {
        return Promise.resolve(resultStore[key]);
      },
      getKey: (key) => key,
      ttl: Number.MAX_SAFE_INTEGER,
      doNotCache: (val) => val === null,
    });

    expect(await cachedFn.$cached("val")).toBe(null);
    resultStore["val"] = 1;
    // Cache should return the new val value
    expect(await cachedFn.$cached("val")).toBe(1);
  });

  test("does not cache on throw", async () => {
    let getResult = () => {
      throw "error";
    };
    const fakeFetch = () => {
      return getResult();
    };
    const cachedFn = cached({
      fn: () => fakeFetch(),
      getKey: () => "",
      ttl: Number.MAX_SAFE_INTEGER,
      doNotCache: (val) => val === null,
    });

    expect(async () => await cachedFn.$cached()).rejects.toThrow("error");
    getResult = () => 1 as never;
    expect(await cachedFn.$cached()).toBe(1);
  });
}
