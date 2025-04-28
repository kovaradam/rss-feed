import type { LinksFunction, MetaFunction } from "react-router";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  useHref,
  useLoaderData,
  useLocation,
  useNavigation,
} from "react-router";

import stylesheet from "./tailwind.css?url";

import { getUser } from "./session.server";
import { UseSounds } from "./components/UseSounds";
import { ClientOnly } from "./components/ClientOnly";
import type { Route } from "./+types/root";
import React from "react";
import { HistoryStack } from "./utils/history-stack";
import { lastTitle } from "./utils";
import { useScrollRestoration } from "./utils/use-scroll-restoration";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
];

export const meta: MetaFunction = () => [{ title: "RSS Journal" }];

type LoaderData = {
  user: Awaited<ReturnType<typeof getUser>>;
};

export const loader = async ({
  request,
}: Route.LoaderArgs): Promise<LoaderData> => {
  const user = await getUser(request);

  return {
    user,
  };
};

export default function App() {
  const data = useLoaderData<typeof loader>();
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
        <Meta />
        <Links />
        <noscript>
          <style>
            {`.script-only {
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
            className="progress"
          >
            <div className="" />
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
