import {
  ArchiveIcon,
  HomeIcon,
  LogoutIcon,
  MenuAlt2Icon,
  PlusIcon,
} from '@heroicons/react/outline';
import type { ActionFunction, LoaderFunction } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { json } from '@remix-run/node';
import type { NavLinkProps } from '@remix-run/react';
import { Form, Link, NavLink, Outlet, useLoaderData } from '@remix-run/react';
import type { MetaFunction } from '@remix-run/react/routeModules';
import React from 'react';
import invariant from 'tiny-invariant';
import { AppTitleClient, AppTitleEmitter } from '~/components/AppTitle';
import { CreateChannelForm } from '~/components/CreateChannelForm';
import { ErrorMessage } from '~/components/ErrorMessage';
import { NavWrapper } from '~/components/NavWrapper';
import type { Channel, Item } from '~/models/channel.server';
import { refreshChannel } from '~/models/channel.server';
import { createChanel, getChannel } from '~/models/channel.server';
import { getChannels } from '~/models/channel.server';
import { getCollections } from '~/models/collection.server';
import { requireUserId } from '~/session.server';
import { createTitle, useUser } from '~/utils';
import { parseChannelXml } from '../models/parse-xml';

const title = 'Your feed';

export const meta: MetaFunction = () => ({
  title: createTitle(title),
});

type LoaderData = {
  channelListItems: Awaited<ReturnType<typeof getChannels>>;
  collectionListItems: Awaited<ReturnType<typeof getCollections>>;
  activeCollectionId:
    | Awaited<ReturnType<typeof getCollections>>[number]['id']
    | null;
};

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await requireUserId(request);
  const channelListItems = (await getChannels({
    where: { userId },
    select: { id: true, title: true, feedUrl: true, items: true },
    orderBy: { title: 'asc' },
  })) as (Channel & { items: Item[] })[];

  const collectionListItems = await getCollections({
    where: { userId },
    orderBy: { title: 'asc' },
  });

  const activeCollectionId = new URL(request.url).searchParams.get(
    'collection'
  );

  channelListItems.forEach(async (dbChannel) => {
    refreshChannel({ channel: dbChannel, userId })
      .then((updatedChannel) => {
        console.log('updated', updatedChannel.feedUrl);
      })
      .catch((error) => {
        console.error('update failed', error);
      });
  });

  return json<LoaderData>({
    channelListItems,
    collectionListItems,
    activeCollectionId,
  });
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
    invariant(
      typeof channel.link === 'string',
      'Link has been parsed in wrong format'
    );
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
    console.error(error);
    return json<ActionData>({ create: 'Could not save RSS feed' });
  }
  return redirect('/channels/'.concat(newChannel.id));
};

export default function ChannelsPage() {
  const data = useLoaderData<LoaderData>();
  const user = useUser();

  const [isNavExpanded, setIsNavExpanded] = React.useState(false);

  return (
    <div className="flex flex-col overflow-x-hidden ">
      <AppTitleEmitter>{title}</AppTitleEmitter>
      <header className="flex w-full justify-center whitespace-nowrap border-b sm:relative sm:hidden">
        <div className="flex w-full items-center justify-between p-4 xl:w-2/3">
          <button
            onClick={() => setIsNavExpanded((prev) => !prev)}
            className="block rounded py-2  px-4 hover:bg-slate-100 active:bg-slate-200 sm:hidden"
          >
            <MenuAlt2Icon className="w-6" />
          </button>
          <h1 className="text-ellipsis font-bold sm:text-3xl">
            <AppTitleClient defaultTitle={title}></AppTitleClient>
          </h1>
          <Form
            action="/logout"
            method="post"
            className="flex items-center gap-2"
          >
            <p className="hidden sm:block">{user?.email}</p>
            <button
              type="submit"
              className="rounded py-2 px-4 hover:bg-gray-100 active:bg-gray-200"
              title="Log out"
            >
              <LogoutIcon className="w-6" />
            </button>
          </Form>
        </div>
      </header>
      <div className="flex justify-center">
        <main
          className={`relative flex h-full min-h-screen w-screen bg-white xl:w-2/3 ${
            isNavExpanded ? 'translate-x-80' : ''
          } duration-200 ease-in`}
          style={{
            boxShadow:
              '-8rem 0 5rem 0rem rgb(248 250 252 / var(--tw-bg-opacity))',
          }}
        >
          <NavWrapper
            isExpanded={isNavExpanded}
            hide={() => setIsNavExpanded(false)}
          >
            <h1 className="hidden text-ellipsis p-4 font-bold sm:block sm:text-3xl">
              <AppTitleClient defaultTitle={title}></AppTitleClient>
            </h1>
            <CreateChannelForm<ActionData> />
            <hr />
            <StyledNavLink to={`/channels`} end>
              <HomeIcon className="w-4" />
              Feed
            </StyledNavLink>
            <hr />
            <h6 className="pl-4 pt-2 text-slate-300">Collections</h6>
            <ol>
              {data.collectionListItems?.map((collection) => (
                <li key={collection.id}>
                  <StyledNavLink to={`/channels/collections/${collection.id}`}>
                    <ArchiveIcon className="w-4" />
                    {collection.title}
                  </StyledNavLink>
                </li>
              ))}
              <li>
                <Link
                  className={`m-2 flex gap-2 rounded p-2 text-xl text-slate-500 hover:bg-slate-100 hover:text-yellow-900`}
                  to={`/channels/collections/new`}
                >
                  <PlusIcon className="w-4" />
                  New collection
                </Link>
              </li>
            </ol>
            <hr />
            <h6 className="pl-4 pt-2 text-slate-300">Channels</h6>
            {data.channelListItems.length === 0 ? (
              <p className="p-4">No channels yet</p>
            ) : (
              <ol>
                {data.channelListItems.map((channel) => (
                  <li key={channel.id}>
                    <StyledNavLink className="block" to={channel.id}>
                      {channel.title}
                    </StyledNavLink>
                  </li>
                ))}
              </ol>
            )}
          </NavWrapper>
          <div className="flex-1 p-6  sm:pt-0">
            <header className=" hidden w-full justify-end whitespace-nowrap p-4 sm:relative sm:flex ">
              <button
                onClick={() => setIsNavExpanded((prev) => !prev)}
                className="block rounded py-2  px-4 hover:bg-slate-100 active:bg-slate-200 sm:hidden"
              >
                <MenuAlt2Icon className="w-6" />
              </button>

              <Form
                action="/logout"
                method="post"
                className="flex items-center gap-2"
              >
                <p className="hidden sm:block">{user?.email}</p>
                <button
                  type="submit"
                  className="rounded py-2 px-4 hover:bg-gray-100 active:bg-gray-200"
                  title="Log out"
                >
                  <LogoutIcon className="w-6" />
                </button>
              </Form>
            </header>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

function StyledNavLink(props: NavLinkProps) {
  return (
    <NavLink
      {...props}
      className={({ isActive }) =>
        `m-2 flex gap-2 rounded p-2 text-lg hover:bg-slate-100 sm:text-xl ${
          isActive ? 'bg-amber-100 text-yellow-900 sm:bg-slate-100' : ''
        } ${props.className}`
      }
    >
      {props.children}
    </NavLink>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  return (
    <ErrorMessage>An unexpected error occurred: {error.message}</ErrorMessage>
  );
}
