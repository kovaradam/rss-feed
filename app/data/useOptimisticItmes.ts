import React from "react";
import { useFetchers } from "react-router";
import { ChannelItemDetail } from "~/components/ChannelItemDetail/ChannelItemDetail";
import { Item } from "~/models/types.server";
import { booleanFilter } from "~/utils";

export function useOptimisticItems<
  T extends Pick<Item, "read" | "bookmarked" | "hiddenFromFeed" | "id">,
>(items: T[]) {
  const fetchers = useFetchers();

  const updatedItemMap = React.useMemo(() => {
    const updatedItems = fetchers
      .map((fetcher) => {
        if (
          fetcher.formData?.get(ChannelItemDetail.form.names.action) !==
          ChannelItemDetail.form.values["update-channel-item"]
        ) {
          return null;
        }

        const itemId = fetcher.formData?.get(
          ChannelItemDetail.form.names.itemId,
        );

        const itemToUpdate = itemId ? items.find((i) => i.id === itemId) : null;

        if (!itemToUpdate) {
          return null;
        }

        return [
          itemId as string,
          {
            ...itemToUpdate,
            bookmarked:
              fetcher.formData?.get(ChannelItemDetail.form.names.bookmarked) ===
              String(true),
            read:
              fetcher.formData?.get(ChannelItemDetail.form.names.read) ===
              String(true),
            hiddenFromFeed:
              fetcher.formData?.get(
                ChannelItemDetail.form.names.hiddenFromFeed,
              ) === String(true),
          },
        ] as const;
      })
      .filter(booleanFilter);

    if (!updatedItems.length) {
      return null;
    }

    return new Map(updatedItems.map(([id, item]) => [id, item] as const));
  }, [fetchers, items]);

  if (!updatedItemMap) {
    return items;
  }
  return items.map((i) => updatedItemMap?.get(i.id) ?? i);
}
