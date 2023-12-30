import React from 'react';
import { BrowserStorage } from '~/utils/browserStorage';

const cache = new BrowserStorage('meta-cache', globalThis.localStorage);

export function useWebsiteMeta(url: string) {
  const meta = React.useSyncExternalStore(
    cache.subscribe,
    () => cache.get(url),
    () => undefined
  );

  React.useEffect(() => {
    if (meta || meta === undefined) {
      return;
    }

    const controller = new AbortController();
    fetch(url, { signal: controller.signal, mode: 'cors' })
      .then((response) => {
        return response.text();
      })
      .then((html) => {
        const tags = getMeta(html);
        cache.set(url, JSON.stringify(tags));
      })
      .catch();

    return () => controller.abort();
  }, [url, meta]);
  return meta ? (JSON.parse(meta) as MetaTags) : null;
}

type MetaTags = ReturnType<typeof getMeta>;

function getMeta(html: string) {
  function getContent(selector: string) {
    const node = document.querySelector(selector);
    return node?.getAttribute('content');
  }
  const parser = new DOMParser();
  const document = parser.parseFromString(html, 'application/xml');

  return {
    image: getContent('meta[property$="image"], meta[name$="image"]'),
    imageAlt: getContent('meta[property$="image:alt"]'),
  };
}
