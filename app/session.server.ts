import { createCookieSessionStorage, redirect } from "react-router";
import invariant from "tiny-invariant";

import type { User } from "~/models/user.server";
import { getUserById } from "~/models/user.server";
import { mapValue } from "./utils/map-value";

invariant(process.env.SESSION_SECRET, "SESSION_SECRET must be set");

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__session",
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secrets: [process.env.SESSION_SECRET],
    secure: process.env.NODE_ENV === "production",
  },
});

const USER_SESSION_KEY = "userId";

async function getSession(request: Request) {
  const cookie = request.headers.get("Cookie");
  return sessionStorage.getSession(cookie);
}

export async function getUserId(
  request: Request
): Promise<User["id"] | undefined> {
  const session = await getSession(request);

  const userId = session.get(USER_SESSION_KEY);
  return userId;
}

export async function getUser(request: Request) {
  const userId = await getUserId(request);
  if (userId === undefined) return null;

  const user = await getUserById(userId);
  if (user) return user;

  throw await logout(request);
}

export async function requireUserId(
  request: Request,
  redirectTo: string = mapValue(new URL(request.url))(
    (url) => url.pathname + url.search + url.hash
  )
) {
  const userId = await getUserId(request);
  if (!userId) {
    const searchParams = new URLSearchParams([["redirectTo", redirectTo]]);
    throw redirect(`/welcome/login?${searchParams}`);
  }
  return userId;
}

export async function requireUser(request: Request) {
  const userId = await requireUserId(request);

  const user = await getUserById(userId);

  if (!user) {
    throw await logout(request);
  }

  if (user.requestedEmail) {
    throw redirect(`/welcome/confirm-email`);
  }

  return user;
}

export async function createUserSession({
  request,
  userId,
  remember,
  redirectTo,
}: {
  request: Request;
  userId: string;
  remember: boolean;
  redirectTo: string;
}) {
  const session = await getSession(request);
  session.set(USER_SESSION_KEY, userId);

  throw redirect(redirectTo, {
    headers: new Headers([
      [
        "Set-Cookie",
        await sessionStorage.commitSession(session, {
          maxAge: remember
            ? 60 * 60 * 24 * 400 // 400 days
            : undefined,
        }),
      ],
      ["Set-Cookie", KNOWN_USER_COOKIE],
    ]),
  });
}

export async function logout(request: Request, target = "/") {
  const session = await getSession(request);
  throw redirect(target, {
    headers: new Headers([
      ["Set-Cookie", await sessionStorage.destroySession(session)],
      ["Set-Cookie", KNOWN_USER_COOKIE],
    ]),
  });
}

export function isKnownUser(request: Request) {
  return request.headers.get("Cookie")?.includes(KNOWN_USER_COOKIE);
}

const KNOWN_USER_COOKIE = "known-user=true";
