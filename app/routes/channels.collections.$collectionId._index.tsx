import { PencilIcon } from '@heroicons/react/outline';
import type { MetaFunction } from '@remix-run/react';
import {
  Link,
  useLoaderData,
  useNavigation,
  isRouteErrorResponse,
  useRouteError,
} from '@remix-run/react';
import type {
  ActionFunction,
  LoaderFunctionArgs,
} from '@remix-run/server-runtime';
import { json } from '@remix-run/server-runtime';
import React from 'react';
import invariant from 'tiny-invariant';
import { UseAppTitle } from '~/components/AppTitle';
import { ChannelItemsOverlay } from '~/components/ArticleOverlay';
import { AsideWrapper } from '~/components/AsideWrapper';
import { ChannelItemDetail } from '~/components/ChannelItemDetail';
import { ChannelItemFilterForm } from '~/components/ChannelItemFilterForm';
import { ChannelItemList } from '~/components/ChannelItemList';
import { Details } from '~/components/Details';
import { ErrorMessage } from '~/components/ErrorMessage';
import { ItemSearchForm } from '~/components/ItemSearchForm';
import { ShowMoreLink } from '~/components/ShowMoreLink';
import { NewChannelModalContext } from '~/hooks/new-channel-modal';
import type { ItemWithChannel } from '~/models/channel.server';
import {
  getItemQueryFilter,
  getItemsByCollection,
} from '~/models/channel.server';
import { getCollection } from '~/models/collection.server';
import { requireUserId } from '~/session.server';
import { createTitle } from '~/utils';

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    {
      title: createTitle(data?.collection?.title ?? 'Collection feed'),
    },
  ];
};

const itemCountName = 'item-count';

export async function loader({ request, params }: LoaderFunctionArgs) {
  const userId = await requireUserId(request);
  const collectionId = params.collectionId;
  invariant(collectionId, 'Collection id was not provided');
  const searchParams = new URL(request.url).searchParams;

  const [before, after, q] = ['before', 'after', 'q'].map((name) =>
    searchParams.get(name)
  );

  const filters = {
    after,
    before,
    q,
  };

  const collection = await getCollection({ where: { id: collectionId } });

  if (!collection) {
    throw new Response('Not Found', { status: 404 });
  }

  const itemCountParam = searchParams.get(itemCountName);
  const itemCount = itemCountParam ? Number(itemCountParam) : 30;

  const items = (await getItemsByCollection(
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
        ...getItemQueryFilter(filters.q ?? ''),
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
  )) as ItemWithChannel[];

  return json({
    items: items,
    cursor:
      items.length >= itemCount
        ? { name: itemCountName, value: String(itemCount + 10) }
        : null,
    filters,
    collection,
  });
}

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();

  if (request.method === 'POST') {
    return ChannelItemDetail.handleAction({ formData });
  }
};

export default function ChannelIndexPage() {
  const { items, cursor, filters, collection } = useLoaderData<typeof loader>();
  const transition = useNavigation();
  const isSubmitting = transition.state === 'submitting';

  const isFilters = Object.values(filters).some(Boolean);

  const FilterForm = React.useCallback(
    () => <ChannelItemFilterForm formId={'filter-form'} filters={filters} />,
    [filters]
  );

  return (
    <>
      <UseAppTitle>{collection.title}</UseAppTitle>
      <div className={`relative flex min-h-screen flex-col sm:flex-row `}>
        <section className="sm:min-w-2/3 relative flex-1 ">
          <Details title="Filter articles" className="mb-4 w-full  sm:hidden">
            <FilterForm />
          </Details>
          <ItemSearchForm
            formId={'filter-form'}
            defaultValue={filters.q ?? undefined}
          />
          {transition.state === 'loading' &&
            transition.formMethod === 'GET' && <ChannelItemsOverlay />}
          {items.length === 0 && (
            <div className="flex flex-col items-center gap-24 p-8">
              <div>
                {!isFilters ? (
                  <>
                    <p className="mb-2 text-center text-lg font-bold">
                      No articles were found in this collection.
                    </p>
                    <p className="text-center text-lg text-slate-600">
                      You may try adding a{' '}
                      <NewChannelModalContext.Consumer>
                        {(context) => (
                          <button
                            onClick={() => context.open?.()}
                            className="font-bold text-yellow-900 underline"
                          >
                            new channel
                          </button>
                        )}
                      </NewChannelModalContext.Consumer>{' '}
                      or{' '}
                      <Link to="edit" className=" underline">
                        edit this collection
                      </Link>
                    </p>
                  </>
                ) : (
                  <p className="mb-2 text-center text-lg font-bold">
                    No articles found matching your criteria.
                  </p>
                )}
              </div>
              <img
                alt="Illustration doodle of a person sitting and reading"
                src="/clumsy.svg"
                width={'70%'}
                data-from="https://www.opendoodles.com/"
              />
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
          {cursor && <ShowMoreLink cursor={cursor} isLoading={isSubmitting} />}
        </section>
        <AsideWrapper>
          <Details
            title="Filter articles"
            className={'mb-2 hidden w-60 sm:flex'}
          >
            <FilterForm />
          </Details>
          <Link
            to={`edit`}
            className="flex w-fit items-center gap-2 rounded bg-slate-100 px-4 py-2 text-slate-600 hover:bg-slate-200 sm:w-full"
          >
            <PencilIcon className="w-4" /> Edit collection
          </Link>
        </AsideWrapper>
      </div>
    </>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  const caught = useRouteError();

  if (isRouteErrorResponse(caught)) {
    if (caught.status === 404) {
      return (
        <ErrorMessage>
          <h4>Collection not found</h4>
        </ErrorMessage>
      );
    }
  }

  return <ErrorMessage>An unexpected error occurred</ErrorMessage>;
}
