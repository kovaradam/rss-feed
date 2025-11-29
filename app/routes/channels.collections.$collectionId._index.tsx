import { Link, useNavigation, isRouteErrorResponse, href } from "react-router";
import invariant from "tiny-invariant";
import { UseAppTitle } from "~/components/AppTitle";
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
  getItemQueryFilter,
  getItemsByCollection,
} from "~/models/channel.server";
import { getCollection } from "~/models/collection.server";
import { requireUserId } from "~/session.server";
import { createTitle } from "~/utils";
import type { Route } from "./+types/channels.collections.$collectionId._index";
import { FilterIcon } from "~/components/icons/FilterIcon";
import { SpinTransition } from "~/components/animations/SpinTransition";
import { useOptimisticItems } from "~/data/useOptimisticItmes";
import { MainSection } from "~/components/MainSection";

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
    },
  )) as ItemWithChannel[];

  return {
    items: items,
    cursor:
      items.length >= itemCount
        ? { name: itemCountName, value: String(itemCount + 10) }
        : null,
    filters,
    collection,
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
  const { items: serverItems, cursor, filters, collection } = loaderData;
  const transition = useNavigation();
  const isSubmitting = transition.state === "submitting";

  const isFilters = Object.values(filters).some(Boolean);

  const items = useOptimisticItems(serverItems).filter((item) => {
    if (collection.read === null) return true;
    return item.read === collection.read;
  });

  const isFilterControlsHidden = !items.length && !isFilters;

  return (
    <>
      <UseAppTitle>{collection.title}</UseAppTitle>
      <MainSection
        className="relative"
        aside={
          !isFilterControlsHidden && (
            <Details
              title="Filter articles"
              icon={
                <SpinTransition>
                  <FilterIcon
                    className="pointer-events-none w-4 min-w-4"
                    key={String(isFilters)}
                    fill={isFilters ? "currentColor" : undefined}
                  />
                </SpinTransition>
              }
            >
              <ChannelItemFilterForm formId={"filter-form"} filters={filters} />
            </Details>
          )
        }
      >
        {!isFilterControlsHidden && (
          <>
            <div className="mb-4 sm:hidden">
              <MainSection.AsideOutlet />
            </div>
            <PageSearchInput
              formId={"filter-form"}
              defaultValue={filters.search ?? undefined}
              placeholder="Search in articles"
            />
          </>
        )}

        {items.length === 0 && (
          <div className="flex flex-col items-center gap-24 p-8">
            <div>
              {!isFilters ? (
                <>
                  <p className="text-center text-lg font-bold">
                    No articles were found in this collection.
                  </p>
                  <p className="text-center text-sm text-slate-600 dark:text-slate-300">
                    You may try{" "}
                    <Link
                      to={href("/channels/new")}
                      className="font-bold underline"
                    >
                      adding a new channel
                    </Link>{" "}
                    or{" "}
                    <Link
                      to={href("/channels/collections/:collectionId/edit", {
                        collectionId: collection.id,
                      })}
                      className="underline"
                    >
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
              alt=""
              src="/clumsy.svg"
              width={"70%"}
              data-from="https://www.opendoodles.com/"
              className="max-w-[40ch] dark:invert-[.8]"
            />
          </div>
        )}
        <ChannelItemList items={items} getKey={(i) => i.id}>
          {(item) => (
            <li>
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
                isContrivedOnRead={!collection.read}
                query={filters.search ?? undefined}
              />
            </li>
          )}
        </ChannelItemList>
        {cursor && <ShowMoreLink cursor={cursor} isLoading={isSubmitting} />}
      </MainSection>
    </>
  );
}

export function ErrorBoundary(props: Route.ErrorBoundaryProps) {
  console.error(props.error);

  if (isRouteErrorResponse(props.error)) {
    if (props.error.status === 404) {
      return (
        <ErrorMessage>
          <h4>Collection not found</h4>
        </ErrorMessage>
      );
    }
  }

  return <ErrorMessage>An unexpected error occurred</ErrorMessage>;
}
