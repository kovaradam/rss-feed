import { PlusIcon } from '@heroicons/react/outline';
import {
  Form,
  useActionData,
  useLoaderData,
  useTransition,
} from '@remix-run/react';
import type {
  ActionFunction,
  LoaderFunction,
  MetaFunction,
} from '@remix-run/server-runtime';
import { redirect } from '@remix-run/server-runtime';
import { json } from '@remix-run/server-runtime';
import React from 'react';
import invariant from 'tiny-invariant';
import { Button } from '~/components/Button';
import { ChannelCategories } from '~/components/ChannelCategories';
import type { Channel } from '~/models/channel.server';
import { updateChannel } from '~/models/channel.server';
import { getChannel } from '~/models/channel.server';
import { requireUserId } from '~/session.server';
import { createTitle } from '~/utils';

const fieldNames = [
  'title',
  'description',
  'image-url',
  'category',
  'language',
] as const;

export const meta: MetaFunction = ({ data, parentsData }) => {
  return {
    title: createTitle(`Edit ${data?.channel?.title ?? 'channel'}`),
  };
};

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
  const errors = useActionData<ActionData>()?.errors;
  const transition = useTransition();
  const channel = useLoaderData<LoaderData>().channel;
  const isSaving = Boolean(transition.submission);

  const [category, setCategory] = React.useState(channel.category ?? '');

  const deleteCategory: React.MouseEventHandler<HTMLButtonElement> = (
    event
  ) => {
    const categoryToRemove = (event.currentTarget as HTMLButtonElement).value;

    setCategory((prev) =>
      prev
        .split('/')
        .filter((category) => category !== categoryToRemove)
        .join('/')
    );
  };

  return (
    <>
      <Form method="post" className="flex max-w-xl flex-col gap-4">
        <h3 className="mb-6 text-4xl font-bold">Edit channel</h3>
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
          {errors?.description && (
            <div className="pt-1 text-red-700" id="title-error">
              {errors.description}
            </div>
          )}
        </div>
        <div>
          <div className="flex w-full flex-col gap-1">
            <label htmlFor="new-category">Category: </label>
            <div className="flex gap-1">
              <ChannelCategories category={category} delete={deleteCategory} />
            </div>
            <fieldset className="flex gap-2">
              <input
                placeholder="e.g. gardening"
                {...inputProps}
                name="new-category"
                id="new-category"
                form="category-form"
              />
              <Button
                className="rounded  bg-slate-100 py-2 px-4 text-slate-600  hover:bg-slate-200  disabled:bg-slate-300"
                type="submit"
                form="category-form"
                secondary
              >
                <PlusIcon className="w-4 " />
              </Button>
            </fieldset>
            <input
              value={category}
              type="hidden"
              name={'category'}
              {...inputProps}
            />
          </div>
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
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Update'}
          </Button>
        </div>
      </Form>
      <Form
        id="category-form"
        onSubmit={(event) => {
          event.preventDefault();
          const category = new FormData(event.target as HTMLFormElement).get(
            'new-category'
          );

          if (typeof category !== 'string') {
            return;
          }

          setCategory((prev) => {
            if (
              prev.split('/').find((prevCategory) => prevCategory === category)
            ) {
              return prev;
            }
            (event.target as HTMLFormElement)['new-category'].value = '';
            return prev.concat('/').concat(category);
          });
        }}
      ></Form>
    </>
  );
}

const inputProps = {
  className: 'w-full rounded border border-gray-500 px-2 py-1 text-lg',
};
