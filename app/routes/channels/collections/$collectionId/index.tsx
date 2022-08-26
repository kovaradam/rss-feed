import { PencilIcon } from '@heroicons/react/outline';
import {
  Form,
  Link,
  useLoaderData,
  useSubmit,
  useTransition,
} from '@remix-run/react';
import type { MetaFunction } from '@remix-run/react/routeModules';
import type { ActionFunction, LoaderFunction } from '@remix-run/server-runtime';
import { json } from '@remix-run/server-runtime';
import React from 'react';
import invariant from 'tiny-invariant';
import { AsideWrapper } from '~/components/AsideWrapper';
import { Button } from '~/components/Button';
import { ChannelItemDetail } from '~/components/ChannelItemDetail';
import { ChannelItemFilterForm } from '~/components/ChannelItemFilterForm';
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
import { createTitle, UseAppTitle } from '~/utils';

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
  const { items, loadMoreAction, filters, collection } =
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
    <>
      <UseAppTitle>{collection.title}</UseAppTitle>
      <div className="relative flex min-h-full flex-col sm:flex-row">
        <section className="sm:min-w-2/3 relative flex-1">
          {!isIdle && (
            <div className="absolute flex h-full min-h-screen w-full  justify-center rounded-lg bg-black pt-[50%] opacity-10">
              <SpinnerIcon className="h-16 w-16" />
            </div>
          )}
          <details className="mb-4 w-full rounded-md border p-2 sm:hidden">
            <summary>Filters</summary>
            <ChannelItemFilterForm
              filters={filters}
              submitFilters={submitFilters}
            />
          </details>
          {items.length === 0 && isIdle && (
            <p className="text-center">No articles found</p>
          )}
          <ul
            className={`grid grid-cols-1 gap-4 sm:min-w-[30ch] 2xl:grid-cols-${
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
        <AsideWrapper>
          <Link to={`edit`} className=" flex w-56 items-center gap-2">
            <PencilIcon className="w-4" /> Edit collection
          </Link>
          <ChannelItemFilterForm
            filters={filters}
            submitFilters={submitFilters}
            className={'hidden w-56 sm:flex'}
          />
        </AsideWrapper>
      </div>
    </>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  return (
    <ErrorMessage>An unexpected error occurred: {error.message}</ErrorMessage>
  );
}
