import { useFetcher } from '@remix-run/react';
import React from 'react';

export function useChannelRefreshFetcher() {
  const fetcher = useFetcher<{ newItemCount: number }>({
    key: useChannelRefreshFetcher.key,
  });
  const { submit } = fetcher;
  const refresh = React.useCallback(
    () =>
      submit(
        {},
        {
          action: useChannelRefreshFetcher.path,
          method: useChannelRefreshFetcher.method,
        }
      ),
    [submit]
  );
  return [refresh, fetcher] as const;
}

useChannelRefreshFetcher.path = '/api/refresh-channels';
useChannelRefreshFetcher.method = 'PATCH' as const;
useChannelRefreshFetcher.key = 'channels-refresh';
useChannelRefreshFetcher.invalidateMethod = 'PUT' as const;
