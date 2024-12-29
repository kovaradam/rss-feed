import React from 'react';

export function useChannelRefreshFetcher() {
  const status = React.useSyncExternalStore(
    RefreshFetcherStore.subscribe,
    RefreshFetcherStore.getStatus,
    () => 'idle' as const
  );

  if (typeof status === 'number') {
    return {
      newItemCount: status,
      refresh: RefreshFetcherStore.refresh,
    };
  }
  return {
    status: status,
    refresh: RefreshFetcherStore.refresh,
  };
}

useChannelRefreshFetcher.path = '/api/refresh-channels';
useChannelRefreshFetcher.method = 'PATCH' as const;
useChannelRefreshFetcher.invalidateMethod = 'PUT' as const;

class RefreshFetcherStore {
  private static abortController = new AbortController();
  private static listeners: Array<() => void> = [];
  private static status: 'pending' | 'idle' | number = 'idle';

  static refresh = async () => {
    // Prevent refresh while fetching to avoid losing results
    if (this.status === 'pending') {
      return;
    }

    this.setStatus('pending');

    try {
      const newChannelCount = await this.fetchRefresh();
      this.setStatus(newChannelCount);
    } catch (_: unknown) {
      this.setStatus(0);
    }
  };

  private static fetchRefresh = async () => {
    this.abortController.abort();
    this.abortController = new AbortController();
    try {
      const response = await fetch(`${useChannelRefreshFetcher.path}.data`, {
        method: useChannelRefreshFetcher.method,
        signal: this.abortController.signal,
      });

      const data = await response.json();

      // Handle router data weirdness
      if (!Array.isArray(data)) {
        return 0;
      }

      const newItemCount = data.at(-1);

      return typeof newItemCount === 'number' ? newItemCount : 0;
    } catch (_: unknown) {
      return 0;
    }
  };

  static subscribe = (newListener: (typeof this.listeners)[number]) => {
    this.listeners = [newListener].concat(this.listeners);

    return () => {
      this.listeners = this.listeners.filter((l) => l !== newListener);
    };
  };

  private static notify = () => {
    this.listeners.forEach((l) => l());
  };

  private static setStatus = (status: typeof this.status) => {
    this.status = status;
    this.notify();
  };

  static getStatus = () => {
    return this.status;
  };
}
