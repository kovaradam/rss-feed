import { convert } from "html-to-text";

export function htmlToText(html: string) {
  const cached = Cache.get(html);
  if (cached) {
    return cached;
  }
  const result = convert(html);

  Cache.set(html, result);

  return result;
}

const Cache = new Map<string, string>();
