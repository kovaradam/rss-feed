import { BanIcon, PencilIcon } from '@heroicons/react/outline';
import {
  Form,
  Link,
  useLoaderData,
  useLocation,
  useSubmit,
  useTransition,
} from '@remix-run/react';
import type { MetaFunction } from '@remix-run/react/routeModules';
import type { ActionFunction, LoaderFunction } from '@remix-run/server-runtime';
import { json } from '@remix-run/server-runtime';
import React from 'react';
import invariant from 'tiny-invariant';
import { Button } from '~/components/Button';
import { ChannelItemDetail } from '~/components/ChannelItemDetail';
import { ErrorMessage } from '~/components/ErrorMessage';
import { SpinnerIcon } from '~/components/SpinnerIcon';
import type {
  getItemsByFilters,
  ItemWithChannel,
} from '~/models/channel.server';
import { getItemsByCollection } from '~/models/channel.server';
import type { Collection } from '~/models/collection.server';
import { getCollection } from '~/models/collection.server';
import { requireUserId } from '~/session.server';
import { styles } from '~/styles/shared';
import { createTitle } from '~/utils';

export const meta: MetaFunction = ({ data }) => {
  return {
    title: createTitle(data.collection?.title ?? 'Collection feed'),
  };
};

type LoaderData = {
  items: ItemWithChannel[];
  filters: Pick<
    Parameters<typeof getItemsByFilters>[0]['filters'],
    'after' | 'before'
  >;
  loadMoreAction: string;
  collection: Collection;
};

const itemCountName = 'item-count';

export const loader: LoaderFunction = async ({ request, params }) => {
  const userId = await requireUserId(request);
  const collectionId = params.collectionId;
  invariant(collectionId, 'Collection id was not provided');
  const searchParams = new URL(request.url).searchParams;

  const itemCountParam = searchParams.get(itemCountName);
  const itemCount = itemCountParam ? Number(itemCountParam) : 30;

  const [before, after] = ['before', 'after'].map((name) =>
    searchParams.get(name)
  );

  const filters = {
    after,
    before,
  };

  const collection = await getCollection({ where: { id: collectionId } });

  if (!collection) {
    throw new Response('Not Found', { status: 404 });
  }

  const items = await getItemsByCollection(
    { collectionId, userId },
    {
      where: {
        pubDate:
          filters.before || filters.after
            ? {
                gte: filters.after ? new Date(filters.after) : undefined,
                lte: filters.before ? new Date(filters.before) : undefined,
              }
            : undefined,
      },
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

  const loadMoreUrl = new URL(request.url);
  loadMoreUrl.searchParams.set(itemCountName, String(itemCount + 10));

  return json<LoaderData>({
    items: items as LoaderData['items'],
    loadMoreAction: loadMoreUrl.pathname.concat(loadMoreUrl.search),
    filters,
    collection,
  });
};

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();

  if (request.method === 'POST') {
    return ChannelItemDetail.handleAction({ formData, request });
  }
};

export default function ChannelIndexPage() {
  const { items, loadMoreAction, filters } = useLoaderData<LoaderData>();
  const transition = useTransition();
  const isSubmitting = transition.state === 'submitting';
  const isIdle = transition.state === 'idle';

  const hasFilters = filters.after || filters.before;

  const submit = useSubmit();

  const submitFilters: React.FormEventHandler<HTMLFormElement> = (event) => {
    const form = event.currentTarget;
    if (!form) {
      return;
    }
    submit(form);
  };

  const { pathname } = useLocation();

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
        <Link to={`edit`} className="mb-6 flex w-56 items-center gap-2">
          <PencilIcon className="w-4" /> Edit collection
        </Link>
        <Form
          method="get"
          className="flex w-56 flex-col gap-6"
          onChangeCapture={submitFilters}
        >
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

const inputClassName = styles.filterInput;
