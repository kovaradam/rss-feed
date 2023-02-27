import type { Channel, Item } from '@prisma/client';
import type {
  ActionFunction,
  LoaderFunction,
  MetaFunction,
} from '@remix-run/node';
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
import type { ChannelWithItems } from '~/models/channel.server';
import { updateChannel } from '~/models/channel.server';
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
  ExclamationCircleIcon,
} from '@heroicons/react/outline';

import { requireUserId } from '~/session.server';
import React from 'react';
import { ChannelCategoryLinks } from '~/components/ChannelCategories';
import { Button } from '~/components/Button';
import { ErrorMessage } from '~/components/ErrorMessage';
import { createTitle } from '~/utils';
import { AsideWrapper } from '~/components/AsideWrapper';
import { UseAppTitle } from '~/components/AppTitle';
import { ShowMoreLink } from '~/components/ShowMoreLink';
import useSound from 'use-sound';

import refreshSound from 'public/sounds/ui_refresh-feed.wav';

export const meta: MetaFunction = ({ data }) => {
  return {
    title: createTitle(data?.channel?.title ?? 'Channel detail'),
  };
};

type LoaderData = {
  channel: Channel;
  items: Item[];
  cursor: React.ComponentProps<typeof ShowMoreLink>['cursor'] | null;
};

const itemCountName = 'itemCount';

export const loader: LoaderFunction = async ({ request, params }) => {
  const userId = await requireUserId(request);
  const requestUrl = new URL(request.url);
  const itemCount = requestUrl.searchParams.get(itemCountName);

  invariant(params.channelId, 'channelId not found');

  const channel = await getChannel({
    where: { userId, id: params.channelId },
  });
  if (!channel) {
    throw new Response('Not Found', { status: 404 });
  }

  const take = itemCount ? Number(itemCount) : 10;

  const items = await getChannelItems({
    where: { channelId: channel.id },
    orderBy: { pubDate: 'desc' },
    take: take,
  });

  return json<LoaderData>({
    channel: channel,
    items: items ?? [],
    cursor:
      items.length >= take
        ? { name: itemCountName, value: String(take + 10) }
        : null,
  });
};

export const action: ActionFunction = async ({ request, params }) => {
  const userId = await requireUserId(request);
  invariant(params.channelId, 'channelId not found');

  if (request.method === 'DELETE') {
    await deleteChannel({ userId, id: params.channelId });

    return redirect('/channels');
  }

  if (request.method === 'POST') {
    const formData = await request.formData();

    const updatedParseErrors = {
      itemPubDateParseError: formData.get('itemPubDateParseError')
        ? false
        : undefined,
    };

    await updateChannel({
      where: { id: params.channelId },
      data: updatedParseErrors,
    });

    return json(updatedParseErrors);
  }

  const channel = await getChannel({
    where: { userId, id: params.channelId },
    select: { feedUrl: true, items: true },
  });

  invariant(channel, 'Channel could not be loaded');

  await refreshChannel({ channel: channel as ChannelWithItems, userId });
  return redirect('/channels/'.concat(params.channelId));
};

export default function ChannelDetailsPage() {
  const data = useLoaderData<LoaderData>();
  const transition = useTransition();

  const submission = transition.submission;
  const isRefreshing =
    transition.state !== 'idle' && submission?.method === 'PATCH';
  const { channel, items } = data;

  const category = channel.category.slice(
    channel.category.startsWith('/') ? 1 : 0,
    channel.category.endsWith('/') ? -1 : undefined
  );

  const isParseErrors = data.channel.itemPubDateParseError;
  const parseErrorSubmission = transition.submission?.formData;

  const [playRefresh] = useSound(refreshSound);

  return (
    <div className="relative flex flex-col sm:flex-row ">
      <UseAppTitle>Channel detail</UseAppTitle>
      <section className="flex-1">
        <WithEditLink name={'title'}>
          <h3 className="text-4xl font-bold ">{data.channel.title}</h3>
        </WithEditLink>
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
          <WithEditLink name={'new-category'}>
            <span className="flex items-center gap-1 text-gray-400">
              <BookmarkIcon className="h-4" />
              {category ? (
                <ChannelCategoryLinks category={category} />
              ) : (
                'Category is missing'
              )}
            </span>
          </WithEditLink>
          <WithEditLink name={'language'}>
            <span className="flex items-center gap-1 text-gray-400">
              <TranslateIcon className="h-4" />
              {channel.language || 'Language is missing'}
            </span>
          </WithEditLink>
        </div>
        <div className="py-6">
          <WithEditLink name={'description'}>
            <span className="text-gray-400">Description</span>
          </WithEditLink>
          <p className="text-xl">
            {data.channel.description || 'Description is missing'}
          </p>
        </div>

        {isParseErrors && (
          <div className="pb-6">
            <span className="text-gray-400">
              Some errors ocurred when parsing channel definition
            </span>
            {[
              {
                isError: data.channel.itemPubDateParseError,
                name: 'itemPubDateParseError',
                message: 'Some article publish dates may be incorrect',
              },
            ]
              .filter((error) => !parseErrorSubmission?.get(error.name))
              .map((error) => (
                <ul key={error.name}>
                  {data.channel.itemPubDateParseError && (
                    <li>
                      <Form method="post">
                        <input type="hidden" name={error.name} value="false" />
                        <button
                          title={'Hide this error message'}
                          type="submit"
                          className="flex items-center gap-1 text-left text-red-800 hover:underline"
                        >
                          <ExclamationCircleIcon className="w-3" />{' '}
                          {error.message}
                        </button>
                      </Form>
                    </li>
                  )}
                </ul>
              ))}
          </div>
        )}

        <hr className="mb-8 " />

        <h4 className="pb-2 text-2xl font-medium">Articles</h4>
        {items.map((item, index, array) => (
          <React.Fragment key={item.id}>
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
        {data.cursor && <ShowMoreLink cursor={data.cursor} />}
      </section>
      <AsideWrapper>
        <Form method="patch" className="flex-1 sm:flex-grow-0">
          <Button
            onClick={() => playRefresh()}
            type="submit"
            title="Refresh this channel"
            className="flex w-[13ch] items-center gap-2 "
            isLoading={isRefreshing}
            secondary
          >
            <RefreshIcon
              className={`w-4  ${
                isRefreshing ? 'animate-spin' : 'animate-none'
              }`}
            />
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
        <br />
        <Form method="delete">
          <Button
            type="submit"
            title="Delete this channel"
            className="flex h-full w-fit items-center gap-2"
            isLoading={transition.submission?.method === 'DELETE'}
          >
            <TrashIcon className="w-4" />{' '}
            <span className="hidden sm:block">Delete</span>
          </Button>
        </Form>
      </AsideWrapper>
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

function WithEditLink(props: {
  name: string;
  children: React.ReactNode;
}): JSX.Element {
  const [isHover, setIsHover] = React.useState(false);
  return (
    <div
      className="flex items-center gap-2"
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
    >
      {props.children}
      {isHover && (
        <Link to={`edit?focus=${props.name}`}>
          <PencilIcon className="w-4" />
        </Link>
      )}
    </div>
  );
}
