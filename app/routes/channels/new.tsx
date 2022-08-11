import { Form, useActionData, useTransition } from '@remix-run/react';
import type { ActionFunction } from '@remix-run/server-runtime';
import { redirect } from '@remix-run/server-runtime';
import { json } from '@remix-run/server-runtime';
import invariant from 'tiny-invariant';
import type { Channel, Item } from '~/models/channel.server';
import { getChannel } from '~/models/channel.server';
import { createChanel } from '~/models/channel.server';
import { requireUserId } from '~/session.server';
import { parseChannelXml } from './utils';

const inputNames = ['channel-url'] as const;
const [channelUrlName] = inputNames;
const errors = [...inputNames, 'xml-parse', 'create', 'fetch'];

type ActionData =
  | Partial<Record<typeof errors[number], string | null>>
  | undefined;

export const action: ActionFunction = async ({ request }) => {
  const data = await request.formData();
  const channelHref = data.get(channelUrlName);
  const userId = await requireUserId(request);

  let channelUrl;
  try {
    channelUrl = new URL(String(channelHref));
  } catch (error) {
    return json<ActionData>({ [channelUrlName]: 'Provide a valid url' });
  }

  let channelRequest;
  try {
    channelRequest = await fetch(channelUrl);
  } catch (error) {
    return json<ActionData>({ fetch: 'Could not load RSS feed' });
  }

  const channelXml = await channelRequest.text();

  let channel: Partial<Channel>, items: Item[];
  try {
    [channel, items] = await parseChannelXml(channelXml);
    invariant(channel.link, 'Link is missing in the RSS definition');
    invariant(channel.title, 'Title is missing in the RSS definition');
  } catch (error) {
    return json<ActionData>({ 'xml-parse': 'Could not parse RSS definition' });
  }

  try {
    const dbChannel = await getChannel({
      where: { link: channel.link, userId },
    });
    if (dbChannel) {
      return json<ActionData>({ create: 'RSS feed already exists' });
    }
  } catch (_) {}

  let newChannel;
  try {
    newChannel = await createChanel({
      channel: channel as Channel,
      userId,
      items: items ?? [],
    });
  } catch (error) {
    console.log(error);

    return json<ActionData>({ create: 'Could not save RSS feed' });
  }
  return redirect('/channels/'.concat(newChannel.id));
};

export default function Channels() {
  const actionData = useActionData<ActionData>();
  const transition = useTransition();
  const isCreating = Boolean(transition.submission);
  const errors = actionData;

  return (
    <Form method="post" className="flex flex-col gap-4">
      <div>
        <label className="flex w-full flex-col gap-1">
          <span>Title: </span>
          <input
            autoFocus
            name={channelUrlName}
            required
            type="url"
            className="flex-1 rounded-md border-2 border-blue-500 px-3 text-lg leading-loose"
            aria-invalid={Boolean(errors)}
          />
        </label>
        {errors &&
          Object.entries(errors).map(([type, error]) => (
            <div key={type} className="pt-1 text-red-700" id="title-error">
              {error}
            </div>
          ))}
      </div>

      <div className="text-right">
        <button
          type="submit"
          className="rounded bg-blue-500 py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400 disabled:bg-blue-300"
          disabled={isCreating}
        >
          {isCreating ? 'Creating...' : 'add'}
        </button>
      </div>
    </Form>
  );
}
