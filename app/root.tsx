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
} from '@remix-run/react';

import tailwindStylesheetUrl from './styles/tailwind.css';
import { getUser } from './session.server';

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: tailwindStylesheetUrl }];
};

export const meta: MetaFunction = () => ({
  charset: 'utf-8',
  title: 'RSS Journal',
  viewport: 'width=device-width,initial-scale=1',
  description:
    'Keep up with the latest web content using an organized RSS feed.',
  keywords: 'RSS feed, RSS, journal, news',
});

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
    </html>
  );
}
