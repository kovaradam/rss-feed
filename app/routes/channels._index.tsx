import { FilterIcon } from '@heroicons/react/outline';
import type { ShouldRevalidateFunction } from '@remix-run/react';
import { Link, useLoaderData, useNavigation } from '@remix-run/react';
import type { ActionFunction, LoaderFunction } from '@remix-run/server-runtime';
import { json } from '@remix-run/server-runtime';
import React from 'react';
import { UseAppTitle } from '~/components/AppTitle';
import { ChannelItemsOverlay } from '~/components/ArticleOverlay';
import { ChannelItemDetail } from '~/components/ChannelItemDetail';
import { ChannelItemFilterForm } from '~/components/ChannelItemFilterForm';
import { ChannelItemList } from '~/components/ChannelItemList';
import { Details } from '~/components/Details';
import { ErrorMessage } from '~/components/ErrorMessage';
import { PageSearchInput } from '~/components/PageSearchInput';
import { NewItemsAlert } from '~/components/NewItemsAlert';
import { ShowMoreLink } from '~/components/ShowMoreLink';
import { useChannelRefreshFetcher } from '~/hooks/useChannelFetcher';
import type { Channel, ItemWithChannel } from '~/models/channel.server';
import { getItemsByFilters, getChannels } from '~/models/channel.server';
import { requireUserId } from '~/session.server';

type LoaderData = {
  items: ItemWithChannel[];
  channels: Channel[];
  categories: string[];
  filters: Parameters<typeof getItemsByFilters>[0]['filters'];
  cursor: React.ComponentProps<typeof ShowMoreLink>['cursor'] | null;
};

const itemCountName = 'item-count';

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await requireUserId(request);
  const searchParams = new URL(request.url).searchParams;
  const itemCountParam = searchParams.get(itemCountName);
  const itemCountRequest = itemCountParam ? Number(itemCountParam) : 30;

  const [filterChannels, filterCategories] = ['channels', 'categories'].map(
    (name) => searchParams.getAll(name)
  );
  const [before, after, q, excludeReadParam] = [
    'before',
    'after',
    'q',
    'exclude-read',
  ].map((name) => searchParams.get(name));

  const filters = {
    after,
    before,
    categories: filterCategories,
    channels: filterChannels,
    excludeRead: excludeReadParam ? excludeReadParam === String(true) : null,
    q: q,
  };

  const items = await getItemsByFilters(
    {
      userId,
      filters,
    },
    {
      orderBy: { pubDate: 'desc' },
      take: itemCountRequest,
      include: {
        channel: {
          select: {
            title: true,
            id: true,
            category: true,
          },
        },
      },
    }
  );

  const channels = await getChannels({ where: { userId } });

  const categories = channels
    .flatMap((channel) => channel.category.split('/'))
    .filter((category, index, array) => index === array.indexOf(category))
    .filter(Boolean);

  return json<LoaderData>({
    items: (items as LoaderData['items']) ?? [],
    channels,
    categories,
    filters,
    cursor:
      items.length >= itemCountRequest
        ? { name: itemCountName, value: String(itemCountRequest + 10) }
        : null,
  });
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();

  if (request.method === 'POST') {
    return ChannelItemDetail.handleAction({ formData });
  }
};

export default function ChannelIndexPage() {
  const { items, channels, categories, filters, cursor } =
    useLoaderData<LoaderData>();

  const transition = useNavigation();
  const isLoading = transition.state === 'loading';

  const isFilters = Object.values(filters).some(Boolean);

  const FilterForm = React.useCallback(
    () => (
      <ChannelItemFilterForm
        formId={'filter-form'}
        filters={filters}
        channels={channels.map((channel) => ({
          ...channel,
          updatedAt: new Date(channel.updatedAt),
          createdAt: new Date(channel.createdAt),
          lastBuildDate: channel.lastBuildDate
            ? new Date(channel.lastBuildDate)
            : null,
          refreshDate: channel.refreshDate
            ? new Date(channel.refreshDate)
            : null,
        }))}
        categories={categories}
        canExcludeRead
      />
    ),
    [filters, channels, categories]
  );

  return (
    <>
      <UseAppTitle>Your feed</UseAppTitle>
      <div className="flex">
        <section className="min-w-2/3 relative flex-1">
          {transition.state === 'loading' &&
            transition.formMethod === 'GET' && <ChannelItemsOverlay />}
          <Details
            className="mb-4 w-full sm:hidden"
            title="Filter articles"
            icon={<FilterIcon className="min-w-4 pointer-events-none w-4" />}
          >
            <FilterForm />
          </Details>
          <PageSearchInput
            defaultValue={filters.q ?? undefined}
            formId={'filter-form'}
            placeholder="Search in articles"
          />
          <NewItemsAlert />

          {items.length === 0 && (
            <div className="flex flex-col gap-2 text-center text-lg font-bold">
              {channels.length !== 0 ? (
                <>
                  <p className="mt-6 dark:text-white">
                    No articles found {isFilters && 'matching your criteria'}
                  </p>
                  <img
                    src="/laying.svg"
                    alt="Doodle of a person laying looking at phone"
                    className="scale-50 dark:invert-[.8]"
                    data-from="https://www.opendoodles.com/"
                  ></img>
                </>
              ) : (
                <div className="mt-8 flex flex-col items-center gap-16">
                  <div>
                    <p className="dark:text-white">
                      You are not subscribed to any RSS feeds.
                    </p>
                    <p className="mb-4 font-normal text-slate-500 dark:text-slate-300">
                      <Link
                        to={'/channels/new'}
                        className="font-bold text-yellow-900 underline dark:text-white"
                      >
                        Add a new channel
                      </Link>{' '}
                      to get started!
                    </p>
                  </div>
                  <img
                    alt="Illustration doodle of a person sitting and reading"
                    src="/sitting-reading.svg"
                    width={'50%'}
                    data-from="https://www.opendoodles.com/"
                    className="dark:invert-[.7]"
                  />
                </div>
              )}
            </div>
          )}
          <ChannelItemList>
            {items.map((item) => (
              <li key={item.id}>
                <ChannelItemDetail
                  item={{
                    ...item,
                    pubDate: new Date(item.pubDate),
                    channel: {
                      ...item.channel,
                      updatedAt: new Date(item.channel.updatedAt),
                      createdAt: new Date(item.channel.createdAt),
                      lastBuildDate: item.channel.lastBuildDate
                        ? new Date(item.channel.lastBuildDate)
                        : null,
                      refreshDate: item.channel.refreshDate
                        ? new Date(item.channel.refreshDate)
                        : null,
                    },
                  }}
                  formMethod="post"
                  query={filters.q ?? undefined}
                />
              </li>
            ))}
          </ChannelItemList>
          {cursor && <ShowMoreLink cursor={cursor} isLoading={isLoading} />}
        </section>
        {channels.length !== 0 && (
          <aside className="hidden pl-4 sm:block ">
            <Details
              title="Filter articles"
              className="w-60"
              icon={<FilterIcon className="min-w-4 pointer-events-none w-4" />}
            >
              <FilterForm />
            </Details>
          </aside>
        )}
      </div>
    </>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  return <ErrorMessage>An unexpected error occurred</ErrorMessage>;
}

export const shouldRevalidate: ShouldRevalidateFunction = ({ formMethod }) => {
  if (formMethod === useChannelRefreshFetcher.method) {
    return false;
  }
  return true;
};
