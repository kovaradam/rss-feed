import type { LoaderFunctionArgs } from '@remix-run/server-runtime';
import { json } from '@remix-run/server-runtime';
import { getChannels, refreshChannel } from '~/models/channel.server';
import { requireUser } from '~/session.server';

export async function action() {
  return null;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const channels = await getChannels({
    where: { userId: user.id },
    select: { id: true, feedUrl: true },
  });
  const results = await Promise.all(
    channels.map(async (dbChannel) => {
      try {
        return await refreshChannel({
          feedUrl: dbChannel.feedUrl,
          userId: user.id,
          signal: request.signal,
        });
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          return;
        }
        console.error('update failed', error);
        return null;
      }
    })
  );
  return json({
    newItemCount: results.reduce(
      (prev, next) => prev + (next?.newItemCount ?? 0),
      0
    ),
  });
}
