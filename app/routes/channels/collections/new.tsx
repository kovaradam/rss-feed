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
import { Button } from '~/components/Button';
import { useCategoryInput } from '~/components/CategoryInput';
import { ErrorMessage } from '~/components/ErrorMessage';
import { getChannels } from '~/models/channel.server';
import { createCollection } from '~/models/collection.server';
import { requireUserId } from '~/session.server';
import { styles } from '~/styles/shared';
import { createTitle, uniqueArrayFilter } from '~/utils';

const fieldNames = [
  'title',
  'read',
  'bookmarked',
  'category',
  'language',
] as const;

export const meta: MetaFunction = () => {
  return {
    title: createTitle(`New collection'}`),
  };
};

type FieldName = typeof fieldNames[number];

type ActionData = {
  errors: Partial<Record<FieldName, string | null>> | undefined;
};

export const action: ActionFunction = async ({ request }) => {
  const userId = await requireUserId(request);
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

  const collection = await createCollection({
    data: {
      userId,
      title: form.title as string,
      bookmarked:
        form.bookmarked !== 'null' ? Boolean(form.bookmarked) : undefined,
      read: form.read !== 'null' ? Boolean(form.read) : undefined,
      category: form.category ?? undefined,
      language: form.language ?? undefined,
    },
  });

  return redirect('/channels?collection='.concat(collection.id));
};

type LoaderData = {
  categories: string[];
  languages: string[];
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const userId = await requireUserId(request);

  const channels = await getChannels({
    where: { userId },
    select: { category: true, language: true },
  });

  const categories =
    channels
      .map((channel) => channel.category.split('/'))
      .filter(Boolean)
      .flat()
      .filter(uniqueArrayFilter) ?? [];

  const languages =
    channels
      .map((channel) => channel.language)
      .filter(Boolean)
      .filter(uniqueArrayFilter) ?? [];

  return json<LoaderData>({ categories, languages });
};

export default function Channels() {
  const errors = useActionData<ActionData>()?.errors;
  const transition = useTransition();
  const data = useLoaderData<LoaderData>();
  const isSaving = Boolean(transition.submission);

  const Categories = useCategoryInput({
    categorySuggestions: data.categories,
    defaultValue: '',
    fakeInputName: 'new-category',
    formId: 'new-category-form',
    inputClassName,
    name: 'category',
  });

  return (
    <>
      <h3 className="mb-2 text-4xl font-bold">Create a new collection</h3>
      <Form method="post" className="flex max-w-xl flex-col gap-4">
        <div>
          <label className="flex w-full flex-col gap-1">
            <span>Title: </span>
            <input
              name={'title'}
              placeholder="e.g. Super fun collection"
              required
              className={inputClassName}
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
            <span>Read status: </span>
            <fieldset className="flex flex-col gap-2">
              {[
                { label: 'Ignore', value: null },
                { label: 'Include only read articles', value: true },
                { label: 'Include only articles not read yet', value: false },
              ].map((props) => (
                <label
                  className="flex items-center gap-2"
                  key={String(props.value)}
                >
                  <input
                    defaultChecked={props.value === null}
                    type="radio"
                    className="accent-blue-400"
                    value={String(props.value)}
                    name="read"
                  />
                  {props.label}
                </label>
              ))}
            </fieldset>
          </label>
        </div>
        <div>
          <label className="flex w-full flex-col gap-1">
            <span>Bookmarked status: </span>
            <fieldset className="flex flex-col gap-2">
              {[
                { label: 'Ignore', value: null },
                { label: 'Include only bookmarked articles', value: true },
                { label: 'Exclude bookmarked articles', value: false },
              ].map((props) => (
                <label
                  className="flex items-center gap-2"
                  key={String(props.value)}
                >
                  <input
                    defaultChecked={props.value === null}
                    type="radio"
                    className="accent-blue-400"
                    value={String(props.value)}
                    name="bookmarked"
                  />
                  {props.label}
                </label>
              ))}
            </fieldset>
          </label>
        </div>
        <div>{Categories.renderCategoryInput()}</div>
        <div>
          <label className="flex w-full flex-col gap-1">
            <span>Language: </span>
            <input
              name={'language'}
              className={inputClassName}
              list="language-suggestions"
            />
            <datalist id="language-suggestions">
              {data.languages.map((language) => (
                <option value={language} key={language} />
              ))}
            </datalist>
          </label>
        </div>

        <div className="text-right">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Creating...' : 'Create'}
          </Button>
        </div>
      </Form>
      {Categories.renderCategoryForm()}
    </>
  );
}

const inputClassName = styles.input;

export function ErrorBoundary({ error }: { error: Error }) {
  return (
    <ErrorMessage>An unexpected error occurred: {error.message}</ErrorMessage>
  );
}
