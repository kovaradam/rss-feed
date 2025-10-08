import React from "react";
import {
  Fetcher,
  Form,
  href,
  Link,
  ShouldRevalidateFunctionArgs,
  useFetchers,
  useNavigation,
} from "react-router";
import { SpinTransition } from "~/components/animations/SpinTransition";
import { UseAppTitle } from "~/components/AppTitle";
import { ChannelItemDetail } from "~/components/ChannelItemDetail/ChannelItemDetail";
import { ChannelItemDetailService } from "~/components/ChannelItemDetail/ChannelItemDetail.server";
import { ChannelItemFilterForm } from "~/components/ChannelItemFilterForm";
import { ChannelItemList } from "~/components/ChannelItemList";
import { Details } from "~/components/Details";
import { ErrorMessage } from "~/components/ErrorMessage";
import { Filter } from "~/components/icons/Filter";
import { NewItemsAlert } from "~/components/NewItemsAlert";
import { PageSearchInput } from "~/components/PageSearchInput";
import { ShowMoreLink } from "~/components/ShowMoreLink";
import type { ItemWithChannel } from "~/models/channel.server";
import { getChannels, getItemsByFilters } from "~/models/channel.server";
import { requireUserId } from "~/session.server";
import { isEmptyObject } from "~/utils/is-empty-object";
import type { Route } from "./+types/channels._index";
import { List } from "~/components/List";

const itemCountName = "item-count";

export const loader = async ({ request }: Route.LoaderArgs) => {
  const userId = await requireUserId(request);
  const searchParams = new URL(request.url).searchParams;
  const itemCountParam = searchParams.get(itemCountName);
  const itemCountRequest = itemCountParam ? Number(itemCountParam) : 30;

  const [filterChannels, filterCategories] = ["channels", "categories"].map(
    (name) => searchParams.getAll(name),
  );
  const [before, after, search, includeHiddenFromFeed] = [
    ChannelItemFilterForm.names.before,
    ChannelItemFilterForm.names.after,
    PageSearchInput.names.search,
    ChannelItemFilterForm.names["include-hidden-from-feed"],
  ].map((name) => searchParams.get(name));

  const filters = {
    after: after ?? null,
    before: before ?? null,
    categories: filterCategories ?? [],
    channels: filterChannels ?? [],
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
    },
  );

  const channels = getChannels(userId);

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
  const {
    items: serverItems,
    channels,
    categories,
    filters,
    cursor,
  } = loaderData;

  const transition = useNavigation();
  const isLoading = transition.state === "loading";

  const isFilters = !isEmptyObject(filters);

  const FilterForm = React.useCallback(
    () => (
      <ChannelItemFilterForm
        formId={"filter-form"}
        filters={{
          ...filters,

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
      />
    ),
    [filters, channels, categories],
  );

  const fetchers = useFetchers();

  const [updatedItems, addUpdatedItem] = React.useReducer(
    (
      prev: Map<string, (typeof serverItems)[number]>,
      update: { fetcher: Fetcher; items: typeof prev },
    ) => {
      if (
        update.fetcher.formData?.get(ChannelItemDetail.form.names.action) !==
        ChannelItemDetail.form.values["update-channel-item"]
      ) {
        return prev;
      }

      const itemId = update.fetcher.formData?.get(
        ChannelItemDetail.form.names.itemId,
      );

      const itemToUpdate = itemId ? update.items.get(itemId as string) : null;

      if (!itemToUpdate) {
        return prev;
      }

      prev.set(itemId as string, {
        ...itemToUpdate,
        bookmarked:
          update.fetcher.formData?.get(
            ChannelItemDetail.form.names.bookmarked,
          ) === String(true),
        read:
          update.fetcher.formData?.get(ChannelItemDetail.form.names.read) ===
          String(true),
        hiddenFromFeed:
          update.fetcher.formData?.get(
            ChannelItemDetail.form.names.hiddenFromFeed,
          ) === String(true),
      });

      return new Map(prev);
    },
    new Map(),
  );

  React.useEffect(() => {
    fetchers.forEach((f) =>
      addUpdatedItem({
        fetcher: f,
        items: new Map(serverItems.map((i) => [i.id, i])),
      }),
    );
    // eslint-disable-next-line react-compiler/react-compiler
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(fetchers), addUpdatedItem, serverItems]);

  const items = serverItems
    .map((i) => updatedItems.get(i.id) ?? i)
    .filter((i) => {
      if (i.hiddenFromFeed && !filters.includeHiddenFromFeed) {
        return false;
      }

      return true;
    });

  return (
    <>
      <UseAppTitle>Your feed</UseAppTitle>
      <div className="flex">
        <section className="min-w-2/3 relative flex-1">
          <Details
            className="mb-4 w-full sm:hidden"
            title="Filter articles"
            icon={
              <SpinTransition>
                <Filter
                  key={String(isFilters)}
                  className="pointer-events-none w-4 min-w-4"
                  fill={isFilters ? "currentColor" : undefined}
                />
              </SpinTransition>
            }
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
            <div className="flex flex-col gap-2 text-center text-lg ">
              {channels.length !== 0 ? (
                <>
                  <p className="mt-6 font-bold dark:text-white">
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
                  <div className="[&_p]:w-full [&_p]:text-center [&_p]:font-normal [&_p]:text-slate-500 [&_p]:dark:text-slate-300">
                    <h3 className="pb-2 font-bold dark:text-white">
                      You are not subscribed to any RSS feeds.
                    </h3>
                    <p className="mb-4">
                      To get started, you should{" "}
                      <Link
                        to={href("/channels/new")}
                        className="font-bold text-yellow-900 underline dark:text-white"
                      >
                        add a new channel
                      </Link>
                      .
                    </p>
                    <hr className="my-4" />
                    <p>
                      If you cannot think of any site that provides RSS feed
                      right now, you can try adding one of these:
                    </p>
                    <List className="flex flex-col gap-6">
                      {recommendedChannels.map((item) => (
                        <li
                          key={item.href}
                          className="flex justify-center rounded bg-white/60 pt-8 dark:bg-inherit/60"
                        >
                          <img
                            rel="noreferrer"
                            src={item.img}
                            alt=""
                            className="pointer-events-none absolute h-14 -rotate-6 pt-6 opacity-50 transition-opacity [li:hover_&]:opacity-100"
                          />

                          <Form action={href("/channels/new")} method="POST">
                            <input
                              type="hidden"
                              value={item.href}
                              name="channel-url"
                            ></input>
                            <input
                              type="hidden"
                              name="loader"
                              value={"true"}
                            ></input>
                            <button className="font-bold underline dark:text-white">
                              {item.title}
                            </button>
                          </Form>
                        </li>
                      ))}
                    </List>
                  </div>
                </div>
              )}
            </div>
          )}
          <ChannelItemList items={items} getKey={(i) => i.id}>
            {(item) => (
              <li>
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
                  isContrivedOnRead
                  query={filters.search ?? undefined}
                />
              </li>
            )}
          </ChannelItemList>
          {cursor && <ShowMoreLink cursor={cursor} isLoading={isLoading} />}
        </section>
        {channels.length !== 0 && (
          <aside className="hidden pl-4 sm:block ">
            <Details
              title="Filter articles"
              className="w-60"
              icon={
                <SpinTransition>
                  <Filter
                    key={String(isFilters)}
                    className="pointer-events-none w-4 min-w-4"
                    fill={isFilters ? "currentColor" : undefined}
                  />
                </SpinTransition>
              }
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

export function shouldRevalidate({ formData }: ShouldRevalidateFunctionArgs) {
  return (
    formData?.get(ChannelItemDetail.form.names.action) !==
    ChannelItemDetail.form.values["update-channel-item"]
  );
}

const recommendedChannels = [
  {
    href: "https://feeds.npr.org/1039/rss.xml",
    title: <>NPR Topics: Music</>,
    img: "https://static-assets.npr.org/chrome_svg/npr-logo-2025.svg",
  },
  {
    href: "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml",
    title: <>BBC News - Science & Environment</>,
    img: "https://upload.wikimedia.org/wikipedia/commons/6/62/BBC_News_2019.svg",
  },
  {
    href: "https://www.nasa.gov/feeds/iotd-feed/",
    title: <>NASA Image of the Day</>,
    img: "https://upload.wikimedia.org/wikipedia/commons/e/e5/NASA_logo.svg",
  },
];
