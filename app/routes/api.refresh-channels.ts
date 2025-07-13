import { getChannels, refreshChannel } from "~/models/channel.server";
import { requireUser } from "~/session.server";
import type { Route } from "./+types/api.refresh-channels";
import { useChannelRefreshFetcher } from "~/data/useChannelRefreshFetcher";

export async function action({ request }: Route.LoaderArgs) {
  const user = await requireUser(request, { id: true });

  if (request.method === useChannelRefreshFetcher.method) {
    try {
      const channels = await getChannels(user.id, {
        select: { id: true, feedUrl: true },
      });
      const results = await Promise.allSettled(
        channels.map(async (dbChannel) => {
          try {
            return await refreshChannel.$cached({
              feedUrl: dbChannel.feedUrl,
              userId: user.id,
              signal: request.signal,
            });
          } catch (error) {
            if ((error as Error).name === "AbortError") {
              return null;
            }
            console.error("update failed", dbChannel.feedUrl);
            return null;
          }
        }),
      );
      return {
        newItemCount: results
          .map((result) =>
            result.status === "fulfilled" ? result.value?.newItemCount ?? 0 : 0,
          )
          .reduce((prev, next) => prev + (next ?? 0), 0),
      };
    } catch (error) {
      console.error(error);
    }
  }

  return {
    newItemCount: 0,
  };
}
