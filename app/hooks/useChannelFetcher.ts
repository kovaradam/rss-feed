import { useFetcher } from '@remix-run/react';
import React from 'react';

export function useChannelRefreshFetcher() {
  const fetcher = useFetcher<{ newItemCount: number }>({
    key: 'channel-refresh',
  });
  const { load } = fetcher;
  const refresh = React.useCallback(
    () => load(useChannelRefreshFetcher.path),
    [load]
  );
  return [refresh, fetcher] as const;
}

useChannelRefreshFetcher.path = '/api/refresh-channels';
useChannelRefreshFetcher.method = 'PATCH' as const;
useChannelRefreshFetcher.invalidateMethod = 'PUT' as const;
