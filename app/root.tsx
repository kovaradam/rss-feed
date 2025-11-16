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
import { withAbortController } from "./utils/with-abort-controller";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: true },
  {
    href: "https://fonts.googleapis.com/css2?family=Merriweather:opsz,wght@700&display=swap",
    rel: "stylesheet",
  },
];

export const meta: MetaFunction = () => [{ title: "RSS Journal" }];

export const loader = async ({ request }: Route.LoaderArgs) => {
  const user = await getUser(request, { soundsAllowed: true });

  return {
    user,
    console: !SERVER_ENV.is.prod,
    scan: !SERVER_ENV.is.prod,
    sw: SERVER_ENV.is.prod,
  };
};

export default function App(props: Route.ComponentProps) {
  const data = props.loaderData;
  const navigation = useNavigation();

  const currentHref = useHref(useLocation());

  React.useEffect(() => {
    HistoryStack.add({ href: currentHref, title: lastTitle });
  }, [currentHref]);

  React.useEffect(() => {
    return withAbortController((controller) => {
      document.addEventListener(
        "click",
        (e) => {
          if (
            e.target instanceof HTMLAnchorElement &&
            e.target.getAttribute("href")?.startsWith("/") &&
            e.target.closest("#nav")
          ) {
            document.getElementById("main-content")?.focus();
          }
        },
        {
          signal: controller.signal,
        },
      );
    });
  }, []);

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
      { signal: controller.signal, passive: true },
    );
    return () => controller.abort();
  }, []);

  useScrollRestoration();

  const isLoaderVisible =
    ["loading", "submitting"].includes(navigation.state) &&
    (!navigation.formAction ||
      navigation.formMethod === "GET" ||
      navigation.formData?.get("loader") === String(true));

  return (
    <html lang="en" className="h-full w-screen overflow-x-hidden">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <meta name="referrer" content="no-referrer" />
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
        {data.sw && <script crossOrigin="anonymous" src="/register-sw.js" />}
      </head>
      <body className="h-full w-screen overflow-x-hidden sm:caret-rose-600 sm:accent-rose-600">
        <div data-loading={isLoaderVisible} className="_progress">
          <div data-loader-slider />
        </div>
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

export function ErrorBoundary(props: Route.ErrorBoundaryProps) {
  console.error(props.error);
  const isNotFound =
    isRouteErrorResponse(props.error) && props.error.status === 404;

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
