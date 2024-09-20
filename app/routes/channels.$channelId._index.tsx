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

import refreshSound from '/sounds/ui_refresh-feed.wav?url';
import { PageHeading } from '~/components/PageHeading';
import { ChannelItemDetail } from '~/components/ChannelItemDetail/ChannelItemDetail';
import { Tooltip } from '~/components/Tooltip';
import { DescriptionList } from '~/components/DescriptionList';
import { ChannelItemDetailService } from '~/components/ChannelItemDetail/ChannelItemDetail.server';
import useSound from '~/utils/use-sound';

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
  invariant(params.channelId, 'channelId not found');
  const userId = await requireUserId(request);

  if (request.method === 'DELETE') {
    await deleteChannel({ userId, id: params.channelId });

    return redirect('/channels');
  }

  if (request.method === 'PUT') {
    return ChannelItemDetailService.handleAction(request);
  }

  const formData = await request.formData();

  if (request.method === 'POST') {
    const updatedParseErrors = {
      itemPubDateParseError: formData.get('itemPubDateParseError')
        ? false
        : undefined,
    };

    await updateChannel(userId, {
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
    await refreshChannel({
      feedUrl: channel.feedUrl,
      userId,
      signal: request.signal,
    });
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
      <section className="relative z-0 max-w-[90vw] flex-1">
        {channel.imageUrl && <ChannelImage src={channel.imageUrl} />}
        <WithEditLink name={'title'}>
          <PageHeading>{data.channel.title}</PageHeading>
        </WithEditLink>

        <DescriptionList className="pt-2 ">
          <span className="flex items-center gap-1 ">
            <DescriptionList.Detail>
              <Href href={channel.link} className="">
                {channel.link}
              </Href>
            </DescriptionList.Detail>
          </span>

          <span className="flex flex-wrap items-center gap-1 ">
            <DescriptionList.Term className="flex items-center gap-1">
              <ClockIcon className="h-4" /> Last build date:
            </DescriptionList.Term>
            <DescriptionList.Detail className="flex flex-wrap gap-1">
              {data.channel.lastBuildDate ? (
                <TimeFromNow date={new Date(data.channel.lastBuildDate)} />
              ) : (
                'unknown'
              )}
              {data.channel.refreshDate && (
                <span>
                  (refreshed{' '}
                  <TimeFromNow date={new Date(data.channel.refreshDate)} />)
                </span>
              )}
            </DescriptionList.Detail>
          </span>
          <WithEditLink name={'new-category'}>
            <span className="flex flex-wrap items-center gap-1 ">
              <DescriptionList.Term className="flex items-center gap-1">
                <BookmarkIcon className="h-4" /> Categories:
              </DescriptionList.Term>
              <DescriptionList.Detail className="flex flex-wrap gap-1">
                {category ? (
                  <ChannelCategoryLinks category={category} />
                ) : (
                  'None'
                )}
              </DescriptionList.Detail>
            </span>
          </WithEditLink>
          <WithEditLink name={'language'}>
            <span className="flex items-center gap-1 ">
              <DescriptionList.Term className="flex items-center gap-1">
                <TranslateIcon className="h-4" /> Language:
              </DescriptionList.Term>
              <DescriptionList.Detail>
                {channel.language || 'None'}
              </DescriptionList.Detail>
            </span>
          </WithEditLink>
          <div className="py-6">
            <WithEditLink name={'description'}>
              <DescriptionList.Term>Description:</DescriptionList.Term>
            </WithEditLink>
            <DescriptionList.Detail>
              <p className="text-slate-900 [overflow-wrap:anywhere] dark:text-slate-300">
                {data.channel.description || 'Description is missing'}
              </p>
            </DescriptionList.Detail>
          </div>
        </DescriptionList>

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
          <div className=" flex-1 text-center">Edit</div>
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

function ChannelImage(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <div
      className={`absolute right-0 -z-10 w-1/2 rotate-12 overflow-hidden rounded ${props.className}`}
    >
      <div className='after:content-[" "] relative to-transparent opacity-20 after:absolute after:top-0 after:h-full after:w-full after:bg-gradient-to-b after:from-transparent after:to-white after:to-[20rem] dark:after:to-slate-900'>
        <img
          {...props}
          alt=""
          className={`w-full border-none text-transparent`}
        />
      </div>{' '}
    </div>
  );
}
