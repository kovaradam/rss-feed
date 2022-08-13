import { LogoutIcon, MenuAlt2Icon } from '@heroicons/react/outline';
import type { ActionFunction, LoaderFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, Link, NavLink, Outlet, useLoaderData } from '@remix-run/react';
import type { MetaFunction } from '@remix-run/react/routeModules';
import React from 'react';
import invariant from 'tiny-invariant';
import { CreateChannelForm } from '~/components/CreateChannelForm';
import { NavWrapper } from '~/components/NavWrapper';
import type { Channel, Item } from '~/models/channel.server';
import { refreshChannel } from '~/models/channel.server';
import { createChanel, getChannel } from '~/models/channel.server';
import { getChannels } from '~/models/channel.server';

import { requireUserId } from '~/session.server';
import { createTitle, useUser } from '~/utils';
import { parseChannelXml } from '../models/parse-xml';

const title = 'Your feed';

export const meta: MetaFunction = () => ({
  title: createTitle(title),
});

type LoaderData = {
  channelListItems: Awaited<ReturnType<typeof getChannels>>;
};

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await requireUserId(request);
  const channelListItems = (await getChannels({
    where: { userId },
    select: { id: true, title: true, feedUrl: true, items: true },
    orderBy: { title: 'asc' },
  })) as (Channel & { items: Item[] })[];

  channelListItems.forEach(async (dbChannel) => {
    try {
      console.log('update', dbChannel.feedUrl);
      refreshChannel({ channel: dbChannel, userId });
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
  } catch (_) {
    return json<ActionData>({ create: 'Could not save RSS feed' });
  }

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
  const data = useLoaderData<LoaderData>();
  const user = useUser();

  const [isNavExpanded, setIsNavExpanded] = React.useState(false);

  return (
    <div className="flex  flex-col">
      <header className="flex w-full justify-center border-b">
        <div className="flex w-full items-center justify-between p-4 xl:w-2/3">
          <button
            onClick={() => setIsNavExpanded((prev) => !prev)}
            className="block rounded py-2  px-4 hover:bg-slate-100 active:bg-slate-200 sm:hidden"
          >
            <MenuAlt2Icon className="w-6" />
          </button>
          <h1 className="text-3xl font-bold">
            <Link to=".">{title}</Link>
          </h1>
          <p className="hidden sm:block">{user?.email}</p>
          <Form action="/logout" method="post">
            <button
              type="submit"
              className="rounded  py-2 px-4 hover:bg-slate-100 active:bg-slate-200"
            >
              <LogoutIcon className="w-6" />
            </button>
          </Form>
        </div>
      </header>
      <div className="flex justify-center">
        <main className="relative flex h-full min-h-screen w-full bg-white xl:w-2/3">
          <NavWrapper isExpanded={isNavExpanded}>
            <CreateChannelForm />
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
          </NavWrapper>
          <div className="flex-1 border-l p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
