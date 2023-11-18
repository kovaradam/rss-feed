import { useFetcher, useFetchers } from '@remix-run/react';
import React from 'react';
import { useChannelRefreshFetcher } from '~/hooks/useChannelFetcher';

export function NewItemsAlert() {
  const revalidateFetcher = useFetcher({ key: 'refresh-revalidate' });
  const refreshFetcher = useFetchers().find(
    (fetcher) => fetcher.key === useChannelRefreshFetcher.key
  );

  if (
    (refreshFetcher?.data?.newItemCount ?? 0) <= 0 ||
    revalidateFetcher.data
  ) {
    return null;
  }

  const isRevalidating = revalidateFetcher?.state !== 'idle';

  return (
    <div className="mb-2 flex justify-center">
      <button
        type="submit"
        className="w-full rounded bg-slate-50 p-2 text-slate-600 shadow-md hover:bg-slate-100 disabled:opacity-60"
        onClick={() => {
          // revalidate();
          revalidateFetcher.submit(
            { revalidate: true },
            {
              method: useChannelRefreshFetcher.invalidateMethod,
              action: useChannelRefreshFetcher.path,
            }
          );
        }}
        disabled={isRevalidating}
      >
        {isRevalidating ? <>Loading new articles</> : <>Show new articles</>}
      </button>
    </div>
  );
}
