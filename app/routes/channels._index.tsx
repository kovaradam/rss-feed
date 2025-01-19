import { FilterIcon } from "@heroicons/react/outline";
import { Link, useNavigation } from "react-router";
import React from "react";
import { UseAppTitle } from "~/components/AppTitle";
import { ChannelItemDetail } from "~/components/ChannelItemDetail/ChannelItemDetail";
import { ChannelItemFilterForm } from "~/components/ChannelItemFilterForm";
import { ChannelItemList } from "~/components/ChannelItemList";
import { Details } from "~/components/Details";
import { ErrorMessage } from "~/components/ErrorMessage";
import { PageSearchInput } from "~/components/PageSearchInput";
import { NewItemsAlert } from "~/components/NewItemsAlert";
import { ShowMoreLink } from "~/components/ShowMoreLink";
import type { ItemWithChannel } from "~/models/channel.server";
import { getItemsByFilters, getChannels } from "~/models/channel.server";
import { requireUserId } from "~/session.server";
import { ChannelItemDetailService } from "~/components/ChannelItemDetail/ChannelItemDetail.server";
import { isEmptyObject } from "~/utils/is-empty-object";
import type { Route } from "./+types/channels._index";

const itemCountName = "item-count";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const userId = await requireUserId(request);
  const searchParams = new URL(request.url).searchParams;
  const itemCountParam = searchParams.get(itemCountName);
  const itemCountRequest = itemCountParam ? Number(itemCountParam) : 30;

  const [filterChannels, filterCategories] = ["channels", "categories"].map(
    (name) => searchParams.getAll(name)
  );
  const [before, after, search, includeReadParam, includeHiddenFromFeed] = [
    ChannelItemFilterForm.names.before,
    ChannelItemFilterForm.names.after,
    PageSearchInput.names.search,
    ChannelItemFilterForm.names.excludeRead,
    ChannelItemFilterForm.names.includeHiddenFromFeed,
  ].map((name) => searchParams.get(name));

  const filters = {
    after: after ?? null,
    before: before ?? null,
    categories: filterCategories ?? [],
    channels: filterChannels ?? [],
    includeRead: includeReadParam ? includeReadParam === String(true) : null,
    includeHiddenFromFeed: includeHiddenFromFeed
      ? includeHiddenFromFeed === String(true)
      : null,
    search: search ?? null,
  };

  const items = getItemsByFilters(
    {
      userId,
      filters: {
        ...filters,
        excludeRead: !filters.search && !filters.includeRead,
        excludeHiddenFromFeed:
          !filters.search && !filters.includeHiddenFromFeed,
      },
    },
    {
      orderBy: { pubDate: "desc" },
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

  const channels = getChannels({ where: { userId } });

  const categories = (await channels)
    .flatMap((channel) => channel.category.split("/"))
    .filter((category, index, array) => index === array.indexOf(category))
    .filter(Boolean);

  return {
    items: ((await items) as ItemWithChannel[]) ?? [],
    channels: await channels,
    categories,
    filters,
    cursor:
      (await items).length >= itemCountRequest
        ? { name: itemCountName, value: String(itemCountRequest + 10) }
        : null,
  };
};

export const action = async ({ request }: Route.ActionArgs) => {
  const userId = await requireUserId(request);
  const formData = await request.formData();

  if (ChannelItemDetailService.isChannelItemUpdate(formData)) {
    return ChannelItemDetailService.handleAction(userId, formData);
  }
};

export default function ChannelIndexPage({ loaderData }: Route.ComponentProps) {
  const { items, channels, categories, filters, cursor } = loaderData;

  const transition = useNavigation();
  const isLoading = transition.state === "loading";

  const isFilters = !isEmptyObject(filters);

  const FilterForm = React.useCallback(
    () => (
      <ChannelItemFilterForm
        formId={"filter-form"}
        filters={{
          ...filters,
          excludeRead:
            filters.includeRead === null ? null : !filters.includeRead,
          excludeHiddenFromFeed:
            filters.includeHiddenFromFeed === null
              ? null
              : !filters.includeHiddenFromFeed,
        }}
        channels={channels.map((channel) => ({
          ...channel,
          updatedAt: channel.updatedAt,
          createdAt: channel.createdAt,
          lastBuildDate: channel.lastBuildDate,
          refreshDate: channel.refreshDate,
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
        <section className="min-w-2/3 relative flex-1" id="feed-container">
          <Details
            className="mb-4 w-full sm:hidden"
            title="Filter articles"
            icon={<FilterIcon className="pointer-events-none w-4 min-w-4" />}
          >
            <FilterForm />
          </Details>
          <PageSearchInput
            defaultValue={filters.search ?? undefined}
            formId={"filter-form"}
            placeholder="Search in articles"
          />
          <NewItemsAlert />

          {items.length === 0 && (
            <div className="flex flex-col gap-2 text-center text-lg font-bold">
              {channels.length !== 0 ? (
                <>
                  <p className="mt-6 dark:text-white">
                    No articles found {isFilters && "matching your criteria"}
                  </p>
                  <img
                    src="/laying.svg"
                    alt=""
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
                        to={"/channels/new"}
                        className="font-bold text-yellow-900 underline dark:text-white"
                      >
                        Add a new channel
                      </Link>{" "}
                      to get started!
                    </p>
                  </div>
                  <img
                    alt=""
                    src="/sitting-reading.svg"
                    width={"50%"}
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
                    pubDate: item.pubDate,
                    channel: {
                      ...item.channel,
                      updatedAt: item.channel.updatedAt,
                      createdAt: item.channel.createdAt,
                      lastBuildDate: item.channel.lastBuildDate,
                      refreshDate: item.channel.refreshDate,
                    },
                  }}
                  query={filters.search ?? undefined}
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
              icon={<FilterIcon className="pointer-events-none w-4 min-w-4" />}
            >
              <FilterForm />
            </Details>
          </aside>
        )}
      </div>
    </>
  );
}

export function ErrorBoundary() {
  return <ErrorMessage>An unexpected error occurred</ErrorMessage>;
}
