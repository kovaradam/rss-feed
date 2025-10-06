const version = "v1";

self.addEventListener("activate", (event) => {
  event.waitUntil(Data.init());
});

self.addEventListener("fetch", (event) => {
  if (conn.isHealthCheckUrl(event.request.url)) {
    return;
  }

  if (Data.isAsset(event.request)) {
    event.respondWith(cacheFirst(event));
    return;
  }

  if (Data.canCache(event.request)) {
    event.respondWith(
      (async () => {
        if (conn.isOnline) {
          return networkFirst(event);
        } else {
          const cachedResponse = await Data.get(event.request);
          if (cachedResponse) {
            return cachedResponse;
          } else {
            return fetchWhenOnline(event);
          }
        }
      })(),
    );
    return;
  }

  if (!conn.isOnline) {
    event.respondWith(fetchWhenOnline(event));
  }
});

async function cacheFirst(event) {
  const networkResponse = await Data.get(event.request);

  if (networkResponse) {
    return networkResponse;
  }

  const responseFromNetwork = await fetch(event.request);

  event.waitUntil(Data.add(event.request, responseFromNetwork.clone()));

  return responseFromNetwork;
}

async function networkFirst(event) {
  try {
    const networkResponse = await fetch(event.request);
    event.waitUntil(Data.add(event.request, networkResponse.clone()));
    return networkResponse;
  } catch (e) {
    const cacheResponse = await Data.get(event.request);

    if (cacheResponse) {
      return cacheResponse;
    }
  }
}

async function fetchWhenOnline(event) {
  await conn.waitForConnection();
  return fetch(event.request);
}

class Data {
  static #cacheKey = version;
  static #cache;

  static init = async () => {
    const cachesToDelete = (await caches.keys()).filter(
      (key) => key !== this.#cacheKey,
    );
    await Promise.all(cachesToDelete.map((key) => caches.delete(key)));
    return this.#getCache();
  };

  static #getCache = async () => {
    if (!(await this.#cache)) {
      this.#cache = await caches.open(this.#cacheKey);
    }
    return this.#cache;
  };

  static add = async (request, response) => {
    const cache = await this.#getCache();
    return cache.put(request, response);
  };

  static get = async (request) => {
    const cache = await this.#getCache();
    const cached = await cache.match(request);
    return cached;
  };

  static isAsset(request) {
    const url = new URL(request.url);
    switch (true) {
      case url.pathname.includes(".wav"):
      case ["image", "audio", "font"].includes(request.destination):
        return true;
    }
    return false;
  }

  static canCache(request) {
    if (request.method !== "GET") return false;

    return true;
  }
}

class Connection {
  #pollingPromise = null;
  #isOnLine = true;

  constructor() {
    if ("connection" in navigator) {
      navigator.connection.addEventListener("change", () => {
        this.healthCheck().then((isOnline) => {
          this.#isOnLine = isOnline;
        });
      });
    }
  }

  get isOnline() {
    return this.#isOnLine;
  }

  waitForConnection = async () => {
    this.#pollingPromise ??= (async () => {
      while (!(await this.healthCheck())) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    })();

    await this.#pollingPromise;

    this.#pollingPromise = null;
  };

  async healthCheck(init) {
    return fetch("/healthcheck", init)
      .then((r) => r.ok)
      .catch(() => false);
  }

  isHealthCheckUrl(url) {
    return url.includes("healthcheck");
  }
}

const conn = new Connection();
