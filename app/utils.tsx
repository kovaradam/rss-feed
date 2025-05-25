import type { MetaFunction, useNavigation } from "react-router";
import { useMatches } from "react-router";
import React from "react";

import type { User } from "~/models/user.server";

const DEFAULT_REDIRECT = "/";

/**
 * This should be used any time the redirect path is user-provided
 * (Like the query string on our login/signup pages). This avoids
 * open-redirect vulnerabilities.
 * @param {string} to The redirect destination
 * @param {string} defaultRedirect The redirect to use if the to is unsafe.
 */
export function safeRedirect(
  to: FormDataEntryValue | string | null | undefined,
  defaultRedirect: string = DEFAULT_REDIRECT
) {
  if (!to || typeof to !== "string") {
    return defaultRedirect;
  }

  if (!to.startsWith("/") || to.startsWith("//")) {
    return defaultRedirect;
  }

  return to;
}

/**
 * This base hook is used in other hooks to quickly search for specific data
 * across all loader data using useMatches.
 * @param {string} id The route id
 * @returns {JSON|undefined} The router data or undefined if not found
 */
export function useMatchesData(
  id: string
): Record<string, unknown> | undefined {
  const matchingRoutes = useMatches();
  const route = React.useMemo(
    () => matchingRoutes.find((route) => route.id === id),
    [matchingRoutes, id]
  );

  return route?.data as Record<string, unknown>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isUser(user: any): user is User {
  return user && typeof user === "object" && typeof user.email === "string";
}

export function useOptionalUser(): User | undefined {
  const data = useMatchesData("root");

  if (!data || !isUser(data.user)) {
    return undefined;
  }
  return data.user;
}

export let lastTitle = "";

export function createTitle(input: string): string {
  lastTitle = input;

  return (import.meta.env.PROD ? "" : "[dev] ").concat(`Journal | ${input}`);
}

export function createMeta(metaFunction?: MetaFunction): MetaFunction {
  return (metaArgs) => {
    const meta = metaFunction?.(metaArgs);
    const title =
      (metaArgs.data as Record<"title", string>)?.title ??
      (
        meta?.find((entry) => Object.keys(entry).includes("title")) as Record<
          "title",
          string
        >
      )?.title;

    return (meta ?? []).concat([
      {
        title: createTitle(title),
      },
    ]);
  };
}

export function uniqueArrayFilter<T>(
  item: T,
  index: number,
  array: T[]
): boolean {
  return array.indexOf(item) === index;
}

export function browserApiSwitch<T>(input: T, fallback: T) {
  if (typeof document === "undefined") {
    return fallback;
  }
  return input;
}

export function isSubmitting({
  state,
  formMethod,
}: ReturnType<typeof useNavigation>) {
  return (state === "loading" || state === "submitting") && Boolean(formMethod);
}

export function enumerate<T extends readonly string[]>(
  input: [...T]
): { [key in T[number]]: key } {
  return Object.fromEntries(input.map((v) => [v, v])) as ReturnType<
    typeof enumerate<T>
  >;
}

export function asEnum<
  T extends string[],
  U extends ReturnType<typeof enumerate<T>>
>(enumerated: U, input: unknown, fallback: keyof U): keyof U {
  return Object.keys(enumerated).includes(input as never)
    ? (input as keyof U)
    : fallback;
}

/**
 * className toggle
 */
export function c(isApply: boolean | undefined | null, className: string) {
  return isApply ? className : "";
}

export function getPrefersReducedMotion() {
  return globalThis.matchMedia?.("(prefers-reduced-motion)").matches === true;
}

export const LoginTypes = enumerate(["password", "passkey"]);

export function stallHoneypot() {
  return new Promise((t) => setTimeout(t, 500 + Math.random() * 1000));
}

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};
