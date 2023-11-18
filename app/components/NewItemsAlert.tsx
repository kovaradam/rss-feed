import React from 'react';
import { useChannelRefreshFetcher } from '~/hooks/useChannelFetcher';

export function NewItemsAlert() {
  const [, fetcher] = useChannelRefreshFetcher();

  if ((fetcher.data?.newItemCount ?? 0) <= 0) {
    return null;
  }

  return (
    <div className="mb-2 flex justify-center">
      <fetcher.Form
        method={useChannelRefreshFetcher.invalidateMethod}
        action={useChannelRefreshFetcher.path}
        className="flex w-full justify-center pb-2"
      >
        <button
          type="submit"
          className="w-full rounded bg-slate-50 p-2 text-slate-600 shadow-md hover:bg-slate-100"
        >
          Show new articles
        </button>
      </fetcher.Form>
    </div>
  );
}
