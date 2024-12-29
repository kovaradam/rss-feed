import { useFetcher } from 'react-router';
import { useChannelRefreshFetcher } from '~/data/useChannelRefreshFetcher';

export function NewItemsAlert() {
  /** submits mutation that triggers query revalidation */
  const newItemsFetcher = useFetcher({ key: 'refresh-revalidate' });
  /** refreshFetcher does not trigger revalidation */
  const refresh = useChannelRefreshFetcher();

  const isFetchingNewItems = newItemsFetcher?.state !== 'idle';

  if (
    ((refresh.newItemCount ?? 0) === 0 || newItemsFetcher.data) &&
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
          newItemsFetcher.submit(
            {},
            {
              method: useChannelRefreshFetcher.invalidateMethod,
              action: useChannelRefreshFetcher.path,
            }
          );
        }}
        disabled={isFetchingNewItems}
      >
        {isFetchingNewItems ? <LoadingIcon /> : <>Show new articles</>}
      </button>
    </div>
  );
}

function LoadingIcon() {
  return (
    <div className="flex gap-2">
      <style></style>
      {[0, 1, 2].map((idx) => (
        <div
          key={idx}
          className="h-2 w-2 rounded-lg bg-slate-200"
          style={{ animation: `bounce 1s ease ${idx * 100}ms infinite` }}
        />
      ))}
    </div>
  );
}
