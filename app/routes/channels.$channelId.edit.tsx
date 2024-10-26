import type { MetaFunction } from '@remix-run/react';
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
} from '@remix-run/react';
import type {
  ActionFunction,
  LoaderFunctionArgs,
} from '@remix-run/server-runtime';
import { redirect, data } from '@remix-run/server-runtime';
import React from 'react';
import invariant from 'tiny-invariant';
import { UseAppTitle } from '~/components/AppTitle';
import { useCategoryInput } from '~/components/CategoryInput';
import { PageHeading } from '~/components/PageHeading';
import { SubmitSection } from '~/components/SubmitSection';
import { WithFormLabel } from '~/components/WithFormLabel';
import type { Channel } from '~/models/channel.server';
import {
  getChannels,
  updateChannel,
  getChannel,
} from '~/models/channel.server';
import { requireUserId } from '~/session.server';
import { styles } from '~/styles/shared';
import { createTitle, isSubmitting } from '~/utils';

const fieldNames = [
  'title',
  'description',
  'image-url',
  'category',
  'language',
] as const;

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    {
      title: createTitle(`Edit ${data?.channel?.title ?? 'channel'}`),
    },
  ];
};

type FieldName = (typeof fieldNames)[number];

type ActionData = {
  errors: Partial<Record<FieldName, string | null>> | undefined;
};

export const action: ActionFunction = async ({ request, params }) => {
  const channelId = params.channelId;
  invariant(channelId, 'ChannelId was not provided');
  const userId = await requireUserId(request);

  const formData = await request.formData();
  const form = Object.fromEntries(formData.entries()) as Record<
    FieldName,
    string | null
  >;

  const errors = {} as typeof form;
  if (!form.title) {
    errors.title = 'Title cannot be undefined';
  }

  if (Object.keys(errors).length !== 0) {
    return data<ActionData>({ errors }, { status: 400 });
  }

  const channel = await updateChannel(userId, {
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

export const loader = async ({
  request,
  params,
}: LoaderFunctionArgs): Promise<LoaderData> => {
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

  return { channel, categories, focusName };
};

export default function Channels() {
  const errors = useActionData<ActionData>()?.errors;
  const transition = useNavigation();
  const { channel, categories, focusName } = useLoaderData<typeof loader>();
  const isSaving = isSubmitting(transition);

  const { renderCategoryInput, renderCategoryForm } = useCategoryInput({
    categorySuggestions: categories,
    defaultValue: channel.category ?? '',
    fakeInputName: 'new-category',
    formId: 'new-category-form',
    name: 'category',
    autoFocus: inputProps(focusName === 'new-category').autoFocus,
    inputClassName,
  });

  return (
    <>
      <UseAppTitle>{channel?.title}</UseAppTitle>
      <PageHeading>Edit channel</PageHeading>
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
              defaultValue={channel.imageUrl ?? ''}
              name={'image-url'}
              {...inputProps(focusName === 'image-url')}
            />
          </WithFormLabel>
        </div>

        <SubmitSection
          cancelProps={{ to: '/channels/'.concat(channel.id) }}
          submitProps={{ children: 'Save changes' }}
          isSubmitting={isSaving}
        />
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
