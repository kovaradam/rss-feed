import { requireUserId } from "~/session.server";
import { Route } from "./+types/api.item-by-link";
import { getChannelItemByLink } from "~/models/channel.server";
import { href, redirect } from "react-router";

export async function loader({ request }: Route.LoaderArgs) {
  const userId = await requireUserId(request);
  const link = new URL(request.url).searchParams.get("link");

  const item = await getChannelItemByLink(link as string, userId);

  if (!item) {
    throw new Response("Not found", {
      status: 404,
      statusText: "Not Found",
    });
  }

  throw redirect(
    href(`/channels/:channelId/articles/:itemId`, {
      channelId: item.channelId,
      itemId: item.id,
    }),
  );
}
