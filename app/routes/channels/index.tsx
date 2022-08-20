import {
  Form,
  useLoaderData,
  useSubmit,
  useTransition,
} from '@remix-run/react';
import type { ActionFunction, LoaderFunction } from '@remix-run/server-runtime';
import { json } from '@remix-run/server-runtime';
import React from 'react';
import { Button } from '~/components/Button';
import { ChannelItemDetail } from '~/components/ChannelItemDetail';
import { ChannelItemFilterForm } from '~/components/ChannelItemFilterForm';
import { ErrorMessage } from '~/components/ErrorMessage';
import { SpinnerIcon } from '~/components/SpinnerIcon';
import type { Channel, ItemWithChannel } from '~/models/channel.server';
import { getItemsByFilters } from '~/models/channel.server';
import { getChannels } from '~/models/channel.server';
import { requireUserId } from '~/session.server';

type LoaderData = {
  items: ItemWithChannel[];
  channels: Channel[];
  categories: string[];
  filters: Parameters<typeof getItemsByFilters>[0]['filters'];
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

  const filters = {
    after,
    before,
    categories: filterCategories,
    channels: filterChannels,
  };

  const items = await getItemsByFilters(
    {
      userId,
      filters,
    },
    {
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
    }
  );

  const channels = await getChannels({ where: { userId } });

  const categories = channels
    .map((channel) => channel.category.split('/'))
    .flat()
    .filter((category, index, array) => index === array.indexOf(category))
    .filter(Boolean);

  const loadMoreUrl = new URL(request.url);
  loadMoreUrl.searchParams.set(itemCountName, String(itemCount + 10));

  return json<LoaderData>({
    items: (items as LoaderData['items']) ?? [],
    channels,
    categories,
    filters,
    loadMoreAction: loadMoreUrl.pathname.concat(loadMoreUrl.search),
  });
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();

  if (request.method === 'POST') {
    return ChannelItemDetail.handleAction({ formData, request });
  }
};

export default function ChannelIndexPage() {
  const { items, channels, categories, filters, loadMoreAction } =
    useLoaderData<LoaderData>();
  const transition = useTransition();
  const isSubmitting = transition.state === 'submitting';
  const isIdle = transition.state === 'idle';

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
        <details className="mb-4 w-full  p-2 sm:hidden">
          <summary>Filters</summary>
          <ChannelItemFilterForm
            filters={filters}
            submitFilters={submitFilters}
            channels={channels}
            categories={categories}
            className="pt-2"
          />
        </details>
        {items.length === 0 && isIdle && (
          <p className="text-center">No articles found</p>
        )}
        <ul
          className={`grid grid-cols-1 gap-4 sm:min-w-[30ch] ${
            items.length <= 1 ? '2xl:grid-cols-1' : '2xl:grid-cols-2'
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
        <ChannelItemFilterForm
          filters={filters}
          categories={categories}
          submitFilters={submitFilters}
          channels={channels}
          className="w-56"
        />
      </aside>
    </div>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  return (
    <ErrorMessage>An unexpected error occurred: {error.message}</ErrorMessage>
  );
}
