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
import { AppTitleEmitter } from '~/components/AppTitle';
import { AsideWrapper } from '~/components/AsideWrapper';
import { SubmitButton } from '~/components/Button';
import { useCategoryInput } from '~/components/CategoryInput';
import { WithFormLabel } from '~/components/WithFormLabel';
import type { Channel } from '~/models/channel.server';
import { getChannels } from '~/models/channel.server';
import { updateChannel } from '~/models/channel.server';
import { getChannel } from '~/models/channel.server';
import { requireUserId } from '~/session.server';
import { styles } from '~/styles/shared';
import { createTitle } from '~/utils';

const fieldNames = [
  'title',
  'description',
  'image-url',
  'category',
  'language',
] as const;

export const meta: MetaFunction = ({ data }) => {
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

type LoaderData = {
  channel: Channel;
  categories: string[];
  focusName: string | null;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const channelId = params.channelId;
  invariant(channelId, 'ChannelId was not provided');
  const userId = await requireUserId(request);
  const searchParams = new URL(request.url).searchParams;
  const focusName = searchParams.get('focus');

  const channel = await getChannel({
    where: { userId, id: params.channelId },
  });
  if (!channel) {
    throw new Response('Not Found', { status: 404 });
  }

  const channels = await getChannels({
    where: { userId },
    select: { category: true },
  });

  const categories =
    channels
      .map((channel) => channel.category.split('/'))
      .flat()
      .filter((category, index, array) => array.indexOf(category) === index) ??
    [];

  if (!channel) {
    throw new Response('Not Found', { status: 404 });
  }

  return json<LoaderData>({ channel, categories, focusName });
};

export default function Channels() {
  const errors = useActionData<ActionData>()?.errors;
  const transition = useTransition();
  const { channel, categories, focusName } = useLoaderData<LoaderData>();
  const isSaving = Boolean(transition.submission);

  const { renderCategoryInput, renderCategoryForm } = useCategoryInput({
    categorySuggestions: categories,
    defaultValue: channel.category ?? '',
    fakeInputName: 'new-category',
    formId: 'new-category-form',
    name: 'category',
    autoFocus: inputProps(focusName === 'category').autoFocus,
    inputClassName,
  });

  return (
    <>
      <AppTitleEmitter>{channel?.title}</AppTitleEmitter>
      <h3 className="mb-2 text-4xl font-bold">Edit channel</h3>
      <Form method="post" className="flex max-w-xl flex-col gap-4">
        <div>
          <WithFormLabel label="Title" required>
            <input
              defaultValue={channel.title}
              name={'title'}
              required
              {...inputProps(focusName === 'title')}
            />
          </WithFormLabel>
          {errors?.title && (
            <div className="pt-1 text-red-700" id="title-error">
              {errors.title}
            </div>
          )}
        </div>
        <div>
          <WithFormLabel label="Description">
            <textarea
              defaultValue={channel.description}
              name={'description'}
              {...inputProps(focusName === 'description')}
            />
          </WithFormLabel>
        </div>
        <div>{renderCategoryInput()}</div>
        <div>
          <WithFormLabel label="Language">
            <input
              defaultValue={channel.language}
              name={'language'}
              {...inputProps(focusName === 'language')}
            />
          </WithFormLabel>
        </div>
        <div>
          <WithFormLabel label="Image URL">
            <input
              defaultValue={channel.imageUrl}
              name={'image-url'}
              {...inputProps(focusName === 'image-url')}
            />
          </WithFormLabel>
        </div>

        <AsideWrapper className="sm:items-end">
          <SubmitButton type="submit" disabled={isSaving} className="w-fit">
            {isSaving ? 'Saving...' : 'Update'}
          </SubmitButton>
        </AsideWrapper>
      </Form>
      {renderCategoryForm()}
    </>
  );
}

const inputClassName = styles.input;

function inputProps(autoFocus: boolean) {
  return {
    autoFocus,
    className: inputClassName,
  };
}
