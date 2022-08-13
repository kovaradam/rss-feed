import {
  Form,
  useLoaderData,
  useLocation,
  useTransition,
} from '@remix-run/react';
import type { ActionFunction, LoaderFunction } from '@remix-run/server-runtime';
import { json } from '@remix-run/server-runtime';
import React from 'react';
import invariant from 'tiny-invariant';
import { Button } from '~/components/Button';
import { ChannelItem } from '~/components/ChannelItem';
import { ErrorMessage } from '~/components/ErrorMessage';
import { Select } from '~/components/Select';
import { SpinnerIcon } from '~/components/SpinnerIcon';
import {
  Channel,
  ItemWithChannel,
  updateChannelItem,
} from '~/models/channel.server';
import { getChannels } from '~/models/channel.server';
import { getChannelItems } from '~/models/channel.server';
import { requireUserId } from '~/session.server';

type LoaderData = {
  items: ItemWithChannel[];
  channels: Channel[];
  categories: string[];
  filters: {
    before: string | null;
    after: string | null;
    filterChannels: string[];
    filterCategories: string[];
  };
  loadMoreAction: string;
};

const itemCountName = 'item-count';

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await requireUserId(request);
  const searchParams = new URL(request.url).searchParams;
  const itemCountParam = searchParams.get(itemCountName);
  const itemCount = itemCountParam ? Number(itemCountParam) : 30;

  const [filterChannels, filterCategories] = ['channels', 'categories'].map(
    (name) => searchParams.getAll(name)
  );

  const [before, after] = ['before', 'after'].map((name) =>
    searchParams.get(name)
  );

  const items = await getChannelItems({
    where: {
      channel: {
        userId,
        id: filterChannels.length !== 0 ? { in: filterChannels } : undefined,
        AND:
          filterCategories.length !== 0
            ? filterCategories?.map((category) => ({
                category: { contains: category },
              }))
            : undefined,
      },
      pubDate:
        before || after
          ? {
              gte: after ? new Date(after) : undefined,
              lte: before ? new Date(before) : undefined,
            }
          : undefined,
    },
    include: {
      channel: {
        select: {
          title: true,
          id: true,
          category: true,
        },
      },
    },
    orderBy: { pubDate: 'desc' },
    take: itemCount,
  });

  const channels = await getChannels({ where: { userId } });

  const categories = channels
    .map((channel) => channel.category.split('/'))
    .flat()
    .filter((category, index, array) => index === array.indexOf(category))
    .filter(Boolean);

  const loadMoreUrl = new URL(request.url);
  loadMoreUrl.searchParams.set(itemCountName, String(itemCount + 10));

  return json<LoaderData>({
    items: items as LoaderData['items'],
    channels,
    categories,
    filters: {
      after,
      before,
      filterCategories,
      filterChannels,
    },
    loadMoreAction: loadMoreUrl.pathname.concat(loadMoreUrl.search),
  });
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();

  if (request.method === 'PATCH') {
    const { names, getBooleanValue } = ChannelItem.form;
    const channelId = formData.get(names.channelId);
    const itemLink = formData.get(names.itemLink);
    invariant(typeof channelId === 'string', 'Channel id was not provided');
    invariant(typeof itemLink === 'string', 'Item link was not provided');

    const bookmarked = formData.get(names.bookmarked);
    const read = formData.get(names.read);

    return await updateChannelItem({
      where: {
        link_channelId: {
          channelId,
          link: itemLink,
        },
      },
      data: {
        read: getBooleanValue(read),
        bookmarked: getBooleanValue(bookmarked),
      },
    });
  }
};

export default function ChannelIndexPage() {
  const { items, channels, categories, filters, loadMoreAction } =
    useLoaderData<LoaderData>();
  const transition = useTransition();
  const isSubmitting = transition.state === 'submitting';
  const isIdle = transition.state === 'idle';

  const { pathname } = useLocation();

  const hasFilters = Boolean(
    filters.after ||
      filters.before ||
      filters.filterCategories.length ||
      filters.filterChannels.length
  );

  return (
    <div className="flex">
      <section className="min-w-2/3 relative flex-1">
        {!isIdle && (
          <div className="absolute flex h-full min-h-screen w-full  justify-center rounded-lg bg-black pt-[50%] opacity-10">
            <SpinnerIcon className="h-16 w-16" />
          </div>
        )}
        {items.length === 0 && isIdle && (
          <p className="text-center">No articles found</p>
        )}
        <ul className="grid min-w-[30ch] grid-cols-1 gap-4 2xl:grid-cols-2">
          {items.map((item) => (
            <li key={item.link}>
              <ChannelItem item={item} formMethod="patch" />
            </li>
          ))}
        </ul>
        {items.length !== 0 && (
          <Form
            className="mt-6 flex w-full justify-center"
            action={loadMoreAction}
          >
            <input
              type="hidden"
              name={itemCountName}
              value={items.length + 10}
            />
            <Button type="submit" isLoading={isSubmitting}>
              {isSubmitting ? 'Loading...' : 'Show more'}
            </Button>
          </Form>
        )}
      </section>
      <aside className="hidden pl-8 sm:block">
        <Form method="get" className="flex w-56 flex-col gap-6">
          <fieldset className="flex flex-col gap-4">
            <label>
              Filter channels
              <Select
                name="channels"
                options={channels.map((channel) => ({
                  value: channel.id,
                  label: channel.title,
                }))}
                renderValue={(values) =>
                  `${values.length || 'No'} channels selected`
                }
                defaultValue={filters.filterChannels}
                className={'w-56'}
                title={
                  channels.length ? 'Select channels' : 'No channels found'
                }
              />
            </label>
            <label>
              Filter categories
              <Select
                name="categories"
                options={categories.map((category) => ({
                  value: category,
                  label: category,
                }))}
                defaultValue={filters.filterCategories}
                className={'w-56'}
                title={
                  categories.length
                    ? 'Select categories'
                    : 'No categories found'
                }
              />
            </label>
          </fieldset>
          <fieldset className="flex flex-col gap-4">
            <label>
              Published before
              <input
                name="before"
                type="date"
                className="w-full rounded  bg-slate-100 p-2 px-2 py-1 text-slate-600"
                defaultValue={filters.before ?? undefined}
              />
            </label>
            <label>
              Published after
              <input
                name="after"
                type="date"
                className="w-full rounded  bg-slate-100 p-2 px-2 py-1 text-slate-600"
                defaultValue={filters.after ?? undefined}
              />
            </label>
          </fieldset>

          <fieldset className="flex flex-col gap-1">
            <Button>Filter articles</Button>
            {hasFilters && (
              <Button secondary form="reset-filters">
                Reset filters
              </Button>
            )}
          </fieldset>
        </Form>
        <Form id="reset-filters" action={pathname} />
      </aside>
    </div>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  return (
    <ErrorMessage>An unexpected error occurred: {error.message}</ErrorMessage>
  );
}
