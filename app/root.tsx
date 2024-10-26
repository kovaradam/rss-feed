import type {
  LinksFunction,
  LoaderFunctionArgs,
  MetaFunction,
} from '@remix-run/node';
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from '@remix-run/react';

import stylesheet from './tailwind.css?url';

import { getUser } from './session.server';
import React from 'react';
import { UseSounds } from './components/UseSounds';
import { ClientOnly } from './components/ClientOnly';

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: stylesheet },
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

export const loader = async ({
  request,
}: LoaderFunctionArgs): Promise<LoaderData> => {
  const user = await getUser(request);

  return {
    user,
  };
};

export default function App() {
  const data = useLoaderData<typeof loader>();

  return (
    <html lang="en" className="h-full w-screen overflow-x-hidden">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <meta
          name="description"
          content="Keep up with the latest web content using an organized RSS feed."
        />
        <meta name="keywords" content="RSS feed, RSS, journal, news" />
        <Meta />
        <Links />
      </head>
      <body className="h-full w-screen overflow-x-hidden sm:caret-rose-600 sm:accent-rose-600">
        <Outlet />
        <ScrollRestoration />
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
