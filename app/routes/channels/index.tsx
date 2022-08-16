import { BanIcon, PencilIcon } from '@heroicons/react/outline';
import {
  Form,
  Link,
  useLoaderData,
  useLocation,
  useSubmit,
  useTransition,
} from '@remix-run/react';
import type { ActionFunction, LoaderFunction } from '@remix-run/server-runtime';
import { json } from '@remix-run/server-runtime';
import React from 'react';
import { Button } from '~/components/Button';
import { ChannelItemDetail } from '~/components/ChannelItemDetail';
import { ErrorMessage } from '~/components/ErrorMessage';
import { SpinnerIcon } from '~/components/SpinnerIcon';
import type { Channel, ItemWithChannel } from '~/models/channel.server';
import { getItemsByCollection } from '~/models/channel.server';
import { getItemsByFilters } from '~/models/channel.server';
import { getChannels } from '~/models/channel.server';
import { requireUserId } from '~/session.server';

type LoaderData = {
  items: ItemWithChannel[];
  channels: Channel[];
  categories: string[];
  filters: Parameters<typeof getItemsByFilters>[0]['filters'];
  loadMoreAction: string;
  activeCollectionId: string | null;
};

const itemCountName = 'item-count';

export const loader: LoaderFunction = async ({ request }) => {
  const userId = await requireUserId(request);
  const searchParams = new URL(request.url).searchParams;

  const itemCountParam = searchParams.get(itemCountName);
  const itemCount = itemCountParam ? Number(itemCountParam) : 30;
  const activeCollectionId = searchParams.get('collection');

  const [filterChannels, filterCategories] = ['channels', 'categories'].map(
    (name) => searchParams.getAll(name)
  );

  const [before, after] = ['before', 'after'].map((name) =>
    searchParams.get(name)
  );

  const filters = {
    after,
    before,
    categories: filterCategories,
    channels: filterChannels,
  };

  const getItems = activeCollectionId
    ? getItemsByCollection.bind(null, {
        userId,
        collectionId: activeCollectionId,
      })
    : getItemsByFilters.bind(null, {
        userId,
        filters,
      });

  const items = await getItems({
    orderBy: { pubDate: 'desc' },
    take: itemCount,
    include: {
      channel: {
        select: {
          title: true,
          id: true,
          category: true,
        },
      },
    },
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
    filters,
    loadMoreAction: loadMoreUrl.pathname.concat(loadMoreUrl.search),
    activeCollectionId,
  });
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();

  if (request.method === 'POST') {
    return ChannelItemDetail.handleAction({ formData, request });
  }
};

export default function ChannelIndexPage() {
  const { items, channels, categories, filters, loadMoreAction, ...data } =
    useLoaderData<LoaderData>();
  const transition = useTransition();
  const isSubmitting = transition.state === 'submitting';
  const isIdle = transition.state === 'idle';

  const { pathname } = useLocation();

  const hasFilters = hasActiveFilters(filters);

  const submit = useSubmit();

  const submitFilters: React.FormEventHandler<HTMLFormElement> = (event) => {
    const form = event.currentTarget;
    if (!form) {
      return;
    }
    submit(form);
  };

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
        <ul
          className={`grid min-w-[30ch] grid-cols-1 gap-4 2xl:grid-cols-${
            items.length > 1 ? '2' : '1'
          }`}
        >
          {items.map((item) => (
            <li key={item.link}>
              <ChannelItemDetail item={item} formMethod="post" />
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
        {data.activeCollectionId && (
          <Link
            to={`collections/${data.activeCollectionId}/edit`}
            className="mb-6 flex items-center gap-2"
          >
            <PencilIcon className="w-4" /> Edit collection
          </Link>
        )}
        <Form
          method="get"
          className="flex w-56 flex-col gap-6"
          onChangeCapture={submitFilters}
        >
          <fieldset className="flex flex-col gap-4">
            <label>
              Filter channels
              <select
                name="channels"
                defaultValue={filters.channels}
                title={
                  channels.length ? 'Select channels' : 'No channels found'
                }
                multiple
                className={inputClassName}
              >
                {channels.map((channel) => (
                  <option value={channel.id} key={channel.id}>
                    {channel.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Filter categories
              <select
                name="categories"
                defaultValue={filters.categories}
                className={inputClassName}
                title={
                  categories.length
                    ? 'Select categories'
                    : 'No categories found'
                }
                multiple
              >
                {categories.map((category) => (
                  <option value={category} key={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
          </fieldset>
          <fieldset className="flex flex-col gap-4">
            <label>
              Published after
              <input
                name="after"
                type="date"
                className={inputClassName}
                defaultValue={filters.after ?? undefined}
              />
            </label>
            <label>
              Published before
              <input
                name="before"
                type="date"
                className={inputClassName}
                defaultValue={filters.before ?? undefined}
              />
            </label>
          </fieldset>

          <fieldset className="flex flex-col gap-1">
            {hasFilters && (
              <Button
                secondary
                form="reset-filters"
                type="submit"
                className="flex items-center justify-center gap-2"
              >
                <BanIcon className="w-4" /> Disable filters
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

function hasActiveFilters(filters: LoaderData['filters']): boolean {
  return Boolean(
    filters.after ||
      filters.before ||
      filters.categories.length ||
      filters.channels.length
  );
}

const inputClassName =
  'w-full rounded  bg-slate-100 p-2 px-2 py-1 text-slate-600';
