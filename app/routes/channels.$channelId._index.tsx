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
  isRouteErrorResponse,
  useLoaderData,
  useNavigation,
  useRouteError,
} from '@remix-run/react';
import invariant from 'tiny-invariant';
import { Href } from '~/components/Href';
import { TimeFromNow } from '~/components/TimeFromNow';
import {
  updateChannel,
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
import { Button, buttonStyle } from '~/components/Button';
import { ErrorMessage } from '~/components/ErrorMessage';
import { createTitle } from '~/utils';
import { AsideWrapper } from '~/components/AsideWrapper';
import { UseAppTitle } from '~/components/AppTitle';
import { ShowMoreLink } from '~/components/ShowMoreLink';
import useSound from 'use-sound';

import refreshSound from 'public/sounds/ui_refresh-feed.wav';
import { PageHeading } from '~/components/PageHeading';
import { ChannelItemDetail } from '~/components/ChannelItemDetail';
import { Tooltip } from '~/components/Tooltip';

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    {
      title: createTitle(data?.channel?.title ?? 'Channel detail'),
    },
  ];
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

  const formData = await request.formData();

  if (request.method === 'PUT') {
    return ChannelItemDetail.handleAction({ formData });
  }

  if (request.method === 'POST') {
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
  try {
    await refreshChannel({ feedUrl: channel.feedUrl, userId });
  } catch (error) {
    console.error(error);
  }

  return redirect('/channels/'.concat(params.channelId));
};

export default function ChannelDetailsPage() {
  const data = useLoaderData<LoaderData>();
  const transition = useNavigation();

  const isRefreshing =
    transition.state !== 'idle' && transition.formMethod === 'PATCH';

  const { channel, items } = data;

  const category = channel.category.slice(
    channel.category.startsWith('/') ? 1 : 0,
    channel.category.endsWith('/') ? -1 : undefined
  );

  const isParseErrors = data.channel.itemPubDateParseError;
  const parseErrorSubmission = transition.formData;

  const [playRefresh] = useSound(refreshSound);

  return (
    <div
      className={`relative flex flex-col sm:flex-row ${
        transition.state === 'loading' ? 'opacity-60' : ''
      }`}
    >
      <UseAppTitle>Channel detail</UseAppTitle>
      <section className="max-w-[90vw] flex-1">
        <WithEditLink name={'title'}>
          <PageHeading>{data.channel.title}</PageHeading>
        </WithEditLink>
        <div className="flex flex-col gap-2 pt-2">
          <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
            <Href href={channel.link}>{channel.link}</Href>
          </span>
          <span className="flex flex-wrap items-center gap-1 text-slate-500 dark:text-slate-400">
            <ClockIcon className="h-4" /> Last build date:{' '}
            {data.channel.lastBuildDate ? (
              <>
                <TimeFromNow date={new Date(data.channel.lastBuildDate)} />
                {data.channel.refreshDate && (
                  <span>
                    (refreshed{' '}
                    <TimeFromNow date={new Date(data.channel.refreshDate)} />)
                  </span>
                )}
              </>
            ) : (
              'unknown'
            )}
          </span>
          <WithEditLink name={'new-category'}>
            <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
              <BookmarkIcon className="h-4" />
              {category ? (
                <ChannelCategoryLinks category={category} />
              ) : (
                'Category is missing'
              )}
            </span>
          </WithEditLink>
          <WithEditLink name={'language'}>
            <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
              <TranslateIcon className="h-4" />
              {channel.language || 'Language is missing'}
            </span>
          </WithEditLink>
        </div>
        <div className="py-6">
          <WithEditLink name={'description'}>
            <span className="text-slate-500 dark:text-slate-400">
              Description
            </span>
          </WithEditLink>
          <p className="dark:text-slate-300">
            {data.channel.description || 'Description is missing'}
          </p>
        </div>

        {isParseErrors && (
          <div className="pb-6">
            <span className="text-slate-500">
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
                          aria-label={'Hide this error message'}
                          type="submit"
                          className="relative flex items-center gap-1 text-left text-red-800 hover:underline"
                        >
                          <ExclamationCircleIcon className="w-3" />{' '}
                          {error.message}
                          <Tooltip />
                        </button>
                      </Form>
                    </li>
                  )}
                </ul>
              ))}
          </div>
        )}

        <hr className="mb-8 dark:border-slate-600" />

        <h4 className="pb-2 text-2xl font-medium dark:text-white">Articles</h4>
        {items.map((item) => (
          <React.Fragment key={item.id}>
            <ChannelItemDetail
              hideImage
              item={{
                ...item,
                pubDate: new Date(item.pubDate),
                channel: {
                  ...channel,
                  lastBuildDate: channel.lastBuildDate
                    ? new Date(channel.lastBuildDate)
                    : null,
                  refreshDate: channel.refreshDate
                    ? new Date(channel.refreshDate)
                    : null,
                  createdAt: new Date(channel.createdAt),
                  updatedAt: new Date(channel.updatedAt),
                },
              }}
              formMethod="put"
              wrapperClassName=" sm:shadow-none sm:px-0 sm:rounded-none dark:sm:bg-transparent dark:sm:border-b-slate-600 dark:sm:border-b"
            />
            <hr className="hidden dark:block dark:border-slate-600" />
          </React.Fragment>
        ))}
        {data.cursor && (
          <ShowMoreLink
            cursor={data.cursor}
            isLoading={
              transition.state === 'loading' && transition.formMethod === 'GET'
            }
          />
        )}
      </section>
      <AsideWrapper>
        <Form method="patch" className="flex-1 sm:flex-grow-0">
          <Button
            onClick={() => playRefresh()}
            type="submit"
            className="flex w-[13ch] items-center gap-2"
            isLoading={isRefreshing}
            secondary
          >
            <RefreshIcon
              className={`w-4  ${
                isRefreshing ? 'animate-spin' : 'animate-none'
              }`}
            />
            <div className="flex-1 text-center">Refresh</div>
          </Button>
        </Form>
        <Link to="edit" className={buttonStyle.concat(' sm:w-full')}>
          <PencilIcon className="w-4" />
          <div className="pointer-events-none flex-1 text-center">Edit</div>
        </Link>
        <br />
        <Form
          method="delete"
          onSubmit={(event) => {
            if (!confirm('Are you sure?')) {
              event.preventDefault();
            }
          }}
        >
          <Button
            type="submit"
            title="Delete this channel"
            className="flex h-full w-fit items-center gap-2 sm:w-full"
            isLoading={transition.formMethod === 'DELETE'}
          >
            <TrashIcon className="w-4" />{' '}
            <span className="pointer-events-none hidden flex-1 text-center sm:block">
              Delete
            </span>
          </Button>
        </Form>
      </AsideWrapper>
    </div>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  const caught = useRouteError();

  if (isRouteErrorResponse(caught)) {
    if (caught.status === 404) {
      return (
        <ErrorMessage>
          <h4>Channel not found</h4>
        </ErrorMessage>
      );
    }
  }

  return (
    <ErrorMessage>An unexpected error occurred: {error.message}</ErrorMessage>
  );
}

function WithEditLink(props: {
  name: string;
  children: React.ReactNode;
}): JSX.Element {
  const [isHover, setIsHover] = React.useState(false);
  return (
    <div
      className="flex items-center gap-2 dark:text-white"
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
