import { FilterIcon, PencilIcon } from "@heroicons/react/outline";
import {
  Link,
  useNavigation,
  isRouteErrorResponse,
  useRouteError,
} from "react-router";
import React from "react";
import invariant from "tiny-invariant";
import { UseAppTitle } from "~/components/AppTitle";
import { AsideWrapper } from "~/components/AsideWrapper";
import { buttonStyle } from "~/components/Button";
import { ChannelItemDetail } from "~/components/ChannelItemDetail/ChannelItemDetail";
import { ChannelItemDetailService } from "~/components/ChannelItemDetail/ChannelItemDetail.server";
import { ChannelItemFilterForm } from "~/components/ChannelItemFilterForm";
import { ChannelItemList } from "~/components/ChannelItemList";
import { Details } from "~/components/Details";
import { ErrorMessage } from "~/components/ErrorMessage";
import { PageSearchInput } from "~/components/PageSearchInput";
import { ShowMoreLink } from "~/components/ShowMoreLink";
import type { ItemWithChannel } from "~/models/channel.server";
import {
  getChannels,
  getItemQueryFilter,
  getItemsByCollection,
} from "~/models/channel.server";
import { getCollection } from "~/models/collection.server";
import { requireUserId } from "~/session.server";
import { createTitle } from "~/utils";
import type { Route } from "./+types/channels.collections.$collectionId._index";

export const meta = ({ data }: Route.MetaArgs) => {
  return [
    {
      title: createTitle(data?.collection?.title ?? "Collection feed"),
    },
  ];
};

const itemCountName = "item-count";

export async function loader({ request, params }: Route.LoaderArgs) {
  const userId = await requireUserId(request);
  const collectionId = params.collectionId;
  invariant(collectionId, "Collection id was not provided");
  const searchParams = new URL(request.url).searchParams;

  const [before, after, search] = [
    ChannelItemFilterForm.names.before,
    ChannelItemFilterForm.names.after,
    PageSearchInput.names.search,
  ].map((name) => searchParams.get(name));

  const filters = {
    after,
    before,
    search,
  };

  const collection = await getCollection(collectionId, userId);

  if (!collection) {
    throw new Response("Not Found", { status: 404 });
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
        ...getItemQueryFilter(filters.search ?? ""),
      },
      orderBy: { pubDate: "desc" },
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

  const channels = await getChannels({
    where: { userId },
    select: { id: true },
  });

  return {
    items: items,
    cursor:
      items.length >= itemCount
        ? { name: itemCountName, value: String(itemCount + 10) }
        : null,
    filters,
    collection,
    channelCount: channels.length,
  };
}

export const action = async ({ request }: Route.ActionArgs) => {
  const userId = await requireUserId(request);
  const formData = await request.formData();

  if (ChannelItemDetailService.isChannelItemUpdate(formData)) {
    return ChannelItemDetailService.handleAction(userId, formData);
  }
};

export default function ChannelIndexPage({ loaderData }: Route.ComponentProps) {
  const { items, cursor, filters, collection, channelCount } = loaderData;
  const transition = useNavigation();
  const isSubmitting = transition.state === "submitting";

  const isFilters = Object.values(filters).some(Boolean);

  const FilterForm = React.useCallback(
    () => <ChannelItemFilterForm formId={"filter-form"} filters={filters} />,
    [filters]
  );

  return (
    <>
      <UseAppTitle>{collection.title}</UseAppTitle>
      <div className={`relative flex min-h-screen flex-col sm:flex-row `}>
        <section className="sm:min-w-2/3 relative flex-1 ">
          <Details
            title="Filter articles"
            className="mb-4 w-full sm:hidden"
            icon={<FilterIcon className="pointer-events-none w-4 min-w-4" />}
          >
            <FilterForm />
          </Details>
          <PageSearchInput
            formId={"filter-form"}
            defaultValue={filters.search ?? undefined}
            placeholder="Search in articles"
          />

          {items.length === 0 && (
            <div className="flex flex-col items-center gap-24 p-8">
              <div>
                {!isFilters ? (
                  <>
                    <p className=" text-center text-lg font-bold dark:text-white">
                      No articles were found in this collection.
                    </p>
                    <p className="text-center text-lg text-slate-600 dark:text-slate-300">
                      You may try adding a{" "}
                      <Link
                        to={"/channels/new"}
                        className="font-bold text-yellow-900 underline dark:text-white"
                      >
                        new channel
                      </Link>{" "}
                      or{" "}
                      <Link to="edit" className=" underline">
                        edit this collection
                      </Link>
                    </p>
                  </>
                ) : (
                  <p className="mb-2 text-center text-lg font-bold dark:text-white">
                    No articles found matching your criteria.
                  </p>
                )}
              </div>
              <img
                alt="Illustration of a person struggling with sheets of paper"
                src="/clumsy.svg"
                width={"70%"}
                data-from="https://www.opendoodles.com/"
                className="dark:invert-[.8]"
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
                  query={filters.search ?? undefined}
                />
              </li>
            ))}
          </ChannelItemList>
          {cursor && <ShowMoreLink cursor={cursor} isLoading={isSubmitting} />}
        </section>
        {channelCount !== 0 && (
          <AsideWrapper>
            <Details
              title="Filter articles"
              className={"mb-2 hidden w-60 sm:flex"}
              icon={<FilterIcon className="pointer-events-none w-4 min-w-4" />}
            >
              <FilterForm />
            </Details>
            <Link to={`edit`} className={buttonStyle.concat(" w-full")}>
              <PencilIcon className="w-4" />
              <span className="pointer-events-none flex-1 text-center ">
                Edit collection
              </span>
            </Link>
          </AsideWrapper>
        )}
      </div>
    </>
  );
}

export function ErrorBoundary() {
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
