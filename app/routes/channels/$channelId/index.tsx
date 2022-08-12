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
import {
  deleteChannel,
  getChannel,
  getChannelItems,
} from '~/models/channel.server';
import {
  ClockIcon,
  BookmarkIcon,
  TranslateIcon,
  TrashIcon,
  PencilIcon,
} from '@heroicons/react/outline';

import { requireUserId } from '~/session.server';
import React from 'react';
import { ChannelCategoryLinks } from '~/components/ChannelCategories';

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

  await deleteChannel({ userId, id: params.channelId });

  return redirect('/channels');
};

export default function ChannelDetailsPage() {
  const data = useLoaderData() as LoaderData;
  const transition = useTransition();
  const { channel, items } = data;

  const isSubmitting = transition.state === 'submitting';

  return (
    <div className="relative">
      <div className="absolute top-0 right-0 flex w-12 flex-row-reverse items-center">
        <Form method="delete">
          <button
            type="submit"
            className="rounded py-2 px-4 text-slate-600 hover:bg-gray-100"
            title="Delete this channel"
          >
            <TrashIcon className="w-6" />
          </button>
        </Form>
        <Link
          title="Edit this channel"
          to="edit"
          className="rounded py-2 px-4 text-blue-500 hover:bg-gray-100"
        >
          <PencilIcon className="w-6" />
        </Link>
      </div>
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
          {index !== array.length - 1 && <hr className="mb-4 border-dashed" />}
        </React.Fragment>
      ))}
      <Form className="mt-6 flex w-full justify-center" method="get">
        <input type="hidden" name={itemCountName} value={items.length + 10} />
        <button
          type="submit"
          className="rounded bg-slate-600 py-2 px-2 text-white disabled:bg-slate-300"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Loading...' : 'Show more'}
        </button>
      </Form>
    </div>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  console.error(error);

  return (
    <div className="flex h-full w-full items-center justify-center bg-red-50 text-red-500">
      An unexpected error occurred: {error.message}
    </div>
  );
}

export function CatchBoundary() {
  const caught = useCatch();

  if (caught.status === 404) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-red-50  text-2xl text-red-500">
        <b className="">Oops!</b>
        <h4 className="">Channel not found</h4>
      </div>
    );
  }

  throw new Error(`Unexpected caught response with status: ${caught.status}`);
}
