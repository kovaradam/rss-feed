import {
  Form,
  useActionData,
  useLoaderData,
  useTransition,
} from '@remix-run/react';
import type { ActionFunction, LoaderFunction } from '@remix-run/server-runtime';
import { redirect } from '@remix-run/server-runtime';
import { json } from '@remix-run/server-runtime';
import invariant from 'tiny-invariant';
import { Channel, updateChannel } from '~/models/channel.server';
import { getChannel } from '~/models/channel.server';
import { requireUserId } from '~/session.server';

const fieldNames = [
  'title',
  'description',
  'image-url',
  'category',
  'language',
] as const;

type FieldName = typeof fieldNames[number];

type ActionData = {
  errors: Partial<Record<FieldName, string | null>> | undefined;
};

export const action: ActionFunction = async ({ request, params }) => {
  const channelId = params.channelId;
  invariant(channelId, 'ChannelId was not provided');

  const data = await request.formData();
  const form = Object.fromEntries(data.entries()) as Record<
    FieldName,
    string | null
  >;

  const errors = {} as typeof form;
  if (!form.title) {
    errors.title = 'Title cannot be undefined';
  }
  if (!form.description) {
    errors.description = 'Description cannot be undefined';
  }

  if (Object.keys(errors).length !== 0) {
    return json<ActionData>({ errors }, { status: 400 });
  }

  const channel = await updateChannel({
    where: { id: channelId },
    data: {
      title: form.title as string,
      category: form.category as string,
      description: form.description ?? '',
      imageUrl: form['image-url'] ?? '',
      language: form.language ?? '',
    },
  });

  return redirect('/channels/'.concat(channel.id));
};

type LoaderData = { channel: Channel };

export const loader: LoaderFunction = async ({ request, params }) => {
  const channelId = params.channelId;
  invariant(channelId, 'ChannelId was not provided');
  const userId = await requireUserId(request);

  const channel = await getChannel({
    where: { userId, id: params.channelId },
  });
  if (!channel) {
    throw new Response('Not Found', { status: 404 });
  }

  return json<LoaderData>({ channel });
};

export default function Channels() {
  const actionData = useActionData<ActionData>();
  const transition = useTransition();
  const channel = useLoaderData<LoaderData>().channel;
  const isCreating = Boolean(transition.submission);
  const errors = actionData?.errors;

  return (
    <Form method="post" className="flex max-w-xl flex-col gap-4">
      <div>
        <label className="flex w-full flex-col gap-1">
          <span>Title: </span>
          <input
            defaultValue={channel.title}
            name={'title'}
            required
            {...inputProps}
          />
        </label>
        {errors?.title && (
          <div className="pt-1 text-red-700" id="title-error">
            {errors.title}
          </div>
        )}
      </div>
      <div>
        <label className="flex w-full flex-col gap-1">
          <span>Description: </span>
          <textarea
            defaultValue={channel.description}
            name={'description'}
            required
            {...inputProps}
          />
        </label>
        {errors?.category && (
          <div className="pt-1 text-red-700" id="title-error">
            {errors.category}
          </div>
        )}
      </div>
      <div>
        <label className="flex w-full flex-col gap-1">
          <span>Category: </span>
          <input
            defaultValue={channel.category}
            name={'category'}
            {...inputProps}
          />
        </label>
      </div>
      <div>
        <label className="flex w-full flex-col gap-1">
          <span>Language: </span>
          <input
            defaultValue={channel.language}
            name={'language'}
            {...inputProps}
          />
        </label>
      </div>
      <div>
        <label className="flex w-full flex-col gap-1">
          <span>Image url: </span>
          <input
            defaultValue={channel.imageUrl}
            name={'image-url'}
            {...inputProps}
          />
        </label>
      </div>

      <div className="text-right">
        <button
          type="submit"
          className="rounded bg-blue-500 py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400 disabled:bg-blue-300"
          disabled={isCreating}
        >
          {isCreating ? 'Creating...' : 'Update'}
        </button>
      </div>
    </Form>
  );
}

const inputProps = {
  className: 'w-full rounded border border-gray-500 px-2 py-1 text-lg',
};
