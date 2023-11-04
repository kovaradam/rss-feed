import type {
  LinksFunction,
  LoaderFunction,
  MetaFunction,
} from '@remix-run/node';
import { json } from '@remix-run/node';
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from '@remix-run/react';

import stylesheet from './tailwind.css';
import { cssBundleHref } from '@remix-run/css-bundle';

import { getUser } from './session.server';
import React from 'react';
import { UseSounds } from './components/UseSounds';
import { ClientOnly } from './components/ClientOnly';

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: stylesheet },
  ...(cssBundleHref ? [{ rel: 'stylesheet', href: cssBundleHref }] : []),
];

export const meta: MetaFunction = () => [
  { charset: 'utf-8' },
  { title: 'RSS Journal' },
  { viewport: 'width=device-width,initial-scale=1' },
  {
    description:
      'Keep up with the latest web content using an organized RSS feed.',
  },
  { keywords: 'RSS feed, RSS, journal, news' },
];

type LoaderData = {
  user: Awaited<ReturnType<typeof getUser>>;
};

export const loader: LoaderFunction = async ({ request }) => {
  const user = await getUser(request);

  return json<LoaderData>({
    user,
  });
};

export default function App() {
  const data = useLoaderData<LoaderData>();

  return (
    <html lang="en" className="h-full w-screen overflow-x-hidden">
      <head>
        <Meta />
        <Links />
      </head>
      <body className="h-full w-screen overflow-x-hidden ">
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
      {data.user?.soundsAllowed && (
        <ClientOnly>
          <UseSounds />
        </ClientOnly>
      )}
    </html>
  );
}
