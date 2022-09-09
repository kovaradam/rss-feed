import type {
  ActionFunction,
  LoaderFunction,
  MetaFunction,
} from '@remix-run/server-runtime';
import { redirect } from '@remix-run/server-runtime';
import { json } from '@remix-run/server-runtime';
import React from 'react';
import { AppTitleEmitter } from '~/components/AppTitle';
import { CollectionForm } from '~/components/CollectionForm';
import { ErrorMessage } from '~/components/ErrorMessage';
import { getChannels } from '~/models/channel.server';
import { createCollection, getBooleanValue } from '~/models/collection.server';
import { requireUserId } from '~/session.server';
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
      bookmarked: getBooleanValue(form.bookmarked),
      read: getBooleanValue(form.read),
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

export default function NewCollectionPage() {
  return (
    <>
      <AppTitleEmitter>New collection</AppTitleEmitter>
      <CollectionForm title="Create a new collection" />
    </>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  return (
    <ErrorMessage>An unexpected error occurred: {error.message}</ErrorMessage>
  );
}
