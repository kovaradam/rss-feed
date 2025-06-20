import type { LinksFunction, MetaFunction } from "react-router";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  useHref,
  useLocation,
  useNavigation,
  isRouteErrorResponse,
  useRouteError,
  useRevalidator,
} from "react-router";

import stylesheet from "./tailwind.css?url";

import React from "react";
import type { Route } from "./+types/root";
import { ClientOnly } from "./components/ClientOnly";
import { UseSounds } from "./components/UseSounds";
import { getUser } from "./session.server";
import { lastTitle } from "./utils";
import { HistoryStack } from "./utils/history-stack";
import { useScrollRestoration } from "./utils/use-scroll-restoration";
import { SERVER_ENV } from "./env.server";
import { useOnWindowFocus } from "./utils/use-on-window-focus";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
];

export const meta: MetaFunction = () => [{ title: "RSS Journal" }];

export const loader = async ({ request }: Route.LoaderArgs) => {
  const user = await getUser(request, { soundsAllowed: true });

  return {
    user,
    console: !SERVER_ENV.is.prod,
    scan: !SERVER_ENV.is.prod,
  };
};

export default function App(props: Route.ComponentProps) {
  const data = props.loaderData;
  const navigation = useNavigation();

  const href = useHref(useLocation());

  React.useEffect(() => {
    HistoryStack.add({ href, title: lastTitle });
  }, [href]);

  React.useEffect(() => {
    const controller = new AbortController();
    document.body.addEventListener(
      "scroll",
      () => {
        if (document.body.scrollTop > 200) {
          document.body.classList.add("scroll");
        } else {
          document.body.classList.remove("scroll");
        }
      },
      { signal: controller.signal, passive: true }
    );
    return () => controller.abort();
  }, []);

  useScrollRestoration();

  const revalidator = useRevalidator();

  useOnWindowFocus(revalidator.revalidate);

  return (
    <html lang="en" className="h-full w-screen overflow-x-hidden">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <meta
          name="description"
          content="Keep up with the latest web content with an RSS feed."
        />
        <meta name="keywords" content="RSS feed, RSS, journal, news" />
        {props.loaderData.scan && (
          <script
            crossOrigin="anonymous"
            src="//unpkg.com/react-scan/dist/auto.global.js"
          />
        )}
        <Meta />
        <Links />
        <noscript>
          <style>
            {`._script-only {
              display: none;
              }`}
          </style>
        </noscript>
      </head>
      <body className="h-full w-screen overflow-x-hidden sm:caret-rose-600 sm:accent-rose-600">
        {(!navigation.formAction ||
          navigation.formMethod === "GET" ||
          navigation.formData?.get("loader") === String(true)) && (
          <div
            data-loading={["loading", "submitting"].includes(navigation.state)}
            className="_progress"
          >
            <div className="" />
          </div>
        )}
        <div id="confirm-modal"></div>
        {data.console && (
          <div className="absolute top-0 z-50 w-full bg-orange-200 sm:hidden">
            <span id="console" />
          </div>
        )}
        <Outlet />
        <Scripts />
      </body>
      {data.user?.soundsAllowed && (
        <ClientOnly>
          <UseSounds />
        </ClientOnly>
      )}
    </html>
  );
}

export function ErrorBoundary() {
  const caught = useRouteError();
  const isNotFound = isRouteErrorResponse(caught) && caught.status === 404;

  return (
    <main>
      <title>Web journal</title>
      <style>{`
            main {
              height: 100%;
              width: 100%;
              display: flex;
              justify-content: center;
              align-items: center;
            }
            `}</style>
      {isNotFound ? (
        <h1>404 Not found</h1>
      ) : (
        <h1>Ooops! this was unexpected</h1>
      )}
    </main>
  );
}
