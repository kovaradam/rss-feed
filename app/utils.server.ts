import cron from "node-cron";
import * as v from "valibot";

export function createTtl(
  ttl: number,
  cleanup: (interval: number) => Promise<void>,
  schedule: string,
) {
  cleanup(ttl);
  cron.schedule(schedule, () => cleanup(ttl));
  return ttl;
}

export function asDate(value: unknown): Date | null {
  try {
    return v.parse(v.date(), new Date(value as never));
  } catch (_) {
    return null;
  }
}

export function asUrl(value: unknown): URL | null {
  try {
    return new URL(value as never);
  } catch (_) {
    return null;
  }
}

export function asNumber(value: unknown): number | null {
  const result = Number(value);
  return isNaN(result) ? null : result;
}
