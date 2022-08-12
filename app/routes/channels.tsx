import type { ActionFunction, LoaderFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { json } from '@remix-run/node';
import {
  Form,
  Link,
  NavLink,
  Outlet,
  useActionData,
  useLoaderData,
  useTransition,
} from '@remix-run/react';
import React from 'react';
import invariant from 'tiny-invariant';
import type { Channel, Item } from '~/models/channel.server';
import { updateChannel } from '~/models/channel.server';
import { createChanel, getChannel } from '~/models/channel.server';
import { getChannels } from '~/models/channel.server';

import { requireUserId } from '~/session.server';
import { useUser } from '~/utils';
import { parseChannelXml } from './utils';

type LoaderData = {
  channelListItems: Awaited<ReturnType<typeof getChannels>>;
};

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await requireUserId(request);
  const channelListItems = (await getChannels({
    where: { userId },
    select: { id: true, title: true, feedUrl: true, items: true },
    orderBy: { updatedAt: 'desc' },
  })) as (Channel & { items: Item[] })[];

  channelListItems.forEach(async (dbChannel) => {
    try {
      console.log('update', dbChannel.feedUrl);
      const channelRequest = await fetch(dbChannel.feedUrl);
      const channelXml = await channelRequest.text();
      const [newChannel, newItems] = await parseChannelXml(channelXml);

      updateChannel({
        where: { id: dbChannel.id },
        data: {
          lastBuildDate: newChannel.lastBuildDate,
          items: {
            create: newItems.filter(
              (item) =>
                !dbChannel.items.find((dbItem) => dbItem.link === item.link)
            ),
          },
        },
      });
    } catch (error) {
      console.error('update failed', error);
      return;
    }
  });

  return json<LoaderData>({ channelListItems });
};

const inputNames = ['channel-url'] as const;
const [channelUrlName] = inputNames;
const errors = [...inputNames, 'xml-parse', 'create', 'fetch'];

type ActionData =
  | Partial<Record<typeof errors[number], string | null>>
  | undefined;

export const action: ActionFunction = async ({ request }) => {
  const data = await request.formData();
  const channelHref = data.get(channelUrlName);
  const userId = await requireUserId(request);

  let channelUrl;
  try {
    channelUrl = new URL(String(channelHref));
  } catch (error) {
    return json<ActionData>({ [channelUrlName]: 'Provide a valid url' });
  }

  let channelRequest;
  try {
    channelRequest = await fetch(channelUrl);
  } catch (error) {
    return json<ActionData>({ fetch: 'Could not load RSS feed' });
  }

  const channelXml = await channelRequest.text();

  let channel: Awaited<ReturnType<typeof parseChannelXml>>[0];
  let items: Awaited<ReturnType<typeof parseChannelXml>>[1];

  try {
    [channel, items] = await parseChannelXml(channelXml);
    invariant(channel.link, 'Link is missing in the RSS definition');
    invariant(channel.title, 'Title is missing in the RSS definition');
  } catch (error) {
    return json<ActionData>({ 'xml-parse': 'Could not parse RSS definition' });
  }

  try {
    const dbChannel = await getChannel({
      where: { link: channel.link, userId },
    });

    if (dbChannel) {
      return json<ActionData>({ create: 'RSS feed already exists' });
    }
  } catch (_) {}

  let newChannel;
  try {
    newChannel = await createChanel({
      channel: { ...channel, feedUrl: channelHref } as Channel,
      userId,
      items: items ?? [],
    });
  } catch (error) {
    console.log(error);

    return json<ActionData>({ create: 'Could not save RSS feed' });
  }
  return redirect('/channels/'.concat(newChannel.id));
};

export default function ChannelsPage() {
  const data = useLoaderData() as LoaderData;
  const user = useUser();
  const [showInput, setShowInput] = React.useState(false);

  const errors = useActionData<ActionData>();
  const transition = useTransition();
  const isCreating = Boolean(transition.submission);

  return (
    <div className="flex  flex-col">
      <header className="flex w-full justify-center border-b">
        <div className="flex w-2/3 items-center justify-between p-4">
          <h1 className="text-3xl font-bold">
            <Link to=".">RSS Channels</Link>
          </h1>
          <p>{user.email}</p>
          <Form action="/logout" method="post">
            <button
              type="submit"
              className="rounded bg-slate-600 py-2 px-4 text-white hover:bg-slate-500 active:bg-slate-600"
            >
              Logout
            </button>
          </Form>
        </div>
      </header>
      <div className="flex justify-center">
        <main className="relative flex h-full min-h-screen w-2/3 bg-white">
          <nav className="h-full w-64 ">
            <div
              className="m-2 block "
              onBlurCapture={() => setShowInput(false)}
            >
              {showInput ? (
                <Form method="post" action={window.location.pathname}>
                  <label htmlFor="new-channel-input">RSS feed address</label>
                  <input
                    type="url"
                    name="channel-url"
                    id="new-channel-input"
                    autoFocus
                    required
                    disabled={isCreating}
                    placeholder="https://www.example-web.com/rss.xml"
                    className="peer  w-full rounded border border-gray-500 px-2 py-1 leading-loose "
                    aria-invalid="false"
                  />
                  {errors &&
                    Object.entries(errors).map(([type, error]) => (
                      <div
                        key={type}
                        className="pt-1 text-red-700"
                        id="title-error"
                      >
                        {error}
                      </div>
                    ))}
                </Form>
              ) : (
                <button
                  className="w-full px-2 py-2 text-left text-xl text-blue-500 hover:bg-blue-50 peer-focus:hidden"
                  onClick={() => setShowInput(true)}
                >
                  + New Channel
                </button>
              )}
            </div>
            <hr />
            {data.channelListItems.length === 0 ? (
              <p className="p-4">No channels yet</p>
            ) : (
              <ol>
                {data.channelListItems.map((channel) => (
                  <li key={channel.id}>
                    <NavLink
                      className={({ isActive }) =>
                        `m-2 block rounded p-2 text-xl hover:bg-blue-50 ${
                          isActive ? 'bg-blue-50 text-blue-500' : ''
                        }`
                      }
                      to={channel.id}
                    >
                      {channel.title}
                    </NavLink>
                  </li>
                ))}
              </ol>
            )}
          </nav>
          <div className="flex-1 border-l p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
