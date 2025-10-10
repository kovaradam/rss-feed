import { useFetcher } from "react-router";
import { useChannelRefreshFetcher } from "~/data/useChannelRefreshFetcher";
import { DotsLoading } from "./icons/DotsLoading";
import React from "react";
import { usePreserveScroll } from "~/utils/usePreserveScroll";

export function NewItemsAlert() {
  /** submits mutation that triggers query revalidation */
  const invalidateFetcher = useFetcher({ key: "refresh-revalidate" });
  /** refreshFetcher does not trigger revalidation */
  const refresh = useChannelRefreshFetcher();

  const isFetchingNewItems = invalidateFetcher?.state !== "idle";
  const isHidden =
    ((refresh.newItemCount ?? 0) === 0 || invalidateFetcher.data) &&
    !isFetchingNewItems;

  const scrollAnchorRef = React.useRef<HTMLDivElement>(null);

  usePreserveScroll(scrollAnchorRef.current, [isHidden], isHidden);

  const reset = React.useEffectEvent(() => refresh.reset?.());

  React.useEffect(() => {
    // If visible alert is unmounted, it can be assumed that items will be invalidated and alert needs to be reset
    if (!isHidden) {
      return () => {
        reset();
      };
    }
  }, [isHidden]);

  return (
    <div>
      {!isHidden && (
        <div className="mb-2 flex justify-center items-center h-10">
          {isFetchingNewItems ? (
            <DotsLoading />
          ) : (
            <button
              type="submit"
              className="flex  items-center justify-center rounded-2xl px-4  bg-white p-2 text-gray-900 border shadow-lg hover:bg-slate-50 disabled:bg-transparent disabled:shadow-none dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
              onClick={() => {
                refresh.reset?.();
                invalidateFetcher.submit(
                  {},
                  {
                    method: useChannelRefreshFetcher.invalidateMethod,
                    action: useChannelRefreshFetcher.path,
                  },
                );
              }}
              disabled={isFetchingNewItems}
            >
              <>Show newer articles</>
            </button>
          )}
        </div>
      )}

      <div ref={scrollAnchorRef} />
    </div>
  );
}
