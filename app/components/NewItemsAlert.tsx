import { useFetcher } from "react-router";
import { useChannelRefreshFetcher } from "~/data/useChannelRefreshFetcher";
import { DotsLoading } from "./icons/DotsLoading";

export function NewItemsAlert() {
  /** submits mutation that triggers query revalidation */
  const invalidateFetcher = useFetcher({ key: "refresh-revalidate" });
  /** refreshFetcher does not trigger revalidation */
  const refresh = useChannelRefreshFetcher();

  const isFetchingNewItems = invalidateFetcher?.state !== "idle";

  if (
    ((refresh.newItemCount ?? 0) === 0 || invalidateFetcher.data) &&
    !isFetchingNewItems
  ) {
    return null;
  }

  return (
    <div className="mb-2 flex justify-center">
      <button
        type="submit"
        className="flex h-10 w-full items-center justify-center rounded  bg-white p-2 text-gray-900 shadow-md hover:bg-slate-50 disabled:bg-transparent disabled:shadow-none dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
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
        {isFetchingNewItems ? <DotsLoading /> : <>Show new articles</>}
      </button>
    </div>
  );
}
