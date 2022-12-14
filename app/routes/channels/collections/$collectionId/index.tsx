import { PencilIcon } from '@heroicons/react/outline';
import {
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
import { AppTitleEmitter } from '~/components/AppTitle';
import { ChannelItemsOverlay } from '~/components/ArticleOverlay';
import { AsideWrapper } from '~/components/AsideWrapper';
import { ChannelItemDetail } from '~/components/ChannelItemDetail';
import { ChannelItemFilterForm } from '~/components/ChannelItemFilterForm';
import { Details } from '~/components/Details';
import { ErrorMessage } from '~/components/ErrorMessage';
import { ShowMoreLink } from '~/components/ShowMoreLink';
import type {
  getItemsByFilters,
  ItemWithChannel,
} from '~/models/channel.server';
import { getItemsByCollection } from '~/models/channel.server';
import type { Collection } from '~/models/collection.server';
import { getCollection } from '~/models/collection.server';
import { requireUserId } from '~/session.server';
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
  loadMoreAction: string | null;
  collection: Collection;
};

const itemCountName = 'item-count';

export const loader: LoaderFunction = async ({ request, params }) => {
  const userId = await requireUserId(request);
  const collectionId = params.collectionId;
  invariant(collectionId, 'Collection id was not provided');
  const searchParams = new URL(request.url).searchParams;

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

  const itemCountParam = searchParams.get(itemCountName);
  const itemCount = itemCountParam ? Number(itemCountParam) : 30;

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
    loadMoreAction:
      items.length >= itemCount
        ? loadMoreUrl.pathname.concat(loadMoreUrl.search)
        : null,
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
      <AppTitleEmitter>{collection.title}</AppTitleEmitter>
      <div className="relative flex min-h-screen flex-col sm:flex-row">
        <section className="sm:min-w-2/3 relative flex-1">
          <ChannelItemsOverlay />
          <Details title="Filter articles" className="mb-4 w-full  sm:hidden">
            <ChannelItemFilterForm
              filters={filters}
              submitFilters={submitFilters}
            />
          </Details>
          {items.length === 0 && isIdle && (
            <p className="text-center text-lg font-bold">
              No articles found in this collection
            </p>
          )}
          <ul
            className={`grid grid-cols-1 gap-4 sm:min-w-[30ch] 2xl:grid-cols-2`}
          >
            {items.map((item) => (
              <li key={item.link}>
                <ChannelItemDetail item={item} formMethod="post" />
              </li>
            ))}
          </ul>
          {loadMoreAction && (
            <ShowMoreLink to={loadMoreAction} isLoading={isSubmitting} />
          )}
        </section>
        <AsideWrapper>
          <Details
            title="Filter articles"
            className={'mb-2 hidden w-60 sm:flex'}
          >
            <ChannelItemFilterForm
              filters={filters}
              submitFilters={submitFilters}
              className={'hidden sm:flex'}
            />
          </Details>
          <Link
            to={`edit`}
            className="flex w-fit items-center gap-2 rounded bg-slate-100 py-2 px-4 text-slate-600 hover:bg-slate-200"
          >
            <PencilIcon className="w-4" /> Edit collection
          </Link>
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
