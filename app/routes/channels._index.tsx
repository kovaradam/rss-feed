import React from "react";
import { Form, href, Link, useNavigation } from "react-router";
import { SpinTransition } from "~/components/animations/SpinTransition";
import { UseAppTitle } from "~/components/AppTitle";
import { ChannelItemDetail } from "~/components/ChannelItemDetail/ChannelItemDetail";
import { ChannelItemDetailService } from "~/components/ChannelItemDetail/ChannelItemDetail.server";
import { ChannelItemFilterForm } from "~/components/ChannelItemFilterForm";
import { ChannelItemList } from "~/components/ChannelItemList";
import { Details } from "~/components/Details";
import { ErrorMessage } from "~/components/ErrorMessage";
import { FilterIcon } from "~/components/icons/FilterIcon";
import { NewItemsAlert } from "~/components/NewItemsAlert";
import { PageSearchInput } from "~/components/PageSearchInput";
import { ShowMoreLink } from "~/components/ShowMoreLink";
import type { ItemWithChannel } from "~/models/channel.server";
import { getChannels, getItemsByFilters } from "~/models/channel.server";
import { requireUserId } from "~/session.server";
import { isEmptyObject } from "~/utils/is-empty-object";
import type { Route } from "./+types/channels._index";
import { List } from "~/components/List";
import { useOptimisticItems } from "~/data/useOptimisticItmes";
import { MainSection } from "~/components/MainSection";

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

  const items = useOptimisticItems(serverItems).filter((i) => {
    if (i.hiddenFromFeed && !filters.includeHiddenFromFeed) {
      return false;
    }

    return true;
  });

  return (
    <>
      <UseAppTitle>Your feed</UseAppTitle>
      <MainSection
        className="relative flex-1"
        aside={
          channels.length !== 0 && (
            <Details
              className="mb-4 w-full"
              title="Filter articles"
              icon={
                <SpinTransition>
                  <FilterIcon
                    key={String(isFilters)}
                    className="pointer-events-none w-4 min-w-4"
                    fill={isFilters ? "currentColor" : undefined}
                  />
                </SpinTransition>
              }
            >
              <FilterForm />
            </Details>
          )
        }
      >
        {channels.length !== 0 && (
          <>
            <div className="mb-4 sm:hidden">
              <MainSection.AsideOutlet />
            </div>
            <PageSearchInput
              defaultValue={filters.search ?? undefined}
              formId={"filter-form"}
              placeholder="Search in articles"
            />
          </>
        )}
        <NewItemsAlert />

        {items.length === 0 && (
          <section className="flex flex-col items-center">
            <div className="flex max-w-[50ch] flex-col gap-2 text-center text-lg">
              {channels.length !== 0 ? (
                <>
                  <p className="mt-6 font-bold">
                    No articles found {isFilters && "matching your criteria"}
                  </p>
                  <div className="flec-col flex justify-center">
                    <img
                      src="/laying.svg"
                      alt=""
                      className="mt-16 max-w-[30ch] dark:invert-[.8]"
                      data-from="https://www.opendoodles.com/"
                    ></img>
                  </div>
                </>
              ) : (
                <div className="mt-8 flex flex-col items-center gap-16">
                  <div className="[&_p]:w-full [&_p]:text-center [&_p]:font-normal [&_p]:text-slate-500 [&_p]:dark:text-slate-300">
                    <h3 className="font-bold">
                      You are not subscribed to any RSS feeds.
                    </h3>
                    <p className="mb-4 text-sm">
                      To get started, try{" "}
                      <Link to={href("/channels/new")} className="underline">
                        adding a new channel
                      </Link>
                      !
                    </p>
                    <hr className="my-4" />
                    <p className="text-sm">
                      If you cannot think of any site that provides RSS feed
                      right now, you can try adding one of these:
                    </p>
                    <List className="flex flex-col gap-6">
                      {recommendedChannels.map((item) => (
                        <li
                          key={item.href}
                          className="flex justify-center rounded bg-white/60 pt-8 dark:bg-transparent"
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
                            <button className="font-bold underline">
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
          </section>
        )}
        <ChannelItemList items={items} getKey={(i) => i.id}>
          {(item) => (
            <li>
              <ChannelItemDetail
                item={item}
                isContrivedOnRead
                query={filters.search ?? undefined}
              />
            </li>
          )}
        </ChannelItemList>
        {cursor && <ShowMoreLink cursor={cursor} isLoading={isLoading} />}
      </MainSection>
    </>
  );
}

export function ErrorBoundary(props: Route.ErrorBoundaryProps) {
  console.error(props.error);
  return <ErrorMessage>An unexpected error occurred</ErrorMessage>;
}

const recommendedChannels = [
  {
    href: "https://www.themarginalian.org/feed/",
    title: "The Marginalian",
    img: "https://i1.wp.com/www.themarginalian.org/wp-content/themes/themarginalian/images/the_marginalian_opengraph.png",
  },
  {
    href: "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml",
    title: <>BBC News - Science & Environment</>,
    img: "https://upload.wikimedia.org/wikipedia/commons/6/62/BBC_News_2019.svg",
  },
  {
    href: "https://reflectionsofthenaturalworld.com/feed",
    title: <>Reflections of the Natural World</>,
    img: "https://i0.wp.com/reflectionsofthenaturalworld.com/wp-content/uploads/2020/01/img_8291b.jpg?fit=1200%2C800&#038;ssl=1",
  },
  {
    href: "https://www.nasa.gov/feeds/iotd-feed/",
    title: <>NASA Image of the Day</>,
    img: "https://upload.wikimedia.org/wikipedia/commons/e/e5/NASA_logo.svg",
  },
];
