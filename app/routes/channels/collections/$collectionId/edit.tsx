import { useLoaderData } from '@remix-run/react';
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

import { CollectionForm } from '~/components/CollectionForm';
import { ErrorMessage } from '~/components/ErrorMessage';
import { getChannels } from '~/models/channel.server';
import type { Collection } from '~/models/collection.server';
import { getBooleanValue } from '~/models/collection.server';
import { deleteCollection } from '~/models/collection.server';
import { updateCollection } from '~/models/collection.server';
import { getCollection } from '~/models/collection.server';
import { requireUserId } from '~/session.server';
import { createTitle, uniqueArrayFilter } from '~/utils';

const fieldNames = [
  'title',
  'read',
  'bookmarked',
  'category',
  'language',
] as const;

export const meta: MetaFunction = ({ data }) => {
  return {
    title: createTitle(`Edit ${data?.collection?.title ?? 'Collection'}`),
  };
};

type FieldName = typeof fieldNames[number];

type ActionData = {
  errors: Partial<Record<'title', string | null>> | undefined;
};

export const action: ActionFunction = async ({ request, params }) => {
  const collectionId = params.collectionId;
  invariant(collectionId, 'Collection id is not defined');
  const userId = await requireUserId(request);
  const data = await request.formData();
  const form = Object.fromEntries(data.entries()) as Record<
    FieldName,
    string | null
  >;

  if (request.method === 'DELETE') {
    await deleteCollection({ where: { id: collectionId } });
    return redirect('/channels');
  }

  const errors = {} as typeof form;
  if (!form.title) {
    errors.title = 'Title cannot be undefined';
  }

  if (Object.keys(errors).length !== 0) {
    return json<ActionData>({ errors }, { status: 400 });
  }

  const collection = await updateCollection({
    where: { id: collectionId },
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
  defaultValue: Collection;
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const collectionId = params.collectionId;
  invariant(collectionId, 'Collection id is not defined');

  const userId = await requireUserId(request);

  const collection = await getCollection({
    where: {
      id: collectionId,
    },
  });

  if (!collection) {
    throw new Response('Not Found', { status: 404 });
  }

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

  return json<LoaderData>({ categories, languages, defaultValue: collection });
};

export default function EditCollectionPage() {
  const data = useLoaderData<LoaderData>();
  return (
    <>
      <AppTitleEmitter>{data.defaultValue.title}</AppTitleEmitter>
      <CollectionForm<LoaderData, ActionData>
        title={'Edit collection'}
        deleteFormId="delete-form"
      />
    </>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  console.error(error);
  return <ErrorMessage>An unexpected error occurred</ErrorMessage>;
}
