import type { LoaderFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, Link, NavLink, Outlet, useLoaderData } from '@remix-run/react';
import { getUserChannels } from '~/models/channel.server';

import { requireUserId } from '~/session.server';
import { useUser } from '~/utils';

type LoaderData = {
  channelListItems: Awaited<ReturnType<typeof getUserChannels>>;
};

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await requireUserId(request);
  const channelListItems = await getUserChannels(userId, {
    select: { id: true, title: true },
    orderBy: { updatedAt: 'desc' },
  });
  return json<LoaderData>({ channelListItems });
};

export default function ChannelsPage() {
  const data = useLoaderData() as LoaderData;
  const user = useUser();

  return (
    <div className="flex  flex-col">
      <header className="flex items-center justify-between bg-slate-800 p-4 text-white">
        <h1 className="text-3xl font-bold">
          <Link to=".">Channels</Link>
        </h1>
        <p>{user.email}</p>
        <Form action="/logout" method="post">
          <button
            type="submit"
            className="rounded bg-slate-600 py-2 px-4 text-blue-100 hover:bg-blue-500 active:bg-blue-600"
          >
            Logout
          </button>
        </Form>
      </header>

      <main className="relative flex h-full min-h-screen bg-white">
        <div className="w-80" />
        <div className="absolute  h-full w-80 border-r bg-gray-50">
          <Link to="new" className="block p-4 text-xl text-blue-500">
            + New Channel
          </Link>

          <hr />

          {data.channelListItems.length === 0 ? (
            <p className="p-4">No channels yet</p>
          ) : (
            <ol>
              {data.channelListItems.map((channel) => (
                <li key={channel.id}>
                  <NavLink
                    className={({ isActive }) =>
                      `block border-b p-4 text-xl ${isActive ? 'bg-white' : ''}`
                    }
                    to={channel.id}
                  >
                    📝 {channel.title}
                  </NavLink>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="flex-1 p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
