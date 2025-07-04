import React from "react";
import { href } from "react-router";

export function useChannelRefreshFetcher() {
  const status = React.useSyncExternalStore(
    RefreshFetcherStore.subscribe,
    RefreshFetcherStore.getStatus,
    () => "idle" as const,
  );

  if (typeof status === "number") {
    return {
      newItemCount: status,
      refresh: RefreshFetcherStore.refresh,
      reset: RefreshFetcherStore.reset,
    };
  }
  return {
    status: status,
    refresh: RefreshFetcherStore.refresh,
  };
}

useChannelRefreshFetcher.path = href("/api/refresh-channels");
useChannelRefreshFetcher.method = "PATCH" as const;
useChannelRefreshFetcher.invalidateMethod = "PUT" as const;

class RefreshFetcherStore {
  private static abortController = new AbortController();
  private static listeners: Array<() => void> = [];
  private static status: "pending" | "idle" | number = "idle";

  static refresh = async () => {
    if (
      // Prevent refresh while fetching or while holding results to avoid losing them
      this.status === "pending" ||
      (typeof this.status === "number" && this.status > 0)
    ) {
      return;
    }

    this.setStatus("pending");

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
        throw new Error();
      }

      const newItemCount = data.at(-1);

      if (typeof newItemCount !== "number") {
        throw new Error();
      }

      return newItemCount;
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

  static reset = () => {
    this.abortController.abort();
    this.setStatus("idle");
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
