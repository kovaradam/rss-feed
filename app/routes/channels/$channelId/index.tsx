import type { Channel, Item } from '@prisma/client';
import type { ActionFunction, LoaderFunction } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import {
  Form,
  Link,
  useCatch,
  useLoaderData,
  useTransition,
} from '@remix-run/react';
import invariant from 'tiny-invariant';
import { Href } from '~/components/Href';
import { TimeFromNow } from '~/components/TimeFromNow';
import type { channelWithItems } from '~/models/channel.server';
import {
  deleteChannel,
  getChannel,
  getChannelItems,
  refreshChannel,
} from '~/models/channel.server';
import {
  ClockIcon,
  BookmarkIcon,
  TranslateIcon,
  TrashIcon,
  PencilIcon,
  RefreshIcon,
} from '@heroicons/react/outline';

import { requireUserId } from '~/session.server';
import React from 'react';
import { ChannelCategoryLinks } from '~/components/ChannelCategories';
import { Button } from '~/components/Button';
import { ErrorMessage } from '~/components/ErrorMessage';
import type { MetaFunction } from '@remix-run/react/routeModules';

export const meta: MetaFunction = ({ data }) => {
  return {
    title: data?.channel?.title ?? 'Channel detail',
  };
};

type LoaderData = {
  channel: Channel;
  items: Item[];
};

const itemCountName = 'itemCount';

export const loader: LoaderFunction = async ({ request, params }) => {
  const userId = await requireUserId(request);
  const itemCount = new URL(request.url).searchParams.get(itemCountName);

  invariant(params.channelId, 'channelId not found');

  const channel = await getChannel({
    where: { userId, id: params.channelId },
  });
  if (!channel) {
    throw new Response('Not Found', { status: 404 });
  }

  const items = await getChannelItems({
    where: { channelId: channel.id },
    orderBy: { pubDate: 'desc' },
    take: itemCount ? Number(itemCount) : 10,
  });

  return json<LoaderData>({ channel: channel, items: items ?? [] });
};

export const action: ActionFunction = async ({ request, params }) => {
  const userId = await requireUserId(request);
  invariant(params.channelId, 'channelId not found');

  if (request.method === 'DELETE') {
    await deleteChannel({ userId, id: params.channelId });

    return redirect('/channels');
  }

  const channel = await getChannel({
    where: { userId, id: params.channelId },
    select: { feedUrl: true, items: true },
  });

  invariant(channel, 'Channel could not be loaded');

  await refreshChannel({ channel: channel as channelWithItems, userId });
  return redirect('/channels/'.concat(params.channelId));
};

export default function ChannelDetailsPage() {
  const data = useLoaderData() as LoaderData;
  const transition = useTransition();
  const submission = transition.submission;
  const isRefreshing =
    transition.state !== 'idle' && submission?.method === 'PATCH';
  const { channel, items } = data;

  const isLoadingMore =
    transition.state === 'submitting' && submission?.method === 'GET';

  return (
    <div className="relative flex">
      <section className="flex-1">
        <h3 className="text-4xl font-bold">{data.channel.title}</h3>
        <div className="flex flex-col gap-2 pt-2">
          <span className="flex items-center gap-1 text-gray-400">
            <Href href={channel.link}>{channel.link}</Href>
          </span>
          <span className="flex items-center gap-1 text-gray-400">
            <ClockIcon className="h-4" /> Last build date:{' '}
            {data.channel.lastBuildDate ? (
              <TimeFromNow date={new Date(data.channel.lastBuildDate)} />
            ) : (
              'unknown'
            )}
          </span>
          <span className="flex items-center gap-1 text-gray-400">
            <BookmarkIcon className="h-4" />
            {channel.category ? (
              <ChannelCategoryLinks category={channel.category} />
            ) : (
              'Category is missing'
            )}
          </span>
          <span className="flex items-center gap-1 text-gray-400">
            <TranslateIcon className="h-4" />
            {channel.language}
          </span>
        </div>
        <div className="py-6">
          <span className="text-gray-400">Description</span>
          <p className="text-xl">{data.channel.description}</p>
        </div>
        <hr className="mb-8 " />
        <h4 className="pb-2 text-2xl font-medium">Articles</h4>
        {items.map((item, index, array) => (
          <React.Fragment key={item.link}>
            <article className="flex flex-col pb-2">
              <Href href={item.link}>{item.title}</Href>
              <span className="border-b-gray-400 text-gray-400">
                {' '}
                {item.pubDate ? (
                  <TimeFromNow date={new Date(item.pubDate)} />
                ) : (
                  'unknown'
                )}
              </span>
            </article>
            {index !== array.length - 1 && (
              <hr className="mb-4 border-dashed" />
            )}
          </React.Fragment>
        ))}
        <Form className="mt-6 flex w-full justify-center" method="get">
          <input type="hidden" name={itemCountName} value={items.length + 10} />
          <Button type="submit" isLoading={isLoadingMore}>
            {isLoadingMore ? 'Loading...' : 'Show more'}
          </Button>
        </Form>
      </section>
      <aside className="flex flex-col gap-2 pl-4">
        <Form method="patch">
          <Button
            type="submit"
            title="Refresh this channel"
            className="flex w-fit items-center gap-2"
            isLoading={isRefreshing}
          >
            <RefreshIcon
              className={`w-4 animate-${isRefreshing ? 'spin' : 'none'}`}
            />{' '}
            Refresh
          </Button>
        </Form>
        <Link
          title="Edit this channel"
          to="edit"
          className="flex w-fit items-center gap-2 rounded bg-slate-100 py-2 px-4 text-slate-600 hover:bg-slate-200"
        >
          <PencilIcon className="w-4" /> Edit
        </Link>
        <Form method="delete">
          <Button
            type="submit"
            title="Delete this channel"
            secondary
            className="flex w-fit items-center gap-2"
          >
            <TrashIcon className="w-4" /> Delete
          </Button>
        </Form>
      </aside>
    </div>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  return (
    <ErrorMessage>An unexpected error occurred: {error.message}</ErrorMessage>
  );
}

export function CatchBoundary() {
  const caught = useCatch();

  if (caught.status === 404) {
    return (
      <ErrorMessage>
        <h4>Channel not found</h4>
      </ErrorMessage>
    );
  }

  throw new Error(`Unexpected caught response with status: ${caught.status}`);
}
