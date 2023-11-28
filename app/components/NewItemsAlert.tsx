import { useFetcher, useFetchers } from '@remix-run/react';
import React from 'react';
import { useChannelRefreshFetcher } from '~/hooks/useChannelFetcher';

export function NewItemsAlert() {
  const revalidateFetcher = useFetcher({ key: 'refresh-revalidate' });
  const refreshFetcher = useFetchers().find(
    (fetcher) => fetcher.key === useChannelRefreshFetcher.key
  );

  const isRevalidating = revalidateFetcher?.state !== 'idle';
  if (
    ((refreshFetcher?.data?.newItemCount ?? 0) === 0 ||
      revalidateFetcher.data) &&
    !isRevalidating
  ) {
    return null;
  }

  return (
    <div className="mb-2 flex justify-center">
      <button
        type="submit"
        className=" flex h-10 w-full items-center justify-center  rounded p-2 text-gray-900 shadow-md hover:bg-slate-50 disabled:bg-transparent disabled:shadow-none"
        onClick={() => {
          revalidateFetcher.submit(
            {},
            {
              method: useChannelRefreshFetcher.invalidateMethod,
              action: useChannelRefreshFetcher.path,
            }
          );
        }}
        disabled={isRevalidating}
      >
        {isRevalidating ? <LoadingIcon /> : <>Show new articles</>}
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
