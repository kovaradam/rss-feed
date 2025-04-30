import { createCookieSessionStorage, redirect } from "react-router";

import type { User } from "~/models/user.server";
import { getUserById } from "~/models/user.server";
import { mapValue } from "./utils/map-value";
import { SERVER_ENV } from "./env.server";
import { safeRedirect } from "./utils";
import { prisma } from "./db.server";

const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__session",
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax",
    secrets: [SERVER_ENV.sessionSecret],
    secure: SERVER_ENV.is.prod,
  },
});
const SESSION_MAX_AGE_IN_SECONDS = 60 * 60 * 24 * 400; // 400 days
const SESSION_MAX_AGE_IN_MS = SESSION_MAX_AGE_IN_SECONDS * 1000;
const BROWSER_SESSION_ID_KEY = "sessionId";

async function getBrowserSession(request: Request) {
  const cookie = request.headers.get("Cookie");
  return sessionStorage.getSession(cookie);
}

export async function getUserId(request: Request): Promise<User["id"] | null> {
  const browserSession = await getBrowserSession(request);

  const sessionId = browserSession.get(BROWSER_SESSION_ID_KEY);

  if (!sessionId) {
    return null;
  }
  const serverSession = await prisma.session
    .findUnique({
      where: { id: sessionId },
    })
    .catch(() => null);

  if (serverSession) {
    const expiry = serverSession.createdAt.getTime() + SESSION_MAX_AGE_IN_MS;
    if (expiry < Date.now()) {
      prisma.session.delete({ where: { id: sessionId } });
      return null;
    }
  }

  return serverSession?.userId ?? null;
}

export async function getUser(request: Request) {
  const userId = await getUserId(request);
  if (userId === null) return null;

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
  redirectTo,
}: {
  request: Request;
  userId: string;
  redirectTo: string;
}) {
  const serverSession = prisma.session.create({ data: { userId } });
  const browserSession = await getBrowserSession(request);

  browserSession.set(BROWSER_SESSION_ID_KEY, (await serverSession).id);

  throw redirect(safeRedirect(redirectTo, "/"), {
    headers: new Headers([
      [
        "Set-Cookie",
        await sessionStorage.commitSession(browserSession, {
          maxAge: SESSION_MAX_AGE_IN_SECONDS,
        }),
      ],
      ["Set-Cookie", KNOWN_USER_COOKIE],
    ]),
  });
}

export async function logout(request: Request, target = "/") {
  const browserSession = await getBrowserSession(request);
  const sessionId = browserSession.get(BROWSER_SESSION_ID_KEY);

  await prisma.session.delete({ where: { id: sessionId } }).catch((e) => {
    console.error(e);
    return null;
  });

  throw redirect(target, {
    headers: new Headers([
      ["Set-Cookie", await sessionStorage.destroySession(browserSession)],
      ["Set-Cookie", KNOWN_USER_COOKIE],
    ]),
  });
}

export function isKnownUser(request: Request) {
  return request.headers.get("Cookie")?.includes(KNOWN_USER_COOKIE);
}

const KNOWN_USER_COOKIE = "known-user=true";

prisma.session.deleteMany({
  where: {
    createdAt: { lte: new Date(Date.now() - SESSION_MAX_AGE_IN_MS) },
  },
});
