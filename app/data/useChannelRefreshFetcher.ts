import { useFetcher } from 'react-router';
import React from 'react';
import type { Route } from '../routes/+types/api.refresh-channels';

export function useChannelRefreshFetcher() {
  const fetcher = useFetcher<Route.ComponentProps['actionData']>({
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
